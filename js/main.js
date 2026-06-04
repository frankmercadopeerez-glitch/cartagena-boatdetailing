// =============================================
// MAIN INTERACTIONS SCRIPT
// =============================================

document.addEventListener("DOMContentLoaded", function () {
  initGlobalLayout();
  initNavbarScroll();
  initMobileMenu();
  initScrollAnimations();
  initDropdownMenu();
  initBackToTop();
  initClickableCards();
  initWhatsAppMessages();
  initFooterConsistency();
});

function getLayoutContext() {
  const pathname = (window.location.pathname || "").toLowerCase();
  const isBlogArticle = /\/blog\/[^/]+\/index\.html$/.test(pathname);
  const isBlogFolder = /\/blog\//.test(pathname);
  const isCotizacionesFolder = /\/cotizaciones\//.test(pathname);
  const isFacturasFolder = /\/facturas\//.test(pathname);
  const isUtilityPage = /business-card\.html|finanzas\.html/.test(pathname);
  const isLeadOnlyPage = /\/cotizar\.html$/.test(pathname);

  let prefix = "";
  if (isBlogArticle) prefix = "../../";
  else if (isBlogFolder || isCotizacionesFolder || isFacturasFolder) prefix = "../";

  return { pathname, prefix, isUtilityPage, isLeadOnlyPage };
}

function buildGlobalNavbar(prefix) {
  return `
<nav id="navbar" class="fixed w-full z-50 transition-all duration-300 py-2">
  <div class="container mx-auto px-6 flex justify-between items-center">
    <a href="${prefix}index.html" class="flex items-center gap-3 group">
      <i class="ph-fill ph-anchor text-3xl text-gold-400 group-hover:rotate-12 transition-transform"></i>
      <div class="flex flex-col">
        <span class="text-white text-lg tracking-[0.2em] font-light leading-none">COLOMBIA</span>
        <span class="text-white font-serif font-bold text-xl tracking-widest leading-none group-hover:text-gold-400 transition-colors">BOAT DETAILING</span>
      </div>
    </a>

    <div class="hidden md:flex items-center gap-10">
      <div class="nav-dropdown">
        <button
          data-dropdown-toggle="servicesDropdown"
          aria-haspopup="true"
          aria-expanded="false"
          aria-controls="servicesDropdown"
          class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all flex items-center gap-1"
        >
          Servicios
          <i class="ph-bold ph-caret-down text-xs" aria-hidden="true"></i>
        </button>

        <div class="nav-dropdown-content" id="servicesDropdown">
          <a href="${prefix}paint-polishing.html" class="nav-dropdown-link">Pulido de Gelcoat</a>
          <a href="${prefix}hull-cleaning.html" class="nav-dropdown-link">Limpieza de Casco</a>
          <a href="${prefix}ppf.html" class="nav-dropdown-link">PPF (Paint Protection)</a>
          <a href="${prefix}ceramic-coating.html" class="nav-dropdown-link">Ceramic Coating</a>
          <a href="${prefix}gelcoat.html" class="nav-dropdown-link">Restauración Gelcoat</a>
          <a href="${prefix}fibra.html" class="nav-dropdown-link">Reparación de Fibra</a>
          <a href="${prefix}cubierta-sintetica.html" class="nav-dropdown-link">Cubierta Sintética</a>
          <a href="${prefix}cubierta-teka.html" class="nav-dropdown-link">Cubierta de Teca</a>
          <a href="${prefix}calcomanias.html" class="nav-dropdown-link">Calcomanías &amp; Gráficos</a>
          <a href="${prefix}polarizado.html" class="nav-dropdown-link">Polarizado Nanocerámico</a>
          <button type="button" class="submenu-item nav-dropdown-link relative w-full text-left">
            Pintura <i class="ph ph-caret-right text-xs ml-1" aria-hidden="true"></i>
            <div class="submenu-flyout">
              <a href="${prefix}engine-painting.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm">Pintura de Motores</a>
              <a href="${prefix}boat-painting.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm border-t">Pintura Completa</a>
              <a href="${prefix}bottom-paint.html" class="block px-4 py-3 text-white hover:bg-white/10 hover:text-gold-400 transition text-sm border-t">Pintura de Casco</a>
            </div>
          </button>
          <a href="${prefix}interior-detailing.html" class="nav-dropdown-link">Interiores &amp; Tapicería</a>
          <a href="${prefix}anti-corrosion.html" class="nav-dropdown-link">Control Anticorrosivo</a>
          <a href="${prefix}technical-wash.html" class="nav-dropdown-link">Lavado Técnico</a>
        </div>
      </div>

      <a href="${prefix}about.html" class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all">Sobre Nosotros</a>
      <a href="${prefix}blog.html" class="text-white/90 hover:text-gold-400 text-sm tracking-widest uppercase hover:border-b hover:border-gold-400 transition-all">Blog</a>
      <a
        href="https://wa.me/573044301112?text=Hola%2C%20vi%20la%20p%C3%A1gina%20web%20de%20Colombia%20Boat%20Detailing%20y%20quiero%20cotizar%20un%20servicio%20para%20mi%20embarcaci%C3%B3n"
        target="_blank"
        rel="noopener noreferrer"
        class="bg-gold-400 hover:bg-gold-500 text-navy-900 px-8 py-3 rounded-sm font-bold text-xs tracking-widest uppercase transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
      >Agendar Cita</a>
    </div>

    <button id="mobile-menu-btn" class="md:hidden text-white focus:outline-none" aria-label="Abrir menú de navegación" aria-expanded="false" aria-controls="mobile-menu">
      <i class="ph ph-list text-3xl" aria-hidden="true"></i>
    </button>
  </div>
</nav>`;
}

function buildGlobalMobileMenu(prefix) {
  return `
<div
  id="mobile-menu"
  role="dialog"
  aria-modal="true"
  aria-label="Menú de navegación"
  aria-hidden="true"
  class="fixed inset-0 bg-navy-900 z-[9999] transform translate-x-full transition-transform duration-300 flex flex-col items-center justify-center gap-8 pointer-events-none"
>
  <button id="close-menu-btn" class="absolute top-6 right-6 text-white/50 hover:text-white" aria-label="Cerrar menú de navegación">
    <i class="ph ph-x text-3xl" aria-hidden="true"></i>
  </button>
  <a href="${prefix}services.html" class="mobile-link text-2xl font-serif text-white hover:text-gold-400">Servicios</a>
  <a href="${prefix}about.html" class="mobile-link text-2xl font-serif text-white hover:text-gold-400">Sobre Nosotros</a>
  <a href="${prefix}blog.html" class="mobile-link text-2xl font-serif text-white hover:text-gold-400">Blog</a>
  <a
    href="https://wa.me/573044301112?text=Hola%2C%20vi%20la%20p%C3%A1gina%20web%20de%20Colombia%20Boat%20Detailing%20y%20quiero%20cotizar%20un%20servicio%20para%20mi%20embarcaci%C3%B3n"
    target="_blank"
    rel="noopener noreferrer"
    class="mobile-link text-2xl font-serif text-gold-400 border-b border-gold-400 pb-1"
  >Agendar Cita</a>
</div>`;
}

function buildGlobalFooter(prefix) {
  return `
<footer class="bg-navy-900 text-slate-300 py-6 md:py-10">
  <div class="container mx-auto px-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6 items-start">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <i class="ph-fill ph-anchor text-3xl text-gold-400"></i>
          <div>
            <p class="text-white text-lg tracking-[0.2em] font-light leading-none">COLOMBIA</p>
            <p class="text-white font-serif font-bold text-xl tracking-widest leading-none">BOAT DETAILING</p>
          </div>
        </div>
        <p class="text-xs text-slate-300 font-light">Estándares Internacionales de Excelencia Marina desde 2024.</p>
      </div>

      <div>
        <h4 class="text-sm font-bold tracking-widest uppercase mb-4">NAVEGACIÓN</h4>
        <ul class="space-y-2 text-xs font-light">
          <li><a href="${prefix}index.html" class="text-slate-300 hover:text-gold-400 transition-colors">Inicio</a></li>
          <li><a href="${prefix}about.html" class="text-slate-300 hover:text-gold-400 transition-colors">Sobre Nosotros</a></li>
          <li><a href="${prefix}blog.html" class="text-slate-300 hover:text-gold-400 transition-colors">Blog</a></li>
          <li><a href="${prefix}services.html" class="text-slate-300 hover:text-gold-400 transition-colors">Todos los Servicios</a></li>
          <li><a href="${prefix}contacto.html" class="text-gold-400 hover:text-white transition-colors font-semibold">Contacto</a></li>
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-bold tracking-widest uppercase mb-4">CONTACTO</h4>
        <p class="text-xs font-light mb-2"><a href="tel:+573044301112" class="hover:text-gold-400 transition">+57 304 430 1112</a></p>
        <p class="text-xs font-light mb-2">Cartagena de Indias</p>
        <p class="text-xs font-light">Cartagena de Indias, Colombia</p>
      </div>
    </div>

    <div class="border-t border-slate-700 pt-6 text-center text-xs font-light text-slate-500">
      <p>&copy; 2024-2026 Colombia Boat Detailing &middot; Cartagena de Indias, Colombia &middot; <a href="${prefix}sitemap.xml" class="hover:text-gold-400 transition">Sitemap</a></p>
    </div>
  </div>
</footer>`;
}

function initGlobalLayout() {
  const { prefix, isUtilityPage, isLeadOnlyPage } = getLayoutContext();
  if (isUtilityPage || isLeadOnlyPage) return;

  const navHtml = buildGlobalNavbar(prefix);
  const mobileHtml = buildGlobalMobileMenu(prefix);
  const footerHtml = buildGlobalFooter(prefix);

  const nav = document.querySelector("nav#navbar") || document.querySelector("body > nav") || document.querySelector("nav");
  if (nav) nav.outerHTML = navHtml;
  else document.body.insertAdjacentHTML("afterbegin", navHtml);

  const existingMobile = document.getElementById("mobile-menu");
  if (existingMobile) existingMobile.outerHTML = mobileHtml;
  else document.getElementById("navbar")?.insertAdjacentHTML("afterend", mobileHtml);

  const footer = document.querySelector("footer");
  if (footer) footer.outerHTML = footerHtml;
  else document.body.insertAdjacentHTML("beforeend", footerHtml);
}

function initFooterConsistency() {
  // Keep the page edge navy to avoid any white strip under the footer.
  document.documentElement.style.backgroundColor = "#001f3f";
  document.body.style.backgroundColor = "#001f3f";

  document.querySelectorAll("footer").forEach((footer) => {
    footer
      .querySelectorAll("h4, .text-navy-900, .text-navy-800")
      .forEach((el) => {
        el.style.setProperty("color", "#e2e8f0", "important");
      });

    footer
      .querySelectorAll(".text-slate-500, .text-slate-600, .text-slate-700")
      .forEach((el) => {
        el.style.setProperty("color", "#cbd5e1", "important");
      });

    // Remove any WhatsApp CTA inside footer (requested global UI rule).
    footer
      .querySelectorAll(
        "a[href*='wa.me'], a[href*='api.whatsapp.com'], a[href*='whatsapp.com/send']",
      )
      .forEach((a) => a.remove());
  });
}

function initWhatsAppMessages() {
  const base =
    "Hola, vi la página web de Colombia Boat Detailing y quiero cotizar un servicio para mi embarcación.";

  const page = (window.location.pathname.split("/").pop() || "").toLowerCase();

  const serviceMap = [
    {
      re: /hull-cleaning|limpieza-casco/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar limpieza de casco para mi embarcacion.",
    },
    {
      re: /paint-polishing|pulido-gelcoat/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar pulido de gelcoat para mi embarcacion.",
    },
    {
      re: /ceramic-coating/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar ceramic coating para mi embarcacion.",
    },
    {
      re: /ppf/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar PPF para mi embarcacion.",
    },
    {
      re: /gelcoat/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar restauracion de gelcoat para mi embarcacion.",
    },
    {
      re: /fibra/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar reparacion de fibra para mi embarcacion.",
    },
    {
      re: /cubierta-teka/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar servicio para cubierta de teca para mi embarcacion.",
    },
    {
      re: /cubierta-sintetica/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar servicio para cubierta sintetica para mi embarcacion.",
    },
    {
      re: /calcomanias/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar calcomanias y graficos para mi embarcacion.",
    },
    {
      re: /polarizado/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar polarizado nanoceramico para mi embarcacion.",
    },
    {
      re: /engine-painting/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar pintura de motores para mi embarcacion.",
    },
    {
      re: /boat-painting/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar pintura completa para mi embarcacion.",
    },
    {
      re: /bottom-paint/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar pintura de casco para mi embarcacion.",
    },
    {
      re: /interior-detailing/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar detailing de interiores para mi embarcacion.",
    },
    {
      re: /anti-corrosion/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar tratamiento anticorrosivo para mi embarcacion.",
    },
    {
      re: /technical-wash/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar lavado tecnico para mi embarcacion.",
    },
    {
      re: /electrical-systems/,
      msg: "Hola, vi la pagina web de Colombia Boat Detailing y quiero cotizar servicios electricos nauticos para mi embarcacion.",
    },
  ];

  let message = base;
  for (const item of serviceMap) {
    if (item.re.test(page)) {
      message = item.msg;
      break;
    }
  }

  const waHref = `https://wa.me/573044301112?text=${encodeURIComponent(message)}`;

  document.querySelectorAll("a[href*='wa.me/573044301112']").forEach((a) => {
    const txt = (a.textContent || "").trim().toLowerCase();
    const normalized = txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isAgendar =
      normalized.includes("agendar cita") ||
      normalized.includes("agendar") ||
      normalized.includes("cotizar ahora");
    const isFloat = a.classList.contains("whatsapp-float");
    const isFooterWhatsApp = txt === "whatsapp";
    const isNavCta = !!a.closest("#navbar, #mobile-menu");

    if (isAgendar || isFloat || isFooterWhatsApp || isNavCta) {
      a.href = waHref;
    }
  });
}

// =============================================
// CLICKABLE SERVICE CARDS (whole card is a link)
// =============================================
function initClickableCards() {
  document.querySelectorAll(".service-card").forEach((card) => {
    if (card.tagName === "A") return; // already a link
    const link = card.querySelector("a[href]");
    if (!link) return;
    card.style.cursor = "pointer";
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return; // let real links/buttons work
      window.location.href = link.href;
    });
  });
}

// =============================================
// BACK TO TOP BUTTON
// =============================================
function initBackToTop() {
  const btn = document.createElement("button");
  btn.id = "back-to-top";
  btn.setAttribute("aria-label", "Volver arriba");
  btn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,149.66a8,8,0,0,1-11.32,0L128,75.31,53.66,149.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,149.66Z"/></svg>';
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// =============================================
// NAVBAR SCROLL EFFECT
// =============================================
function initNavbarScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("glass-nav");
      navbar.classList.add("shadow-lg");
    } else {
      navbar.classList.remove("glass-nav");
      navbar.classList.remove("shadow-lg");
    }
  });
}

// =============================================
// MOBILE MENU LOGIC
// =============================================
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const closeMenuBtn = document.getElementById("close-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-link");

  if (!mobileMenuBtn || !mobileMenu) return;

  function toggleMenu() {
    const isClosed = mobileMenu.classList.contains("translate-x-full");
    if (isClosed) {
      // Abrir menú
      mobileMenu.classList.remove("translate-x-full");
      mobileMenu.classList.remove("pointer-events-none");
      mobileMenuBtn.setAttribute("aria-expanded", "true");
      mobileMenu.removeAttribute("aria-hidden");
    } else {
      // Cerrar menú
      mobileMenu.classList.add("translate-x-full");
      mobileMenu.classList.add("pointer-events-none");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
    }
  }

  mobileMenuBtn.addEventListener("click", toggleMenu);
  closeMenuBtn?.addEventListener("click", toggleMenu);

  mobileLinks.forEach((link) => {
    link.addEventListener("click", toggleMenu);
  });
}

// =============================================
// SCROLL ANIMATIONS (Intersection Observer)
// =============================================
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        // Unobserve after animation to improve performance
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all animated elements
  document
    .querySelectorAll(
      ".fade-in, .slide-in-left, .slide-in-right, .scale-up, .stagger-item",
    )
    .forEach((el) => {
      observer.observe(el);
    });

  // Observe review cards
  document.querySelectorAll(".review-card").forEach((card) => {
    observer.observe(card);
    card.classList.add("fade-in");
  });

  // Observe blog cards
  document.querySelectorAll(".blog-card").forEach((card) => {
    observer.observe(card);
    card.classList.add("scale-up");
  });

  // Observe service cards for stagger effect
  const serviceCards = document.querySelectorAll(".service-card");
  serviceCards.forEach((card, index) => {
    card.classList.add("fade-in");
    observer.observe(card);
  });
}

// =============================================
// DROPDOWN MENU (Services)
// =============================================
function initDropdownMenu() {
  const isTouchDevice = () => window.matchMedia("(hover: none)").matches;

  const dropdownToggles = document.querySelectorAll("[data-dropdown-toggle]");

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      if (!isTouchDevice()) return; // en desktop el hover CSS lo maneja
      e.preventDefault();
      e.stopPropagation();
      const targetId = this.getAttribute("data-dropdown-toggle");
      const dropdownMenu = document.getElementById(targetId);
      if (!dropdownMenu) return;

      const isOpen = dropdownMenu.classList.contains("nav-open");
      // Cerrar todos
      document
        .querySelectorAll(".nav-dropdown-content.nav-open")
        .forEach((m) => {
          m.classList.remove("nav-open");
        });
      // Abrir este si estaba cerrado
      if (!isOpen) dropdownMenu.classList.add("nav-open");
    });
  });

  // Cerrar al tocar fuera
  document.addEventListener("click", function (e) {
    if (!isTouchDevice()) return;
    if (!e.target.closest(".nav-dropdown")) {
      document
        .querySelectorAll(".nav-dropdown-content.nav-open")
        .forEach((m) => {
          m.classList.remove("nav-open");
        });
    }
  });
}

// =============================================
// COUNTER ANIMATION
// =============================================
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observerOptions = {
    threshold: 0.5,
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute("data-count"));
        const duration = 2000; // 2 seconds
        const start = Date.now();

        const updateCounter = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.floor(progress * target);
          counter.textContent = current;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          }
        };

        updateCounter();
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counters.forEach((counter) => observer.observe(counter));
}

// =============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// =============================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#" && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// =============================================
// PARALLAX SCROLL EFFECT
// =============================================
function initParallax() {
  const parallaxElements = document.querySelectorAll(".parallax-bg");
  if (parallaxElements.length === 0) return;

  window.addEventListener("scroll", () => {
    parallaxElements.forEach((element) => {
      const scrollPosition = window.scrollY;
      const elementOffset = element.offsetTop;
      const distance = scrollPosition - elementOffset;
      element.style.backgroundPosition = `center ${distance * 0.5}px`;
    });
  });
}

document.addEventListener("DOMContentLoaded", initParallax);

// =============================================
// FORM VALIDATION
// =============================================
function initFormValidation() {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      const inputs = this.querySelectorAll(
        "input[required], textarea[required], select[required]",
      );
      let isValid = true;

      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add("border-red-500");
        } else {
          input.classList.remove("border-red-500");
        }
      });

      if (!isValid) {
        e.preventDefault();
        alert("Por favor, complete todos los campos requeridos.");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", initFormValidation);

// =============================================
// ACTIVE LINK HIGHLIGHTING
// =============================================
function updateActiveLink() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("border-b", "border-gold-400", "text-gold-400");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("border-b", "border-gold-400", "text-gold-400");
    }
  });
}

window.addEventListener("scroll", updateActiveLink);

// =============================================
// ADD KEYSTROKE ANIMATION
// =============================================
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInUp {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
`;
document.head.appendChild(styleSheet);

// =============================================
// CAROUSEL INFINITE (Reseñas)
// =============================================
function initCarousel() {
  const carouselContainer = document.querySelector(".carousel-container");
  const carouselItems = document.querySelectorAll(".carousel-item");
  const carouselDots = document.querySelectorAll(".carousel-dot");

  if (!carouselContainer || carouselItems.length === 0) return;

  let currentIndex = 0;
  let autoPlayInterval;

  function showSlide(index) {
    carouselItems.forEach((item) => item.classList.remove("active"));
    carouselDots.forEach((dot) => dot.classList.remove("active"));

    carouselItems[index].classList.add("active");
    carouselDots[index].classList.add("active");
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % carouselItems.length;
    showSlide(currentIndex);
  }

  function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 5000);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  // Click on dots
  carouselDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentIndex = index;
      showSlide(currentIndex);
      stopAutoPlay();
      startAutoPlay();
    });
  });

  // Pause on hover
  carouselContainer.addEventListener("mouseenter", stopAutoPlay);
  carouselContainer.addEventListener("mouseleave", startAutoPlay);

  showSlide(0);
  startAutoPlay();
}

// =============================================
// FAQ ACCORDION
// =============================================
function initFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const toggle = item.querySelector(".faq-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      // Close all other items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("open");
        }
      });

      // Toggle current item
      item.classList.toggle("open");
    });
  });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
  initFAQ();
});

// Initialize counters when page loads
initCounters();

// =============================================
// NAVAL PARTICLES — Ocean Atmosphere Effect
// =============================================
function initNavalParticles() {
  const canvas = document.getElementById("naval-particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let animationId;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  // Particle types: bubble, star, sparkle
  function createParticle() {
    const types = ["bubble", "star", "sparkle"];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 20,
      size: Math.random() * 3 + 0.5,
      speedY: -(Math.random() * 0.6 + 0.2),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.1,
      type,
      life: 1,
      decay: Math.random() * 0.002 + 0.001,
      hue: Math.random() > 0.7 ? "#d4af37" : "rgba(255,255,255,",
    };
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.opacity * p.life;

    if (p.type === "bubble") {
      ctx.strokeStyle =
        p.hue === "#d4af37" ? "#d4af37" : "rgba(255,255,255,0.5)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === "star") {
      ctx.fillStyle =
        p.hue === "#d4af37" ? "rgba(212,175,55,0.7)" : "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // sparkle — 4-point star
      ctx.fillStyle = "rgba(212,175,55,0.5)";
      ctx.translate(p.x, p.y);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(p.size * 0.4, p.size * 1.8);
        ctx.lineTo(0, p.size * 1.2);
        ctx.lineTo(-p.size * 0.4, p.size * 1.8);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Maintain particle count
    while (particles.length < 60) {
      particles.push(createParticle());
    }

    particles = particles.filter((p) => p.life > 0);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.life -= p.decay;
      drawParticle(p);
    });

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Pause when not visible for performance
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });
}

// =============================================
// WAVE CURSOR RIPPLE
// =============================================
function initWaveRipple() {
  document.querySelectorAll(".water-ripple").forEach((el) => {
    el.addEventListener("click", function (e) {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        background: radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 60%);
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        animation: ripple-wave 0.8s ease-out forwards;
        z-index: 0;
      `;

      // Inject keyframe if not exists
      if (!document.getElementById("ripple-wave-style")) {
        const style = document.createElement("style");
        style.id = "ripple-wave-style";
        style.textContent = `@keyframes ripple-wave {
          to { transform: scale(1); opacity: 0; }
        }`;
        document.head.appendChild(style);
      }

      el.style.position = "relative";
      el.style.overflow = "hidden";
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 900);
    });
  });
}

// =============================================
// TILT EFFECT ON CARDS (naval "rocking" feel)
// =============================================
function initCardTilt() {
  const cards = document.querySelectorAll(".service-card, .nautical-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener("mouseleave", function () {
      card.style.transform = "";
    });
  });
}

// =============================================
// SONAR PULSE on stat elements
// =============================================
function initSonarPulse() {
  const stats = document.querySelectorAll(".stat-glow");
  stats.forEach((stat) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animation = "float-slow 4s ease-in-out infinite";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(stat);
  });
}

// Initialize all naval effects
document.addEventListener("DOMContentLoaded", () => {
  initNavalParticles();
  initWaveRipple();
  initCardTilt();
  initSonarPulse();
});
