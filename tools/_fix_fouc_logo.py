"""
Fix 1: FOUC — cambia tailwind.css de async (preload+onload) a sync (link rel=stylesheet)
Fix 2: Logo — agrega style="width:40px;height:40px" en todas las imgs del logo
"""
import os, glob, re

root = r'C:/Users/Dell/PROYECTOS WEB/cartagena-boatdetailing'
files = glob.glob(os.path.join(root, '**', '*.html'), recursive=True)

# ---------- FIX 1: FOUC ----------
# Patron 1 (root level, multiline):
#   <link\n      rel="preload"\n      href="css/tailwind.css"\n      as="style"\n      onload="..."\n    />\n    <noscript>..tailwind.css...</noscript>
# Patron 2 (blog, single line):
#   <link rel="preload" href="../../css/tailwind.css" as="style" onload="..." />\n<noscript>...</noscript>
# Patron 3 (cotizaciones):
#   <link rel="preload" href="../css/tailwind.css" as="style" onload="..." />\n<noscript>...</noscript>

fouc_pattern = re.compile(
    r'<link[^>]+rel=["\']preload["\'][^>]+href=["\']([^"\']*tailwind\.css)["\'][^>]+as=["\']style["\'][^>]*/>\s*'
    r'<noscript>\s*<link[^>]+href=["\'][^"\']*tailwind\.css["\'][^>]*/>\s*</noscript>',
    re.DOTALL
)

def fouc_replacement(m):
    href = m.group(1)
    return f'<link rel="stylesheet" href="{href}" />'

# ---------- FIX 2: Logo img ----------
# Cambiar class logo img para agregar style exacto
# Patron A (main pages, multiline):
logo_multiline = re.compile(
    r'(<img\s+src=["\'][^"\']*cbdlogo-gold\.svg["\'][^>]*class=["\'])([^"\']*?)(["\'][^>]*)(width=["\'])\d+(["\'][^>]*height=["\'])\d+(["\'][^>]*/>)',
    re.DOTALL
)

fouc_count = 0
logo_count = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    original = content

    # Fix FOUC
    new_content = fouc_pattern.sub(fouc_replacement, content)
    if new_content != content:
        content = new_content
        fouc_count += 1

    # Fix logo: remove w-10/w-auto/w-12, add inline style with exact dimensions
    # Simple string replacements for known patterns
    # Pattern in main pages:
    content = content.replace(
        'class="h-10 w-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"',
        'class="flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style="width:40px;height:40px"'
    )
    # Pattern in blog pages:
    content = content.replace(
        'class="h-10 w-10 flex-shrink-0" width="40"',
        'class="flex-shrink-0" style="width:40px;height:40px" width="40"'
    )

    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        if fouc_count > 0 or logo_count > 0:
            pass

# Recount properly
fouc_count = 0
logo_count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    if '<link rel="stylesheet" href=' in content and 'tailwind.css' in content:
        fouc_count += 1
    if 'style="width:40px;height:40px"' in content and 'cbdlogo-gold' in content:
        logo_count += 1

print(f'Files with sync tailwind.css: {fouc_count}')
print(f'Files with logo inline style: {logo_count}')
