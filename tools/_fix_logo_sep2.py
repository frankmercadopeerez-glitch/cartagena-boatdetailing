"""
Fix correcto del navbar logo: separador + logo 32px.
Solo modifica archivos que AUN tienen el patron viejo (no index.html que ya fue corregido).
"""
import os, glob

root = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing'
files = glob.glob(os.path.join(root, '**', '*.html'), recursive=True)

changes = [
    # 1. Fix anchor tag (root & blog both have this)
    (
        'class="flex items-center gap-10 group" style="gap:56px"',
        'class="flex items-center group" style="display:flex;align-items:center;gap:16px"'
    ),
    # 2. Fix img size - blog style (single line, width=40)
    (
        'class="flex-shrink-0" style="width:40px;height:40px" width="40" height="40"',
        'class="flex-shrink-0" style="width:32px;height:32px" width="32" height="32"'
    ),
    # 3. Fix img size - main pages multiline (width=48)
    (
        'style="width:40px;height:40px"\n            width="48"\n            height="40"',
        'style="width:32px;height:32px"\n            width="32"\n            height="32"'
    ),
]

# Separator insertion patterns (specific context to avoid false matches)
SEP_DIV = '<div style="width:1px;height:28px;background:rgba(212,175,55,0.4);flex-shrink:0"></div>\n'

sep_patterns = [
    # blog pages (6 space indent): loading="eager" />\n      <div class="flex flex-col">
    (
        'loading="eager" />\n      <div class="flex flex-col">',
        'loading="eager" />\n      ' + SEP_DIV + '      <div class="flex flex-col">'
    ),
    # main pages (10 space indent): loading="eager"\n          />\n          <div class="flex flex-col">
    (
        'loading="eager"\n          />\n          <div class="flex flex-col">',
        'loading="eager"\n          />\n          ' + SEP_DIV + '          <div class="flex flex-col">'
    ),
]

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    # Skip if already fixed
    if 'rgba(212,175,55,0.4)' in content:
        continue

    original = content

    for old, new in changes:
        content = content.replace(old, new)

    for old, new in sep_patterns:
        if old in content:
            content = content.replace(old, new)
            break  # Only apply one separator pattern per file

    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        count += 1

print(f'Updated: {count} files')
