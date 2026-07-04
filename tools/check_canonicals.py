import os, re

root = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing'
issues = []

skip = {'business-card.html', 'calendario-seo-2026.html', 'finanzas.html', 'cotizar.html'}

for fname in sorted(os.listdir(root)):
    if not fname.endswith('.html'):
        continue
    if fname in skip:
        continue
    fpath = os.path.join(root, fname)
    with open(fpath, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    canon = re.findall(r'<link[^>]+canonical[^>]+href="([^"]+)"', content, re.IGNORECASE)
    if not canon:
        canon = re.findall(r'<link[^>]+href="([^"]+)"[^>]+canonical', content, re.IGNORECASE)
    if canon:
        cu = canon[0]
        if 'colombiaboatdetailing.com' not in cu:
            issues.append((fname, 'WRONG DOMAIN: ' + cu))
    else:
        issues.append((fname, 'NO CANONICAL'))

print('Root HTML issues:', len(issues))
for f, issue in issues:
    print(f'  {f} -> {issue}')

# Also check blog posts
blog_dir = root + '/blog'
blog_issues = []
for d in sorted(os.listdir(blog_dir)):
    dpath = os.path.join(blog_dir, d)
    if not os.path.isdir(dpath):
        continue
    idx = os.path.join(dpath, 'index.html')
    if not os.path.exists(idx):
        blog_issues.append((d, 'NO index.html'))
        continue
    with open(idx, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    canon = re.findall(r'<link[^>]+canonical[^>]+href="([^"]+)"', content, re.IGNORECASE)
    if not canon:
        canon = re.findall(r'<link[^>]+href="([^"]+)"[^>]+canonical', content, re.IGNORECASE)
    if canon:
        cu = canon[0]
        expected = f'https://www.colombiaboatdetailing.com/blog/{d}/'
        if 'colombiaboatdetailing.com' not in cu:
            blog_issues.append((d, 'WRONG DOMAIN: ' + cu))
        elif cu.rstrip('/') != expected.rstrip('/'):
            blog_issues.append((d, f'WRONG URL: got {cu} expected {expected}'))
    else:
        blog_issues.append((d, 'NO CANONICAL'))

print(f'\nBlog issues: {len(blog_issues)}')
for d, issue in blog_issues:
    print(f'  {d} -> {issue}')
