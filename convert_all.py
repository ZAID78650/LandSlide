#!/usr/bin/env python3
"""
Download all h5 files from HuggingFace using threaded parallel downloads,
then convert to PNG locally. Resumes from where it left off.
"""
import os
import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from queue import Queue

DOWNLOAD_DIR = "/tmp/landslide4sense_hf"
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Landslide4Sense")

# Map HF paths to local output dirs
HF_TO_LOCAL = {
    ("images", "train"): ("TrainData", "images_rgb"),
    ("images", "validation"): ("ValidData", "images_rgb"),
    ("images", "test"): ("TestData", "images_rgb"),
    ("annotations", "train"): ("TrainData", "masks"),
    ("annotations", "validation"): ("ValidData", "masks"),
    ("annotations", "test"): ("TestData", "masks"),
}

EXPECTED = {
    ("images", "train"): 3799,
    ("images", "validation"): 245,
    ("images", "test"): 800,
    ("annotations", "train"): 3799,
    ("annotations", "validation"): 245,
    ("annotations", "test"): 800,
}

def is_real_h5(path):
    """Check if a file is a real h5 file (not a Git LFS pointer)."""
    try:
        return os.path.getsize(path) > 100
    except:
        return False

def h5_to_rgb_png(h5_path, png_path):
    import h5py
    import numpy as np
    from PIL import Image
    with h5py.File(h5_path, 'r') as f:
        data = f['img'][:]
    rgb = np.stack([data[:,:,3], data[:,:,2], data[:,:,1]], axis=-1).astype(np.float32)
    for c in range(3):
        ch = rgb[:,:,c]
        mn, mx = ch.min(), ch.max()
        rgb[:,:,c] = ((ch - mn) / (mx - mn) * 255) if mx > mn else 0
    Image.fromarray(rgb.astype(np.uint8)).save(png_path)

def h5_to_mask_png(h5_path, png_path):
    import h5py
    import numpy as np
    from PIL import Image
    with h5py.File(h5_path, 'r') as f:
        key = 'mask' if 'mask' in f else 'img'
        data = f[key][:]
    if len(data.shape) == 3:
        data = data[:,:,0]
    Image.fromarray((data > 0).astype(np.uint8) * 255, mode='L').save(png_path)

def download_one(args):
    """Download one h5 file from HF."""
    from huggingface_hub import hf_hub_download
    hf_path, local_dir = args
    try:
        local_path = hf_hub_download(
            repo_id="harshinde/LandSlide4Sense",
            filename=hf_path,
            repo_type="dataset",
            local_dir=local_dir,
        )
        # Verify it's real
        if is_real_h5(local_path):
            return (hf_path, local_path, None)
        else:
            return (hf_path, None, "LFS pointer, not real data")
    except Exception as e:
        return (hf_path, None, str(e))

def download_split(category, split, workers=8):
    """Download all h5 files for a split using parallel workers."""
    from huggingface_hub import list_repo_files
    
    all_files = list_repo_files("harshinde/LandSlide4Sense", repo_type="dataset")
    prefix = f"{category}/{split}/"
    h5_files = [f for f in all_files if f.startswith(prefix) and f.endswith('.h5')]
    
    # Check what we already have
    local_cache_dir = os.path.join(DOWNLOAD_DIR, category, split)
    os.makedirs(local_cache_dir, exist_ok=True)
    
    already = set()
    if os.path.exists(local_cache_dir):
        for f in os.listdir(local_cache_dir):
            if f.endswith('.h5') and is_real_h5(os.path.join(local_cache_dir, f)):
                already.add(f"{category}/{split}/{f}")
    
    to_download = [f for f in h5_files if f not in already]
    
    if not to_download:
        print(f"  {category}/{split}: All {len(h5_files)} files already cached", flush=True)
        return len(h5_files), 0
    
    print(f"  {category}/{split}: {len(already)} cached, downloading {len(to_download)}...", flush=True)
    
    tasks = [(f, DOWNLOAD_DIR) for f in to_download]
    downloaded = 0
    failed = 0
    
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(download_one, t): t for t in tasks}
        for i, future in enumerate(as_completed(futures)):
            hf_path, local_path, error = future.result()
            if local_path:
                downloaded += 1
            else:
                failed += 1
                if failed <= 3:
                    print(f"    FAIL: {hf_path}: {error}", flush=True)
            if (i + 1) % 100 == 0:
                print(f"    ... {i+1}/{len(to_download)} processed (ok={downloaded}, fail={failed})", flush=True)
    
    print(f"  {category}/{split}: {downloaded} downloaded, {failed} failed (total cached: {len(already) + downloaded})", flush=True)
    return len(already) + downloaded, failed

def convert_all():
    """Convert all downloaded h5 files to PNG."""
    print("\n=== Converting h5 → PNG ===\n", flush=True)
    
    grand_converted = 0
    grand_total = 0
    
    for (category, split), (data_dir, out_name) in HF_TO_LOCAL.items():
        h5_dir = os.path.join(DOWNLOAD_DIR, category, split)
        out_dir = os.path.join(BASE, data_dir, out_name)
        os.makedirs(out_dir, exist_ok=True)
        
        expected = EXPECTED.get((category, split), 0)
        
        if not os.path.exists(h5_dir):
            print(f"  {data_dir}/{out_name}: No h5 directory", flush=True)
            continue
        
        # Get existing PNGs
        existing = set()
        for f in os.listdir(out_dir):
            if f.endswith('.png'):
                num = int(os.path.splitext(f)[0].split('_')[-1])
                existing.add(num)
        
        h5_files = [f for f in os.listdir(h5_dir) if f.endswith('.h5') and is_real_h5(os.path.join(h5_dir, f))]
        converted = 0
        errors = 0
        
        for h5_file in sorted(h5_files):
            num = int(os.path.splitext(h5_file)[0].split('_')[-1])
            out_path = os.path.join(out_dir, f"image_{num}.png")
            
            if num in existing or os.path.exists(out_path):
                continue
            
            h5_path = os.path.join(h5_dir, h5_file)
            try:
                if category == "images":
                    h5_to_rgb_png(h5_path, out_path)
                else:
                    h5_to_mask_png(h5_path, out_path)
                converted += 1
            except Exception as e:
                errors += 1
                if errors <= 3:
                    print(f"    ERROR {h5_file}: {e}", flush=True)
        
        total = len(existing) + converted
        status = "✓" if total >= expected else f"✗ ({expected - total} missing)"
        print(f"  {data_dir}/{out_name}: {total}/{expected} {status} (+{converted} new, {errors} errors)", flush=True)
        grand_converted += converted
        grand_total += total
    
    print(f"\nConverted: {grand_converted} new PNGs", flush=True)
    return grand_total

def print_status():
    print("\n=== STATUS ===", flush=True)
    grand = 0
    grand_exp = 0
    for (category, split), (data_dir, out_name) in HF_TO_LOCAL.items():
        out_dir = os.path.join(BASE, data_dir, out_name)
        expected = EXPECTED.get((category, split), 0)
        grand_exp += expected
        count = len([f for f in os.listdir(out_dir) if f.endswith('.png')]) if os.path.exists(out_dir) else 0
        grand += count
        status = "✓" if count >= expected else f"✗ ({expected - count} missing)"
        print(f"  {data_dir}/{out_name}: {count}/{expected} {status}", flush=True)
    print(f"\n  TOTAL: {grand}/{grand_exp} PNGs\n", flush=True)

if __name__ == "__main__":
    t0 = time.time()
    
    print("=" * 60, flush=True)
    print("LANDSlide4Sense H5 → PNG Converter (Parallel)", flush=True)
    print("=" * 60, flush=True)
    
    print_status()
    
    # Phase 1: Download everything with parallel workers
    print("\n=== Phase 1: Downloading from HuggingFace ===\n", flush=True)
    
    splits_to_download = [
        ("images", "train"), ("images", "validation"), ("images", "test"),
        ("annotations", "train"), ("annotations", "validation"), ("annotations", "test"),
    ]
    
    for category, split in splits_to_download:
        download_split(category, split, workers=8)
    
    # Phase 2: Convert all
    convert_all()
    
    print_status()
    
    elapsed = time.time() - t0
    print(f"Total time: {elapsed/60:.1f} minutes", flush=True)
    print("ALL DONE!", flush=True)
