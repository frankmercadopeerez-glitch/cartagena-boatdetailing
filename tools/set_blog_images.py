import os, re

BLOG = 'blog'
updated = 0
for folder in sorted(os.listdir(BLOG)):
    path = os.path.join(BLOG, folder, 'index.html')
    img = os.path.join('images','blog', folder + '.jpg')
    if not os.path.exists(path) or not os.path.exists(img):
        continue
    rel = '../../images/blog/' + folder + '.jpg'
    abs_url = 'https://www.colombiaboatdetailing.com/images/blog/' + folder + '.jpg'
    with open(path,'r',encoding='utf-8') as f: c = f.read()
    orig = c

    # 1. hero inserted images
    c = re.sub(r'(class="blog-hero-img[^"]*"\s+src=")[^"]+(")', r'\g<1>'+rel+r'\g<2>', c)

    # 2. first body image referencing ../../images/ (existing layout)
    if 'blog-hero-img' not in orig:
        c = re.sub(r'(src=")\.\./\.\./images/[^"]+\.webp(")', r'\g<1>'+rel+r'\g<2>', c, count=1)

    # 3. og:image + twitter:image
    c = re.sub(r'(og:image"\s+content=")https://www\.colombiaboatdetailing\.com/images/[^"]+(")', r'\g<1>'+abs_url+r'\g<2>', c)
    c = re.sub(r'(twitter:image"\s+content=")https://www\.colombiaboatdetailing\.com/images/[^"]+(")', r'\g<1>'+abs_url+r'\g<2>', c)

    if c != orig:
        with open(path,'w',encoding='utf-8') as f: f.write(c)
        updated += 1
        print('UPDATED ' + folder)
    else:
        print('NOCHANGE ' + folder)
print(f'\nUpdated {updated}')
