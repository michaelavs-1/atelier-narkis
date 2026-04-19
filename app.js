/* ATELIER NARKIS — single-page luxury siddur site
   topbar scroll state, reveal-on-scroll, live hakdasha, active section nav, reserve form */

(function () {
  "use strict";

  // topbar scrolled state
  const topbar = document.querySelector(".topbar");
  if (topbar) {
    const onScroll = () => topbar.classList.toggle("scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // reveal-on-scroll
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            revealObs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => revealObs.observe(el));
  }

  // active section in top nav
  const navLinks = document.querySelectorAll(".nav-main.right a[data-nav]");
  const sectionMap = {};
  navLinks.forEach((a) => {
    const key = a.getAttribute("data-nav");
    const target = document.getElementById(key);
    if (target) sectionMap[key] = { link: a, el: target };
  });
  const keys = Object.keys(sectionMap);
  if (keys.length) {
    const navObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id;
            navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("data-nav") === id));
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    keys.forEach((k) => navObs.observe(sectionMap[k].el));
  }

  // live hakdasha preview
  const owner = document.getElementById("ownerInput");
  const ded = document.getElementById("dedInput");
  const ownerOut = document.getElementById("ownerOut");
  const dedOut = document.getElementById("dedOut");

  const defaultOwner = "שמך כאן";
  const defaultDed = "לַיְלָה וּבֹקֶר וְצָהֳרַיִם / אָשִׂיחָה וְאֶהֱמֶה וְיִשְׁמַע קוֹלִי";

  function sync() {
    if (ownerOut) {
      const v = (owner && owner.value.trim()) || "";
      ownerOut.textContent = v || defaultOwner;
      ownerOut.classList.toggle("placeholder", !v);
    }
    if (dedOut) {
      const v = (ded && ded.value.trim()) || "";
      dedOut.textContent = v || defaultDed;
    }
  }
  if (owner) owner.addEventListener("input", sync);
  if (ded) ded.addEventListener("input", sync);
  sync();

  // reservation form — fake submit
  const resForm = document.getElementById("reserveForm");
  if (resForm) {
    resForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = resForm.querySelector("button[type=submit]");
      if (btn) {
        btn.style.pointerEvents = "none";
        btn.textContent = "תודה — נחזור אליך";
      }
      const confirm = document.getElementById("reserveConfirm");
      if (confirm) {
        confirm.hidden = false;
        confirm.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      resForm.reset();
    });
  }
})();
