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

  // ---------- Ambient: snake-threads + letter-chase verses ----------
  // Delicate gold "snake" trails that grow along a path and then dissolve.
  // Paths are randomly chosen: free wander, hexagram star, rose (rosette),
  // spiral, or lemniscate (infinity). Each snake is traced as one continuous
  // thin thread — a stroke with only a short visible window (head + tail).
  // In parallel, Hebrew pesukim appear letter-by-letter with a rolling fade
  // (letter chasing letter).
  (function initAmbientBg() {
    const canvas = document.getElementById("thread-bg");
    const versesLayer = document.getElementById("verses-layer");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Mobile detection: smaller viewport or coarse pointer
    const isMobile = window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;

    let W = 0, H = 0;
    // Clamp DPR hard on mobile to avoid oversized canvas buffers
    let DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(W * DPR));
      canvas.height = Math.max(1, Math.floor(H * DPR));
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

    // =========================================================
    //   SNAKE-THREAD SYSTEM
    //   Each snake is a thin gold line that grows along a pre-
    //   computed path, then dissolves as its tail catches up.
    //   Paths are: wander (random smooth walk), star (hexagram),
    //   rose (rosette), spiral, infinity (lemniscate).
    // =========================================================

    // Path generators. Each returns an array of {x, y} points
    // approximately equidistant. We keep cumulative arc lengths for
    // head/tail math.
    function pathWander(x0, y0) {
      const pts = [];
      const N = 200 + Math.floor(Math.random() * 120);
      let x = x0, y = y0;
      let ang = Math.random() * Math.PI * 2;
      const seed1 = Math.random() * 1000;
      const seed2 = Math.random() * 1000;
      const step = 3 + Math.random() * 2;
      for (let i = 0; i <= N; i++) {
        pts.push({ x, y });
        // Smooth turning via sum of low-freq sines (imitates Perlin noise)
        const turn =
          Math.sin(i * 0.07 + seed1) * 0.11 +
          Math.sin(i * 0.031 + seed2) * 0.07 +
          Math.sin(i * 0.013 + seed1 * 0.3) * 0.04;
        ang += turn;
        x += Math.cos(ang) * step;
        y += Math.sin(ang) * step;
      }
      return pts;
    }

    function pathHexagram(cx, cy, r) {
      // Unicursal star outline: 12 vertices alternating outer (r) and inner
      // points — traces a Star-of-David silhouette as one continuous line
      const ri = r * 0.577; // √3/3 for a regular hexagram
      const verts = [];
      for (let i = 0; i <= 12; i++) {
        const rad = (i % 2 === 0) ? r : ri;
        const ang = -Math.PI / 2 + i * Math.PI / 6;
        verts.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad });
      }
      // Subdivide each segment so the snake traces it smoothly
      return subdivide(verts, 4);
    }

    function pathRose(cx, cy, r, k) {
      const petals = k || (Math.random() < 0.5 ? 3 : 4);
      const N = 320;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const rr = r * Math.abs(Math.cos(petals * t));
        pts.push({ x: cx + Math.cos(t) * rr, y: cy + Math.sin(t) * rr });
      }
      return pts;
    }

    function pathSpiral(cx, cy, r) {
      const turns = 2.5 + Math.random() * 1.5;
      const N = 260;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = t * turns * Math.PI * 2;
        const rr = t * r;
        pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
      }
      return pts;
    }

    function pathInfinity(cx, cy, r) {
      // Lemniscate of Gerono, traced twice so head+tail can meet cleanly
      const N = 260;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const d = 1 + Math.sin(t) * Math.sin(t);
        const x = r * Math.cos(t) / d;
        const y = r * Math.cos(t) * Math.sin(t) / d;
        pts.push({ x: cx + x, y: cy + y });
      }
      return pts;
    }

    // Linear-subdivide a polyline into denser points (every `step` px)
    function subdivide(verts, step) {
      const out = [];
      for (let i = 0; i < verts.length - 1; i++) {
        const a = verts[i], b = verts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        const n = Math.max(2, Math.ceil(len / step));
        for (let j = 0; j < n; j++) {
          const t = j / n;
          out.push({ x: a.x + dx * t, y: a.y + dy * t });
        }
      }
      out.push(verts[verts.length - 1]);
      return out;
    }

    // Pick a random corner/edge position that avoids the middle of the page
    function randEdgePos() {
      const margin = Math.min(80, W * 0.06);
      const edge = Math.random();
      if (edge < 0.3) return { x: margin + Math.random() * (W * 0.28), y: margin + Math.random() * (H - 2 * margin) };
      if (edge < 0.6) return { x: W - margin - Math.random() * (W * 0.28), y: margin + Math.random() * (H - 2 * margin) };
      if (edge < 0.8) return { x: margin + Math.random() * (W - 2 * margin), y: margin + Math.random() * (H * 0.2) };
      return { x: margin + Math.random() * (W - 2 * margin), y: H - margin - Math.random() * (H * 0.2) };
    }

    // Snake types & probabilities — mostly wandering, occasional shape
    function makeSnake() {
      const roll = Math.random();
      const pos = randEdgePos();
      let pts, type;
      const sizeMax = Math.min(W, H);
      const r = Math.max(40, Math.min(140, sizeMax * 0.12 + Math.random() * 50));

      if (roll < 0.55) {
        type = "wander";
        pts = pathWander(pos.x, pos.y);
      } else if (roll < 0.72) {
        type = "star";
        pts = pathHexagram(pos.x, pos.y, r);
      } else if (roll < 0.86) {
        type = "rose";
        pts = pathRose(pos.x, pos.y, r, Math.random() < 0.5 ? 3 : 4);
      } else if (roll < 0.95) {
        type = "spiral";
        pts = pathSpiral(pos.x, pos.y, r);
      } else {
        type = "infinity";
        pts = pathInfinity(pos.x, pos.y, r);
      }

      // Compute cumulative arc lengths
      const lens = [0];
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        lens.push(lens[i - 1] + Math.hypot(dx, dy));
      }
      const totalLen = lens[lens.length - 1];
      if (totalLen < 10) return null;

      return {
        pts, lens, totalLen, type,
        head: -20,
        // Speed & trail length for delicate feel — thin, slow, short tail
        speed: 60 + Math.random() * 90,
        trail: 70 + Math.random() * 120,
        color: GOLDS[Math.floor(Math.random() * GOLDS.length)],
        alpha: 0.45 + Math.random() * 0.35,
        width: 0.35 + Math.random() * 0.5
      };
    }

    // Update head; returns false when snake is fully gone
    function updateSnake(s, dt) {
      s.head += s.speed * dt;
      return (s.head - s.trail) < s.totalLen;
    }

    // Binary-search helper: find first index where lens[i] >= target
    function findIndex(lens, target) {
      let lo = 0, hi = lens.length - 1;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        if (lens[m] < target) lo = m + 1; else hi = m;
      }
      return lo;
    }

    function drawSnake(s) {
      const headDist = s.head;
      const tailDist = s.head - s.trail;
      if (headDist <= 0 || tailDist >= s.totalLen) return;
      const start = Math.max(0, tailDist);
      const end = Math.min(s.totalLen, headDist);
      if (end - start < 1) return;
      const iStart = Math.max(0, Math.min(s.pts.length - 1, findIndex(s.lens, start)));
      const iEnd   = Math.max(0, Math.min(s.pts.length - 1, findIndex(s.lens, end)));
      if (iEnd <= iStart) return;

      const total = iEnd - iStart;
      if (total < 4) {
        strokeSegment(s, iStart, iEnd, 1.0);
      } else {
        // Three-way taper: tail third faint, middle, head third brightest
        const seg = Math.floor(total / 3);
        const mid1 = iStart + seg;
        const mid2 = iStart + seg * 2;
        strokeSegment(s, iStart, mid1, 0.3);
        strokeSegment(s, mid1,   mid2, 0.75);
        strokeSegment(s, mid2,   iEnd, 1.0);
      }
    }

    function strokeSegment(s, i0, i1, alphaMul) {
      const lastIdx = s.pts.length - 1;
      i0 = Math.max(0, Math.min(lastIdx, i0));
      i1 = Math.max(0, Math.min(lastIdx, i1));
      if (i1 <= i0) return;
      const a = (s.alpha * alphaMul).toFixed(3);
      const p0 = s.pts[i0];
      if (!p0) return;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      for (let i = i0 + 1; i <= i1; i++) {
        const p = s.pts[i];
        if (!p) break;
        ctx.lineTo(p.x, p.y);
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = s.width;
      ctx.strokeStyle = s.color + a + ")";
      ctx.stroke();
      // Thin halo
      ctx.lineWidth = s.width * 2.4;
      ctx.strokeStyle = s.color + (s.alpha * alphaMul * 0.16).toFixed(3) + ")";
      ctx.stroke();
    }

    // Live snake pool
    const snakes = [];
    const MAX_SNAKES = reduced ? 3 : (isMobile ? 4 : 7);

    // =========================================================
    //   VERSES — letter chases letter
    //   Each char appears, then a fixed delay later fades out.
    //   A rolling window of ~N chars is visible at any moment,
    //   so the verse reads as a wave moving through the text.
    // =========================================================
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
      const text = VERSES[Math.floor(Math.random() * VERSES.length)];
      const vw = window.innerWidth, vh = window.innerHeight;
      // On mobile use smaller fonts
      const baseSize = isMobile ? 12 : 18;
      const variance = isMobile ? 6 : 14;
      const fontSize = baseSize + Math.random() * variance;
      const side = Math.random() < 0.5 ? "left" : "right";
      const topMin = isMobile ? 80 : 60;
      const topMax = Math.max(topMin + 40, vh - 120);
      const top = topMin + Math.random() * (topMax - topMin);
      const rotation = (Math.random() - 0.5) * (isMobile ? 5 : 10);
      const sideInset = isMobile ? 8 : 10;
      const sideRange = isMobile ? 30 : 80;

      const el = document.createElement("div");
      el.className = "verse-ghost";
      el.style.fontSize = fontSize + "px";
      el.style.top = top + "px";
      if (side === "left") {
        el.style.left = (sideInset + Math.random() * sideRange) + "px";
        el.style.right = "auto";
      } else {
        el.style.right = (sideInset + Math.random() * sideRange) + "px";
        el.style.left = "auto";
      }
      el.style.transform = "rotate(" + rotation.toFixed(2) + "deg)";

      // Wrap each char in a span. Convert spaces to NBSP so inline-block spans
      // don't collapse the whitespace into zero-width.
      const chars = Array.from(text);
      chars.forEach((c) => {
        const s = document.createElement("span");
        s.className = "char";
        s.textContent = (c === " ") ? "\u00A0" : c;
        el.appendChild(s);
      });
      versesLayer.appendChild(el);

      const charEls = el.querySelectorAll(".char");
      // Timing: each char appears at i*perChar and fades at i*perChar + visibleWindow
      const perChar = 110 + Math.random() * 50;      // ~110–160ms
      const visibleWindow = 1400 + Math.random() * 600; // ~1.4–2s
      const exitFade = 360;

      charEls.forEach((c, i) => {
        setTimeout(() => c.classList.add("shown"), i * perChar);
        setTimeout(() => c.classList.add("gone"),  i * perChar + visibleWindow);
      });

      const lastExit = (charEls.length - 1) * perChar + visibleWindow + exitFade;
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, lastExit + 200);
    }

    function scheduleNextVerse() {
      // Keep the flow dense — new verse begins before previous finishes
      const delay = reduced ? 6000 : (isMobile ? 3800 : 2800 + Math.random() * 2000);
      verseTimer = setTimeout(() => {
        spawnVerse();
        scheduleNextVerse();
      }, delay);
    }

    // ---- Main animation loop ----
    let rafId = null;
    let lastFrame = 0;
    let lastTick = performance.now();
    const TARGET_FPS = reduced ? 20 : (isMobile ? 30 : 40);
    const FRAME_MS = 1000 / TARGET_FPS;
    let lastSnakeSpawn = 0;
    const SNAKE_SPAWN_INTERVAL = reduced ? 3000 : (isMobile ? 1500 : 850);

    function frame(now) {
      if (now - lastFrame >= FRAME_MS) {
        const dt = Math.min(0.1, (now - lastTick) / 1000);
        lastTick = now;
        lastFrame = now;

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Spawn new snake periodically
        if (now - lastSnakeSpawn > SNAKE_SPAWN_INTERVAL && snakes.length < MAX_SNAKES) {
          const s = makeSnake();
          if (s) snakes.push(s);
          lastSnakeSpawn = now;
        }

        // Update & draw snakes
        for (let i = snakes.length - 1; i >= 0; i--) {
          const alive = updateSnake(snakes[i], dt);
          if (!alive) { snakes.splice(i, 1); continue; }
          drawSnake(snakes[i]);
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
        lastTick = performance.now();
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
