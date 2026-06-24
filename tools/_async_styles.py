"""
Makes styles.css load async (non-render-blocking) across all HTML pages.
Critical above-fold styles are already inline in the <head>, so styles.css
can load after first paint without causing CLS.
"""
import os, re, glob

ROOT = os.path.dirname(os.path.abspath(__file__))

html_files = (
    glob.glob(os.path.join(ROOT, "*.html")) +
    glob.glob(os.path.join(ROOT, "cotizaciones", "*.html")) +
    glob.glob(os.path.join(ROOT, "blog", "**", "*.html"), recursive=True)
)

SKIP = {"business-card.html", "finanzas.html", "calendario-seo-2026.html"}

# Pattern: sync styles.css link
SYNC_PATTERN = re.compile(
    r'<link rel="stylesheet" href="([^"]*css/styles\.css)" />',
)

changed = 0
for path in sorted(html_files):
    fname = os.path.basename(path)
    if fname in SKIP:
        continue

    with open(path, encoding="utf-8") as f:
        html = f.read()
    orig = html

    def make_async(m):
        href = m.group(1)
        return (
            f'<link rel="preload" href="{href}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" />\n'
            f'    <noscript><link rel="stylesheet" href="{href}" /></noscript>'
        )

    html = SYNC_PATTERN.sub(make_async, html)

    if html != orig:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        changed += 1

print(f"Made styles.css async in {changed} HTML files")
