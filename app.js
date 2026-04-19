/* ATELIER NARKIS — luxury siddur micro-site
   minimal interactivity: scroll effects, live hakdasha preview, reservation form */

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
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  // live hakdasha preview (on siddur.html)
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

  // reservation form (story.html) — fake submit
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
