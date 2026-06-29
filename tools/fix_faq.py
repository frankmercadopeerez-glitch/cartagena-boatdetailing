import os

# Fix FAQ low contrast: invisible white border + white/5 bg on slate-50 section
OLD = 'faq-item border border-white/10 bg-white/5 rounded-sm overflow-hidden'
NEW = 'faq-item border border-slate-200 bg-white shadow-sm rounded-sm overflow-hidden'

count = 0
files_changed = 0
for root, dirs, files in os.walk('.'):
    if '.git' in root or 'vendor' in root or 'node_modules' in root:
        continue
    for fn in files:
        if not fn.endswith('.html'):
            continue
        path = os.path.join(root, fn)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if OLD in content:
            n = content.count(OLD)
            content = content.replace(OLD, NEW)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            count += n
            files_changed += 1
            print(f'{path}: {n} fixed')

print(f'\nTotal {count} FAQ items in {files_changed} files')
