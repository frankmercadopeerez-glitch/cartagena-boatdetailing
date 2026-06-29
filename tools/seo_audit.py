import re, os, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

files = [
    'index.html','index-en.html',
    'hull-cleaning.html','hull-cleaning-en.html',
    'hull-cleaning-bocagrande.html','hull-cleaning-bocagrande-en.html',
    'limpieza-casco-baru.html','hull-cleaning-baru-en.html',
    'limpieza-casco-islas-del-rosario.html','hull-cleaning-rosario-en.html',
    'limpieza-casco-manzanillo.html','hull-cleaning-manzanillo-en.html',
    'gelcoat.html','gelcoat-en.html',
    'interior-detailing.html','interior-detailing-en.html',
    'ppf.html','ppf-en.html',
    'ceramic-coating.html','ceramic-coating-en.html',
    'paint-polishing.html','paint-polishing-en.html',
    'about.html','about-en.html',
    'contacto.html','contact-en.html',
    'services.html','services-en.html',
    'anti-corrosion.html','anti-corrosion-en.html',
]

for f in files:
    if not os.path.exists(f):
        print(f'{f} | NOT FOUND')
        continue
    with open(f,'r',encoding='utf-8') as fh:
        content = fh.read()
    
    title = re.search(r'<title>(.*?)</title>', content, re.S)
    canonical = re.search(r'<link\s[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']|<link\s[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']canonical["\']', content, re.S | re.I)
    hreflang_es = re.search(r'hreflang=["\']es', content)
    hreflang_en = re.search(r'hreflang=["\']en["\']', content)
    robots = re.search(r'<meta\s[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)["\']|<meta\s[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']robots["\']', content, re.S | re.I)
    lang = re.search(r'<html[^>]*lang=["\']([^"\']+)["\']', content)
    
    print(f'{f}')
    can_url = (canonical.group(1) or canonical.group(2)) if canonical else None
    rob_val = (robots.group(1) or robots.group(2)) if robots else None
    print(f'  title: {re.sub(chr(10)+r"\s+", " ", title.group(1)).strip()[:80] if title else "MISSING"}')
    print(f'  canonical: {can_url if can_url else "MISSING"}')
    print(f'  hreflang-es:{" YES" if hreflang_es else " NO"} | hreflang-en:{" YES" if hreflang_en else " NO"}')
    print(f'  robots: {rob_val[:60] if rob_val else "MISSING"} | lang={lang.group(1) if lang else "MISSING"}')
    print()
