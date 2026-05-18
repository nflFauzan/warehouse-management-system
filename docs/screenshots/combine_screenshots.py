"""
Script untuk menggabungkan screenshot WMS TAKKA STEEL menjadi 8 gambar collage.
Jalankan: python combine_screenshots.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "combined")
os.makedirs(OUT, exist_ok=True)

LABEL_HEIGHT = 36  # tinggi area label di bawah setiap gambar
LABEL_BG     = (30, 41, 59)    # slate-800
LABEL_FG     = (203, 213, 225) # slate-300
GAP          = 6               # jarak antar gambar (px)
BORDER_COL   = (51, 65, 85)    # slate-700
TARGET_H     = 600             # tinggi target setiap gambar sebelum digabung


def load_and_resize(path: str, target_h: int = TARGET_H) -> Image.Image:
    """Buka gambar, resize proporsional ke target_h."""
    img = Image.open(path).convert("RGB")
    w, h = img.size
    scale = target_h / h
    return img.resize((int(w * scale), target_h), Image.LANCZOS)


def add_label(img: Image.Image, text: str) -> Image.Image:
    """Tambahkan label teks di bawah gambar."""
    w, h = img.size
    canvas = Image.new("RGB", (w, h + LABEL_HEIGHT), LABEL_BG)
    canvas.paste(img, (0, 0))
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("arial.ttf", 13)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (w - tw) // 2
    ty = h + (LABEL_HEIGHT - th) // 2
    draw.text((tx, ty), text, fill=LABEL_FG, font=font)
    return canvas


def hconcat(images: list, labels: list) -> Image.Image:
    """Gabungkan daftar gambar secara horizontal dengan label."""
    labeled = [add_label(img, lbl) for img, lbl in zip(images, labels)]
    total_w = sum(i.width for i in labeled) + GAP * (len(labeled) - 1)
    max_h   = max(i.height for i in labeled)
    canvas  = Image.new("RGB", (total_w, max_h), BORDER_COL)
    x = 0
    for img in labeled:
        canvas.paste(img, (x, 0))
        x += img.width + GAP
    return canvas


# ─── Definisi 8 grup ──────────────────────────────────────────────────────────

GROUPS = [
    {
        "output": "combined_01_auth_overview.jpg",
        "files":  ["01_login.png", "02_dashboard.png"],
        "labels": ["Login Screen", "Main Dashboard"],
    },
    {
        "output": "combined_02_master_data_items.jpg",
        "files":  ["03_items_list.png", "04_items_form.png", "06_units.png"],
        "labels": ["Items List", "Create/Edit Item Form", "Units of Measure"],
    },
    {
        "output": "combined_03_master_data_master.jpg",
        "files":  ["05_categories.png", "07_suppliers.png", "08_customers.png"],
        "labels": ["Category Management", "Supplier Management", "Customer Management"],
    },
    {
        "output": "combined_04_stock_in.jpg",
        "files":  ["09_stock_in_list.png", "10_stock_in_form.png", "11_stock_in_detail.png"],
        "labels": ["Stock In List", "Stock In Form", "Stock In Detail"],
    },
    {
        "output": "combined_05_stock_out.jpg",
        "files":  ["12_stock_out_list.png", "13_stock_out_form.png", "14_stock_out_detail.png"],
        "labels": ["Stock Out List", "Stock Out Form", "Stock Out Detail"],
    },
    {
        "output": "combined_06_stock_position_history.jpg",
        "files":  ["15_stock_position.png", "16_stock_history.png"],
        "labels": ["Stock Position", "Stock History"],
    },
    {
        "output": "combined_07_reports.jpg",
        "files":  ["17_report_stock.png", "18_report_stock_in.png", "19_report_stock_out.png"],
        "labels": ["Stock Report", "Stock In Report", "Stock Out Report"],
    },
    {
        "output": "combined_08_warehouse_settings.jpg",
        "files":  ["20_warehouse_layout.png", "21_profile.png", "22_users.png"],
        "labels": ["Warehouse Layout", "User Profile", "User Management"],
    },
]

# ─── Proses ───────────────────────────────────────────────────────────────────

def main():
    print(f"[INFO] Source : {SRC}")
    print(f"[INFO] Output : {OUT}")
    print()

    for i, grp in enumerate(GROUPS, 1):
        images = []
        for fname in grp["files"]:
            fpath = os.path.join(SRC, fname)
            if not os.path.exists(fpath):
                print(f"  [SKIP] File tidak ditemukan: {fpath}")
                continue
            images.append(load_and_resize(fpath))

        if not images:
            print(f"  [ERROR] Grup {i} dilewati - tidak ada gambar yang valid.")
            continue

        combined = hconcat(images, grp["labels"])
        out_path = os.path.join(OUT, grp["output"])
        combined.save(out_path, "JPEG", quality=90)
        size_kb = os.path.getsize(out_path) // 1024
        print(f"  [OK] [{i}/8] {grp['output']}  ({combined.width}x{combined.height}px, {size_kb} KB)")

    print()
    print("[DONE] Selesai! Semua gambar gabungan tersimpan di folder 'combined/'.")


if __name__ == "__main__":
    main()
