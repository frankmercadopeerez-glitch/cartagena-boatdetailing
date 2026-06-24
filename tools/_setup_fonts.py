"""
Downloads Google Fonts (latin subset only) and creates self-hosted @font-face CSS.
Run from project root: python _setup_fonts.py
"""
import os, re, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(ROOT, 'fonts')
os.makedirs(FONTS_DIR, exist_ok=True)

FONTS_URL = (
    "https://fonts.googleapis.com/css2?"
    "family=Inter:wght@300;400;500;600;700"
    "&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400"
    "&display=swap"
)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"

def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as r:
        return r.read() if binary else r.read().decode("utf-8")

print("Fetching Google Fonts CSS...")
css = fetch(FONTS_URL)

# Parse blocks: each @font-face with its preceding /* comment */ for subset label
pattern = re.compile(
    r'/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{[^}]+\})',
    re.DOTALL
)

# We only want latin and latin-ext for Spanish
KEEP_SUBSETS = {"latin", "latin-ext"}

face_blocks = []
for m in pattern.finditer(css):
    subset = m.group(1).strip()
    block  = m.group(2).strip()
    if subset not in KEEP_SUBSETS:
        continue

    # Extract font properties
    family  = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    style   = re.search(r"font-style:\s*(\w+)", block).group(1)
    weight  = re.search(r"font-weight:\s*(\d+)", block).group(1)
    src_url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
    u_range = re.search(r"unicode-range:\s*([^\n;]+)", block)
    u_range = u_range.group(1).strip() if u_range else None

    # Build local filename
    safe_family = family.lower().replace(" ", "-")
    filename    = f"{safe_family}-{style}-{weight}-{subset}.woff2"
    local_path  = os.path.join(FONTS_DIR, filename)

    if not os.path.exists(local_path):
        print(f"  Downloading {filename}...")
        data = fetch(src_url, binary=True)
        with open(local_path, "wb") as f:
            f.write(data)
        print(f"    {len(data)//1024} KB")
    else:
        print(f"  Already exists: {filename}")

    face_blocks.append({
        "family": family,
        "style": style,
        "weight": weight,
        "subset": subset,
        "filename": filename,
        "unicode_range": u_range,
    })

# Generate @font-face CSS
print("\nGenerating @font-face CSS...")
font_css_lines = []
for b in face_blocks:
    font_path = f"../fonts/{b['filename']}"
    lines = [
        f"/* {b['subset']} */",
        "@font-face {",
        f"  font-family: '{b['family']}';",
        f"  font-style: {b['style']};",
        f"  font-weight: {b['weight']};",
        "  font-display: swap;",
        f"  src: url('{font_path}') format('woff2');",
    ]
    if b["unicode_range"]:
        lines.append(f"  unicode-range: {b['unicode_range']};")
    lines.append("}")
    font_css_lines.extend(lines)

font_css = "\n".join(font_css_lines)

# Prepend @font-face rules to styles.css (before existing content)
styles_path = os.path.join(ROOT, "css", "styles.css")
with open(styles_path, encoding="utf-8") as f:
    existing = f.read()

# Remove any existing Google Fonts @import or previous @font-face blocks
existing = re.sub(r'@import url\(["\']?https://fonts\.googleapis\.com[^)]+\)["\']?;\s*\n?', '', existing)
existing = re.sub(r'/\* (latin|latin-ext|cyrillic[^*]*) \*/\s*\n@font-face \{[^}]+\}\s*\n?', '', existing)

new_styles = (
    "/* === Self-hosted Google Fonts (latin + latin-ext, display:swap) === */\n"
    + font_css
    + "\n\n"
    + existing.lstrip()
)
with open(styles_path, "w", encoding="utf-8") as f:
    f.write(new_styles)
print(f"  Prepended @font-face rules to css/styles.css")

print(f"\nDone. {len(face_blocks)} font faces added.")
print(f"Font files in: fonts/")
