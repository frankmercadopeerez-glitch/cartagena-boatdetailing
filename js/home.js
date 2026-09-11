"use strict";

(function () {
  var initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    var navbar = document.getElementById("navbar");
    if (navbar) {
      function updateNavbar() {
        var active = window.scrollY > 50;
        navbar.classList.toggle("glass-nav", active);
        navbar.classList.toggle("shadow-lg", active);
      }
      updateNavbar();
      window.addEventListener("scroll", updateNavbar, { passive: true });
    }

    var english = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
    var menu = document.querySelector(".nav-dropdown-content");
    if (menu) {
      var services = english
        ? [
            ["paint-polishing-en.html", "Polishing & Gelcoat"],
            ["interior-detailing-en.html", "Upholstery & Interiors"],
            ["synthetic-decking-en.html", "EVA Decking"],
            ["boat-painting.html", "Marine Painting"],
            ["hull-cleaning-en.html", "Hull Cleaning"],
            ["electrical-systems-en.html", "Electrical, A/C & Mechanics"],
          ]
        : [
            ["paint-polishing.html", "Pulido y Gelcoat"],
            ["interior-detailing.html", "Cojinería e Interiores"],
            ["cubierta-sintetica.html", "Pisos EVA y Cubiertas"],
            ["boat-painting.html", "Pintura Naval"],
            ["hull-cleaning.html", "Limpieza de Casco"],
            ["electrical-systems.html", "Electricidad, Aire y Mecánica"],
          ];
      menu.innerHTML = services
        .map(function (service, index) {
          return (
            '<a href="' +
            service[0] +
            '" class="nav-dropdown-link' +
            (index === 0 ? " nav-dropdown-link--primary" : "") +
            '">' +
            (index === 0
              ? '<span class="nav-service-badge">★ ' +
                (english ? "Most requested" : "Más solicitado") +
                "</span>"
              : "") +
            "<span>" +
            service[1] +
            "</span></a>"
          );
        })
        .join("");
      menu.insertAdjacentHTML(
        "beforeend",
        '<a href="' +
          (english ? "services-en.html" : "services.html") +
          '" class="nav-dropdown-link nav-dropdown-link--all"><span>' +
          (english ? "View all services" : "Ver todos los servicios") +
          '</span><span aria-hidden="true">→</span></a>',
      );
    }

    if (typeof window.gtag === "function") {
      document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("a[href]");
        if (!link) return;
        var href = link.getAttribute("href") || "";
        var method = "";
        if (/wa\.me|api\.whatsapp\.com|whatsapp\.com\/send/i.test(href)) {
          method = "whatsapp";
        } else if (/^tel:/i.test(href)) {
          method = "phone";
        } else if (/^mailto:/i.test(href)) {
          method = "email";
        }
        if (!method) return;
        window.gtag("event", "contact", {
          method: method,
          event_category: "contact",
          event_label:
            method === "whatsapp" && link.classList.contains("whatsapp-float")
              ? "boton_flotante"
              : document.title.split("|")[0].trim().slice(0, 60),
          page_path: window.location.pathname,
        });
      });
      document.documentElement.setAttribute("data-cbd-conversion-tracking", "");
    }

    document.querySelectorAll(".faq-item").forEach(function (item, index) {
      var button = item.querySelector(".faq-toggle");
      var answer = item.querySelector(".faq-answer");
      if (!button || !answer) return;
      if (!answer.id) answer.id = "faq-answer-" + (index + 1);
      button.setAttribute("aria-controls", answer.id);
      button.setAttribute("aria-expanded", String(item.classList.contains("open")));
    });

  function toggleMobileMenu() {
    var button = document.getElementById("mobile-menu-btn");
    var menu = document.getElementById("mobile-menu");
    if (!button || !menu) return;
    var opening = menu.classList.contains("translate-x-full");
    menu.classList.toggle("translate-x-full", !opening);
    menu.classList.toggle("pointer-events-none", !opening);
    button.setAttribute("aria-expanded", String(opening));
    menu.setAttribute("aria-hidden", String(!opening));
  }

  function closeDropdowns() {
    document
      .querySelectorAll(".nav-dropdown-content.nav-open")
      .forEach(function (menu) {
        menu.classList.remove("nav-open");
      });
    document.querySelectorAll("[data-dropdown-toggle]").forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (target.closest("#mobile-menu-btn, #close-menu-btn, #mobile-menu .mobile-link")) {
      toggleMobileMenu();
      return;
    }

    var dropdownButton = target.closest("[data-dropdown-toggle]");
    if (dropdownButton) {
      event.preventDefault();
      event.stopPropagation();
      var menu = document.getElementById(
        dropdownButton.getAttribute("data-dropdown-toggle"),
      );
      if (!menu) return;
      var opening = !menu.classList.contains("nav-open");
      closeDropdowns();
      if (opening) {
        menu.classList.add("nav-open");
        dropdownButton.setAttribute("aria-expanded", "true");
      }
      return;
    }
    if (!target.closest(".nav-dropdown")) closeDropdowns();

    var faqToggle = target.closest(".faq-toggle");
    if (faqToggle) {
      var item = faqToggle.closest(".faq-item");
      document.querySelectorAll(".faq-item.open").forEach(function (other) {
        if (other !== item) {
          other.classList.remove("open");
          var otherToggle = other.querySelector(".faq-toggle");
          if (otherToggle) otherToggle.setAttribute("aria-expanded", "false");
        }
      });
      if (item) {
        var isOpen = item.classList.toggle("open");
        faqToggle.setAttribute("aria-expanded", String(isOpen));
      }
    }

    var language = target.closest(".lang-switch a.lang-opt");
    if (language) {
      try {
        localStorage.setItem(
          "cbd_lang_pref",
          language.getAttribute("lang") === "en" ? "en" : "es",
        );
      } catch (_) {}
    }
  });

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    var valid = true;
    form
      .querySelectorAll("input[required], textarea[required], select[required]")
      .forEach(function (field) {
        var missing = !field.value.trim();
        field.classList.toggle("border-red-500", missing);
        if (missing) valid = false;
      });
    if (!valid) {
      event.preventDefault();
      window.alert("Por favor, complete todos los campos requeridos.");
    }
  });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
