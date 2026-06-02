import os, re, glob

pattern = re.compile(r'\s*<span class="whatsapp-float__label">[^<]*</span>')
files = glob.glob('**/*.html', recursive=True)
count = 0
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()
    updated = pattern.sub('', original)
    if updated != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(updated)
        count += 1
        print(f'  fixed: {path}')
print(f'\nTotal: {count} files updated')
