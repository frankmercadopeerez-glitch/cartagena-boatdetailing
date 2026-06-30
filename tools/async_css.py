import os

root = r'c:\Users\Dell\PROYECTOS WEB\cartagena-boatdetailing'
skip_dirs = {'node_modules', '.git', 'vendor', '_originals_backup', 'tools', 'guias', 'cotizaciones', 'facturas', 'fonts', 'css', 'js', 'images'}
updated = []

for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in skip_dirs]
    for fname in filenames:
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, encoding='utf-8') as f:
            content = f.read()
        changed = False
        for prefix in ['css/', '../css/', '../../css/']:
            old_t = f'<link rel="stylesheet" href="{prefix}tailwind.css" />'
            new_t = f'<link rel="preload" href="{prefix}tailwind.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" />'
            old_s = f'<link rel="stylesheet" href="{prefix}styles.css" />'
            new_s = f'<link rel="preload" href="{prefix}styles.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" />'
            if old_t in content:
                content = content.replace(old_t, new_t)
                changed = True
            if old_s in content:
                content = content.replace(old_s, new_s)
                changed = True
        if changed:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            updated.append(fpath.replace(root + os.sep, ''))

print(f'Updated {len(updated)} files:')
for f in updated:
    print(' ', f)
