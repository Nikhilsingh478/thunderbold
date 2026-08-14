"""Generate pure solid #080808 black splash images (no icon) for Android.
The native Capacitor SplashScreen plugin handles the background color,
so these images just need to be solid black canvases."""

from PIL import Image
import os

splash_files = {
    r"android\app\src\main\res\drawable\splash.png": (480, 800),
    r"android\app\src\main\res\drawable-land-mdpi\splash.png": (480, 320),
    r"android\app\src\main\res\drawable-land-hdpi\splash.png": (800, 480),
    r"android\app\src\main\res\drawable-land-xhdpi\splash.png": (1280, 720),
    r"android\app\src\main\res\drawable-land-xxhdpi\splash.png": (1600, 960),
    r"android\app\src\main\res\drawable-land-xxxhdpi\splash.png": (1920, 1280),
    r"android\app\src\main\res\drawable-port-mdpi\splash.png": (320, 480),
    r"android\app\src\main\res\drawable-port-hdpi\splash.png": (480, 800),
    r"android\app\src\main\res\drawable-port-xhdpi\splash.png": (720, 1280),
    r"android\app\src\main\res\drawable-port-xxhdpi\splash.png": (960, 1600),
    r"android\app\src\main\res\drawable-port-xxxhdpi\splash.png": (1280, 1920),
}

BG_COLOR = (8, 8, 8)

for rel_path, (w, h) in splash_files.items():
    dest = os.path.abspath(rel_path)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    img = Image.new("RGB", (w, h), BG_COLOR)
    img.save(dest, "PNG")
    print(f"Created solid black {w}x{h} -> {rel_path}")

print("Done — all splash images are solid #080808 black (no icon).")
