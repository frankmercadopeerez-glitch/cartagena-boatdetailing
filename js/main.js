function getLayoutContext() {
  const e = (window.location.pathname || "").toLowerCase(),
    t = /\/blog\/[^/]+\/(?:index\.html)?$/.test(e),
    a = /\/blog\//.test(e),
    n = /\/cotizaciones\//.test(e),
    o = /\/facturas\//.test(e),
    r = /\/guias\//.test(e);
  let i = "";
  return (
    t ? (i = "../../") : (a || n || o || r) && (i = "../"),
    {
      pathname: e,
      prefix: i,
      isUtilityPage: /business-card\.html|finanzas\.html/.test(e),
      isLeadOnlyPage: /\/cotizar\.html$/.test(e),
    }
  );
}
function isEnglishDocument() {
  return (document.documentElement.lang || "")
    .trim()
    .toLowerCase()
    .startsWith("en");
}
function getSharedLayoutRoutes(e) {
  const prefix = e || "";
  if (isEnglishDocument()) {
    return {
      home: prefix + "index-en.html",
      services: prefix + "services-en.html",
      about: prefix + "about-en.html",
      cases: prefix + "case-studies.html",
      blog: prefix + "blog.html",
      contact: prefix + "contact-en.html",
      quote: prefix + "contact-en.html",
    };
  }
  return {
    home: prefix || "/",
    services: prefix + "services.html",
    about: prefix + "about.html",
    cases: prefix + "casos-reales.html",
    blog: prefix + "blog.html",
    contact: prefix + "contacto.html",
    quote: prefix + "cotizar.html",
  };
}
function getEnglishWhatsAppMessage(service) {
  const messages = {
    hullCleaning:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for hull cleaning for my vessel.",
    polishing:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for gelcoat polishing for my vessel.",
    ceramic:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for ceramic coating for my vessel.",
    ppf:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for PPF for my vessel.",
    gelcoat:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for gelcoat repair for my vessel.",
    fiberglass:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for fiberglass repair for my vessel.",
    teak:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for teak deck service for my vessel.",
    syntheticDeck:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for synthetic decking for my vessel.",
    graphics:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for vessel lettering and graphics.",
    tint:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for marine window tinting.",
    enginePainting:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for marine engine painting.",
    boatPainting:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for marine painting for my vessel.",
    bottomPaint:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for bottom painting for my vessel.",
    interior:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for marine upholstery and interior cleaning.",
    antiCorrosion:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for anti-corrosion treatment for my vessel.",
    technicalWash:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for a technical wash for my vessel.",
    electrical:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for marine electrical or air-conditioning service.",
    mechanics:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for marine mechanical service.",
    default:
      "Hello, I visited the Colombia Boat Detailing website and would like to request a quote for my vessel.",
  };
  return messages[service] || messages.default;
}
function buildEnglishWhatsAppUrl(service) {
  return `https://wa.me/573044301112?text=${encodeURIComponent(
    getEnglishWhatsAppMessage(service),
  )}`;
}
var I18N_PAIRS = {
    "index.html": "index-en.html",
    "services.html": "services-en.html",
    "ceramic-coating.html": "ceramic-coating-en.html",
    "ppf.html": "ppf-en.html",
    "paint-polishing.html": "paint-polishing-en.html",
    "contacto.html": "contact-en.html",
    "hull-cleaning.html": "hull-cleaning-en.html",
    "limpieza-casco-bocagrande.html": "hull-cleaning-bocagrande-en.html",
    "limpieza-casco-baru.html": "hull-cleaning-baru-en.html",
    "limpieza-casco-islas-del-rosario.html": "hull-cleaning-rosario-en.html",
    "limpieza-casco-manzanillo.html": "hull-cleaning-manzanillo-en.html",
    "about.html": "about-en.html",
    "interior-detailing.html": "interior-detailing-en.html",
    "gelcoat.html": "gelcoat-en.html",
    "anti-corrosion.html": "anti-corrosion-en.html",
    "cubierta-sintetica.html": "synthetic-decking-en.html",
    "electrical-systems.html": "electrical-systems-en.html",
    "mecanica-naval.html": "marine-mechanics-en.html",
    "casos-reales.html": "case-studies.html",
  },
  I18N_PAIRS_REV = {};
function i18nCurrentFile() {
  var e = (window.location.pathname || "/").toLowerCase().split("/").pop();
  return e || "index.html";
}
function i18nInfo(e) {
  e = e || "";
  var t,
    a,
    n = i18nCurrentFile(),
    o = isEnglishDocument();
  if (o) {
    a = e + n;
    var i = I18N_PAIRS_REV[n];
    t = i ? e + i : null;
  } else {
    t = "index.html" === n ? e || "/" : e + n;
    var r = I18N_PAIRS[n];
    a = r ? e + r : null;
  }
  return { current: o ? "en" : "es", esUrl: t, enUrl: a };
}
function buildLangSwitcher(e) {
  var t = i18nInfo(e),
    a = "es" === t.current,
    n = "en" === t.current;
  return (
    '<div class="lang-switch" role="group" aria-label="' +
    (n ? "Language" : "Idioma / Language") +
    '"><i class="ph ph-globe" aria-hidden="true"></i>' +
    ('<a href="' +
      (t.esUrl || e || "/") +
      '" class="lang-opt' +
      (a ? " lang-active" : "") +
      '" lang="es" hreflang="es-CO" aria-label="' +
      (n ? "View in Spanish" : "Ver en espanol") +
      '"' +
      (a ? ' aria-current="true"' : "") +
      ">ES</a>") +
    '<span class="lang-sep">/</span>' +
    (t.enUrl
      ? '<a href="' +
        t.enUrl +
        '" class="lang-opt' +
        (n ? " lang-active" : "") +
        '" lang="en" hreflang="en" aria-label="' +
        (n ? "Current page in English" : "View in English") +
        '"' +
        (n ? ' aria-current="true"' : "") +
        ">EN</a>"
      : '<button type="button" class="lang-opt" data-translate-help aria-label="Translate this page to English">EN</button>') +
    "</div>"
  );
}
function buildLangSwitcherMobile(e) {
  return buildLangSwitcher(e).replace(
    'class="lang-switch"',
    'class="lang-switch lang-switch--mobile"',
  );
}
function i18nGetPref() {
  try {
    return localStorage.getItem("cbd_lang_pref");
  } catch (e) {
    return null;
  }
}
function i18nSetPref(e) {
  try {
    localStorage.setItem("cbd_lang_pref", e);
  } catch (e) {}
}
function i18nBanner(e) {
  if (!document.getElementById("cbd-lang-banner")) {
    var t = document.createElement("div");
    ((t.id = "cbd-lang-banner"),
      t.setAttribute("role", "region"),
      t.setAttribute("aria-label", "Language"),
      (t.innerHTML =
        '<div class="cbd-lang-inner">' +
        e +
        '<button type="button" class="cbd-lang-close" data-lang-dismiss aria-label="Close">&times;</button></div>'),
      document.body.appendChild(t),
      requestAnimationFrame(function () {
        t.classList.add("show");
      }));
  }
}
function i18nTranslateHelp() {
  i18nBanner(
    '<i class="ph ph-globe" aria-hidden="true"></i><span>An English version of this page is coming soon. Meanwhile, use your browser\'s <strong>Translate</strong> option to read it in any language. Full English pages: <a href="' +
      getLayoutContext().prefix +
      'hull-cleaning-en.html">Hull Cleaning</a>.</span>',
  );
}
function i18nAutoDetect() {
  var e = i18nInfo(getLayoutContext().prefix);
  if ("en" !== e.current && !i18nGetPref()) {
    var t = (
      (navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ""])[0] || ""
    )
      .slice(0, 2)
      .toLowerCase();
    t &&
      "es" !== t &&
      "en" === t &&
      e.enUrl &&
      (i18nSetPref("en"), window.location.replace(e.enUrl));
  }
}
function i18nInjectStyles() {
  if (!document.getElementById("cbd-i18n-styles")) {
    var e = document.createElement("style");
    ((e.id = "cbd-i18n-styles"),
      (e.textContent =
        "\n.lang-switch{display:inline-flex;align-items:center;gap:.3rem;font-size:.72rem;letter-spacing:.12em;color:rgba(255,255,255,.7)}\n.lang-switch .ph-globe{font-size:1rem;color:#d4af37}\n.lang-switch .lang-opt{background:none;border:0;padding:0 .15rem;margin:0;cursor:pointer;color:rgba(255,255,255,.6);font:inherit;letter-spacing:inherit;text-decoration:none;transition:color .2s}\n.lang-switch .lang-opt:hover{color:#d4af37}\n.lang-switch .lang-active{color:#d4af37;font-weight:700}\n.lang-switch .lang-sep{color:rgba(255,255,255,.25)}\n.lang-switch--mobile{font-size:1rem;letter-spacing:.18em;gap:.5rem}\n.lang-switch--mobile .ph-globe{font-size:1.4rem}\n#cbd-lang-banner{position:fixed;left:50%;bottom:1rem;transform:translate(-50%,160%);width:min(620px,92vw);z-index:9998;background:#0a192f;border:1px solid rgba(212,175,55,.45);border-radius:.6rem;box-shadow:0 12px 45px rgba(0,0,0,.45);transition:transform .45s cubic-bezier(.4,0,.2,1)}\n#cbd-lang-banner.show{transform:translate(-50%,0)}\n#cbd-lang-banner .cbd-lang-inner{display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;color:#e2e8f0;font-size:.85rem;line-height:1.45}\n#cbd-lang-banner .ph-globe{font-size:1.5rem;color:#d4af37;flex-shrink:0}\n#cbd-lang-banner a{color:#d4af37}\n#cbd-lang-banner .cbd-lang-btn{background:#d4af37;color:#0a192f;padding:.45rem .85rem;border-radius:.35rem;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0}\n#cbd-lang-banner .cbd-lang-close{margin-left:.25rem;background:none;border:0;color:rgba(255,255,255,.55);font-size:1.5rem;line-height:1;cursor:pointer;flex-shrink:0;padding:0 .25rem}\n#cbd-lang-banner .cbd-lang-close:hover{color:#fff}\n@media(max-width:640px){#cbd-lang-banner .cbd-lang-inner{flex-wrap:wrap}}\n"),
      document.head.appendChild(e));
  }
}
function initLangSwitcher() {
  (i18nInjectStyles(),
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-translate-help]"))
        return (
          e.preventDefault(),
          i18nSetPref("en"),
          void i18nTranslateHelp()
        );
      if (e.target.closest("[data-lang-dismiss]")) {
        (e.preventDefault(), i18nSetPref("dismissed"));
        var t = document.getElementById("cbd-lang-banner");
        t &&
          (t.classList.remove("show"),
          setTimeout(function () {
            t.remove();
          }, 400));
      } else {
        if (e.target.closest("[data-lang-go]")) i18nSetPref("en");
        else {
          var a = e.target.closest(".lang-switch a.lang-opt");
          a && i18nSetPref("en" === a.getAttribute("lang") ? "en" : "es");
        }
      }
    }));
}
function initLangAutoDetect() {
  i18nAutoDetect();
}
function buildGlobalNavbarEnglish(e) {
  const routes = getSharedLayoutRoutes(e);
  const whatsappUrl = buildEnglishWhatsAppUrl("default");
  return `
<nav id="navbar" aria-label="Primary navigation" class="fixed w-full z-50 transition-all duration-300 py-2">
  <div class="container mx-auto px-6 flex justify-between items-center">
    <a href="${routes.home}" class="flex items-center gap-4 group" aria-label="Colombia Boat Detailing - Home">
      <img src="${e}images/cbdlogo-gold.svg" alt="" aria-hidden="true" class="h-10 w-auto transition-transform duration-300 group-hover:scale-110" width="120" height="40" loading="eager" />
      <div class="flex flex-col">
        <span class="text-white text-lg tracking-[0.2em] font-light leading-none">COLOMBIA</span>
        <span class="text-white font-serif font-bold text-xl tracking-widest leading-none group-hover:text-gold-400 transition-colors">BOAT DETAILING</span>
      </div>
    </a>

    <div class="hidden md:flex items-center gap-10">
      <div class="nav-dropdown">
        <button
          data-dropdown-toggle="servicesDropdown"
          aria-label="Open services menu"
          aria-haspopup="true"
          aria-expanded="false"
          aria-controls="servicesDropdown"
          class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all flex items-center gap-1"
        >
          Services
          <svg class="w-3 h-3 ml-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
        </button>

        <div class="nav-dropdown-content" id="servicesDropdown">
          <a href="${e}paint-polishing-en.html" class="nav-dropdown-link">Yacht and Boat Polishing</a>
          <a href="${e}synthetic-decking-en.html" class="nav-dropdown-link">EVA Synthetic Decking</a>
          <a href="${e}gelcoat-en.html" class="nav-dropdown-link">Gelcoat Repair</a>
          <a href="${e}fibra.html" class="nav-dropdown-link">Fiberglass Repair</a>
          <a href="${e}interior-detailing-en.html" class="nav-dropdown-link">Upholstery Cleaning</a>
          <button type="button" class="submenu-item nav-dropdown-link relative w-full text-left" style="grid-column:1/-1">
            Marine Painting <svg class="w-3 h-3 ml-1 inline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            <div class="submenu-flyout">
              <a href="${e}engine-painting.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm">Engine Painting</a>
              <a href="${e}boat-painting.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm border-t">Complete Marine Painting</a>
              <a href="${e}bottom-paint.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm border-t">Bottom Painting</a>
            </div>
          </button>
          <a href="${e}electrical-systems-en.html" class="nav-dropdown-link">Marine Electrical and A/C</a>
          <a href="${e}marine-mechanics-en.html" class="nav-dropdown-link">Marine Mechanics</a>
          <a href="${e}cubierta-teka.html" class="nav-dropdown-link">Teak Decking</a>
          <a href="${e}calcomanias.html" class="nav-dropdown-link">Vessel Lettering and Graphics</a>
          <a href="${e}polarizado.html" class="nav-dropdown-link">Marine Window Tinting</a>
          <a href="${e}anti-corrosion-en.html" class="nav-dropdown-link">Anti-Corrosion Treatment</a>
          <a href="${e}technical-wash.html" class="nav-dropdown-link">Technical Wash</a>
          <a href="${e}hull-cleaning-en.html" class="nav-dropdown-link">Hull Cleaning</a>
          <a href="${e}ceramic-coating-en.html" class="nav-dropdown-link">Ceramic Coating</a>
          <a href="${e}ppf-en.html" class="nav-dropdown-link">PPF</a>
          <a href="${routes.services}" class="nav-dropdown-link">View All Services</a>
          <a href="${routes.contact}" class="nav-dropdown-link">Contact</a>
        </div>
      </div>

      <a href="${routes.about}" class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all">About Us</a>
      <a href="${routes.blog}" class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all">Marine Blog</a>
      ${buildLangSwitcher(e)}
      <a
        href="${whatsappUrl}"
        data-whatsapp-layout
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Request a quote on WhatsApp"
        class="bg-gold-400 hover:bg-gold-500 text-navy-900 px-8 py-3 rounded-sm font-bold text-xs tracking-widest uppercase transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
      >Request Quote</a>
    </div>

    <button id="mobile-menu-btn" class="md:hidden text-white focus:outline-none" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-menu">
      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
</nav>`;
}
function buildGlobalMobileMenuEnglish(e) {
  const routes = getSharedLayoutRoutes(e);
  const whatsappUrl = buildEnglishWhatsAppUrl("default");
  return `
<div
  id="mobile-menu"
  role="dialog"
  aria-modal="true"
  aria-label="Navigation menu"
  aria-hidden="true"
  class="fixed inset-0 bg-navy-900 z-[9999] transform translate-x-full transition-transform duration-300 flex flex-col pointer-events-none"
  style="overflow-y:auto"
>
  <div class="flex items-center justify-between px-6 py-5 border-b border-white/10">
    <a href="${routes.home}" class="flex items-center gap-3" aria-label="Home">
      <img src="${e}images/cbdlogo-gold.svg" alt="" aria-hidden="true" class="h-9 w-auto" width="43" height="36" loading="lazy" />
      <div>
        <p class="text-white text-sm tracking-[0.2em] font-light leading-none">COLOMBIA</p>
        <p class="text-white font-serif font-bold text-base tracking-widest leading-none">BOAT DETAILING</p>
      </div>
    </a>
    <button id="close-menu-btn" class="text-white/50 hover:text-white p-2" aria-label="Close navigation menu">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  </div>
  <div class="flex flex-col px-6 py-8 gap-1 flex-1">
    <p class="text-gold-400 text-[10px] font-bold tracking-widest uppercase mb-4">Main Menu</p>
    <a href="${routes.home}" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Home</a>
    <a href="${routes.services}" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Services</a>
    <a href="${routes.about}" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">About Us</a>
    <a href="${routes.blog}" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Marine Blog</a>
    <a href="${routes.contact}" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Contact</a>
  </div>
  <div class="px-6 py-6 border-t border-white/10 flex flex-col items-center text-center">
    ${buildLangSwitcherMobile(e)}
    <a
      href="${whatsappUrl}"
      data-whatsapp-layout
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Request a quote on WhatsApp"
      class="mobile-link mt-4 w-full text-center block bg-gold-400 hover:bg-gold-500 text-navy-900 px-8 py-4 font-bold text-sm tracking-widest uppercase transition-all"
    >Request Quote — WhatsApp</a>
    <a href="tel:+573044301112" class="mobile-link mt-3 w-full text-center block border border-white/20 text-white py-3 text-sm tracking-widest" aria-label="Call Colombia Boat Detailing">+57 304 430 1112</a>
  </div>
</div>`;
}
function buildGlobalFooterEnglish(e) {
  const routes = getSharedLayoutRoutes(e);
  const whatsappUrl = buildEnglishWhatsAppUrl("default");
  return `
<footer class="bg-navy-900 text-slate-300 border-t border-gold-400/10">
  <div class="container mx-auto px-6 py-10 md:py-14">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
      <div class="lg:col-span-1">
        <a href="${routes.home}" class="flex items-center gap-3 mb-5 group" aria-label="Colombia Boat Detailing - Home">
          <img src="${e}images/cbdlogo-white.svg" alt="" aria-hidden="true" width="56" height="47" class="h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
          <div>
            <p class="text-white text-sm tracking-[0.2em] font-light leading-none">COLOMBIA</p>
            <p class="text-white font-serif font-bold text-lg tracking-widest leading-none">BOAT DETAILING</p>
          </div>
        </a>
        <p class="text-xs text-slate-400 font-light leading-relaxed mb-5">Marine appearance and technical care in Cartagena, with an on-site assessment and written scope before work begins.</p>
        <div class="flex gap-4 items-center">
          <a href="${whatsappUrl}" data-whatsapp-layout target="_blank" rel="noopener noreferrer" aria-label="Contact us on WhatsApp" class="text-slate-400 hover:text-gold-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.022.501 3.927 1.382 5.6L0 24l6.545-1.359A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.653-.513-5.168-1.407l-.37-.22-3.854.8.824-3.75-.241-.386A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          </a>
          <a href="https://instagram.com/colombiaboatdetailing" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="text-slate-400 hover:text-gold-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://facebook.com/colombiaboatdetailing" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="text-slate-400 hover:text-gold-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-bold tracking-widest uppercase text-gold-400 mb-5 pb-2 border-b border-gold-400/20">SERVICES</h4>
        <ul class="space-y-2 text-xs font-light">
          <li><a href="${e}paint-polishing-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Yacht and Boat Polishing</a></li>
          <li><a href="${e}synthetic-decking-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> EVA Synthetic Decking</a></li>
          <li><a href="${e}gelcoat-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Gelcoat Repair</a></li>
          <li><a href="${e}fibra.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Fiberglass Repair</a></li>
          <li><a href="${e}boat-painting.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Marine Painting</a></li>
          <li><a href="${e}interior-detailing-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Upholstery Cleaning</a></li>
          <li><a href="${e}electrical-systems-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Marine Electrical and A/C</a></li>
          <li><a href="${e}marine-mechanics-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Marine Mechanics</a></li>
          <li><a href="${e}hull-cleaning-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Hull Cleaning</a></li>
          <li><a href="${routes.services}" class="text-gold-400 hover:text-white transition-colors flex items-center gap-2 font-medium mt-2"><span>→</span> View all services</a></li>
        </ul>
      </div>

      <div>
        <div class="hidden md:block">
          <h4 class="text-xs font-bold tracking-widest uppercase text-gold-400 mb-5 pb-2 border-b border-gold-400/20">NAVIGATION</h4>
          <ul class="space-y-2 text-xs font-light">
            <li><a href="${routes.home}" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Home</a></li>
            <li><a href="${routes.about}" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> About Us</a></li>
            <li><a href="${routes.blog}" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Marine Blog</a></li>
            <li><a href="${routes.quote}" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Request a Quote</a></li>
            <li><a href="${routes.contact}" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Contact</a></li>
          </ul>
        </div>
        <h4 class="text-xs font-bold tracking-widest uppercase text-gold-400 mt-6 mb-4 pb-2 border-b border-gold-400/20">SERVICE AREAS</h4>
        <ul class="space-y-2 text-xs font-light">
          <li><a href="${e}hull-cleaning-bocagrande-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Bocagrande</a></li>
          <li><a href="${e}hull-cleaning-baru-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Barú</a></li>
          <li><a href="${e}hull-cleaning-rosario-en.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Rosario Islands</a></li>
        </ul>
      </div>

      <div>
        <h4 class="text-xs font-bold tracking-widest uppercase text-gold-400 mb-5 pb-2 border-b border-gold-400/20">CONTACT</h4>
        <ul class="space-y-4 text-xs font-light">
          <li class="flex items-start gap-3">
            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <div><a href="tel:+573044301112" class="text-slate-300 hover:text-gold-400 transition-colors block">+57 304 430 1112</a><a href="${whatsappUrl}" data-whatsapp-layout target="_blank" rel="noopener noreferrer" aria-label="Contact us on WhatsApp" class="text-gold-400 hover:text-white transition-colors text-[10px] tracking-widest">WhatsApp available</a></div>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <a href="mailto:proyectos@colombiaboatdetailing.com" class="text-slate-300 hover:text-gold-400 transition-colors">proyectos@colombiaboatdetailing.com</a>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span class="text-slate-300">Cartagena de Indias<br/>Bolívar, Colombia</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span class="text-slate-300">Monday to Saturday<br/>7:00 am – 6:00 pm</span>
          </li>
        </ul>
        <a href="${whatsappUrl}" data-whatsapp-layout target="_blank" rel="noopener noreferrer" aria-label="Request a quote on WhatsApp" class="mt-6 inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-navy-900 px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all">Request Quote</a>
      </div>
    </div>
  </div>

  <div class="border-t border-slate-700/60">
    <div class="container mx-auto px-6 py-5 flex flex-col items-center gap-3 text-xs text-slate-500 font-light text-center">
      <p>&copy; 2026 Colombia Boat Detailing &middot; All rights reserved</p>
      <div class="flex gap-5">
        <a href="${e}sitemap.xml" class="hover:text-gold-400 transition">Sitemap</a>
        <span>&middot;</span>
        <a href="${routes.quote}" class="hover:text-gold-400 transition">Request a Quote</a>
        <span>&middot;</span>
        <a href="${routes.contact}" class="hover:text-gold-400 transition">Contact</a>
      </div>
    </div>
  </div>
</footer>`;
}
function buildGlobalNavbar(e) {
  if (isEnglishDocument()) return buildGlobalNavbarEnglish(e);
  return `\n<nav id="navbar" class="fixed w-full z-50 transition-all duration-300 py-2">\n  <div class="container mx-auto px-6 flex justify-between items-center">\n    <a href="${e || "/"}" class="flex items-center gap-4 group" aria-label="Colombia Boat Detailing - Inicio">\n      <img src="${e}images/cbdlogo-gold.svg" alt="" aria-hidden="true" class="h-10 w-auto transition-transform duration-300 group-hover:scale-110" width="120" height="40" loading="eager" />\n      <div class="flex flex-col">\n        <span class="text-white text-lg tracking-[0.2em] font-light leading-none">COLOMBIA</span>\n        <span class="text-white font-serif font-bold text-xl tracking-widest leading-none group-hover:text-gold-400 transition-colors">BOAT DETAILING</span>\n      </div>\n    </a>\n\n    <div class="hidden md:flex items-center gap-10">\n      <div class="nav-dropdown">\n        <button\n          data-dropdown-toggle="servicesDropdown"\n          aria-haspopup="true"\n          aria-expanded="false"\n          aria-controls="servicesDropdown"\n          class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all flex items-center gap-1"\n        >\n          Servicios\n          <svg class="w-3 h-3 ml-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>\n        </button>\n\n        <div class="nav-dropdown-content" id="servicesDropdown">\n          <a href="${e}paint-polishing.html" class="nav-dropdown-link">Pulido de Yates y Botes</a>\n          <a href="${e}cubierta-sintetica.html" class="nav-dropdown-link">Pisos Sintéticos EVA</a>\n          <a href="${e}gelcoat.html" class="nav-dropdown-link">Reparación de Gelcoat</a>\n          <a href="${e}fibra.html" class="nav-dropdown-link">Reparación de Fibra</a>\n          <a href="${e}interior-detailing.html" class="nav-dropdown-link">Limpieza de Cojinería</a>\n          <button type="button" class="submenu-item nav-dropdown-link relative w-full text-left" style="grid-column:1/-1">\n            Pintura Naval <svg class="w-3 h-3 ml-1 inline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>\n            <div class="submenu-flyout">\n              <a href="${e}engine-painting.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm">Pintura de Motores</a>\n              <a href="${e}boat-painting.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm border-t">Pintura Completa</a>\n              <a href="${e}bottom-paint.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm border-t">Pintura de Casco</a>\n            </div>\n          </button>\n          <a href="${e}electrical-systems.html" class="nav-dropdown-link">Electricidad y Aire Acondicionado</a>\n          <a href="${e}cubierta-teka.html" class="nav-dropdown-link">Cubierta de Teca</a>\n          <a href="${e}calcomanias.html" class="nav-dropdown-link">Calcomanías y Gráficos</a>\n          <a href="${e}polarizado.html" class="nav-dropdown-link">Polarizado Nanocerámico</a>\n          <a href="${e}anti-corrosion.html" class="nav-dropdown-link">Control Anticorrosivo</a>\n          <a href="${e}technical-wash.html" class="nav-dropdown-link">Lavado Técnico</a>\n          <a href="${e}hull-cleaning.html" class="nav-dropdown-link">Limpieza de Casco</a>\n          <a href="${e}ceramic-coating.html" class="nav-dropdown-link">Ceramic Coating</a>\n          <a href="${e}ppf.html" class="nav-dropdown-link">PPF</a>\n        </div>\n      </div>\n\n      <a href="${e}about.html" class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all">Sobre Nosotros</a>\n      <a href="${e}blog.html" class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all">Blog</a>\n      ${buildLangSwitcher(e)}\n      <a\n        href="https://wa.me/573044301112?text=Hola%2C%20vi%20la%20p%C3%A1gina%20web%20de%20Colombia%20Boat%20Detailing%20y%20quiero%20cotizar%20un%20servicio%20para%20mi%20embarcaci%C3%B3n"\n        target="_blank"\n        rel="noopener noreferrer"\n        class="bg-gold-400 hover:bg-gold-500 text-navy-900 px-8 py-3 rounded-sm font-bold text-xs tracking-widest uppercase transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)]"\n      >Agendar Cita</a>\n    </div>\n\n    <button id="mobile-menu-btn" class="md:hidden text-white focus:outline-none" aria-label="Abrir menú de navegación" aria-expanded="false" aria-controls="mobile-menu">\n      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>\n    </button>\n  </div>\n</nav>`;
}
function buildGlobalMobileMenu(e) {
  if (isEnglishDocument()) return buildGlobalMobileMenuEnglish(e);
  return `\n<div\n  id="mobile-menu"\n  role="dialog"\n  aria-modal="true"\n  aria-label="Menú de navegación"\n  aria-hidden="true"\n  class="fixed inset-0 bg-navy-900 z-[9999] transform translate-x-full transition-transform duration-300 flex flex-col pointer-events-none"\n  style="overflow-y:auto"\n>\n  \x3c!-- Mobile menu header --\x3e\n  <div class="flex items-center justify-between px-6 py-5 border-b border-white/10">\n    <a href="${e || "/"}" class="flex items-center gap-3" aria-label="Inicio">\n      <img src="${e}images/cbdlogo-gold.svg" alt="" aria-hidden="true" class="h-9 w-auto" width="43" height="36" loading="lazy" />\n      <div>\n        <p class="text-white text-sm tracking-[0.2em] font-light leading-none">COLOMBIA</p>\n        <p class="text-white font-serif font-bold text-base tracking-widest leading-none">BOAT DETAILING</p>\n      </div>\n    </a>\n    <button id="close-menu-btn" class="text-white/50 hover:text-white p-2" aria-label="Cerrar menú de navegación">\n      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>\n    </button>\n  </div>\n  \x3c!-- Mobile menu links --\x3e\n  <div class="flex flex-col px-6 py-8 gap-1 flex-1">\n    <p class="text-gold-400 text-[10px] font-bold tracking-widest uppercase mb-4">Menú Principal</p>\n    <a href="${e || "/"}" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Inicio</a>\n    <a href="${e}services.html" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Servicios</a>\n    <a href="${e}about.html" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Sobre Nosotros</a>\n    <a href="${e}blog.html" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Blog Naval</a>\n    <a href="${e}contacto.html" class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">Contacto</a>\n  </div>\n  \x3c!-- Mobile CTA --\x3e\n  <div class="px-6 py-6 border-t border-white/10 flex flex-col items-center text-center">\n    ${buildLangSwitcherMobile(e)}\n    <a\n      href="https://wa.me/573044301112?text=Hola%2C%20vi%20la%20p%C3%A1gina%20web%20de%20Colombia%20Boat%20Detailing%20y%20quiero%20cotizar%20un%20servicio%20para%20mi%20embarcaci%C3%B3n"\n      target="_blank"\n      rel="noopener noreferrer"\n      class="mobile-link mt-4 w-full text-center block bg-gold-400 hover:bg-gold-500 text-navy-900 px-8 py-4 font-bold text-sm tracking-widest uppercase transition-all"\n    >Agendar Cita — WhatsApp</a>\n    <a href="tel:+573044301112" class="mobile-link mt-3 w-full text-center block border border-white/20 text-white py-3 text-sm tracking-widest">+57 304 430 1112</a>\n  </div>\n</div>`;
}
function buildGlobalFooter(e) {
  if (isEnglishDocument()) return buildGlobalFooterEnglish(e);
  return `\n<footer class="bg-navy-900 text-slate-300 border-t border-gold-400/10">\n  \x3c!-- Top footer --\x3e\n  <div class="container mx-auto px-6 py-10 md:py-14">\n    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">\n\n      \x3c!-- Brand --\x3e\n      <div class="lg:col-span-1">\n        <a href="${e || "/"}" class="flex items-center gap-3 mb-5 group" aria-label="Colombia Boat Detailing">\n          <img src="${e}images/cbdlogo-white.svg" alt="" aria-hidden="true" width="56" height="47" class="h-12 w-auto opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />\n          <div>\n            <p class="text-white text-sm tracking-[0.2em] font-light leading-none">COLOMBIA</p>\n            <p class="text-white font-serif font-bold text-lg tracking-widest leading-none">BOAT DETAILING</p>\n          </div>\n        </a>\n        <p class="text-xs text-slate-400 font-light leading-relaxed mb-5">Estándares internacionales de excelencia marina en Cartagena de Indias. Desde 2024 protegemos y embellecemos embarcaciones del Caribe colombiano.</p>\n        <div class="flex gap-4 items-center">\n          <a href="https://wa.me/573044301112" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" class="text-slate-400 hover:text-gold-400 transition-colors">\n            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.022.501 3.927 1.382 5.6L0 24l6.545-1.359A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.653-.513-5.168-1.407l-.37-.22-3.854.8.824-3.75-.241-.386A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>\n          </a>\n          <a href="https://instagram.com/colombiaboatdetailing" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="text-slate-400 hover:text-gold-400 transition-colors">\n            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>\n          </a>\n          <a href="https://facebook.com/colombiaboatdetailing" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="text-slate-400 hover:text-gold-400 transition-colors">\n            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>\n          </a>\n        </div>\n      </div>\n\n      \x3c!-- Servicios --\x3e\n      <div>\n        <h4 class="text-xs font-bold tracking-widest uppercase text-gold-400 mb-5 pb-2 border-b border-gold-400/20">SERVICIOS</h4>\n        <ul class="space-y-2 text-xs font-light">\n          <li><a href="${e}paint-polishing.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Pulido de Yates y Botes</a></li>\n          <li><a href="${e}cubierta-sintetica.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Pisos Sintéticos EVA</a></li>\n          <li><a href="${e}gelcoat.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Reparación de Gelcoat</a></li>\n          <li><a href="${e}fibra.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Reparación de Fibra</a></li>\n          <li><a href="${e}boat-painting.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Pintura Naval</a></li>\n          <li><a href="${e}interior-detailing.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Limpieza de Cojinería</a></li>\n          <li><a href="${e}electrical-systems.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Electricidad y Aire Acondicionado</a></li>\n          <li><a href="${e}hull-cleaning.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> Limpieza de Casco</a></li>\n          <li><a href="${e}services.html" class="text-gold-400 hover:text-white transition-colors flex items-center gap-2 font-medium mt-2"><span>→</span> Ver todos los servicios</a></li>\n        </ul>\n      </div>\n\n      \x3c!-- Navegación (oculta en móvil, redundante con el menú) --\x3e\n      <div>\n        <div class="hidden md:block">\n        <h4 class="text-xs font-bold tracking-widest uppercase text-gold-400 mb-5 pb-2 border-b border-gold-400/20">NAVEGACIÓN</h4>\n        <ul class="space-y-2 text-xs font-light">\n          <li><a href="${e || "/"}" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Inicio</a></li>\n          <li><a href="${e}about.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Sobre Nosotros</a></li>\n          <li><a href="${e}blog.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Blog Naval</a></li>\n          <li><a href="${e}cotizar.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Cotizar Servicio</a></li>\n          <li><a href="${e}contacto.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Contacto</a></li>\n        </ul>\n        </div>\n        <h4 class="text-xs font-bold tracking-widest uppercase text-gold-400 mt-6 mb-4 pb-2 border-b border-gold-400/20">ZONAS</h4>\n        <ul class="space-y-2 text-xs font-light">\n          <li><a href="${e}limpieza-casco-bocagrande.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Bocagrande</a></li>\n          <li><a href="${e}limpieza-casco-baru.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Barú</a></li>\n          <li><a href="${e}limpieza-casco-islas-del-rosario.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">›</span> Islas del Rosario</a></li>\n        </ul>\n      </div>\n\n      \x3c!-- Contacto --\x3e\n      <div>\n        <h4 class="text-xs font-bold tracking-widest uppercase text-gold-400 mb-5 pb-2 border-b border-gold-400/20">CONTACTO</h4>\n        <ul class="space-y-4 text-xs font-light">\n          <li class="flex items-start gap-3">\n            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>\n            <div><a href="tel:+573044301112" class="text-slate-300 hover:text-gold-400 transition-colors block">+57 304 430 1112</a><a href="https://wa.me/573044301112" target="_blank" rel="noopener" class="text-gold-400 hover:text-white transition-colors text-[10px] tracking-widest">WhatsApp disponible</a></div>\n          </li>\n          <li class="flex items-start gap-3">\n            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>\n            <a href="mailto:proyectos@colombiaboatdetailing.com" class="text-slate-300 hover:text-gold-400 transition-colors">proyectos@colombiaboatdetailing.com</a>\n          </li>\n          <li class="flex items-start gap-3">\n            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>\n            <span class="text-slate-300">Cartagena de Indias<br/>Bolívar, Colombia</span>\n          </li>\n          <li class="flex items-start gap-3">\n            <svg class="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>\n            <span class="text-slate-300">Lunes a Sábado<br/>7:00 am – 6:00 pm</span>\n          </li>\n        </ul>\n        <a href="https://wa.me/573044301112?text=Hola%2C%20quiero%20cotizar%20un%20servicio%20para%20mi%20embarcaci%C3%B3n" target="_blank" rel="noopener noreferrer" class="mt-6 inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-navy-900 px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all">\n          Agendar Ahora\n        </a>\n      </div>\n    </div>\n  </div>\n\n  \x3c!-- Bottom footer --\x3e\n  <div class="border-t border-slate-700/60">\n    <div class="container mx-auto px-6 py-5 flex flex-col items-center gap-3 text-xs text-slate-500 font-light text-center">\n      <p>&copy; 2026 Colombia Boat Detailing &middot; Todos los derechos reservados</p>\n      <div class="flex gap-5">\n        <a href="${e}sitemap.xml" class="hover:text-gold-400 transition">Sitemap</a>\n        <span>&middot;</span>\n        <a href="${e}cotizar.html" class="hover:text-gold-400 transition">Cotizar</a>\n        <span>&middot;</span>\n        <a href="${e}contacto.html" class="hover:text-gold-400 transition">Contacto</a>\n      </div>\n    </div>\n  </div>\n</footer>`;
}
function styleGlobalMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (!menu) return;

  Object.assign(menu.style, {
    left: "auto",
    right: "0",
    width: "min(100%, 420px)",
    height: "100dvh",
    maxHeight: "100dvh",
    overflowY: "auto",
    boxShadow: "-18px 0 50px rgba(0, 0, 0, .35)",
  });

  const header = menu.firstElementChild;
  const brand = header?.querySelector(
    'a[aria-label="Inicio"], a[aria-label="Home"]',
  );
  const logo = brand?.querySelector("img");
  const brandText = brand?.querySelector("div");
  const brandLines = brandText?.querySelectorAll("p");
  const closeButton = menu.querySelector("#close-menu-btn");
  const closeIcon = closeButton?.querySelector("svg");
  const links = menu.querySelectorAll(".mobile-link:not([href^='tel:'])");
  const linksPanel = menu.children[1];
  const ctaPanel = menu.children[2];
  const phoneLink = menu.querySelector('.mobile-link[href^="tel:"]');

  header &&
    Object.assign(header.style, {
      flex: "0 0 72px",
      minHeight: "72px",
      padding: "12px 20px",
    });
  brand &&
    Object.assign(brand.style, {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      maxWidth: "calc(100% - 48px)",
      overflow: "hidden",
    });
  logo &&
    Object.assign(logo.style, {
      display: "block",
      width: "42px",
      height: "35px",
      maxWidth: "42px",
      maxHeight: "35px",
      objectFit: "contain",
      flex: "0 0 42px",
    });
  brandText &&
    Object.assign(brandText.style, {
      minWidth: "0",
      whiteSpace: "nowrap",
    });
  brandLines?.forEach((line, index) =>
    Object.assign(line.style, {
      margin: index ? "0" : "0 0 3px",
      fontSize: index ? "15px" : "12px",
      lineHeight: "1",
      letterSpacing: index ? ".1em" : ".2em",
    }),
  );
  closeButton &&
    Object.assign(closeButton.style, {
      display: "flex",
      width: "40px",
      height: "40px",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 40px",
    });
  closeIcon &&
    Object.assign(closeIcon.style, {
      display: "block",
      width: "24px",
      height: "24px",
    });
  linksPanel &&
    Object.assign(linksPanel.style, {
      padding: "24px 20px 16px",
    });
  linksPanel?.querySelector("p") &&
    Object.assign(linksPanel.querySelector("p").style, {
      margin: "0 0 8px",
    });
  links.forEach((link) => {
    if (link.closest("div") !== linksPanel) return;
    Object.assign(link.style, {
      padding: "11px 4px",
      fontSize: "20px",
      lineHeight: "1.35",
    });
  });
  ctaPanel &&
    Object.assign(ctaPanel.style, {
      padding: "16px 20px 20px",
    });
  phoneLink &&
    Object.assign(phoneLink.style, {
      paddingTop: "10px",
      paddingBottom: "10px",
      fontSize: "12px",
    });
}
function initGlobalLayout() {
  const { prefix: e, isUtilityPage: t, isLeadOnlyPage: a } = getLayoutContext();
  const path = (window.location.pathname || "/").toLowerCase();
  if (t || a || path === "/" || path === "/index.html") return;
  const n = buildGlobalNavbar(e),
    o = buildGlobalMobileMenu(e),
    i = buildGlobalFooter(e).replace(
      "Estándares internacionales de excelencia marina en Cartagena de Indias. Desde 2024 protegemos y embellecemos embarcaciones del Caribe colombiano.",
      "Cuidado estético y técnico para embarcaciones en Cartagena, con visita previa y alcance definido antes de iniciar.",
    ),
    r =
      document.querySelector("nav#navbar") ||
      document.querySelector("body > nav") ||
      document.querySelector("nav");
  r ? (r.outerHTML = n) : document.body.insertAdjacentHTML("afterbegin", n);
  const l = document.getElementById("mobile-menu");
  l
    ? (l.outerHTML = o)
    : document.getElementById("navbar")?.insertAdjacentHTML("afterend", o);
  styleGlobalMobileMenu();
  const s = document.querySelector("footer");
  s ? (s.outerHTML = i) : document.body.insertAdjacentHTML("beforeend", i);
  injectRealWorkNavigation(e);
  injectMarineMechanicsNavigation(e);
  prioritizeServicesNavigation();
}
function injectRealWorkNavigation(e) {
  const english = isEnglishDocument();
  const href = `${e}${english ? "case-studies.html" : "casos-reales.html"}`;
  const desktopLabel = english ? "Real Work" : "Casos Reales";
  const navAnchor = document.querySelector(
    english ? `#navbar a[href$="about-en.html"]` : `#navbar a[href$="about.html"]`,
  );
  if (navAnchor && !document.querySelector("#navbar [data-real-work-link]")) {
    navAnchor.insertAdjacentHTML(
      "afterend",
      `<a href="${href}" data-real-work-link class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all">${desktopLabel}</a>`,
    );
  }
  const mobileAnchor = document.querySelector(
    english ? `#mobile-menu a[href$="about-en.html"]` : `#mobile-menu a[href$="about.html"]`,
  );
  if (mobileAnchor && !document.querySelector("#mobile-menu [data-real-work-link]")) {
    mobileAnchor.insertAdjacentHTML(
      "afterend",
      `<a href="${href}" data-real-work-link class="mobile-link text-xl font-serif text-white hover:text-gold-400 py-3 border-b border-white/5">${desktopLabel}</a>`,
    );
  }
  const footerAnchor = document.querySelector(
    english ? `footer a[href$="about-en.html"]` : `footer a[href$="about.html"]`,
  );
  if (footerAnchor && !document.querySelector("footer [data-real-work-link]")) {
    const item = footerAnchor.closest("li");
    item?.insertAdjacentHTML(
      "afterend",
      `<li><a href="${href}" data-real-work-link class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> ${desktopLabel}</a></li>`,
    );
  }
}
function injectMarineMechanicsNavigation(e) {
  const label = isEnglishDocument() ? "Marine Mechanics" : "Mecánica Naval";
  document.querySelectorAll(".nav-dropdown-content").forEach((menu) => {
    if (menu.querySelector('a[href$="mecanica-naval.html"]')) return;
    const electricalLink = menu.querySelector(
      'a[href$="electrical-systems.html"]',
    );
    if (!electricalLink) return;
    electricalLink.insertAdjacentHTML(
      "afterend",
      `<a href="${e}mecanica-naval.html" class="nav-dropdown-link">${label}</a>`,
    );
  });

  const footerElectrical = document.querySelector(
    'footer a[href$="electrical-systems.html"]',
  );
  if (
    footerElectrical &&
    !document.querySelector('footer a[href$="mecanica-naval.html"]')
  ) {
    footerElectrical.closest("li")?.insertAdjacentHTML(
      "afterend",
      `<li><a href="${e}mecanica-naval.html" class="text-slate-300 hover:text-gold-400 transition-colors flex items-center gap-2"><span class="text-gold-400 opacity-50">&rsaquo;</span> ${label}</a></li>`,
    );
  }
}
function prioritizeServicesNavigation() {
  document.querySelectorAll(".nav-dropdown-content").forEach((e) => {
    const t = e.querySelector(
        'a[href$="paint-polishing.html"], a[href$="paint-polishing-en.html"]',
      ),
      a = e.querySelector(
        'a[href$="hull-cleaning.html"], a[href$="hull-cleaning-en.html"]',
      ),
      n = e.querySelector(".submenu-item"),
      o = n?.querySelector(".submenu-flyout");
    if (!t || !a || !n) return;
    (t.classList.add("flex", "items-center", "gap-2"),
      t.querySelector("[data-primary-service]") ||
        t.insertAdjacentHTML(
          "afterbegin",
          '<span data-primary-service class="text-[9px] font-black bg-gold-400 text-navy-900 rounded-sm" style="display:inline-flex;width:1.35rem;height:1.35rem;align-items:center;justify-content:center;line-height:1;flex:0 0 1.35rem;padding:0">★</span>',
        ));
    let i = e.querySelector("[data-services-divider]");
    (i ||
      ((i = document.createElement("div")),
      i.setAttribute("data-services-divider", ""),
      i.setAttribute("aria-hidden", "true"),
      (i.className = "mx-4 h-px bg-white/10 my-1")),
      e.prepend(i),
      e.prepend(t),
      (n.style.gridColumn = "1"),
      o &&
        Object.assign(o.style, {
          left: "100%",
          right: "auto",
          top: "0",
          bottom: "auto",
          transform: "translateX(0)",
        }),
      n.setAttribute("aria-haspopup", "true"),
      n.setAttribute("aria-expanded", "false"),
      n.addEventListener("mouseenter", () => {
        if (!o) return;
        (o.style.top = "0"),
          (o.style.bottom = "auto"),
          requestAnimationFrame(() => {
            const e = o.getBoundingClientRect();
            let t = Math.min(0, window.innerHeight - 12 - e.bottom);
            ((t = Math.max(t, 12 - e.top)), (o.style.top = `${t}px`));
          });
      }),
      n.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        (e.preventDefault(), e.stopPropagation());
        const t = n.classList.toggle("submenu-open");
        (n.setAttribute("aria-expanded", String(t)),
          o &&
            Object.assign(o.style, {
              opacity: t ? "1" : "",
              visibility: t ? "visible" : "",
            }),
          t &&
            o &&
            requestAnimationFrame(() => {
              const e = o.getBoundingClientRect();
              let t = Math.min(0, window.innerHeight - 12 - e.bottom);
              ((t = Math.max(t, 12 - e.top)), (o.style.top = `${t}px`));
            }));
      }),
      document.addEventListener("click", (e) => {
        e.target.closest(".submenu-item") ||
          (n.classList.remove("submenu-open"),
          n.setAttribute("aria-expanded", "false"),
          o &&
            Object.assign(o.style, {
              opacity: "",
              visibility: "",
            }));
      }),
      document.addEventListener("keydown", (e) => {
        "Escape" === e.key &&
          (n.classList.remove("submenu-open"),
          n.setAttribute("aria-expanded", "false"),
          o &&
            Object.assign(o.style, {
              opacity: "",
              visibility: "",
            }));
      }),
      e.append(n),
      e.append(a));
  });
}
function initFooterConsistency() {
  ((document.documentElement.style.backgroundColor = "#001f3f"),
    document.body.classList.contains("bg-navy-900")
      ? (document.body.style.backgroundColor = "#001f3f")
      : document.body.style.removeProperty("background-color"),
    document.querySelectorAll("footer").forEach((e) => {
      (e.querySelectorAll("h4, .text-navy-900, .text-navy-800").forEach((e) => {
        e.style.setProperty("color", "#e2e8f0", "important");
      }),
        e
          .querySelectorAll(".text-slate-500, .text-slate-600, .text-slate-700")
          .forEach((e) => {
            e.style.setProperty("color", "#cbd5e1", "important");
          }),
        e
          .querySelectorAll(
            "a[href*='wa.me'], a[href*='api.whatsapp.com'], a[href*='whatsapp.com/send']",
          )
          .forEach((link) => {
            if (!isEnglishDocument()) return link.remove();
            link.style.setProperty(
              "display",
              link.classList.contains("inline-flex") || link.querySelector("svg")
                ? "inline-flex"
                : "inline",
              "important",
            );
          }));
    }));
}
function normalizeFloatingWhatsApp() {
  const existing = document.querySelector("a.whatsapp-float");
  if (existing) {
    if (isEnglishDocument())
      existing.setAttribute("aria-label", "Request a quote on WhatsApp");
    return;
  }
  const e = document.querySelector('a[aria-label="WhatsApp"][href*="wa.me"]');
  if (!e) return;
  const t =
      (window.location.pathname.match(/\//g) || []).length >= 3 ? "../../" : "",
    a = e.getAttribute("href") || "https://wa.me/573044301112",
    n = document.createElement("a");
  ((n.href = a),
    (n.className = "whatsapp-float"),
    n.setAttribute("target", "_blank"),
    n.setAttribute("rel", "noopener noreferrer"),
    n.setAttribute(
      "aria-label",
      isEnglishDocument()
        ? "Request a quote on WhatsApp"
        : "Cotizar por WhatsApp",
    ),
    (n.innerHTML = `<img src="${t}images/whatsapp-96.webp" alt="WhatsApp" class="whatsapp-float__img" width="58" height="58" />`),
    e.replaceWith(n));
}
function centerBlogArticleHeader() {
  const e = (window.location.pathname || "").toLowerCase();
  if (!/\/blog\/[^/]+\/index\.html$/.test(e)) return;
  const t = document.querySelector("header");
  if (!t) return;
  const a = t.querySelector(".max-w-3xl, .max-w-4xl, .max-w-5xl");
  a && !a.classList.contains("text-center") && a.classList.add("text-center");
}
function normalizeBlogArticleReadability() {
  const e = (window.location.pathname || "").toLowerCase();
  if (!/\/blog\/[^/]+\/index\.html$/.test(e)) return;
  const t = document.querySelector("article");
  t && !t.className.includes("bg-") && t.classList.add("bg-white");
  const a = document.querySelector(".prose");
  a &&
    a.querySelectorAll("p, li").forEach((e) => {
      e.className.includes("text-") || e.classList.add("text-slate-800");
    });
}
function initWhatsAppMessages() {
  const e = (window.location.pathname.split("/").pop() || "").toLowerCase(),
    english = isEnglishDocument(),
    t = [
      {
        service: "hullCleaning",
        re: /hull-cleaning|limpieza-casco/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar limpieza de casco para mi embarcacion.",
      },
      {
        service: "polishing",
        re: /paint-polishing|pulido-gelcoat/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar pulido de gelcoat para mi embarcacion.",
      },
      {
        service: "ceramic",
        re: /ceramic-coating/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar ceramic coating para mi embarcacion.",
      },
      {
        service: "ppf",
        re: /ppf/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar PPF para mi embarcacion.",
      },
      {
        service: "gelcoat",
        re: /gelcoat/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar restauracion de gelcoat para mi embarcacion.",
      },
      {
        service: "fiberglass",
        re: /fibra/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar reparacion de fibra para mi embarcacion.",
      },
      {
        service: "teak",
        re: /cubierta-teka/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar servicio para cubierta de teca para mi embarcacion.",
      },
      {
        service: "syntheticDeck",
        re: /cubierta-sintetica/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar servicio para cubierta sintetica para mi embarcacion.",
      },
      {
        service: "graphics",
        re: /calcomanias/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar calcomanias y graficos para mi embarcacion.",
      },
      {
        service: "tint",
        re: /polarizado/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar polarizado nanoceramico para mi embarcacion.",
      },
      {
        service: "enginePainting",
        re: /engine-painting/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar pintura de motores para mi embarcacion.",
      },
      {
        service: "boatPainting",
        re: /boat-painting/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar pintura completa para mi embarcacion.",
      },
      {
        service: "bottomPaint",
        re: /bottom-paint/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar pintura de casco para mi embarcacion.",
      },
      {
        service: "interior",
        re: /interior-detailing/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar limpieza de cojineria y tapiceria para mi embarcacion.",
      },
      {
        service: "antiCorrosion",
        re: /anti-corrosion/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar tratamiento anticorrosivo para mi embarcacion.",
      },
      {
        service: "technicalWash",
        re: /technical-wash/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar lavado tecnico para mi embarcacion.",
      },
      {
        service: "electrical",
        re: /electrical-systems/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar electricidad o instalacion de aire acondicionado para mi yate.",
      },
      {
        service: "mechanics",
        re: /mecanica-naval/,
        msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar mecanica naval para mi yate o bote.",
      },
    ];
  let a = english
    ? getEnglishWhatsAppMessage("default")
    : "Hola, vi la página web de Colombia Boat Detailing y quiero cotizar un servicio para mi embarcación.";
  for (const n of t)
    if (n.re.test(e)) {
      a = english ? getEnglishWhatsAppMessage(n.service) : n.msg;
      break;
    }
  const n = `https://wa.me/573044301112?text=${encodeURIComponent(a)}`;
  document.querySelectorAll("a[href*='wa.me/573044301112']").forEach((e) => {
    const t = (e.textContent || "").trim().toLowerCase(),
      a = t.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      o =
        a.includes("agendar cita") ||
        a.includes("agendar") ||
        a.includes("cotizar ahora"),
      i = e.classList.contains("whatsapp-float"),
      r = "whatsapp" === t,
      l = !!e.closest("#navbar, #mobile-menu"),
      s = e.hasAttribute("data-whatsapp-layout");
    (o || i || r || l || s) && (e.href = n);
  });
}
function initClickableCards() {
  document.querySelectorAll(".service-card").forEach((e) => {
    if ("A" === e.tagName) return;
    const t = e.querySelector("a[href]");
    t &&
      ((e.style.cursor = "pointer"),
      e.addEventListener("click", (e) => {
        e.target.closest("a, button") || (window.location.href = t.href);
      }));
  });
}
function initClickableBlogPreviewCards() {
  document.querySelectorAll(".blog-preview-card").forEach((e) => {
    const t = e.querySelector("a[href]");
    t &&
      ((e.style.cursor = "pointer"),
      e.addEventListener("click", (e) => {
        e.target.closest("a, button") || (window.location.href = t.href);
      }));
  });
}
function initNavbarScroll() {
  const e = document.getElementById("navbar");
  e &&
    window.addEventListener(
      "scroll",
      () => {
        window.scrollY > 50
          ? (e.classList.add("glass-nav"), e.classList.add("shadow-lg"))
          : (e.classList.remove("glass-nav"), e.classList.remove("shadow-lg"));
      },
      { passive: !0 },
    );
}
function initMobileMenu() {
  const e = document.getElementById("mobile-menu-btn"),
    t = document.getElementById("close-menu-btn"),
    a = document.getElementById("mobile-menu"),
    n = document.querySelectorAll(".mobile-link");
  function o() {
    a.classList.contains("translate-x-full")
      ? (a.classList.remove("translate-x-full"),
        a.classList.remove("pointer-events-none"),
        e.setAttribute("aria-expanded", "true"),
        a.removeAttribute("aria-hidden"))
      : (a.classList.add("translate-x-full"),
        a.classList.add("pointer-events-none"),
        e.setAttribute("aria-expanded", "false"),
        a.setAttribute("aria-hidden", "true"));
  }
  e &&
    a &&
    (e.addEventListener("click", o),
    t?.addEventListener("click", o),
    n.forEach((e) => {
      e.addEventListener("click", o);
    }));
}
function initScrollAnimations() {
  const e = new IntersectionObserver(
    function (t) {
      t.forEach((t) => {
        t.isIntersecting &&
          (t.target.classList.add("visible"), e.unobserve(t.target));
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );
  (document
    .querySelectorAll(
      ".fade-in, .slide-in-left, .slide-in-right, .scale-up, .stagger-item",
    )
    .forEach((t) => {
      e.observe(t);
    }),
    document.querySelectorAll(".review-card").forEach((t) => {
      (e.observe(t), t.classList.add("fade-in"));
    }),
    document.querySelectorAll(".blog-card").forEach((t) => {
      (e.observe(t), t.classList.add("scale-up"));
    }),
    document.querySelectorAll(".service-card").forEach((t, a) => {
      (t.classList.add("fade-in"), e.observe(t));
    }));
}
function initDropdownMenu() {
  function e() {
    (document
      .querySelectorAll(".nav-dropdown-content.nav-open")
      .forEach((e) => {
        e.classList.remove("nav-open");
      }),
      document
        .querySelectorAll("[data-dropdown-toggle]")
        .forEach((e) => e.setAttribute("aria-expanded", "false")));
  }
  (document.querySelectorAll("[data-dropdown-toggle]").forEach((t) => {
    t.addEventListener("click", function (t) {
      (t.preventDefault(), t.stopPropagation());
      const a = this.getAttribute("data-dropdown-toggle"),
        n = document.getElementById(a);
      if (!n) return;
      const o = n.classList.contains("nav-open");
      (e(),
        o ||
          (n.classList.add("nav-open"),
          this.setAttribute("aria-expanded", "true")));
    });
  }),
    document.addEventListener("click", function (t) {
      t.target.closest(".nav-dropdown") || e();
    }),
    document.addEventListener("keydown", function (t) {
      "Escape" === t.key && e();
    }));
}
function initCounters() {
  const e = document.querySelectorAll("[data-count]"),
    t = new IntersectionObserver(
      function (e) {
        e.forEach((e) => {
          if (e.isIntersecting) {
            const a = e.target,
              n = parseInt(a.getAttribute("data-count")),
              o = 2e3,
              i = Date.now(),
              r = () => {
                const e = Date.now() - i,
                  t = Math.min(e / o, 1),
                  l = Math.floor(t * n);
                ((a.textContent = l), t < 1 && requestAnimationFrame(r));
              };
            (r(), t.unobserve(e.target));
          }
        });
      },
      { threshold: 0.5 },
    );
  e.forEach((e) => t.observe(e));
}
function initParallax() {
  const e = document.querySelectorAll(".parallax-bg");
  0 !== e.length &&
    window.addEventListener(
      "scroll",
      () => {
        e.forEach((e) => {
          const t = window.scrollY - e.offsetTop;
          e.style.backgroundPosition = `center ${0.5 * t}px`;
        });
      },
      { passive: !0 },
    );
}
function initFormValidation() {
  document.querySelectorAll("form").forEach((e) => {
    e.addEventListener("submit", function (e) {
      const t = this.querySelectorAll(
        "input[required], textarea[required], select[required]",
      );
      let a = !0;
      (t.forEach((e) => {
        e.value.trim()
          ? e.classList.remove("border-red-500")
          : ((a = !1), e.classList.add("border-red-500"));
      }),
        a ||
          (e.preventDefault(),
          alert("Por favor, complete todos los campos requeridos.")));
    });
  });
}
function updateActiveLink() {
  const e = document.querySelectorAll("section[id]"),
    t = document.querySelectorAll('nav a[href^="#"]');
  let a = "";
  (e.forEach((e) => {
    const t = e.offsetTop;
    (e.clientHeight, scrollY >= t - 200 && (a = e.getAttribute("id")));
  }),
    t.forEach((e) => {
      (e.classList.remove("border-b", "border-gold-400", "text-gold-400"),
        e.getAttribute("href") === `#${a}` &&
          e.classList.add("border-b", "border-gold-400", "text-gold-400"));
    }));
}
function runWhenIdle(callback, timeout) {
  if ("requestIdleCallback" in window)
    window.requestIdleCallback(callback, { timeout: timeout || 2500 });
  else setTimeout(callback, timeout || 1200);
}
function isHomePage() {
  const path = (window.location.pathname || "/").toLowerCase();
  return path === "/" || path === "/index.html";
}
function initDeferredEnhancements() {
  if (isHomePage()) return;
  runWhenIdle(function () {
    (initScrollAnimations(),
      initClickableCards(),
      initClickableBlogPreviewCards(),
      initConversionTracking());
  }, 1800);
}
(Object.keys(I18N_PAIRS).forEach(function (e) {
  I18N_PAIRS_REV[I18N_PAIRS[e]] = e;
}),
  document.addEventListener("DOMContentLoaded", function () {
    if (isHomePage()) {
      (initNavbarScroll(),
        initMobileMenu(),
        initDropdownMenu(),
        initWhatsAppMessages(),
        initLangSwitcher(),
        runWhenIdle(function () {
          (initFormValidation(), initCounters(), initCarousel(), initFAQ());
        }, 2800));
      return;
    }
    (initGlobalLayout(),
      normalizeBlogArticleReadability(),
      initNavbarScroll(),
      initMobileMenu(),
      initDropdownMenu(),
      initWhatsAppMessages(),
      initFooterConsistency(),
      normalizeFloatingWhatsApp(),
      centerBlogArticleHeader(),
      initLangSwitcher(),
      initDeferredEnhancements());
  }),
  document.querySelectorAll('a[href^="#"]').forEach((e) => {
    e.addEventListener("click", function (e) {
      const t = this.getAttribute("href");
      "#" !== t &&
        document.querySelector(t) &&
        (e.preventDefault(),
        document
          .querySelector(t)
          .scrollIntoView({ behavior: "smooth", block: "start" }));
    });
  }),
  document.addEventListener("DOMContentLoaded", function () {
    if (!isHomePage()) (initParallax(), initFormValidation());
  }),
  document.querySelector('nav a[href^="#"]') &&
    window.addEventListener("scroll", updateActiveLink, { passive: !0 }));
const styleSheet = document.createElement("style");
function initCarousel() {
  const e = document.querySelector(".carousel-container"),
    t = document.querySelectorAll(".carousel-item"),
    a = document.querySelectorAll(".carousel-dot");
  if (!e || 0 === t.length) return;
  let n,
    o = 0;
  function i(e) {
    (t.forEach((e) => e.classList.remove("active")),
      a.forEach((e) => e.classList.remove("active")),
      t[e].classList.add("active"),
      a[e].classList.add("active"));
  }
  function r() {
    ((o = (o + 1) % t.length), i(o));
  }
  function l() {
    n = setInterval(r, 5e3);
  }
  function s() {
    clearInterval(n);
  }
  (a.forEach((e, t) => {
    e.addEventListener("click", () => {
      ((o = t), i(o), s(), l());
    });
  }),
    e.addEventListener("mouseenter", s),
    e.addEventListener("mouseleave", l),
    i(0),
    l());
}
function initFAQ() {
  const e = document.querySelectorAll(".faq-item");
  e.forEach((t) => {
    const a = t.querySelector(".faq-toggle");
    a &&
      a.addEventListener("click", () => {
        (e.forEach((e) => {
          e !== t && e.classList.remove("open");
        }),
          t.classList.toggle("open"));
      });
  });
}
function initNavalParticles() {
  const e = document.getElementById("naval-particles");
  if (!e) return;
  const t = e.getContext("2d");
  let a,
    n = [];
  function o() {
    ((e.width = e.offsetWidth), (e.height = e.offsetHeight));
  }
  function i() {
    const t = ["bubble", "star", "sparkle"],
      a = t[Math.floor(Math.random() * t.length)];
    return {
      x: Math.random() * e.width,
      y: e.height + 20 * Math.random(),
      size: 3 * Math.random() + 0.5,
      speedY: -(0.6 * Math.random() + 0.2),
      speedX: 0.3 * (Math.random() - 0.5),
      opacity: 0.4 * Math.random() + 0.1,
      type: a,
      life: 1,
      decay: 0.002 * Math.random() + 0.001,
      hue: Math.random() > 0.7 ? "#d4af37" : "rgba(255,255,255,",
    };
  }
  function r() {
    for (t.clearRect(0, 0, e.width, e.height); n.length < 60; ) n.push(i());
    ((n = n.filter((e) => e.life > 0)),
      n.forEach((e) => {
        ((e.x += e.speedX),
          (e.y += e.speedY),
          (e.life -= e.decay),
          (function (e) {
            if (
              (t.save(),
              (t.globalAlpha = e.opacity * e.life),
              "bubble" === e.type)
            )
              ((t.strokeStyle =
                "#d4af37" === e.hue ? "#d4af37" : "rgba(255,255,255,0.5)"),
                (t.lineWidth = 0.8),
                t.beginPath(),
                t.arc(e.x, e.y, e.size, 0, 2 * Math.PI),
                t.stroke());
            else if ("star" === e.type)
              ((t.fillStyle =
                "#d4af37" === e.hue
                  ? "rgba(212,175,55,0.7)"
                  : "rgba(255,255,255,0.6)"),
                t.beginPath(),
                t.arc(e.x, e.y, 0.5 * e.size, 0, 2 * Math.PI),
                t.fill());
            else {
              ((t.fillStyle = "rgba(212,175,55,0.5)"), t.translate(e.x, e.y));
              for (let a = 0; a < 4; a++)
                (t.rotate(Math.PI / 2),
                  t.beginPath(),
                  t.moveTo(0, 0),
                  t.lineTo(0.4 * e.size, 1.8 * e.size),
                  t.lineTo(0, 1.2 * e.size),
                  t.lineTo(0.4 * -e.size, 1.8 * e.size),
                  t.closePath(),
                  t.fill());
            }
            t.restore();
          })(e));
      }),
      (a = requestAnimationFrame(r)));
  }
  (o(),
    window.addEventListener("resize", o),
    r(),
    document.addEventListener("visibilitychange", () => {
      document.hidden ? cancelAnimationFrame(a) : r();
    }));
}
function initWaveRipple() {
  document.querySelectorAll(".water-ripple").forEach((e) => {
    e.addEventListener("click", function (t) {
      const a = e.getBoundingClientRect(),
        n = document.createElement("span"),
        o = 2 * Math.max(a.width, a.height);
      if (
        ((n.style.cssText = `\n        position: absolute;\n        width: ${o}px;\n        height: ${o}px;\n        left: ${t.clientX - a.left - o / 2}px;\n        top: ${t.clientY - a.top - o / 2}px;\n        background: radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 60%);\n        border-radius: 50%;\n        pointer-events: none;\n        transform: scale(0);\n        animation: ripple-wave 0.8s ease-out forwards;\n        z-index: 0;\n      `),
        !document.getElementById("ripple-wave-style"))
      ) {
        const e = document.createElement("style");
        ((e.id = "ripple-wave-style"),
          (e.textContent =
            "@keyframes ripple-wave {\n          to { transform: scale(1); opacity: 0; }\n        }"),
          document.head.appendChild(e));
      }
      ((e.style.position = "relative"),
        (e.style.overflow = "hidden"),
        e.appendChild(n),
        setTimeout(() => n.remove(), 900));
    });
  });
}
function initCardTilt() {
  document.querySelectorAll(".service-card, .nautical-card").forEach((e) => {
    (e.addEventListener("mousemove", function (t) {
      const a = e.getBoundingClientRect(),
        n = t.clientX - a.left,
        o = t.clientY - a.top,
        i = a.width / 2,
        r = a.height / 2,
        l = ((o - r) / r) * -4,
        s = ((n - i) / i) * 4;
      e.style.transform = `perspective(800px) rotateX(${l}deg) rotateY(${s}deg) translateY(-6px)`;
    }),
      e.addEventListener("mouseleave", function () {
        e.style.transform = "";
      }));
  });
}
function initSonarPulse() {
  document.querySelectorAll(".stat-glow").forEach((e) => {
    const t = new IntersectionObserver(
      (e) => {
        e.forEach((e) => {
          e.isIntersecting &&
            ((e.target.style.animation = "float-slow 4s ease-in-out infinite"),
            t.unobserve(e.target));
        });
      },
      { threshold: 0.5 },
    );
    t.observe(e);
  });
}
function initConversionTracking() {
  if ("function" != typeof gtag) return;
  const e = document.title.split("|")[0].trim().slice(0, 60);
  (document.addEventListener("click", function (t) {
    const a = t.target.closest("a[href*='wa.me']");
    if (!a) return;
    const n = a.classList.contains("whatsapp-float");
    gtag("event", "contact", {
      method: "whatsapp",
      event_category: "contact",
      event_label: n ? "boton_flotante" : e,
    });
  }),
    document.addEventListener("click", function (t) {
      t.target.closest("a[href^='tel:']") &&
        gtag("event", "contact", {
          method: "phone",
          event_category: "contact",
          event_label: e,
        });
    }));
}
((styleSheet.innerText =
  "\n    @keyframes fadeIn {\n        from { opacity: 0; transform: translateY(20px); }\n        to { opacity: 1; transform: translateY(0); }\n    }\n    @keyframes slideInUp {\n        from { opacity: 0; transform: translateY(40px); }\n        to { opacity: 1; transform: translateY(0); }\n    }\n    @keyframes scaleIn {\n        from { opacity: 0; transform: scale(0.95); }\n        to { opacity: 1; transform: scale(1); }\n    }\n"),
  document.head.appendChild(styleSheet),
  document.addEventListener("DOMContentLoaded", () => {
    if (!isHomePage()) (initCarousel(), initFAQ());
  }),
  document.addEventListener("DOMContentLoaded", function () {
    if (!isHomePage()) initCounters();
  }),
  window.addEventListener("load", () => {
    const path = (window.location.pathname || "/").toLowerCase();
    if (path === "/" || path === "/index.html") return;
    runWhenIdle(() => {
      (window.innerWidth > 767 && initNavalParticles(),
        initWaveRipple(),
        window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
          initCardTilt(),
        initSonarPulse());
    }, 3000);
  }));
