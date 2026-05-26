#!/usr/bin/env python3
"""Performance optimizations: replace Tailwind CDN with compiled CSS, async fonts, lazy images."""
import re, os

ROOT = r"C:\Users\Dell\PROYECTOS WEB\cartagena-boatdetailing"
FONTS_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"

def read_utf8(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def write_utf8(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def optimize_head(content, tw_path, css_path):
    # 1. Remove unused preload for Google Fonts (no onload = useless)
    content = re.sub(
        r'\s*<link rel="preload" href="https://fonts\.googleapis\.com/css2\?[^"]*" as="style" />\n',
        '\n', content)

    # 2. Replace blocking Google Fonts stylesheet with async pattern
    content = re.sub(
        r'(<link\s+href=")(https://fonts\.googleapis\.com/css2\?[^"]+)("\s+rel="stylesheet"\s+/>)',
        lambda m: (
            f'<link rel="preload" href="{m.group(2)}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" />\n'
            f'    <noscript><link href="{m.group(2)}" rel="stylesheet" /></noscript>'
        ),
        content
    )
    # Also handle multi-line version: <link\n      href="..."\n      rel="stylesheet"\n    />
    content = re.sub(
        r'<link\s*\n\s+href="(https://fonts\.googleapis\.com/css2\?[^"]+)"\s*\n\s+rel="stylesheet"\s*\n\s+/>',
        lambda m: (
            f'<link rel="preload" href="{m.group(1)}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" />\n'
            f'    <noscript><link href="{m.group(1)}" rel="stylesheet" /></noscript>'
        ),
        content
    )

    # 3. Remove dns-prefetch for cdn.tailwindcss.com (no longer needed)
    content = re.sub(r'\s*<link rel="dns-prefetch" href="//cdn\.tailwindcss\.com" />\n', '\n', content)

    # 4. Replace Tailwind CDN script (with optional comment) with compiled CSS link
    content = re.sub(
        r'(\s*<!-- Tailwind CSS -->\s*\n)?\s*<script src="https://cdn\.tailwindcss\.com"></script>\s*\n',
        f'\n    <!-- Tailwind CSS (compiled) -->\n    <link rel="stylesheet" href="{tw_path}" />\n',
        content
    )

    # 5. Remove tailwind.config inline script block
    content = re.sub(
        r'\s*<script>\s*\n\s*tailwind\.config\s*=\s*\{.*?\};\s*\n\s*</script>\s*\n',
        '\n',
        content,
        flags=re.DOTALL
    )

    # 6. Add preconnect for unpkg.com (Phosphor Icons) if not already present
    if 'preconnect" href="https://unpkg.com"' not in content and 'unpkg.com/@phosphor-icons' in content:
        content = content.replace(
            '<link rel="preconnect" href="https://fonts.googleapis.com" />',
            '<link rel="preconnect" href="https://fonts.googleapis.com" />\n    <link rel="preconnect" href="https://unpkg.com" crossorigin />'
        )

    # 7. Add fetchpriority="high" to hero image preload if missing
    content = re.sub(
        r'(<link rel="preload" href="[^"]*header[^"]*" as="image"[^/]*?)( />)',
        lambda m: m.group(1) + ' fetchpriority="high"' + m.group(2) if 'fetchpriority' not in m.group(1) else m.group(0),
        content
    )

    return content

def add_lazy_loading(content):
    """Add loading="lazy" to all img tags except the first/hero one."""
    imgs = list(re.finditer(r'<img\s', content))
    if not imgs:
        return content
    # Skip the first img (likely LCP/hero), lazy-load the rest
    for m in reversed(imgs[1:]):
        tag_end = content.index('>', m.start())
        tag = content[m.start():tag_end+1]
        if 'loading=' not in tag:
            new_tag = tag.replace('<img ', '<img loading="lazy" ')
            content = content[:m.start()] + new_tag + content[tag_end+1:]
    return content

SKIP = {'business-card.html', 'finanzas.html', 'calendario-seo-2026.html'}

# Process root pages
print("ROOT pages...")
for fname in sorted(os.listdir(ROOT)):
    if not fname.endswith('.html') or fname in SKIP:
        continue
    path = os.path.join(ROOT, fname)
    content = read_utf8(path)
    if 'cdn.tailwindcss.com' not in content and 'tailwind.css' not in content:
        continue
    css_path = 'css/styles.css'
    tw_path = 'css/tailwind.css'
    content = optimize_head(content, tw_path, css_path)
    content = add_lazy_loading(content)
    write_utf8(path, content)
    print(f"  OK: {fname}")

# Process blog posts
print("BLOG posts...")
blog_dir = os.path.join(ROOT, 'blog')
for post in sorted(os.listdir(blog_dir)):
    path = os.path.join(blog_dir, post, 'index.html')
    if not os.path.exists(path):
        continue
    content = read_utf8(path)
    if 'cdn.tailwindcss.com' not in content and 'tailwind.css' not in content:
        continue
    tw_path = '../../css/tailwind.css'
    content = optimize_head(content, tw_path, '../../css/styles.css')
    content = add_lazy_loading(content)
    write_utf8(path, content)
    print(f"  OK: blog/{post}/")

print("Done!")
