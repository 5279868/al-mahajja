/* =========================================================
   المحجة البيضاء — interactions
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- Mobile navigation ---------- */
  const burger = $("#burger");
  const nav = $("#nav");
  const overlay = $("#navOverlay");

  const setNav = (open) => {
    nav.classList.toggle("is-open", open);
    overlay.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    document.body.classList.toggle("no-scroll", open);
  };

  burger.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  overlay.addEventListener("click", () => setNav(false));
  $$(".nav a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });
  window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => { if (e.matches) setNav(false); });

  /* ---------- Header shadow, back-to-top, active link ---------- */
  const header = $("#header");
  const toTop = $("#toTop");
  const sections = $$("main section[id]");
  const links = $$(".nav__link");

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 10);
    toTop.classList.toggle("is-visible", y > 600);

    let current = "home";
    sections.forEach((s) => { if (y + 140 >= s.offsetTop) current = s.id; });
    const activeLink = links.find((l) => l.getAttribute("href") === `#${current}`);
    links.forEach((l) => l.classList.toggle("is-active", l === activeLink));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Hero slider ---------- */
  const slider = $("#slider");
  const slides = $$(".slide", slider);
  const dotsWrap = $("#sliderDots");
  let index = 0;
  let timer;
  const DELAY = 5500;

  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.className = "slider__dot";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `الشريحة ${i + 1}`);
    b.addEventListener("click", () => { go(i); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  function go(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => {
      s.classList.toggle("is-active", n === index);
      s.setAttribute("aria-hidden", String(n !== index));
    });
    dots.forEach((d, n) => {
      d.classList.toggle("is-active", n === index);
      d.setAttribute("aria-selected", String(n === index));
    });
  }
  const next = () => go(index + 1);
  const prev = () => go(index - 1);
  const start = () => { timer = setInterval(next, DELAY); };
  const stop = () => clearInterval(timer);
  const restart = () => { stop(); start(); };

  // In RTL the "previous" arrow sits on the right
  $(".hero__arrow--prev").addEventListener("click", () => { prev(); restart(); });
  $(".hero__arrow--next").addEventListener("click", () => { next(); restart(); });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : restart()));

  // Swipe (touch + mouse drag), RTL-aware: swiping left → previous
  let startX = null;
  slider.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  slider.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    dx > 0 ? next() : prev();
    restart();
  });
  slider.addEventListener("pointercancel", () => { startX = null; });
  slider.addEventListener("dragstart", (e) => e.preventDefault());

  go(0);
  start();

  /* ---------- Reveal on scroll + counters ---------- */
  const fmt = new Intl.NumberFormat("en-US");
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const dur = 1600;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        const num = entry.target.querySelector("[data-count]");
        if (num) countUp(num);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-visible"));
    $$("[data-count]").forEach((el) => (el.textContent = fmt.format(el.dataset.count)));
  }

  /* ---------- Contact form validation ---------- */
  const form = $("#contactForm");
  const toast = $("#toast");
  const messages = {
    name: { valueMissing: "يرجى إدخال الاسم", tooShort: "الاسم قصير جداً" },
    email: { valueMissing: "يرجى إدخال البريد الإلكتروني", typeMismatch: "البريد الإلكتروني غير صحيح" },
    phone: { valueMissing: "يرجى إدخال رقم الهاتف", pattern: "رقم الهاتف غير صحيح" },
    message: { valueMissing: "يرجى كتابة رسالتك", tooShort: "الرسالة قصيرة جداً (10 أحرف على الأقل)" },
  };

  const validate = (input) => {
    const field = input.closest(".field");
    const err = $(".field__error", field);
    let msg = "";
    const v = input.validity;
    const m = messages[input.name] || {};

    if (v.valueMissing) msg = m.valueMissing;
    else if (v.typeMismatch) msg = m.typeMismatch;
    else if (v.tooShort) msg = m.tooShort;
    else if (input.name === "phone" && !/^\+?[\d\s-]{8,16}$/.test(input.value.trim())) msg = m.pattern;

    field.classList.toggle("has-error", Boolean(msg));
    err.textContent = msg || "";
    return !msg;
  };

  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("is-visible"), 3500);
  };

  const inputs = $$("input, textarea", form);
  inputs.forEach((input) => {
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) validate(input);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = inputs.map(validate).every(Boolean);
    if (!ok) {
      inputs.find((i) => i.closest(".field").classList.contains("has-error"))?.focus();
      return;
    }
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    btn.textContent = "جارٍ الإرسال...";
    // Front-end only: simulate sending
    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.textContent = "إرسال";
      showToast("تم إرسال رسالتك بنجاح، سنتواصل معك قريباً");
    }, 900);
  });

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
