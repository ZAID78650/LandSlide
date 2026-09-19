#!/usr/bin/env python3
"""
LANDSense AI — Download + Convert Landslide4Sense Dataset
Sequential download with immediate conversion.
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

BAND_NAMES = [
    "B01_coastal", "B02_blue", "B03_green", "B04_red",
    "B05_veg_edge1", "B06_veg_edge2", "B07_veg_edge3",
    "B08_nir", "B8A_narrow_nir", "B09_water_vapour",
    "B10_swir_cirrus", "B11_swir1", "B12_swir2",
    "DEM", "Slope"
]

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
    r = normalize_band(data[:, :, 3])  # B4
    g = normalize_band(data[:, :, 2])  # B3
    b = normalize_band(data[:, :, 1])  # B2
    Image.fromarray(np.stack([r, g, b], axis=-1)).save(out_path)


def convert_mask_h5_to_png(h5_path, out_path):
    with h5py.File(h5_path, 'r') as f:
        key = list(f.keys())[0]
        mask = np.array(f[key])
    if mask.ndim == 3:
        mask = mask[:, :, 0]
    Image.fromarray((mask > 0).astype(np.uint8) * 255).save(out_path)


def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"done": []}


def save_progress(done_list):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump({"done": done_list}, f)


def main():
    print("=" * 60)
    print("LANDSense AI — Landslide4Sense Download + Convert")
    print("=" * 60)

    start = time.time()
    progress = load_progress()
    done_set = set(progress["done"])

    # List files
    print("\nFetching file list from Hugging Face...")
    all_files = list_repo_files(REPO_ID, repo_type="dataset")
    all_h5 = sorted([f for f in all_files if f.endswith(".h5")])
    todo = [f for f in all_h5 if f not in done_set]
    print(f"Total: {len(all_h5)} files, Already done: {len(done_set)}, Remaining: {len(todo)}")

    total = len(all_h5)
    completed = len(done_set)
    errors = 0

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
                # Image → RGB PNG
                out_dir = LOCAL_BASE / split / "images_rgb"
                out_dir.mkdir(parents=True, exist_ok=True)
                convert_img_h5_to_rgb(local_h5, out_dir / f"{stem}.png")
            else:
                # Mask → binary PNG
                out_dir = LOCAL_BASE / split / "masks_png"
                out_dir.mkdir(parents=True, exist_ok=True)
                convert_mask_h5_to_png(local_h5, out_dir / f"{stem}.png")

            done_set.add(repo_file)
            completed += 1

        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"  ERROR [{repo_file}]: {e}")

        # Progress every 100 files
        if completed % 100 == 0:
            elapsed = time.time() - start
            rate = (completed - len(done_set) + 100) / max(elapsed, 1)
            remaining = len(todo) - (i + 1)
            eta = remaining / rate if rate > 0 else 0
            print(f"  [{completed}/{total}] {completed*100//total}% — {rate:.1f} f/s — ETA {eta/60:.1f}min")
            save_progress(list(done_set))

    # Final save
    save_progress(list(done_set))

    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"DONE — {elapsed:.0f}s ({elapsed/60:.1f}min)")
    print(f"  Converted: {completed - len(done_set) + len(done_set)}/{total}")
    print(f"  Errors: {errors}")
    print(f"\nOutput:")
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
