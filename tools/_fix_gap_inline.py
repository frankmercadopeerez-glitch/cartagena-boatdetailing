"""
Fix logo gap: agrega style="gap:56px" inline en todos los <a> del navbar logo
para garantizar separacion visual independiente de CSS classes.
"""
import os, glob

root = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing'
files = glob.glob(os.path.join(root, '**', '*.html'), recursive=True)

OLD = 'class="flex items-center gap-10 group"'
NEW = 'class="flex items-center gap-10 group" style="gap:56px"'

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    if OLD in content:
        content = content.replace(OLD, NEW)
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        count += 1

print(f'Updated: {count} files')
