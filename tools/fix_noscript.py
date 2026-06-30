import os, re

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
            for asset in ['tailwind.css', 'styles.css']:
                # Fix noscript tags: revert preload back to stylesheet inside <noscript>
                bad_noscript = f'<noscript><link rel="preload" href="{prefix}{asset}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" /></noscript>'
                good_noscript = f'<noscript><link rel="stylesheet" href="{prefix}{asset}" /></noscript>'
                if bad_noscript in content:
                    content = content.replace(bad_noscript, good_noscript)
                    changed = True
        if changed:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            updated.append(fpath.replace(root + os.sep, ''))

print(f'Fixed noscript in {len(updated)} files')
