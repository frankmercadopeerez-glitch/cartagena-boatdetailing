#!/usr/bin/env python3
"""
Add aggregateRating to Service schema JSON-LD blocks on service pages.
Skips pages that already have aggregateRating.
"""
import re, os, glob

ROOT = r"C:\Users\Dell\PROYECTOS WEB\cartagena-boatdetailing"

SERVICE_PAGES = [
    "hull-cleaning.html",
    "ceramic-coating.html",
    "ppf.html",
    "paint-polishing.html",
    "gelcoat.html",
    "engine-painting.html",
    "boat-painting.html",
    "bottom-paint.html",
    "interior-detailing.html",
    "anti-corrosion.html",
    "technical-wash.html",
    "polarizado.html",
    "calcomanias.html",
    "fibra.html",
    "cubierta-sintetica.html",
    "cubierta-teka.html",
    "electrical-systems.html",
]

AGGREGATE_RATING = '''      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "47",
        "bestRating": "5",
        "worstRating": "1"
      }'''

def read_utf8(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def write_utf8(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def add_aggregate_rating(content, filename):
    """
    Find the Service schema JSON-LD block and add aggregateRating before
    the closing } of the top-level Service object.
    Strategy: find the last property in the Service block that ends with
    a value (looking for patterns like "}}" or "}" followed by whitespace
    then "}") and inject before the final "}" of the Service object.
    """
    if 'aggregateRating' in content:
        return content, "already has aggregateRating"

    if '"@type": "Service"' not in content:
        return content, "no Service schema found"

    # Find the Service schema script block
    # Pattern: <script type="application/ld+json"> ... "@type": "Service" ... </script>
    script_pattern = re.compile(
        r'(<script type="application/ld\+json">\s*)(.*?)(</script>)',
        re.DOTALL
    )

    modified = False
    result = content

    def inject_rating(m):
        nonlocal modified
        opening = m.group(1)
        json_body = m.group(2)
        closing = m.group(3)

        if '"@type": "Service"' not in json_body:
            return m.group(0)
        if 'aggregateRating' in json_body:
            return m.group(0)

        # Find the last closing "}" of the top-level JSON object
        # and inject aggregateRating before it.
        # We look for the pattern where the object ends: last "}" before </script>
        # The JSON body typically ends with: \n      }\n    \n
        # We need to add a comma after the last property and then aggregateRating

        # Find the last property closing - look for the pattern of the closing brace
        # of the top-level object. We find the last occurrence of:
        # either "}" or "]" followed by optional whitespace then "}" (end of object)

        # Approach: find last non-whitespace character before the final "}"
        stripped = json_body.rstrip()
        if not stripped.endswith('}'):
            return m.group(0)

        # Find the position of the final "}" of the top-level object
        # Walk backwards from the end to find the closing brace
        last_brace = stripped.rfind('}')
        before_brace = stripped[:last_brace].rstrip()

        # Check that we're at the right nesting level by counting braces
        # (simplified: assume the last } in stripped is the top-level close)
        
        # If the last char before the final "}" is already "}", we need a comma
        # If it ends with a quoted string or number, we need a comma
        new_json = before_brace + ',\n' + AGGREGATE_RATING + '\n      }'
        
        # Preserve trailing whitespace
        trailing = json_body[len(stripped):]
        new_json_body = new_json + trailing

        modified = True
        return opening + new_json_body + closing

    result = script_pattern.sub(inject_rating, result)

    if not modified:
        return content, "could not inject (pattern not matched)"

    return result, "updated"

def main():
    updated = 0
    skipped = 0
    errors = []

    for filename in SERVICE_PAGES:
        path = os.path.join(ROOT, filename)
        if not os.path.exists(path):
            print(f"  ! {filename} (file not found)")
            continue

        content = read_utf8(path)
        new_content, msg = add_aggregate_rating(content, filename)

        if new_content != content:
            write_utf8(path, new_content)
            print(f"  ✓ {filename}")
            updated += 1
        else:
            print(f"  - {filename} ({msg})")
            skipped += 1

    print(f"\nDone: {updated} updated, {skipped} skipped")

if __name__ == '__main__':
    main()
