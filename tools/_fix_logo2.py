import os, glob

root = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing'

replacements = [
    # gap-6 -> gap-10 on the logo anchor
    ('flex items-center gap-6 group', 'flex items-center gap-10 group'),
    # w-auto -> w-10 on the logo img (transition variant)
    ('h-10 w-auto flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
     'h-10 w-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-110'),
    # w-auto -> w-10 on the logo img (simple variant)
    ('class="h-10 w-auto flex-shrink-0" width="120"',
     'class="h-10 w-10 flex-shrink-0" width="40"'),
]

files = glob.glob(os.path.join(root, '**', '*.html'), recursive=True)
changed_files = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        changed_files += 1

print(f'Updated: {changed_files} files')
