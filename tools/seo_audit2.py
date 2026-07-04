import os, re

root = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing'

# Check hreflang in HTML pages
issues = []

# Check all HTML files for hreflang
all_html = [f for f in os.listdir(root) if f.endswith('.html')]
skip = {'business-card.html', 'calendario-seo-2026.html', 'finanzas.html', 'cotizar.html', 'blog.html'}

print("=== HREFLANG CHECK ===")
for fname in sorted(all_html):
    if fname in skip:
        continue
    with open(os.path.join(root, fname), encoding='utf-8', errors='ignore') as f:
        content = f.read()
    hreflang_links = re.findall(r'<link[^>]+hreflang[^>]+>', content, re.IGNORECASE)
    is_en = fname.endswith('-en.html')
    has_es_counterpart = os.path.exists(os.path.join(root, fname.replace('-en.html', '.html')))
    
    if is_en and has_es_counterpart and not hreflang_links:
        issues.append((fname, 'EN page missing hreflang'))
    elif not is_en and not hreflang_links:
        en_counterpart = fname.replace('.html', '-en.html')
        if os.path.exists(os.path.join(root, en_counterpart)):
            issues.append((fname, 'ES page missing hreflang (has EN version: ' + en_counterpart + ')'))

print(f"Hreflang issues: {len(issues)}")
for f, issue in issues:
    print(f"  {f} -> {issue}")

# Check for internal links to redirecting pages
redirecting_pages = {
    'pulido-gelcoat-cartagena.html',
    'index.html',
}
print("\n=== INTERNAL LINKS TO REDIRECTING PAGES ===")
for fname in sorted(all_html):
    if fname in skip:
        continue
    with open(os.path.join(root, fname), encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for rpage in redirecting_pages:
        if rpage in content:
            print(f"  {fname} links to {rpage}")

blog_dir = root + '/blog'
for d in sorted(os.listdir(blog_dir)):
    dpath = os.path.join(blog_dir, d)
    if not os.path.isdir(dpath):
        continue
    idx = os.path.join(dpath, 'index.html')
    if not os.path.exists(idx):
        continue
    with open(idx, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for rpage in redirecting_pages:
        if rpage in content:
            print(f"  blog/{d}/ links to {rpage}")

# Check for noindex tags
print("\n=== PAGES WITH NOINDEX ===")
for fname in sorted(all_html):
    if fname in skip:
        continue
    with open(os.path.join(root, fname), encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'noindex' in content.lower():
        print(f"  {fname}")

for d in sorted(os.listdir(blog_dir)):
    dpath = os.path.join(blog_dir, d)
    if not os.path.isdir(dpath):
        continue
    idx = os.path.join(dpath, 'index.html')
    if not os.path.exists(idx):
        continue
    with open(idx, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'noindex' in content.lower():
        print(f"  blog/{d}/")

# Check sitemap for any pages that are in vercel redirects
print("\n=== SITEMAP URLS THAT REDIRECT ===")
with open(root + '/sitemap.xml', encoding='utf-8') as f:
    sitemap = f.read()
sitemap_urls = re.findall(r'<loc>https://www\.colombiaboatdetailing\.com/([^<]*)</loc>', sitemap)
vercel_redirects_sources = ['pulido-gelcoat-cartagena.html', 'index.html']
for url in sitemap_urls:
    if url in vercel_redirects_sources:
        print(f"  WARNING: {url} is in sitemap but also a redirect source!")
