/* ATELIER NARKIS — bilingual single-page site
   language toggle, topbar scroll state, reveal-on-scroll, active section nav, live hakdasha, reserve form */

(function () {
  "use strict";

  const LANG_KEY = "atelier_narkis_lang";
  const DEFAULT_LANG = "he";
  const SUPPORTED = ["he", "en"];

  const copy = {
    he: {
      title: "נרקיס · סידורי מהדורה · Atelier Narkis",
      defaultOwner: "שמך כאן",
      defaultDed: "לַיְלָה וּבֹקֶר וְצָהֳרַיִם / אָשִׂיחָה וְאֶהֱמֶה וְיִשְׁמַע קוֹלִי",
      btnSubmitted: "תודה — נחזור אליך"
    },
    en: {
      title: "Atelier Narkis · Limited Edition Siddur",
      defaultOwner: "Your name here",
      defaultDed: "Evening, morning and noon — I pray, I cry out, and He hears my voice.",
      btnSubmitted: "Thank you — we'll call"
    }
  };

  // ---------- Language toggle ----------
  function currentLang() {
    return document.documentElement.getAttribute("lang") || DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "he" ? "rtl" : "ltr");

    // update <title>
    if (copy[lang] && copy[lang].title) document.title = copy[lang].title;

    // update placeholders
    document.querySelectorAll("[data-ph-" + lang + "]").forEach((el) => {
      const val = el.getAttribute("data-ph-" + lang);
      if (val != null) el.setAttribute("placeholder", val);
    });

    // re-run live hakdasha sync (defaults change)
    sync();

    // ensure any already-observed reveals stay visible across toggles
    document.querySelectorAll(".reveal.visible").forEach((el) => el.classList.add("visible"));

    // trigger reveals for any newly-visible content currently in viewport
    setTimeout(() => {
      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("visible");
        }
      });
    }, 50);

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
  }

  function initLang() {
    const urlLang = new URLSearchParams(location.search).get("lang");
    let saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
    const initial = SUPPORTED.includes(urlLang) ? urlLang : (SUPPORTED.includes(saved) ? saved : DEFAULT_LANG);
    setLang(initial);
  }

  // wire up lang toggle link
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-lang-toggle]");
    if (!t) return;
    e.preventDefault();
    setLang(currentLang() === "he" ? "en" : "he");
  });

  // ---------- Topbar scrolled state + hero parallax ----------
  const topbar = document.querySelector(".topbar");
  const heroBg = document.querySelector(".hero-bg");
  let lastY = -1;
  let ticking = false;
  function onScrollRaf() {
    if (topbar) topbar.classList.toggle("scrolled", window.scrollY > 24);
    if (heroBg) {
      const y = Math.min(window.scrollY * 0.22, 140);
      heroBg.style.setProperty("--hero-py", y + "px");
    }
    ticking = false;
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScrollRaf);
  }
  onScrollRaf();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- Reveal-on-scroll ----------
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

  // ---------- Active section in top nav ----------
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

  // ---------- Modular configurator: tier + add-ons total ----------
  const tierNames = {
    basic: { he: "בסיסי", en: "Basic" },
    premium: { he: "פרימיום", en: "Premium" },
    atelier: { he: "אַטלייה", en: "Atelier" }
  };
  const totalOut = document.getElementById("totalOut");
  const tierMetaHe = document.getElementById("tierMetaHe");
  const tierMetaEn = document.getElementById("tierMetaEn");

  function formatPrice(n) {
    return n.toLocaleString("en-US");
  }

  function recalcConfig() {
    const tierInput = document.querySelector('input[name="tier"]:checked');
    if (!tierInput) return;
    const tierLabel = tierInput.closest(".tier");
    const base = parseInt(tierLabel.getAttribute("data-price"), 10) || 0;
    const tier = tierInput.value;

    const addons = document.querySelectorAll('.addon input[type="checkbox"]:checked');
    let addonSum = 0;
    addons.forEach((cb) => {
      const p = parseInt(cb.closest(".addon").getAttribute("data-price"), 10) || 0;
      addonSum += p;
    });

    const total = base + addonSum;
    if (totalOut) {
      totalOut.textContent = formatPrice(total);
      const bar = document.querySelector(".config-total");
      if (bar) {
        bar.classList.remove("pulse");
        // force reflow to restart animation
        void bar.offsetWidth;
        bar.classList.add("pulse");
      }
    }

    const n = addons.length;
    if (tierMetaHe) {
      const name = (tierNames[tier] && tierNames[tier].he) || "";
      tierMetaHe.textContent = n === 0 ? (name + " · ללא תוספות") : (name + " · " + n + " תוספות (+₪" + formatPrice(addonSum) + ")");
    }
    if (tierMetaEn) {
      const name = (tierNames[tier] && tierNames[tier].en) || "";
      tierMetaEn.textContent = n === 0 ? (name + " · no add-ons") : (name + " · " + n + " add-on" + (n > 1 ? "s" : "") + " (+₪" + formatPrice(addonSum) + ")");
    }
  }

  document.querySelectorAll('input[name="tier"]').forEach((el) => el.addEventListener("change", recalcConfig));
  document.querySelectorAll('.addon input[type="checkbox"]').forEach((el) => el.addEventListener("change", recalcConfig));

  // Keep sync() as no-op for backward compat from initLang path
  function sync() { /* configurator has no live-text preview; placeholders already handled */ }

  // ---------- Reservation form ----------
  const resForm = document.getElementById("reserveForm");
  if (resForm) {
    resForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const lang = currentLang();
      const c = copy[lang] || copy.he;
      const btn = resForm.querySelector("button[type=submit]");
      if (btn) {
        btn.style.pointerEvents = "none";
        btn.textContent = c.btnSubmitted;
      }
      const confirm = document.getElementById("reserveConfirm");
      if (confirm) {
        confirm.hidden = false;
        confirm.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      resForm.reset();
    });
  }

  // ---------- Boot ----------
  initLang();
  recalcConfig();
})();
