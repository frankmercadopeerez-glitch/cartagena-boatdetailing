#!/usr/bin/env python3
"""
Add BreadcrumbList schema to all blog articles that don't have it yet.
Reads title from <title> tag and canonical URL from <link rel="canonical">.
"""
import re, os, glob

ROOT = r"C:\Users\Dell\PROYECTOS WEB\cartagena-boatdetailing"
BLOG_PATTERN = os.path.join(ROOT, "blog", "*", "index.html")

def read_utf8(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def write_utf8(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def extract_title(content):
    m = re.search(r'<title>([^<]+)</title>', content)
    if not m:
        return None
    # Clean up whitespace
    return re.sub(r'\s+', ' ', m.group(1)).strip()

def extract_canonical(content):
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', content)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', content)
    return m.group(1).strip() if m else None

def make_breadcrumb_schema(title, url):
    # Strip pipe separator: "Title of Article | Colombia Boat Detailing" -> "Title of Article"
    display_title = title.split(' | ')[0].strip() if ' | ' in title else title
    return f'''    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": "https://colombiaboatdetailing.com/"
        }},
        {{
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://colombiaboatdetailing.com/blog.html"
        }},
        {{
          "@type": "ListItem",
          "position": 3,
          "name": "{display_title}",
          "item": "{url}"
        }}
      ]
    }}
    </script>'''

def process_file(path):
    content = read_utf8(path)

    # Skip if BreadcrumbList already exists
    if 'BreadcrumbList' in content:
        return False, "already has BreadcrumbList"

    title = extract_title(content)
    if not title:
        return False, "no <title> found"

    canonical = extract_canonical(content)
    if not canonical:
        return False, "no canonical found"

    schema = make_breadcrumb_schema(title, canonical)

    # Inject right before </head>
    if '</head>' not in content:
        return False, "no </head> found"

    new_content = content.replace('</head>', schema + '\n  </head>', 1)
    write_utf8(path, new_content)
    return True, f'"{title[:60]}"'

def main():
    files = sorted(glob.glob(BLOG_PATTERN))
    print(f"Found {len(files)} blog articles\n")

    updated = 0
    skipped = 0

    for path in files:
        slug = os.path.basename(os.path.dirname(path))
        ok, msg = process_file(path)
        if ok:
            print(f"  ✓ {slug}")
            updated += 1
        else:
            print(f"  - {slug} ({msg})")
            skipped += 1

    print(f"\nDone: {updated} updated, {skipped} skipped")

if __name__ == '__main__':
    main()
