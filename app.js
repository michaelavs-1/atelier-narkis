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

  // ---------- Ambient gold threads + ornamental figures + verses ----------
  // A single canvas draws two layers:
  //   1) Drifting sinusoidal gold threads (the "warp/weft")
  //   2) Ornamental thread-figures that fade in, breathe, and fade out
  //      (Magen David, rosette, spiral, scroll flourish)
  // In parallel, a DOM layer types out Hebrew pesukim and fades them.
  (function initAmbientBg() {
    const canvas = document.getElementById("thread-bg");
    const versesLayer = document.getElementById("verses-layer");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // ---- Palette ----
    const GOLDS = [
      "rgba(201,169,106,",   // primary
      "rgba(224,194,128,",   // light
      "rgba(255,220,160,",   // pale highlight
      "rgba(168,134,74,"     // antique
    ];

    // ---- Ambient drifting threads ----
    function makeThread(i, count) {
      const orient = Math.random() < 0.55 ? "h" : "v";
      const color = GOLDS[Math.floor(Math.random() * GOLDS.length)];
      // Bolder than before
      const alphaBase = 0.34 + Math.random() * 0.34;
      const widthPx = 0.7 + Math.random() * 1.3;
      const phase = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 18;
      const amp = 30 + Math.random() * 140;
      const wavelen = 220 + Math.random() * 420;
      const offset = (i / Math.max(count - 1, 1));
      return {
        orient, color, alphaBase, widthPx,
        phase, speed, amp, wavelen, offset,
        driftSpeed: 0.00008 + Math.random() * 0.00020,
        driftPhase: Math.random() * Math.PI * 2
      };
    }

    const THREAD_COUNT = reduced ? 10 : 22;
    let threads = Array.from({ length: THREAD_COUNT }, (_, i) => makeThread(i, THREAD_COUNT));

    window.addEventListener("resize", () => {
      threads = Array.from({ length: THREAD_COUNT }, (_, i) => makeThread(i, THREAD_COUNT));
    });

    function drawThread(th, now) {
      const elapsed = (now - t0) / 1000;
      const travel = elapsed * th.speed;
      const drift = Math.sin(now * th.driftSpeed + th.driftPhase) * 60;

      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = th.widthPx;

      if (th.orient === "h") {
        const baseY = th.offset * H + drift;
        for (let x = -80; x <= W + 80; x += 8) {
          const y = baseY + Math.sin((x + travel) / th.wavelen * Math.PI * 2 + th.phase) * th.amp;
          if (x === -80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      } else {
        const baseX = th.offset * W + drift;
        for (let y = -80; y <= H + 80; y += 8) {
          const x = baseX + Math.sin((y + travel) / th.wavelen * Math.PI * 2 + th.phase) * th.amp;
          if (y === -80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = th.color + th.alphaBase.toFixed(3) + ")";
      ctx.stroke();
      // Halo
      ctx.lineWidth = th.widthPx * 3.5;
      ctx.strokeStyle = th.color + (th.alphaBase * 0.2).toFixed(3) + ")";
      ctx.stroke();
    }

    // ---- Ornamental figures (thin-thread shapes) ----
    // Each figure: type, cx, cy, radius, rotation, color, born, lifetime.
    // Lifetime phases: fade-in (2s), hold (6–10s), fade-out (3s).
    const FIGURE_TYPES = ["magen", "rosette", "spiral", "flourish"];
    const figures = [];
    const MAX_FIGURES = reduced ? 1 : 3;

    function spawnFigure(now) {
      const type = FIGURE_TYPES[Math.floor(Math.random() * FIGURE_TYPES.length)];
      // Prefer edges/corners to not collide with main text
      const margin = 120;
      const edge = Math.random();
      let cx, cy;
      if (edge < 0.3) { // left strip
        cx = margin + Math.random() * (W * 0.28);
        cy = margin + Math.random() * (H - 2 * margin);
      } else if (edge < 0.6) { // right strip
        cx = W - margin - Math.random() * (W * 0.28);
        cy = margin + Math.random() * (H - 2 * margin);
      } else if (edge < 0.8) { // top strip
        cx = margin + Math.random() * (W - 2 * margin);
        cy = margin + Math.random() * (H * 0.22);
      } else { // bottom strip
        cx = margin + Math.random() * (W - 2 * margin);
        cy = H - margin - Math.random() * (H * 0.22);
      }
      const radius = 60 + Math.random() * 90;
      const rotation = Math.random() * Math.PI * 2;
      const color = GOLDS[Math.floor(Math.random() * GOLDS.length)];
      const lifetime = 11000 + Math.random() * 6000;
      figures.push({
        type, cx, cy, radius, rotation,
        rotSpeed: (Math.random() - 0.5) * 0.0003,
        color, born: now, lifetime,
        seed: Math.random()
      });
    }

    // Draw a Magen David (two overlapping triangles) as a single continuous path
    function drawMagen(f, alpha, now) {
      const r = f.radius;
      const rot = f.rotation + (now - f.born) * f.rotSpeed;
      ctx.save();
      ctx.translate(f.cx, f.cy);
      ctx.rotate(rot);
      ctx.lineWidth = 0.8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = f.color + (alpha * 0.95).toFixed(3) + ")";
      // Triangle 1 (pointing up)
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Triangle 2 (pointing down)
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) {
        const a = Math.PI / 2 + i * (Math.PI * 2 / 3);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Inner hexagon (subtle)
      ctx.beginPath();
      const ri = r * 0.5;
      for (let i = 0; i <= 6; i++) {
        const a = i * Math.PI / 3;
        const x = Math.cos(a) * ri, y = Math.sin(a) * ri;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = f.color + (alpha * 0.4).toFixed(3) + ")";
      ctx.stroke();
      ctx.restore();
    }

    // Draw a rosette: 8 curved petals radiating from center
    function drawRosette(f, alpha, now) {
      const r = f.radius;
      const rot = f.rotation + (now - f.born) * f.rotSpeed;
      ctx.save();
      ctx.translate(f.cx, f.cy);
      ctx.rotate(rot);
      ctx.lineWidth = 0.8;
      ctx.lineCap = "round";
      ctx.strokeStyle = f.color + (alpha * 0.9).toFixed(3) + ")";
      const petals = 8;
      for (let i = 0; i < petals; i++) {
        const a = i * Math.PI * 2 / petals;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Quadratic curve out and back — lobed petal
        const ox = Math.cos(a) * r;
        const oy = Math.sin(a) * r;
        const px = Math.cos(a + 0.5) * r * 0.6;
        const py = Math.sin(a + 0.5) * r * 0.6;
        const px2 = Math.cos(a - 0.5) * r * 0.6;
        const py2 = Math.sin(a - 0.5) * r * 0.6;
        ctx.quadraticCurveTo(px, py, ox, oy);
        ctx.quadraticCurveTo(px2, py2, 0, 0);
        ctx.stroke();
      }
      // Center circle
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
      ctx.strokeStyle = f.color + (alpha * 0.7).toFixed(3) + ")";
      ctx.stroke();
      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
      ctx.strokeStyle = f.color + (alpha * 0.35).toFixed(3) + ")";
      ctx.stroke();
      ctx.restore();
    }

    // Archimedean spiral, 3 turns
    function drawSpiral(f, alpha, now) {
      const r = f.radius;
      const rot = f.rotation + (now - f.born) * f.rotSpeed * 2;
      ctx.save();
      ctx.translate(f.cx, f.cy);
      ctx.rotate(rot);
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      ctx.strokeStyle = f.color + (alpha * 0.9).toFixed(3) + ")";
      ctx.beginPath();
      const turns = 3;
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = t * turns * Math.PI * 2;
        const rr = t * r;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Scroll flourish: S-curve with two decorative loops
    function drawFlourish(f, alpha, now) {
      const r = f.radius;
      const rot = f.rotation + (now - f.born) * f.rotSpeed;
      ctx.save();
      ctx.translate(f.cx, f.cy);
      ctx.rotate(rot);
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      ctx.strokeStyle = f.color + (alpha * 0.9).toFixed(3) + ")";
      // Main S-curve
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.bezierCurveTo(-r * 0.5, -r * 0.8, r * 0.5, r * 0.8, r, 0);
      ctx.stroke();
      // Left loop
      ctx.beginPath();
      ctx.arc(-r * 0.85, -r * 0.1, r * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      // Right loop
      ctx.beginPath();
      ctx.arc(r * 0.85, r * 0.1, r * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      // Accent crosses near loops
      ctx.strokeStyle = f.color + (alpha * 0.5).toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(-r * 0.85 - 4, -r * 0.1); ctx.lineTo(-r * 0.85 + 4, -r * 0.1);
      ctx.moveTo(-r * 0.85, -r * 0.1 - 4); ctx.lineTo(-r * 0.85, -r * 0.1 + 4);
      ctx.moveTo(r * 0.85 - 4, r * 0.1); ctx.lineTo(r * 0.85 + 4, r * 0.1);
      ctx.moveTo(r * 0.85, r * 0.1 - 4); ctx.lineTo(r * 0.85, r * 0.1 + 4);
      ctx.stroke();
      ctx.restore();
    }

    function drawFigure(f, now) {
      const age = now - f.born;
      if (age >= f.lifetime) return false;
      const fadeIn = 2000, fadeOut = 3000;
      let alpha = 1;
      if (age < fadeIn) alpha = age / fadeIn;
      else if (age > f.lifetime - fadeOut) alpha = (f.lifetime - age) / fadeOut;
      // Soft breathing
      alpha *= 0.75 + 0.25 * Math.sin((age / 1000) * 1.3);
      alpha = Math.max(0, Math.min(1, alpha));
      switch (f.type) {
        case "magen":    drawMagen(f, alpha, now); break;
        case "rosette":  drawRosette(f, alpha, now); break;
        case "spiral":   drawSpiral(f, alpha, now); break;
        case "flourish": drawFlourish(f, alpha, now); break;
      }
      return true;
    }

    // ---- Verses (typed-out Hebrew pesukim) ----
    const VERSES = [
      "שְׁמַע יִשְׂרָאֵל ה׳ אֱלֹהֵינוּ ה׳ אֶחָד",
      "מַה טֹּבוּ אֹהָלֶיךָ יַעֲקֹב",
      "שִׁוִּיתִי ה׳ לְנֶגְדִּי תָמִיד",
      "הוֹדוּ לַה׳ כִּי טוֹב",
      "בָּרְכִי נַפְשִׁי אֶת ה׳",
      "אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ",
      "פִּתְחוּ לִי שַׁעֲרֵי צֶדֶק",
      "מוֹדֶה אֲנִי לְפָנֶיךָ",
      "כִּי עִמְּךָ מְקוֹר חַיִּים",
      "שִׂים שָׁלוֹם טוֹבָה וּבְרָכָה",
      "יְהִי רָצוֹן מִלְּפָנֶיךָ",
      "מִזְמוֹר לְדָוִד ה׳ רֹעִי",
      "הָאֵל הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא"
    ];

    let verseTimer = null;
    function spawnVerse() {
      if (!versesLayer) return;
      // pick random verse
      const text = VERSES[Math.floor(Math.random() * VERSES.length)];
      // Random edge-ish position; avoid center band
      const vw = window.innerWidth, vh = window.innerHeight;
      const fontSize = 18 + Math.random() * 14; // 18–32px
      const side = Math.random() < 0.5 ? "left" : "right";
      const top = 60 + Math.random() * (vh - 200);
      const rotation = (Math.random() - 0.5) * 10; // -5..+5 deg

      const el = document.createElement("div");
      el.className = "verse-ghost";
      el.style.fontSize = fontSize + "px";
      el.style.top = top + "px";
      if (side === "left") {
        el.style.left = (10 + Math.random() * 80) + "px";
        el.style.right = "auto";
      } else {
        el.style.right = (10 + Math.random() * 80) + "px";
        el.style.left = "auto";
      }
      el.style.transform = "rotate(" + rotation.toFixed(2) + "deg)";

      // Wrap each char in a span so we can reveal them one by one
      const chars = Array.from(text);
      chars.forEach((c) => {
        const s = document.createElement("span");
        s.className = "char";
        s.textContent = c;
        el.appendChild(s);
      });

      versesLayer.appendChild(el);

      // Reveal chars sequentially (like handwriting)
      const perChar = 90 + Math.random() * 60;
      const charEls = el.querySelectorAll(".char");
      charEls.forEach((c, i) => {
        setTimeout(() => c.classList.add("shown"), i * perChar);
      });

      const writeDuration = charEls.length * perChar;
      const hold = 2600 + Math.random() * 1800;

      // Fade out
      setTimeout(() => { el.classList.add("fading"); }, writeDuration + hold);
      // Remove
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, writeDuration + hold + 1600);
    }

    function scheduleNextVerse() {
      const delay = reduced ? 8000 : (4200 + Math.random() * 3200);
      verseTimer = setTimeout(() => {
        spawnVerse();
        scheduleNextVerse();
      }, delay);
    }

    // ---- Main animation loop ----
    let t0 = performance.now();
    let rafId = null;
    let lastFrame = 0;
    const TARGET_FPS = reduced ? 18 : 40;
    const FRAME_MS = 1000 / TARGET_FPS;
    let lastFigureSpawn = 0;
    const FIGURE_INTERVAL = reduced ? 9000 : 4500;

    function frame(now) {
      if (now - lastFrame >= FRAME_MS) {
        lastFrame = now;
        ctx.clearRect(0, 0, W, H);

        // 1) Drifting threads
        for (let i = 0; i < threads.length; i++) drawThread(threads[i], now);

        // 2) Ornamental figures
        // Spawn new one periodically up to MAX_FIGURES
        if (now - lastFigureSpawn > FIGURE_INTERVAL && figures.length < MAX_FIGURES) {
          spawnFigure(now);
          lastFigureSpawn = now;
        }
        for (let i = figures.length - 1; i >= 0; i--) {
          const alive = drawFigure(figures[i], now);
          if (!alive) figures.splice(i, 1);
        }
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    // First verse ~2.5s after boot, then cycle
    setTimeout(() => { spawnVerse(); scheduleNextVerse(); }, 2400);

    // Pause when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        if (verseTimer) { clearTimeout(verseTimer); verseTimer = null; }
      } else if (!rafId) {
        t0 = performance.now();
        lastFrame = 0;
        rafId = requestAnimationFrame(frame);
        scheduleNextVerse();
      }
    });
  })();

  // ---------- Boot ----------
  initLang();
  recalcConfig();
})();
