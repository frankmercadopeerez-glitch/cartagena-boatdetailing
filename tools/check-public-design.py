"""Check the public components that have previously regressed on phones and desktops."""
import argparse
import io
import math
import mimetypes
import os
import shutil
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
LOCAL = "http://cbd.test"
CHARTER = "/blog/boat-detailing-yates-charter-cartagena/"
RADIUS = "9px"


def local_route(route):
    url = urlsplit(route.request.url)
    if url.hostname != "cbd.test":
        return route.abort()
    file = (ROOT / unquote(url.path).strip("/")).resolve()
    if file.is_dir():
        file = file / "index.html"
    if ROOT not in file.parents or not file.is_file():
        return route.fulfill(status=404, body="")
    return route.fulfill(body=file.read_bytes(), content_type=mimetypes.guess_type(file.name)[0] or "application/octet-stream")


def style(locator, prop, pseudo=None):
    return locator.first.evaluate("(e,[p,s])=>getComputedStyle(e,s).getPropertyValue(p)", [prop, pseudo])


def check_corners(page, selector):
    elements = page.locator(selector)
    assert elements.count(), selector
    values = elements.evaluate_all("""els => els.filter(e=>e.getClientRects().length).map(e=>{
      const s=getComputedStyle(e);
      return [s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomLeftRadius,s.borderBottomRightRadius]
    })""")
    assert all(v == [RADIUS] * 4 for v in values), (selector, values)


def check_action_link(page, selector):
    link = page.locator(selector).first
    for state in ("normal", "hover", "keyboard"):
        if state == "hover":
            link.hover()
        if state == "keyboard":
            page.mouse.move(0, 0)
            page.keyboard.press("Tab")
            link.focus()
            assert link.evaluate("e => e.matches(':focus-visible')"), selector
        assert style(link, "border-bottom-width") == "0px", (selector, state)
        assert style(link, "text-decoration-line") == "none", (selector, state)


def check_article_surfaces(page, url):
    """Check the painted outer corners across all public article templates."""
    entries = ElementTree.parse(ROOT / "sitemap.xml").findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    paths = [urlsplit(e.text).path for e in entries if urlsplit(e.text).path.startswith("/blog/")]
    assert paths, "No blog articles found in the public sitemap"
    for path in paths:
        response = page.goto(url + path, wait_until="load")
        assert response and response.ok, path
        defects = page.locator("""
          body.cbd-article img:not(.absolute, .absolute img, nav img, footer img, .rounded-full, [src*=".svg"], .whatsapp-float img),
          .border-l-4, .border-l-2, .quick-check > li, .compare-row,
          .overflow-x-auto:has(> table), .answer, .article-cta, .cbd-card:not(.rounded-full)
        """).evaluate_all("""(es,radius) => es.filter(e => e.getClientRects().length).filter(e => {
          const s = getComputedStyle(e);
          return [s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomLeftRadius,s.borderBottomRightRadius].some(r=>r!==radius)
        }).map(e=>[e.tagName,e.className])""", RADIUS)
        assert not defects, (path, defects)
    print(f"{len(paths)} blog articles verified at {page.viewport_size['width']}px", flush=True)


def check_wave(page, selector):
    # Count dark pixels in each column of the actual separator. A rectangular gap
    # introduces either a full-height column or a vertical jump in the silhouette.
    band = page.locator(selector).first
    band.evaluate("e=>window.scrollTo({top:scrollY+e.getBoundingClientRect().top-innerHeight/2,behavior:'instant'})")
    for phase in ("0s", "-2.25s", "-6.75s"):
        rule = page.add_style_tag(content=f"{selector}::before {{animation-delay:{phase}!important;animation-play-state:paused!important}}")
        box = band.bounding_box()
        size = int(float(style(band, "height", "::before").removesuffix("px")))
        screen = Image.open(io.BytesIO(page.screenshot())).convert("RGB")
        y = round(box["y"]) + int(float(style(band, "border-top-width").removesuffix("px")))
        strip = screen.crop((8, y, screen.width - 8, y + size))
        heights = [sum(sum(strip.getpixel((x, yy))) < 440 for yy in range(size)) for x in range(strip.width)]
        assert max(heights) - min(heights) >= size * .32, ("flat wave", size, phase)
        assert min(heights) > 0 and max(heights) < size, ("gap or block", min(heights), max(heights), size, phase)
        assert max(abs(a-b) for a,b in zip(heights, heights[1:])) <= 2, ("vertical seam", phase)
        # A curve can be seamless and still flatten halfway up each flank.
        # Compare one rendered cycle with its best-fitting sine, at any phase.
        mask_size = style(band, "mask-size", "::before").split()[0]
        period = round(float(mask_size.removesuffix("px")))
        assert 0 < period <= len(heights), (selector, mask_size)
        cycle = heights[:period]
        center = sum(cycle) / period
        angles = [math.tau * x / period for x in range(period)]
        sine = 2 * sum((v-center)*math.sin(t) for v,t in zip(cycle, angles)) / period
        cosine = 2 * sum((v-center)*math.cos(t) for v,t in zip(cycle, angles)) / period
        amplitude = math.hypot(sine, cosine)
        residual = [v-center-sine*math.sin(t)-cosine*math.cos(t) for v,t in zip(cycle, angles)]
        error = math.sqrt(sum(r*r for r in residual) / period)
        assert error <= .4 + .025 * amplitude, ("irregular wave", selector, phase, round(error, 2), period)
        rule.evaluate("e=>e.remove()")


def run(page, url, width):
    def open_page(path):
        response = page.goto(url + path, wait_until="load", timeout=45000)
        assert response and response.status == 200, path
        page.evaluate("document.fonts.ready")
        assert style(page.locator("footer"), "mask-image", "::before") != "none", path

    open_page("/")
    check_action_link(page, "header a[href='#servicios']")
    check_corners(page, ".featured-service-badge, .featured-service-price, .home-case-gallery-controls, .home-process-list li, .home-process-list li > span, .home-guide-links a, #form-descripcion")
    controls = page.locator(".home-case-gallery-controls").first
    previous = controls.locator('[aria-current="true"]').get_attribute("aria-label")
    controls.locator(".home-case-gallery-arrow").last.click()
    page.wait_for_function("v=>document.querySelector('.home-case-gallery-controls [aria-current=true]').getAttribute('aria-label')!==v", arg=previous)
    assert len(set(page.locator(".home-guide-links a").evaluate_all("xs=>xs.map(x=>x.href)"))) == 7
    assert style(page.locator("#contact-form a[href*='wa.me']"), "background-color") == "rgb(217, 239, 248)"
    open_page("/services.html")
    check_action_link(page, "section a[href='#servicios']")
    cards = page.locator(".service-catalog-grid .service-catalog-card")
    sizes = cards.evaluate_all("es=>es.map(e=>[e.offsetWidth,e.offsetHeight])")
    for axis in range(2):
        assert max(v[axis] for v in sizes) - min(v[axis] for v in sizes) <= 1, sizes
    images = page.locator(".secondary-service-grid img")
    assert images.count() == 11
    assert images.evaluate_all("async xs=>{await Promise.all(xs.map(e=>{e.loading='eager';return e.decode()}));return xs.every(e=>e.naturalWidth)}")
    open_page("/about.html")
    portrait = page.locator(".photo-portrait img").first
    portrait.scroll_into_view_if_needed()
    assert portrait.evaluate("async e=>{await e.decode();return e.height<=innerHeight-100 && Math.abs(e.width/e.height-e.naturalWidth/e.naturalHeight)<.015}")
    open_page("/blog.html")
    check_corners(page, ".blog-service-routes a, .blog-filter-btn, .blog-category-tag")
    open_page("/blog/cubierta-eva-foamdeck-cartagena/")
    check_action_link(page, "header .cbd-action-link")
    open_page("/case-studies.html")
    check_action_link(page, ".case-service-link a")
    open_page(CHARTER)
    check_corners(page, ".answer, .article-image")
    assert style(page.locator(".cbd-article-hero"), "mask-image", "::after") != "none"
    open_page("/blog/humedad-moho-interior-yate-cartagena/")
    check_corners(page, "article .border-l-4")
    check_corners(page, "header + div > img")
    open_page("/cubierta-sintetica.html")
    check_corners(page, ".deck-warranty,.photo-service")
    check_wave(page, ".bg-slate-50 + section.bg-navy-900")
    check_wave(page, "#ventajas + section")
    page.emulate_media(reduced_motion="reduce")
    assert style(page.locator("footer"), "animation-name", "::before") == "none"
    page.emulate_media(reduced_motion="no-preference")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    print(f"{width}px verified", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=LOCAL)
    parser.add_argument("--browser")
    parser.add_argument("--all-articles", action="store_true")
    args = parser.parse_args()
    chrome = Path(os.getenv("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe"
    binary = args.browser or (str(chrome) if chrome.is_file() else shutil.which("chromium"))
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=binary)
        for width,height in [(390,844),(1366,768),(1920,900)]:
            page = browser.new_page(viewport={"width":width,"height":height})
            if args.base_url == LOCAL:
                page.route("**/*", local_route)
            run(page,args.base_url.rstrip("/"),width)
            if args.all_articles and width in (390, 1366):
                check_article_surfaces(page, args.base_url.rstrip("/"))
            page.close()
        browser.close()
