(function () {
  "use strict";

  var PIXEL_ID = "1692665435160786";
  var pagePath = window.location.pathname || "/";

  if (window.fbq) return;

  /* Meta Pixel base code. */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js",
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
