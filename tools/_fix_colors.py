import os, re, glob

# ---- Update styles.css ----
with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('#060607', '#001f3f')
css = css.replace('#0e0e10', '#0a2f5e')
css = css.replace('rgba(4,4,6,', 'rgba(0,20,50,')
css = css.replace('rgba(2,2,4,', 'rgba(0,10,30,')
css = css.replace('rgba(5,5,6,', 'rgba(0,15,50,')

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('styles.css updated')

# ---- Update all HTML files ----
html_files = glob.glob('./*.html') + glob.glob('./blog/**/*.html', recursive=True)

count = 0
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content

    # SVG inline fills
    new_content = new_content.replace('fill="#060607"', 'fill="#001f3f"')
    new_content = new_content.replace('fill="#0e0e10"', 'fill="#0a2f5e"')

    # inline style backgrounds
    new_content = new_content.replace('background:#060607', 'background:#001f3f')
    new_content = new_content.replace('background:#0e0e10', 'background:#0a2f5e')

    # inline rgba
    new_content = new_content.replace('rgba(6,6,7,', 'rgba(0,31,63,')
    new_content = new_content.replace('rgba(14,14,16,', 'rgba(10,47,94,')

    # wave divider white backgrounds between dark sections
    new_content = new_content.replace('style="background:white;"', 'style="background:transparent;"')
    new_content = new_content.replace("style='background:white;'", "style='background:transparent;'")

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        print(f'Updated: {filepath}')

print(f'Total HTML files updated: {count}')
