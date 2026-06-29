import re

with open('sitemap.xml','r',encoding='utf-8') as f:
    content = f.read()
urls = re.findall(r'<loc>(.*?)</loc>', content)
missing = ['about-en.html','gelcoat-en.html','interior-detailing-en.html','anti-corrosion-en.html']
for m in missing:
    found = any(m in u for u in urls)
    status = 'IN SITEMAP' if found else 'MISSING'
    print(f'{m}: {status}')

# Find context around about.html
idx = content.find('/about.html')
if idx > 0:
    print()
    print(content[max(0,idx-100):idx+300])
