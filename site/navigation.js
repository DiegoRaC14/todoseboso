/* Chapter menu: native details and hash links work even if this script fails. */
"use strict";
(() => {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector("#nav-links");
  const toggle = document.querySelector("#menu-toggle");
  if (!header || !nav || !toggle) return;
  const groups = [...nav.querySelectorAll(".nav-group")];
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const closeGroups = (except) => groups.forEach((group) => {
    if (group !== except) group.open = false;
  });
  const closeMobile = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const opening = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(opening));
    nav.classList.toggle("open", opening);
    if (!opening) closeGroups();
  });
  groups.forEach((group) => group.addEventListener("toggle", () => {
    if (group.open) closeGroups(group);
  }));
  links.forEach((link) => link.addEventListener("click", () => {
    closeGroups();
    closeMobile();
  }));
  document.addEventListener("pointerdown", (event) => {
    if (!header.contains(event.target)) {
      closeGroups();
      closeMobile();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const wasOpen = nav.classList.contains("open");
    const groupWasOpen = groups.some((group) => group.open);
    closeGroups();
    closeMobile();
    if (wasOpen || groupWasOpen) toggle.focus();
  });
  const breakpoint = window.matchMedia("(min-width: 901px)");
  const onBreakpoint = () => { closeGroups(); closeMobile(); };
  if (breakpoint.addEventListener) breakpoint.addEventListener("change", onBreakpoint);
  else breakpoint.addListener(onBreakpoint);

  // Active-section highlighting never changes the location or page history.
  const tracked = links
    .filter((link) => link.hash && link.hash !== "#inicio" && link.hash !== "#recorrido")
    .map((link) => ({link, section: document.getElementById(decodeURIComponent(link.hash.slice(1)))}))
    .filter((entry) => entry.section);
  let queued = false;
  const refresh = () => {
    queued = false;
    let active = null;
    const threshold = header.offsetHeight + 55;
    let closestTop = -Infinity;
    for (const entry of tracked) {
      const top = entry.section.getBoundingClientRect().top;
      // Find the closest preceding section by on-page position, not menu order.
      if (top <= threshold && top > closestTop) {
        closestTop = top;
        active = entry;
      }
    }
    for (const link of links) link.removeAttribute("aria-current");
    groups.forEach((group) => group.classList.remove("is-active"));
    if (active) {
      active.link.setAttribute("aria-current", "location");
      const group = active.link.closest(".nav-group");
      if (group) group.classList.add("is-active");
    } else if (window.scrollY < 120) {
      const home = nav.querySelector(".nav-home");
      if (home) home.setAttribute("aria-current", "location");
    }
  };
  const requestRefresh = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(refresh);
  };
  window.addEventListener("scroll", requestRefresh, {passive:true});
  window.addEventListener("resize", requestRefresh, {passive:true});
  window.addEventListener("hashchange", requestRefresh);
  requestRefresh();
})();
