"""
1. Removes latin-ext @font-face blocks from css/styles.css (files deleted, not needed for Spanish)
2. Removes Google Fonts <link> tags and preconnects from ALL html pages  
3. Adds <link rel="preload"> for critical Inter 400 + Playfair 700 fonts
4. Minifies css/styles.css (remove comments, collapse whitespace)
5. Updates HTML pages to preload critical fonts
"""
import os, re, glob, csscompressor  # pip install csscompressor

ROOT = os.path.dirname(os.path.abspath(__file__))
STYLES_PATH = os.path.join(ROOT, "css", "styles.css")

# ---- 1. Remove latin-ext @font-face blocks from styles.css ----
with open(STYLES_PATH, encoding="utf-8") as f:
    css = f.read()

# Remove entire latin-ext @font-face block (comment + block)
css = re.sub(
    r'/\* latin-ext \*/\s*\n@font-face \{[^}]+\}\s*\n?',
    '',
    css
)

with open(STYLES_PATH, "w", encoding="utf-8") as f:
    f.write(css)
print("1. Removed latin-ext @font-face blocks from styles.css")

# ---- 2 & 3: Update all HTML pages ----
html_files = (
    glob.glob(os.path.join(ROOT, "*.html")) +
    glob.glob(os.path.join(ROOT, "cotizaciones", "*.html")) +
    glob.glob(os.path.join(ROOT, "blog", "**", "*.html"), recursive=True)
)

SKIP = {"business-card.html", "finanzas.html", "calendario-seo-2026.html"}

# Google Fonts patterns to remove
GF_PATTERNS = [
    # <link rel="preconnect" href="https://fonts.googleapis.com" />
    r'<link rel="preconnect" href="https://fonts\.googleapis\.com" ?/?>\s*\n?',
    # <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    r'<link rel="preconnect" href="https://fonts\.gstatic\.com"[^>]*/>\s*\n?',
    # dns-prefetch for google fonts
    r'<link rel="dns-prefetch" href="//fonts\.googleapis\.com" ?/?>\s*\n?',
    r'<link rel="dns-prefetch" href="//fonts\.gstatic\.com" ?/?>\s*\n?',
    # blocking link
    r'<link\s+\n?\s+href="https://fonts\.googleapis\.com/css2\?[^"]+"\s+rel="stylesheet"\s*/?>\s*\n?',
    r'<link\s+href="https://fonts\.googleapis\.com/css2\?[^"]*"\s+rel="stylesheet"\s*/?>\s*\n?',
    r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?[^"]*"\s*/?>\s*\n?',
    # async preload version (_perf.py produced)
    r'<link rel="preload" href="https://fonts\.googleapis\.com/css2\?[^"]*" as="style" onload=[^>]*/>\s*\n?',
    r'<noscript><link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet" /></noscript>\s*\n?',
    # preload (old format without onload)
    r'<link rel="preload" href="https://fonts\.googleapis\.com/css2\?[^"]*" as="style" ?/?>\s*\n?',
]

# Preload tags to inject (relative paths adjusted per page depth)
def get_preload_block(depth):
    """depth=0 for root, depth=1 for cotizaciones, depth=2 for blog/post/"""
    prefix = "../" * depth
    return (
        f'    <!-- Preload critical fonts -->\n'
        f'    <link rel="preload" href="{prefix}fonts/inter-normal-400-latin.woff2" as="font" type="font/woff2" crossorigin />\n'
        f'    <link rel="preload" href="{prefix}fonts/playfair-display-normal-700-latin.woff2" as="font" type="font/woff2" crossorigin />\n'
    )

changed = 0
for path in sorted(html_files):
    fname = os.path.basename(path)
    if fname in SKIP:
        continue

    with open(path, encoding="utf-8") as f:
        html = f.read()
    orig = html

    # Remove all Google Fonts tags
    for pat in GF_PATTERNS:
        html = re.sub(pat, '', html, flags=re.IGNORECASE)

    # Skip if fonts already preloaded locally
    if 'fonts/inter-normal-400-latin.woff2' not in html:
        # Determine depth
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        depth = rel.count("/")
        preload_block = get_preload_block(depth)
        # Inject before </head> or before first <link rel="stylesheet"
        if '<link rel="stylesheet"' in html:
            html = html.replace(
                '<link rel="stylesheet"',
                preload_block + '    <link rel="stylesheet"',
                1
            )
        elif '</head>' in html:
            html = html.replace('</head>', preload_block + '</head>', 1)

    if html != orig:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        changed += 1

print(f"2+3. Updated {changed} HTML files (removed Google Fonts, added local preloads)")

# ---- 4. Minify styles.css ----
try:
    import csscompressor
    with open(STYLES_PATH, encoding="utf-8") as f:
        css = f.read()
    # Keep the @font-face section readable, minify the rest
    # Actually just minify everything
    minified = csscompressor.compress(css)
    with open(STYLES_PATH, "w", encoding="utf-8") as f:
        f.write(minified)
    size_kb = len(minified.encode()) / 1024
    print(f"4. Minified styles.css → {size_kb:.1f} KB")
except ImportError:
    print("4. csscompressor not installed — run: pip install csscompressor")

print("\nDone.")
