import os, time, hashlib
import urllib.request

OUT = 'images/blog'
# folders that failed -> alternative keywords
retry = {
    'ceramic-coating-vs-ppf-marino': 'yacht,blue',
    'ceramic-comparativa': 'yacht,ocean',
    'mantenimiento-ceramic-coating-yate': 'yacht,water',
    'ppf-vs-ceramic-coating-yate': 'boat,white',
    'precio-ceramic-coating-yate-cartagena': 'yacht,harbor',
    'preguntas-frecuentes-ceramic-coating-yate': 'yacht,sunset',
}

# load existing hashes to keep uniqueness
hashes = {}
for f in os.listdir(OUT):
    p = os.path.join(OUT, f)
    if f.endswith('.jpg'):
        hashes[hashlib.md5(open(p,'rb').read()).hexdigest()] = f

base = 50000
for folder, keyword in retry.items():
    out = os.path.join(OUT, folder + '.jpg')
    ok = False
    for attempt in range(8):
        base += 137
        url = f'https://loremflickr.com/1200/630/{keyword}?lock={base}'
        try:
            req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
            data = urllib.request.urlopen(req, timeout=30).read()
        except Exception:
            time.sleep(1); continue
        h = hashlib.md5(data).hexdigest()
        if h in hashes or len(data) < 5000:
            continue
        hashes[h] = folder
        with open(out,'wb') as f: f.write(data)
        ok = True; break
    print(('OK ' if ok else 'FAIL ') + folder + ' <- ' + keyword)
    time.sleep(0.3)
