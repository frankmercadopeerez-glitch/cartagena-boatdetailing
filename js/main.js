// =============================================
// MAIN INTERACTIONS SCRIPT
// =============================================

document.addEventListener("DOMContentLoaded", function () {
  initNavbarScroll();
  initMobileMenu();
  initScrollAnimations();
  initDropdownMenu();
});

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
      navbar.classList.remove("py-6");
      navbar.classList.add("py-4");
    } else {
      navbar.classList.remove("glass-nav");
      navbar.classList.remove("shadow-lg");
      navbar.classList.remove("py-4");
      navbar.classList.add("py-6");
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
  const navbar = document.getElementById("navbar");
  const mobileLinks = document.querySelectorAll(".mobile-link");

  if (!mobileMenuBtn || !mobileMenu) return;

  function toggleMenu() {
    const isClosed = mobileMenu.classList.contains("translate-x-full");
    if (isClosed) {
      mobileMenu.classList.remove("translate-x-full");
      if (navbar) navbar.classList.add("hidden");
    } else {
      mobileMenu.classList.add("translate-x-full");
      if (navbar) navbar.classList.remove("hidden");
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
  const dropdownToggles = document.querySelectorAll("[data-dropdown-toggle]");

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("data-dropdown-toggle");
      const dropdownMenu = document.getElementById(targetId);

      if (dropdownMenu) {
        // Close other dropdowns
        document.querySelectorAll(".dropdown-menu.active").forEach((menu) => {
          if (menu.id !== targetId) {
            menu.classList.remove("active");
          }
        });

        // Toggle this dropdown
        dropdownMenu.classList.toggle("active");
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (
      !e.target.closest("[data-dropdown-toggle]") &&
      !e.target.closest(".dropdown-menu")
    ) {
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        menu.classList.remove("active");
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
