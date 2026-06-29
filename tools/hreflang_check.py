"""
Check hreflang bidirectionality in ES/EN page pairs.
"""
import re, os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE_URL = "https://www.colombiaboatdetailing.com/"

PAIRS = {
    'index.html': 'index-en.html',
    'hull-cleaning.html': 'hull-cleaning-en.html',
    'limpieza-casco-bocagrande.html': 'hull-cleaning-bocagrande-en.html',
    'limpieza-casco-baru.html': 'hull-cleaning-baru-en.html',
    'limpieza-casco-islas-del-rosario.html': 'hull-cleaning-rosario-en.html',
    'limpieza-casco-manzanillo.html': 'hull-cleaning-manzanillo-en.html',
    'gelcoat.html': 'gelcoat-en.html',
    'interior-detailing.html': 'interior-detailing-en.html',
    'ppf.html': 'ppf-en.html',
    'ceramic-coating.html': 'ceramic-coating-en.html',
    'paint-polishing.html': 'paint-polishing-en.html',
    'about.html': 'about-en.html',
    'contacto.html': 'contact-en.html',
    'services.html': 'services-en.html',
    'anti-corrosion.html': 'anti-corrosion-en.html',
}

def get_hreflang_hrefs(content):
    """Return dict of hreflang -> href"""
    result = {}
    for m in re.finditer(r'<link[^>]*hreflang=["\']([^"\']+)["\'][^>]*href=["\']([^"\']+)["\']|<link[^>]*href=["\']([^"\']+)["\'][^>]*hreflang=["\']([^"\']+)["\']', content, re.S | re.I):
        if m.group(1):
            result[m.group(1)] = m.group(2)
        else:
            result[m.group(4)] = m.group(3)
    return result

issues = []
for es_file, en_file in PAIRS.items():
    if not os.path.exists(es_file):
        print(f'MISSING FILE: {es_file}')
        continue
    if not os.path.exists(en_file):
        print(f'MISSING FILE: {en_file}')
        continue
    
    with open(es_file,'r',encoding='utf-8') as f:
        es_content = f.read()
    with open(en_file,'r',encoding='utf-8') as f:
        en_content = f.read()
    
    es_hreflang = get_hreflang_hrefs(es_content)
    en_hreflang = get_hreflang_hrefs(en_content)
    
    es_url = BASE_URL + ('' if es_file == 'index.html' else es_file)
    en_url = BASE_URL + en_file
    
    problems = []
    # ES page should point to EN version
    en_in_es = any(en_url in v for v in es_hreflang.values())
    if not en_in_es:
        problems.append(f'ES page missing hreflang link to EN ({en_url})')
    
    # EN page should point to ES version  
    es_in_en = any(es_url in v for v in en_hreflang.values())
    if not es_in_en:
        problems.append(f'EN page missing hreflang link to ES ({es_url})')
    
    if problems:
        print(f'\n[ISSUE] {es_file} <-> {en_file}')
        for p in problems:
            print(f'  - {p}')
        print(f'  ES hreflang: {es_hreflang}')
        print(f'  EN hreflang: {en_hreflang}')
    else:
        print(f'OK: {es_file} <-> {en_file}')

print('\nDone.')
