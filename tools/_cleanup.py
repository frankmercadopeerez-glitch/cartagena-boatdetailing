"""
Cleanup script:
1. Remove empty <noscript></noscript> tags from all HTML files
2. Remove leftover Google Fonts from facturas/ and any remaining files
"""
import os, re, glob

ROOT = os.path.dirname(os.path.abspath(__file__))

all_html = glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
SKIP = {"business-card.html", "finanzas.html", "calendario-seo-2026.html"}

GF_PATTERNS = [
    r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com"[^>]*/>\s*\n?',
    r'\s*<link rel="preconnect" href="https://fonts\.gstatic\.com"[^>]*/>\s*\n?',
    r'\s*<link rel="dns-prefetch" href="//fonts\.(googleapis|gstatic)\.com"[^>]*/>\s*\n?',
    r'\s*<link\s+\n?\s+href="https://fonts\.googleapis\.com/css2\?[^"]+"\s*\n?\s+rel="stylesheet"[^>]*/>\s*\n?',
    r'\s*<link\s+href="https://fonts\.googleapis\.com/css2\?[^"]*"\s+rel="stylesheet"[^>]*/>\s*\n?',
    r'\s*<link rel="preload" href="https://fonts\.googleapis\.com/css2\?[^"]*" as="style" onload=[^>]*/>\s*\n?',
    r'\s*<noscript><link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet" /></noscript>\s*\n?',
    r'\s*<link rel="preload" href="https://fonts\.googleapis\.com/css2\?[^"]*" as="style"[^>]*/>\s*\n?',
    # Google Fonts multi-line blocking link (facturas style)
    r'\s*<link\s*\n\s+href="https://fonts\.googleapis\.com/css2\?[^"]+"\s*\n\s+rel="stylesheet"\s*\n\s*/>\s*\n?',
]

n = 0
for path in sorted(all_html):
    fname = os.path.basename(path)
    if fname in SKIP:
        continue

    with open(path, encoding="utf-8") as f:
        html = f.read()
    orig = html

    # Remove empty <noscript></noscript>
    html = re.sub(r'\s*<noscript></noscript>\s*\n?', '\n', html)

    # Remove leftover Google Fonts (for facturas, cotizar, etc.)
    for pat in GF_PATTERNS:
        html = re.sub(pat, '', html, flags=re.IGNORECASE | re.DOTALL)

    # Remove duplicate blank lines (max 2 consecutive)
    html = re.sub(r'\n{3,}', '\n\n', html)

    if html != orig:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        n += 1

print(f"Cleaned {n} files")
