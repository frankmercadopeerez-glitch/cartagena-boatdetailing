"""
SEO Fix Script — Colombia Boat Detailing
- Adds missing <link rel="canonical"> to pages without one
- Adds missing <meta name="robots"> to pages without one
- Cleans whitespace from <title> tags
"""

import re, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = "https://www.colombiaboatdetailing.com/"
ROBOTS_CONTENT = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

# All root-level pages to fix  (filename -> canonical URL)
ROOT_FILES = {
    'index.html':                          BASE_URL,
    'index-en.html':                       BASE_URL + 'index-en.html',
    'hull-cleaning.html':                  BASE_URL + 'hull-cleaning.html',
    'hull-cleaning-en.html':               BASE_URL + 'hull-cleaning-en.html',
    'hull-cleaning-bocagrande-en.html':    BASE_URL + 'hull-cleaning-bocagrande-en.html',
    'limpieza-casco-bocagrande.html':      BASE_URL + 'limpieza-casco-bocagrande.html',
    'limpieza-casco-baru.html':            BASE_URL + 'limpieza-casco-baru.html',
    'hull-cleaning-baru-en.html':          BASE_URL + 'hull-cleaning-baru-en.html',
    'limpieza-casco-islas-del-rosario.html': BASE_URL + 'limpieza-casco-islas-del-rosario.html',
    'hull-cleaning-rosario-en.html':       BASE_URL + 'hull-cleaning-rosario-en.html',
    'limpieza-casco-manzanillo.html':      BASE_URL + 'limpieza-casco-manzanillo.html',
    'hull-cleaning-manzanillo-en.html':    BASE_URL + 'hull-cleaning-manzanillo-en.html',
    'gelcoat.html':                        BASE_URL + 'gelcoat.html',
    'gelcoat-en.html':                     BASE_URL + 'gelcoat-en.html',
    'interior-detailing.html':             BASE_URL + 'interior-detailing.html',
    'interior-detailing-en.html':          BASE_URL + 'interior-detailing-en.html',
    'ppf.html':                            BASE_URL + 'ppf.html',
    'ppf-en.html':                         BASE_URL + 'ppf-en.html',
    'ceramic-coating.html':                BASE_URL + 'ceramic-coating.html',
    'ceramic-coating-en.html':             BASE_URL + 'ceramic-coating-en.html',
    'paint-polishing.html':                BASE_URL + 'paint-polishing.html',
    'paint-polishing-en.html':             BASE_URL + 'paint-polishing-en.html',
    'about.html':                          BASE_URL + 'about.html',
    'about-en.html':                       BASE_URL + 'about-en.html',
    'contacto.html':                       BASE_URL + 'contacto.html',
    'contact-en.html':                     BASE_URL + 'contact-en.html',
    'services.html':                       BASE_URL + 'services.html',
    'services-en.html':                    BASE_URL + 'services-en.html',
    'anti-corrosion.html':                 BASE_URL + 'anti-corrosion.html',
    'anti-corrosion-en.html':              BASE_URL + 'anti-corrosion-en.html',
    # Extra service pages
    'fibra.html':                          BASE_URL + 'fibra.html',
    'boat-painting.html':                  BASE_URL + 'boat-painting.html',
    'bottom-paint.html':                   BASE_URL + 'bottom-paint.html',
    'cubierta-sintetica.html':             BASE_URL + 'cubierta-sintetica.html',
    'cubierta-teka.html':                  BASE_URL + 'cubierta-teka.html',
    'electrical-systems.html':             BASE_URL + 'electrical-systems.html',
    'engine-painting.html':               BASE_URL + 'engine-painting.html',
    'technical-wash.html':                 BASE_URL + 'technical-wash.html',
    'polarizado.html':                     BASE_URL + 'polarizado.html',
    'calcomanias.html':                    BASE_URL + 'calcomanias.html',
    # Pulido zone pages
    'pulido-gelcoat-baru.html':            BASE_URL + 'pulido-gelcoat-baru.html',
    'pulido-gelcoat-bocagrande.html':      BASE_URL + 'pulido-gelcoat-bocagrande.html',
    'pulido-gelcoat-cartagena.html':       BASE_URL + 'pulido-gelcoat-cartagena.html',
    'pulido-gelcoat-islas-rosario.html':   BASE_URL + 'pulido-gelcoat-islas-rosario.html',
}

def fix_file(filepath, canonical_url):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    changed = []

    # 1. Clean whitespace from <title>
    def clean_title(m):
        inner = re.sub(r'\s+', ' ', m.group(1)).strip()
        return f'<title>{inner}</title>'
    content = re.sub(r'<title>(.*?)</title>', clean_title, content, flags=re.S)

    # 2. Add missing canonical (insert before </head>)
    has_canonical = bool(re.search(r'<link\s+rel="canonical"', content, re.I))
    if not has_canonical:
        canonical_tag = f'  <link rel="canonical" href="{canonical_url}" />\n'
        content = content.replace('</head>', canonical_tag + '</head>', 1)
        changed.append('canonical')

    # 3. Add missing robots meta (insert after <meta charset> line or after <head>)
    has_robots = bool(re.search(r'<meta\s+name="robots"', content, re.I))
    if not has_robots:
        robots_tag = f'  <meta name="robots" content="{ROBOTS_CONTENT}" />\n'
        # Insert after the charset meta if present
        charset_match = re.search(r'(<meta\s+charset[^>]*>)', content, re.I)
        if charset_match:
            pos = charset_match.end()
            content = content[:pos] + '\n' + robots_tag + content[pos:]
        else:
            content = content.replace('</head>', robots_tag + '</head>', 1)
        changed.append('robots')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  FIXED [{", ".join(changed)}]: {os.path.basename(filepath)}')
    else:
        print(f'  OK: {os.path.basename(filepath)}')


print('=== Fixing root pages ===')
for fname, canonical in ROOT_FILES.items():
    fpath = os.path.join(BASE, fname)
    if os.path.exists(fpath):
        fix_file(fpath, canonical)
    else:
        print(f'  SKIP (not found): {fname}')

# Fix blog posts
print('\n=== Fixing blog posts ===')
blog_root = os.path.join(BASE, 'blog')
fixed_blog = 0
if os.path.isdir(blog_root):
    for folder in sorted(os.listdir(blog_root)):
        folder_path = os.path.join(blog_root, folder)
        if not os.path.isdir(folder_path):
            continue
        index_file = os.path.join(folder_path, 'index.html')
        if os.path.exists(index_file):
            canonical_url = f'{BASE_URL}blog/{folder}/'
            fix_file(index_file, canonical_url)
            fixed_blog += 1

print(f'\nDone. Fixed {fixed_blog} blog posts.')
