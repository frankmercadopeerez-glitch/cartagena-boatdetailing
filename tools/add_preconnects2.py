import os
root = r'c:\Users\Dell\PROYECTOS WEB\cartagena-boatdetailing'
skip_dirs = {'node_modules', '.git', 'vendor', '_originals_backup', 'tools', 'guias', 'cotizaciones', 'facturas', 'fonts', 'css', 'js', 'images'}

PRECONNECT = (
    '<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin />\n'
    '    <link rel="dns-prefetch" href="https://www.google-analytics.com" />\n    '
)

# We'll insert before the first <link rel="preload" or before </head>
updated = []
for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in skip_dirs]
    for fname in filenames:
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, encoding='utf-8') as f:
            content = f.read()
        # Skip if preconnect already present
        if 'rel="preconnect" href="https://www.googletagmanager.com"' in content:
            continue
        # Insert before the first preload link (for LCP image or fonts)
        import re
        m = re.search(r'(<link\s+rel="preload")', content)
        if m:
            content = content[:m.start()] + PRECONNECT + content[m.start():]
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            updated.append(fpath.replace(root + os.sep, ''))

print(f'Added preconnects to {len(updated)} files')
