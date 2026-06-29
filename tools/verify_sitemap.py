import re
from collections import Counter

with open('sitemap.xml','r',encoding='utf-8') as f:
    content = f.read()
urls = re.findall(r'<loc>(.*?)</loc>', content)
print(f'Total URLs: {len(urls)}')
dupes = [u for u,c in Counter(urls).items() if c > 1]
if dupes:
    print('DUPLICATES:')
    for d in dupes:
        print(f'  {d}')
else:
    print('No duplicates found.')
new_pages = ['about-en','gelcoat-en','interior-detailing-en','anti-corrosion-en']
for p in new_pages:
    found = any(p in u for u in urls)
    status = 'IN SITEMAP' if found else 'MISSING'
    print(f'{p}.html: {status}')
