import re, json

files = ['ceramic-coating.html', 'ppf.html', 'hull-cleaning.html', 'paint-polishing.html']
for f in files:
    with open(f, encoding='utf-8') as fh:
        html = fh.read()
    pattern = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.DOTALL)
    for i, m in enumerate(pattern.finditer(html)):
        try:
            json.loads(m.group(1))
            print('OK ' + f + ' block ' + str(i+1))
        except Exception as e:
            print('ERR ' + f + ' block ' + str(i+1) + ': ' + str(e))
