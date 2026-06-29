import os, re, html

BLOG = 'blog'
inserted = 0
skipped = 0

for folder in sorted(os.listdir(BLOG)):
    path = os.path.join(BLOG, folder, 'index.html')
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if a body hero image already exists
    if 'blog-hero-img' in content:
        skipped += 1
        continue

    # Extract og:image
    m = re.search(r'og:image"\s+content="https://www\.colombiaboatdetailing\.com/(images/[^"]+)"', content)
    if not m:
        print(f'NO og:image: {folder}')
        skipped += 1
        continue
    rel = '../../' + m.group(1)

    # Alt text from <h1>
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.S)
    alt = 'Detailing naval Cartagena'
    if h1:
        alt = re.sub(r'<[^>]+>', ' ', h1.group(1))
        alt = re.sub(r'\s+', ' ', alt).strip()[:120]

    hero = (
        '\n    <div class="container mx-auto px-6 -mt-8 mb-4">\n'
        '      <div class="max-w-3xl mx-auto">\n'
        f'        <img class="blog-hero-img w-full h-64 md:h-80 object-cover rounded-sm shadow-lg" '
        f'src="{rel}" alt="{html.escape(alt)}" width="768" height="384" loading="lazy" />\n'
        '      </div>\n    </div>\n'
    )

    # Insert after the first </header>
    if '</header>' in content:
        content = content.replace('</header>', '</header>' + hero, 1)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        inserted += 1
    else:
        print(f'NO </header>: {folder}')
        skipped += 1

print(f'\nInserted hero images: {inserted}, skipped: {skipped}')
