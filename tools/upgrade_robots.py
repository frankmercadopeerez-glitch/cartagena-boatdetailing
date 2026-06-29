"""
Upgrade robots meta to full version with max-image-preview, max-snippet, max-video-preview
on pages that only have 'index, follow'
"""
import re, os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FULL_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
BASIC_ROBOTS = re.compile(r'(index,\s*follow)\s*"', re.I)

# Files to upgrade
zone_files = [
    'limpieza-casco-bocagrande.html',
    'hull-cleaning-bocagrande-en.html',
    'limpieza-casco-baru.html',
    'hull-cleaning-baru-en.html',
    'limpieza-casco-islas-del-rosario.html',
    'hull-cleaning-rosario-en.html',
    'limpieza-casco-manzanillo.html',
    'hull-cleaning-manzanillo-en.html',
    'pulido-gelcoat-baru.html',
    'pulido-gelcoat-bocagrande.html',
    'pulido-gelcoat-cartagena.html',
    'pulido-gelcoat-islas-rosario.html',
]

for fname in zone_files:
    if not os.path.exists(fname):
        print(f'SKIP (not found): {fname}')
        continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check current robots value
    robots = re.search(r'<meta\s[^>]*name=["\']robots["\'][^>]*>', content, re.S | re.I)
    if not robots:
        print(f'NO ROBOTS META: {fname}')
        continue
    
    tag = robots.group(0)
    # Check if already has full version
    if 'max-image-preview' in tag:
        print(f'  OK (already full): {fname}')
        continue
    
    # Replace the robots tag with full version
    # Find the content= attribute value and replace
    new_tag = re.sub(
        r'content=["\'][^"\']+["\']',
        f'content="{FULL_ROBOTS}"',
        tag
    )
    new_content = content.replace(tag, new_tag, 1)
    if new_content != content:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'  UPGRADED: {fname}')
    else:
        print(f'  UNCHANGED: {fname}')

# Also check blog posts
print('\n--- Blog post robots check (sample) ---')
blog_root = 'blog'
upgraded = 0
for folder in sorted(os.listdir(blog_root)):
    fpath = os.path.join(blog_root, folder, 'index.html')
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    robots = re.search(r'<meta\s[^>]*name=["\']robots["\'][^>]*>', content, re.S | re.I)
    if robots and 'max-image-preview' not in robots.group(0):
        tag = robots.group(0)
        new_tag = re.sub(r'content=["\'][^"\']+["\']', f'content="{FULL_ROBOTS}"', tag)
        new_content = content.replace(tag, new_tag, 1)
        if new_content != content:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            upgraded += 1
print(f'Blog posts upgraded: {upgraded}')
print('Done.')
