#!/usr/bin/env python3
"""
Step 1: Convert all already-cached HDF5 files to PNG images.
Step 2: Continue downloading remaining files from Hugging Face.
"""
import os, sys, time, json
import numpy as np
from pathlib import Path

import h5py
from PIL import Image
from huggingface_hub import hf_hub_download, list_repo_files

REPO_ID = "harshinde/LandSlide4Sense"
HF_CACHE = "/tmp/landslide4sense_hf"
LOCAL_BASE = Path(__file__).parent / "Landslide4Sense"
PROGRESS_FILE = "/tmp/ls4s_progress.json"

SPLIT_MAP = {"train": "TrainData", "validation": "ValidData", "test": "TestData"}


def normalize_band(data, clip_pct=2):
    valid = data[np.isfinite(data)]
    if valid.size == 0:
        return np.zeros_like(data, dtype=np.uint8)
    lo, hi = np.percentile(valid, clip_pct), np.percentile(valid, 100 - clip_pct)
    if hi - lo < 1e-10:
        return np.zeros_like(data, dtype=np.uint8)
    return np.clip((data - lo) / (hi - lo) * 255, 0, 255).astype(np.uint8)


def convert_img_h5_to_rgb(h5_path, out_path):
    with h5py.File(h5_path, 'r') as f:
        data = np.array(f['img'])
    r, g, b = normalize_band(data[:,:,3]), normalize_band(data[:,:,2]), normalize_band(data[:,:,1])
    Image.fromarray(np.stack([r, g, b], axis=-1)).save(out_path)


def convert_mask_h5_to_png(h5_path, out_path):
    with h5py.File(h5_path, 'r') as f:
        key = list(f.keys())[0]
        mask = np.array(f[key])
    if mask.ndim == 3:
        mask = mask[:, :, 0]
    Image.fromarray((mask > 0).astype(np.uint8) * 255).save(out_path)


def find_cached_files():
    """Find all real HDF5 files in the HF cache."""
    cached = {}
    for root, dirs, files in os.walk(HF_CACHE):
        for f in files:
            if f.endswith('.h5'):
                fp = os.path.join(root, f)
                if os.path.getsize(fp) > 10000:  # Real file, not stub
                    cached[f] = fp
    return cached


def main():
    print("=" * 60)
    print("LANDSense AI — Convert Cached + Continue Download")
    print("=" * 60)

    # ── Phase 1: Convert cached files ──
    print("\nPhase 1: Converting already-cached HDF5 files...")
    cached = find_cached_files()
    print(f"Found {len(cached)} cached HDF5 files")

    converted = 0
    errors = 0

    for filename, h5_path in cached.items():
        # Determine split and output path
        # Files in HF cache are named like image_1.h5 or mask_1.h5
        is_mask = filename.startswith("mask_")
        stem = filename.replace(".h5", "")

        # Try to determine split from the HF cache directory structure
        # HF cache layout: /tmp/landslide4sense_hf/images/train/image_1.h5
        rel = os.path.relpath(h5_path, HF_CACHE)
        parts = rel.split(os.sep)

        if len(parts) >= 2:
            # e.g., images/train/image_1.h5
            if parts[0] == "images" and len(parts) >= 3:
                split = SPLIT_MAP.get(parts[1], parts[1])
            elif parts[0] == "annotations" and len(parts) >= 3:
                split = SPLIT_MAP.get(parts[1], parts[1])
            else:
                split = "TrainData"  # default
        else:
            split = "TrainData"

        try:
            if not is_mask:
                out_dir = LOCAL_BASE / split / "images_rgb"
                out_dir.mkdir(parents=True, exist_ok=True)
                out_path = out_dir / f"{stem}.png"
                if not out_path.exists():  # skip if already converted
                    convert_img_h5_to_rgb(h5_path, out_path)
                    converted += 1
            else:
                out_dir = LOCAL_BASE / split / "masks_png"
                out_dir.mkdir(parents=True, exist_ok=True)
                out_path = out_dir / f"{stem}.png"
                if not out_path.exists():
                    convert_mask_h5_to_png(h5_path, out_path)
                    converted += 1
        except Exception as e:
            errors += 1
            if errors <= 3:
                print(f"  ERROR [{filename}]: {e}")

    print(f"  Converted: {converted} new PNGs, Errors: {errors}")

    # ── Phase 2: Download remaining files ──
    print("\nPhase 2: Downloading remaining files from Hugging Face...")
    print("  (This will take time without HF_TOKEN authentication)")

    # Load progress
    done_set = set()
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            done_set = set(json.load(f).get("done", []))

    # Also mark cached files as done
    for fn in cached:
        # Map filename back to repo path
        # This is approximate — we'll skip files that are already converted
        pass

    all_files = list_repo_files(REPO_ID, repo_type="dataset")
    all_h5 = sorted([f for f in all_files if f.endswith(".h5")])
    todo = [f for f in all_h5 if f not in done_set]

    print(f"  Total: {len(all_h5)}, Cached/Done: {len(all_h5) - len(todo)}, Remaining: {len(todo)}")

    if len(todo) == 0:
        print("  All files already downloaded!")
    else:
        print(f"  Downloading {len(todo)} files (est. {len(todo)*9/3600:.1f} hours without auth)...")
        print(f"  TIP: Set HF_TOKEN for 10x faster downloads:")
        print(f"       export HF_TOKEN=your_huggingface_token")
        print(f"       Get token at: https://huggingface.co/settings/tokens\n")

        start = time.time()
        for i, repo_file in enumerate(todo):
            parts = repo_file.split("/")
            is_mask = parts[0] == "annotations"
            split = SPLIT_MAP.get(parts[1], parts[1])
            stem = Path(parts[2]).stem

            try:
                local_h5 = hf_hub_download(
                    repo_id=REPO_ID, repo_type="dataset",
                    filename=repo_file, local_dir=HF_CACHE,
                )

                if not is_mask:
                    out_dir = LOCAL_BASE / split / "images_rgb"
                    out_dir.mkdir(parents=True, exist_ok=True)
                    convert_img_h5_to_rgb(local_h5, out_dir / f"{stem}.png")
                else:
                    out_dir = LOCAL_BASE / split / "masks_png"
                    out_dir.mkdir(parents=True, exist_ok=True)
                    convert_mask_h5_to_png(local_h5, out_dir / f"{stem}.png")

                done_set.add(repo_file)

            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"  ERROR [{repo_file}]: {e}")

            if (i + 1) % 50 == 0:
                elapsed = time.time() - start
                rate = (i + 1) / max(elapsed, 1)
                eta = (len(todo) - i - 1) / max(rate, 0.01)
                print(f"  [{i+1}/{len(todo)}] {rate:.2f} f/s — ETA {eta/60:.1f}min")
                with open(PROGRESS_FILE, 'w') as f:
                    json.dump({"done": list(done_set)}, f)

        with open(PROGRESS_FILE, 'w') as f:
            json.dump({"done": list(done_set)}, f)

    # ── Summary ──
    print(f"\n{'=' * 60}")
    print("CONVERSION SUMMARY")
    print(f"{'=' * 60}")
    for split in ["TrainData", "ValidData", "TestData"]:
        rgb = LOCAL_BASE / split / "images_rgb"
        masks = LOCAL_BASE / split / "masks_png"
        if rgb.exists():
            n = len(list(rgb.glob("*.png")))
            print(f"  {split}/images_rgb/  → {n} PNGs")
        if masks.exists():
            n = len(list(masks.glob("*.png")))
            print(f"  {split}/masks_png/   → {n} PNGs")
    print("=" * 60)


if __name__ == "__main__":
    main()
