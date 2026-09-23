from PIL import Image
from pathlib import Path

src = Path('public/pms-image.png')
dst = Path('public/pms-image-optimized.png')
img = Image.open(src).convert('RGBA')
img = img.resize((256, 256), Image.LANCZOS)
img.save(dst, optimize=True, compress_level=9)
print(dst)
print(img.size)
