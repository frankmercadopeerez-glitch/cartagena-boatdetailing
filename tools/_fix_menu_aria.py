import glob

files = (
    glob.glob('*.html') +
    glob.glob('cotizaciones/*.html') +
    glob.glob('blog/**/*.html', recursive=True)
)

OLD = 'aria-label="Men\u00fa de navegaci\u00f3n"\n  class="fixed inset-0 bg-navy-900'
NEW = 'aria-label="Men\u00fa de navegaci\u00f3n"\n  aria-hidden="true"\n  class="fixed inset-0 bg-navy-900'

OLDC = 'class="absolute inset-0 z-[1]" style="width:100%;height:100%;"></canvas>'
NEWC = 'class="absolute inset-0 z-[1]" style="width:100%;height:100%;" aria-hidden="true"></canvas>'

n = 0
for p in files:
    with open(p, encoding='utf-8') as f:
        h = f.read()
    h2 = h.replace(OLD, NEW).replace(OLDC, NEWC)
    if h2 != h:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(h2)
        n += 1
        print(f'  fixed: {p}')

print(f'\nTotal: {n} files updated')
