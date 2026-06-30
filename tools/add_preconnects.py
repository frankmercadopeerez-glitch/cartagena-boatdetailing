import os

root = r'c:\Users\Dell\PROYECTOS WEB\cartagena-boatdetailing'
skip_dirs = {'node_modules', '.git', 'vendor', '_originals_backup', 'tools', 'guias', 'cotizaciones', 'facturas', 'fonts', 'css', 'js', 'images'}
updated = []

PRECONNECT = (
    '<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin />\n'
    '    <link rel="dns-prefetch" href="https://www.google-analytics.com" />'
)
PLACEHOLDER = '<!-- Preconnect FIRST (before any resource fetch) -->'

for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in skip_dirs]
    for fname in filenames:
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, encoding='utf-8') as f:
            content = f.read()
        if PLACEHOLDER in content:
            if '<link rel="preconnect" href="https://www.googletagmanager.com"' not in content:
                content = content.replace(
                    PLACEHOLDER,
                    f'{PRECONNECT}\n    {PLACEHOLDER}'
                )
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(content)
                updated.append(fpath.replace(root + os.sep, ''))

print(f'Added preconnects to {len(updated)} files')
