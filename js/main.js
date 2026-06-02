// =============================================
// MAIN INTERACTIONS SCRIPT
// =============================================

document.addEventListener("DOMContentLoaded", function () {
  initNavbarScroll();
  initMobileMenu();
  initScrollAnimations();
  initDropdownMenu();
  initBackToTop();
});

// =============================================
// BACK TO TOP BUTTON
// =============================================
function initBackToTop() {
  const btn = document.createElement("button");
  btn.id = "back-to-top";
  btn.setAttribute("aria-label", "Volver arriba");
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,149.66a8,8,0,0,1-11.32,0L128,75.31,53.66,149.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,149.66Z"/></svg>';
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
      document.querySelectorAll(".nav-dropdown-content.nav-open").forEach((m) => {
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
      document.querySelectorAll(".nav-dropdown-content.nav-open").forEach((m) => {
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
