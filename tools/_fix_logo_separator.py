"""
Fix definitivo: 
- Logo reducido a 32x32px
- Separador vertical dorado entre logo y texto
- gap reducido a 16px
"""
import os, glob, re

root = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing'
files = glob.glob(os.path.join(root, '**', '*.html'), recursive=True)

SEPARATOR = '<div style="width:1px;height:28px;background:rgba(212,175,55,0.35);flex-shrink:0"></div>\n          '

# Patron para paginas raiz (multilinea)
OLD_ROOT_A = 'class="flex items-center gap-10 group" style="gap:56px"'
NEW_ROOT_A  = 'class="flex items-center group" style="display:flex;align-items:center;gap:16px"'

OLD_ROOT_IMG = ('class="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" '
                'style="width:40px;height:40px"\n            width="48"\n            height="40"')
NEW_ROOT_IMG  = ('class="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" '
                 'style="width:32px;height:32px"\n            width="32"\n            height="32"')

# Patron para blog (linea simple con width=40)
OLD_BLOG_A   = 'class="flex items-center gap-10 group" style="gap:56px"'
# (Same as root - already handled above)

OLD_BLOG_IMG = 'class="flex-shrink-0" style="width:40px;height:40px" width="40" height="40"'
NEW_BLOG_IMG = 'class="flex-shrink-0" style="width:32px;height:32px" width="32" height="32"'

# Insertar separador justo antes de <div class="flex flex-col">
OLD_DIV = '          <div class="flex flex-col">'
NEW_DIV = f'          {SEPARATOR}<div class="flex flex-col">'

# Blog pages (4 spaces indent)
OLD_DIV2 = '      <div class="flex flex-col">'
NEW_DIV2 = f'      <div style="width:1px;height:28px;background:rgba(212,175,55,0.35);flex-shrink:0"></div>\n      <div class="flex flex-col">'

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    original = content

    # Fix anchor gap
    content = content.replace(OLD_ROOT_A, NEW_ROOT_A)

    # Fix img size
    content = content.replace(OLD_ROOT_IMG, NEW_ROOT_IMG)
    content = content.replace(OLD_BLOG_IMG, NEW_BLOG_IMG)

    # Insert separator (only if not already there)
    if 'rgba(212,175,55,0.35)' not in content:
        content = content.replace(OLD_DIV, NEW_DIV)
        content = content.replace(OLD_DIV2, NEW_DIV2)

    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        count += 1

print(f'Updated: {count} files')
