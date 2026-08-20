(function () {
  "use strict";

  var AUTOPLAY_DELAY = 5600;
  var MOBILE_QUERY = window.matchMedia("(max-width: 767px)");
  var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

  function split(value, separator) {
    return (value || "")
      .split(separator)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  function initializeGallery(gallery, galleryIndex) {
    var frames = split(gallery.dataset.caseFrames, "|");
    var alts = split(gallery.dataset.caseAlts, "||");
    var path = gallery.dataset.casePath || "";
    var picture = gallery.querySelector("picture");
    var source = picture && picture.querySelector("source");
    var image = picture && picture.querySelector("img");

    if (!picture || !source || !image || frames.length < 2) return;

    var language = document.documentElement.lang.toLowerCase().startsWith("en")
      ? "en"
      : "es";
    var index = Number.parseInt(gallery.dataset.caseStart || "0", 10);
    if (!Number.isFinite(index) || index < 0 || index >= frames.length) index = 0;

    var timer = 0;
    var paused = false;
    var requestToken = 0;

    var controls = document.createElement("div");
    controls.className = "home-case-gallery-controls";
    controls.setAttribute(
      "aria-label",
      language === "en" ? "Project photo gallery" : "Galería de fotos del proyecto",
    );

    var previous = document.createElement("button");
    previous.type = "button";
    previous.className = "home-case-gallery-arrow";
    previous.setAttribute(
      "aria-label",
      language === "en" ? "Previous photo" : "Foto anterior",
    );
    previous.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';

    var dots = document.createElement("div");
    dots.className = "home-case-gallery-dots";

    var next = document.createElement("button");
    next.type = "button";
    next.className = "home-case-gallery-arrow";
    next.setAttribute("aria-label", language === "en" ? "Next photo" : "Foto siguiente");
    next.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

    var status = document.createElement("span");
    status.className = "home-case-gallery-status";
    status.setAttribute("aria-live", "polite");

    var dotButtons = frames.map(function (_, dotIndex) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "home-case-gallery-dot";
      dot.setAttribute(
        "aria-label",
        language === "en"
          ? "Show photo " + (dotIndex + 1) + " of " + frames.length
          : "Mostrar foto " + (dotIndex + 1) + " de " + frames.length,
      );
      dot.addEventListener("click", function () {
        show(dotIndex, true);
      });
      dots.appendChild(dot);
      return dot;
    });

    controls.appendChild(previous);
    controls.appendChild(dots);
    controls.appendChild(next);
    controls.appendChild(status);
    gallery.appendChild(controls);

    function updateControls(userInitiated) {
      dotButtons.forEach(function (dot, dotIndex) {
        dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
      });
      if (userInitiated) {
        status.textContent =
          (language === "en" ? "Photo " : "Foto ") +
          (index + 1) +
          (language === "en" ? " of " : " de ") +
          frames.length +
          ". " +
          (alts[index] || "");
      }
    }

    function schedule(extraDelay) {
      window.clearTimeout(timer);
      if (paused || REDUCED_MOTION.matches || document.hidden) return;
      timer = window.setTimeout(function () {
        show(index + 1, false);
      }, AUTOPLAY_DELAY + (extraDelay || 0));
    }

    function show(requestedIndex, userInitiated) {
      var nextIndex = (requestedIndex + frames.length) % frames.length;
      if (nextIndex === index) {
        schedule();
        return;
      }

      var token = ++requestToken;
      var mobileUrl = path + frames[nextIndex] + "-560.webp";
      var desktopUrl = path + frames[nextIndex] + "-960.webp";
      var preloader = new Image();
      gallery.classList.add("is-changing");

      function commit() {
        if (token !== requestToken) return;
        index = nextIndex;
        source.srcset = mobileUrl;
        image.src = desktopUrl;
        image.alt = alts[index] || image.alt;
        updateControls(userInitiated);
        window.requestAnimationFrame(function () {
          gallery.classList.remove("is-changing");
        });
        schedule();
      }

      preloader.onload = commit;
      preloader.onerror = commit;
      preloader.src = MOBILE_QUERY.matches ? mobileUrl : desktopUrl;
    }

    previous.addEventListener("click", function () {
      show(index - 1, true);
    });
    next.addEventListener("click", function () {
      show(index + 1, true);
    });

    gallery.addEventListener("mouseenter", function () {
      paused = true;
      window.clearTimeout(timer);
    });
    gallery.addEventListener("mouseleave", function () {
      paused = false;
      schedule();
    });
    gallery.addEventListener("focusin", function () {
      paused = true;
      window.clearTimeout(timer);
    });
    gallery.addEventListener("focusout", function (event) {
      if (gallery.contains(event.relatedTarget)) return;
      paused = false;
      schedule();
    });
    document.addEventListener("visibilitychange", function () {
      schedule();
    });
    REDUCED_MOTION.addEventListener("change", function () {
      schedule();
    });

    updateControls(false);
    schedule(galleryIndex * 900);
  }

  function initialize() {
    document.querySelectorAll("[data-case-gallery]").forEach(initializeGallery);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
