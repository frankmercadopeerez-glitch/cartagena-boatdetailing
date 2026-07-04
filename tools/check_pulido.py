import re

fname = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing/pulido-gelcoat-cartagena.html'
with open(fname, encoding='utf-8') as f:
    content = f.read()

canon = re.findall(r'rel="canonical"[^>]+href="([^"]+)"', content)
if not canon:
    canon = re.findall(r'href="([^"]+)"[^>]+rel="canonical"', content)
ogurl = re.findall(r'og:url[^>]+content="([^"]+)"', content)

print('Canonical:', canon)
print('OG URL:', ogurl)
print('File size:', len(content))
