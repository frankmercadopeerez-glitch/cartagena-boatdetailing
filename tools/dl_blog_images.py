import os, re, html, time, hashlib
import urllib.request

BLOG = 'blog'
OUT = 'images/blog'
os.makedirs(OUT, exist_ok=True)

def kw(slug):
    s = slug
    def has(*words): return any(w in s for w in words)
    if has('catamaran'): return 'catamaran,boat'
    if has('velero'): return 'sailboat,sea'
    if has('helice'): return 'boat,propeller'
    if has('anodo'): return 'boat,hull,metal'
    if has('antifouling','fouling','incrustacion','bottom','casco-sucio'): return 'boat,hull'
    if has('buzos','limpieza-casco','casco','suscripcion-limpieza'): return 'scuba,diver,boat'
    if has('calcomania'): return 'yacht,wrap'
    if has('ceramic'): return 'yacht,polished'
    if has('cojineria','tapiceria','interior'): return 'yacht,interior'
    if has('cubierta','foam','teca','deck'): return 'yacht,deck'
    if has('ppf'): return 'yacht,white'
    if has('pulido','gelcoat'): return 'boat,polish'
    if has('osmosis','fibra'): return 'boat,fiberglass'
    if has('pintura','repintar'): return 'boat,paint'
    if has('polarizado'): return 'yacht,window'
    if has('electrica','led','seguridad','luces'): return 'yacht,marina,night'
    if has('festival','bololo','arsenal'): return 'yacht,marina'
    if has('charter'): return 'yacht,luxury'
    if has('detailing','mantenimiento','naval','checklist','errores','guia'): return 'yacht,marina'
    return 'yacht,sea'

folders = sorted([d for d in os.listdir(BLOG) if os.path.isdir(os.path.join(BLOG, d))])
hashes = {}
saved = {}
idx = 0
for folder in folders:
    idx += 1
    keyword = kw(folder)
    out = os.path.join(OUT, folder + '.jpg')
    ok = False
    for attempt in range(4):
        lock = idx * 7 + attempt * 1000 + 13
        url = f'https://loremflickr.com/1200/630/{keyword}?lock={lock}'
        try:
            req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
            data = urllib.request.urlopen(req, timeout=30).read()
        except Exception as e:
            time.sleep(1); continue
        h = hashlib.md5(data).hexdigest()
        if h in hashes:   # duplicate, retry
            continue
        if len(data) < 5000:  # too small / error
            continue
        hashes[h] = folder
        with open(out, 'wb') as f:
            f.write(data)
        saved[folder] = folder + '.jpg'
        ok = True
        break
    print(('OK ' if ok else 'FAIL ') + folder + ' <- ' + keyword)
    time.sleep(0.3)

print(f'\nSaved {len(saved)} / {len(folders)} unique images')
