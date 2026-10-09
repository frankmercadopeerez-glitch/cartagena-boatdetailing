(() => {
  const mobile = window.matchMedia("(max-width: 640px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const shells = document.querySelectorAll(".schedule-shell");

  if (!shells.length) return;

  const easeInOut = (value) => value < 0.5
    ? 2 * value * value
    : 1 - Math.pow(-2 * value + 2, 2) / 2;

  const nudge = (shell) => {
    if (!mobile.matches || shell.dataset.nudged === "true") return;

    const scroller = shell.querySelector(".schedule-wrap");
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll < 24) return;

    shell.dataset.nudged = "true";
    shell.classList.add("is-hinting");

    if (reducedMotion.matches) {
      shell.classList.add("reduced-motion");
      return;
    }

    let cancelled = false;
    const cancel = () => {
      cancelled = true;
      shell.classList.remove("is-hinting");
    };

    ["pointerdown", "touchstart", "wheel"].forEach((eventName) => {
      scroller.addEventListener(eventName, cancel, { once: true, passive: true });
    });

    const distance = Math.min(84, maxScroll);
    const duration = 1400;
    const startedAt = performance.now();

    const animate = (now) => {
      if (cancelled) return;
      const progress = Math.min((now - startedAt) / duration, 1);
      const direction = progress <= 0.5 ? progress * 2 : (1 - progress) * 2;
      scroller.scrollLeft = distance * easeInOut(direction);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        scroller.scrollLeft = 0;
        shell.classList.remove("is-hinting");
      }
    };

    requestAnimationFrame(animate);
  };

  if (!("IntersectionObserver" in window)) {
    shells.forEach(nudge);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      window.setTimeout(() => nudge(entry.target), 350);
    });
  }, { threshold: 0.35 });

  shells.forEach((shell) => observer.observe(shell));
})();
