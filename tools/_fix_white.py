import re, glob

# Change light-section backgrounds on main pages (not blog posts)
# bg-slate-50 and bg-white on <section> tags -> bg-blue-50
# body tag bg-slate-50 -> bg-blue-50

main_pages = glob.glob('./*.html')
# Also update some key blog pages that aren't article pages
# Skip blog pages since they need white for readability

section_bg_patterns = [
    (r'(<section[^>]*)\bbg-slate-50\b', r'\1bg-blue-50'),
    (r'(<section[^>]*)\bbg-white\b', r'\1bg-blue-50'),
]

body_pattern = re.compile(r'(<body\s[^>]*)bg-slate-50(\s)', re.DOTALL)
body_pattern2 = re.compile(r'(<body\s[^>]*)bg-white(\s)', re.DOTALL)

# Fix wave divider between two light sections (fill was white, now matches blue-50)
wave_fill_pattern = re.compile(r'(background:#f8fafc[^>]*>.*?fill=")[^"]+(")', re.DOTALL)

count = 0
for filepath in main_pages:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content

    # Fix body background
    new_content = body_pattern.sub(r'\1bg-blue-50\2', new_content)
    new_content = body_pattern2.sub(r'\1bg-blue-50\2', new_content)

    # Fix section backgrounds
    for pat, rep in section_bg_patterns:
        new_content = re.sub(pat, rep, new_content)

    # Fix intro section that had bg-white standalone (not on body/section with py-)
    # Also update the wave divider fill between light sections to match
    new_content = new_content.replace(
        'style="background:#f8fafc;"',
        'style="background:#eff6ff;"'
    )
    # Wave that was white fill between two light sections -> #eff6ff
    # Only the wave between cotizar and intro (both now blue-50)
    new_content = new_content.replace(
        'style="background:#eff6ff;">\n      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 70" preserveAspectRatio="none">\n        <path d="M0,35 C360,70 720,0 1080,35 C1260,52 1360,28 1440,35 L1440,70 L0,70 Z" fill="white"/>',
        'style="background:#eff6ff;">\n      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 70" preserveAspectRatio="none">\n        <path d="M0,35 C360,70 720,0 1080,35 C1260,52 1360,28 1440,35 L1440,70 L0,70 Z" fill="#eff6ff"/>'
    )

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        print(f'Updated: {filepath}')

print(f'Total main pages updated: {count}')
