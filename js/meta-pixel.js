(function () {
  "use strict";

  var PIXEL_ID = "1692665435160786";
  var pagePath = window.location.pathname || "/";

  var pixelScriptLoaded = false;

  /*
   * Keep Meta's queue available immediately so conversions are not lost, but
   * postpone the 190 KB third-party library until the visitor interacts or
   * the initial rendering work is finished.
   */
  if (!window.fbq) {
    var n = (window.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
  }

  function loadPixelScript() {
    if (pixelScriptLoaded || document.querySelector('script[data-meta-pixel]')) {
      return;
    }
    pixelScriptLoaded = true;
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.dataset.metaPixel = "true";
    document.head.appendChild(script);
  }

  ["pointerdown", "keydown", "touchstart", "scroll"].forEach(function (eventName) {
    window.addEventListener(eventName, loadPixelScript, {
      once: true,
      passive: true,
    });
  });

  window.addEventListener(
    "load",
    function () {
      window.setTimeout(loadPixelScript, 10000);
    },
    { once: true },
  );

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView", { page_path: pagePath });

  function pageCategory() {
    if (pagePath.indexOf("/blog/") === 0 || pagePath === "/blog.html") {
      return "blog";
    }
    if (
      pagePath === "/" ||
      pagePath === "/index.html" ||
      pagePath === "/about.html" ||
      pagePath === "/about-en.html" ||
      pagePath === "/services.html" ||
      pagePath === "/services-en.html" ||
      pagePath === "/contacto.html" ||
      pagePath === "/contact-en.html"
    ) {
      return "general";
    }
    return "service";
  }

  window.fbq("track", "ViewContent", {
    content_name: document.title,
    content_category: pageCategory(),
    page_path: pagePath,
  });

  document.addEventListener(
    "click",
    function (event) {
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;

      var href = link.getAttribute("href") || "";
      var channel = "";

      if (/wa\.me|api\.whatsapp\.com|whatsapp\.com\/send/i.test(href)) {
        channel = "whatsapp";
      } else if (/^tel:/i.test(href)) {
        channel = "phone";
      } else if (/^mailto:/i.test(href)) {
        channel = "email";
      }

      if (!channel) return;

      window.fbq("track", "Contact", {
        contact_channel: channel,
        content_category: pageCategory(),
        page_path: pagePath,
      });
    },
    true,
  );

  document.addEventListener(
    "submit",
    function (event) {
      var form = event.target;
      if (!form || form.tagName !== "FORM") return;

      window.fbq("track", "Lead", {
        content_category: pageCategory(),
        page_path: pagePath,
      });
    },
    true,
  );
})();
