import os, glob

root = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing'
old_img = 'class="h-10 w-auto" width="120"'
new_img = 'class="h-10 w-auto flex-shrink-0" width="120"'

files = glob.glob(os.path.join(root, '**', '*.html'), recursive=True)
count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    if old_img in content:
        content = content.replace(old_img, new_img)
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        count += 1
print('Updated:', count, 'files')
