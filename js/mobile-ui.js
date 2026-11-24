/* Shared by the static home menu and the navigation rendered by main.js. */
function initPublicServiceMenu() {
  const trigger = document.querySelector("[data-dropdown-toggle]");
  const menu = trigger && document.getElementById(trigger.dataset.dropdownToggle);
  const group = trigger?.closest(".nav-dropdown");
  if (!menu || !group) return;

  let pinned = false;
  function display(open) {
    menu.classList.toggle("nav-open", open);
    // Keep CSS hover, keyboard focus and the announced disclosure state in sync.
    menu.style.visibility = open ? "visible" : "hidden";
    menu.inert = !open;
    trigger.setAttribute("aria-expanded", String(open));
    if (!open) pinned = false;
  }

  display(false);
  trigger.addEventListener("click", () => {
    pinned = !pinned;
    display(pinned);
  });
  group.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") display(true);
  });
  group.addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse" && !pinned && !menu.contains(document.activeElement)) display(false);
  });
  group.addEventListener("focusout", event => {
    if (!group.contains(event.relatedTarget)) display(false);
  });
  document.addEventListener("click", event => {
    if (!group.contains(event.target)) display(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || menu.inert) return;
    if (group.contains(document.activeElement)) trigger.focus({ preventScroll: true });
    display(false);
  });
}

function initPublicMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const opener = document.getElementById("mobile-menu-btn");
  const close = document.getElementById("close-menu-btn");
  if (!menu || !opener || !close) return;

  function setOpen(open, restoreFocus = true) {
    menu.classList.toggle("translate-x-full", !open);
    menu.classList.toggle("pointer-events-none", !open);
    opener.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("mobile-nav-open", open);
    if (!open && restoreFocus) opener.focus({ preventScroll: true });
    menu.inert = !open;
    menu.setAttribute("aria-hidden", String(!open));
    if (open) {
      menu.scrollTop = 0;
      close.focus({ preventScroll: true });
    }
  }

  setOpen(false, false);
  opener.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));
  menu.addEventListener("click", event => {
    if (event.target.closest("a[href]")) setOpen(false);
  });
  menu.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
    if (event.key !== "Tab") return;
    const controls = [...menu.querySelectorAll("a[href], button:enabled")]
      .filter(element => element.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", event => {
    if (event.matches && !menu.inert) setOpen(false, false);
  });
  window.addEventListener("pageshow", event => {
    if (event.persisted) setOpen(false, false);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const formSections = document.querySelectorAll("form, #success-msg, #contact-success");
  if (!formSections.length || !("IntersectionObserver" in window)) return;
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    document.body.classList.toggle("mobile-form-visible", visible.size > 0);
  });
  formSections.forEach(section => observer.observe(section));
});
