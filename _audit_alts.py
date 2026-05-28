"""
Find all <img> tags across service and main pages.
Print file, alt text, and src to identify generic/missing alt texts.
"""
import re, os, glob

ROOT = r"C:\Users\Dell\PROYECTOS WEB\cartagena-boatdetailing"

# Check main pages (not blog, not cotizaciones)
pages = glob.glob(os.path.join(ROOT, '*.html'))
img_pattern = re.compile(r'<img[^>]+>', re.DOTALL)
alt_pattern = re.compile(r'alt=["\']([^"\']*)["\']')
src_pattern = re.compile(r'src=["\']([^"\']+)["\']')

print(f"{'FILE':<40} {'ALT':<50} SRC")
print('-' * 120)
for path in sorted(pages):
    fname = os.path.basename(path)
    with open(path, encoding='utf-8') as f:
        html = f.read()
    for img in img_pattern.finditer(html):
        tag = img.group(0)
        alt_m = alt_pattern.search(tag)
        src_m = src_pattern.search(tag)
        alt = alt_m.group(1) if alt_m else '[NO ALT]'
        src = src_m.group(1) if src_m else '[NO SRC]'
        # Skip icons, SVGs, data URIs
        if src.startswith('data:') or '.svg' in src or 'unpkg' in src:
            continue
        print(f"{fname:<40} {alt:<50} {src}")
