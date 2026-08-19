/* ============================================================
   The New Quays — main script
   No dependencies. ~5KB. Every feature degrades gracefully:
   the site is fully readable and navigable with JS disabled.
   ============================================================ */
(function () {
  "use strict";

  var S = window.SITE || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. HEADER — transparent over hero, solid once scrolled
     --------------------------------------------------------- */
  var header = $(".site-header");
  var hasHero = !!$(".hero, .page-hero");

  function onScroll() {
    var y = window.scrollY;
    if (header && hasHero) {
      var threshold = Math.min(window.innerHeight * 0.6, 420);
      header.classList.toggle("site-header--solid", y > threshold);
    }
    if (bookBar) {
      bookBar.setAttribute("data-visible", y > 200 ? "true" : "false");
    }
  }
  // No hero means no dark image behind the header, so it stays solid.
  // The class is also set in the HTML to avoid a flash before this runs.
  if (header && !hasHero) header.classList.add("site-header--solid");

  /* ---------------------------------------------------------
     2. MOBILE NAVIGATION
     --------------------------------------------------------- */
  var drawer = $(".mobile-nav");
  var toggle = $(".nav-toggle");
  var lastFocus = null;

  function setDrawer(open) {
    if (!drawer) return;
    drawer.setAttribute("data-open", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.classList.toggle("no-scroll", open);
    document.body.classList.toggle("no-scroll", open);
    if (open) {
      lastFocus = document.activeElement;
      var first = $(".mobile-nav__close", drawer);
      if (first) first.focus();
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }

  if (toggle) toggle.addEventListener("click", function () {
    setDrawer(drawer.getAttribute("data-open") !== "true");
  });
  var closeBtn = $(".mobile-nav__close");
  if (closeBtn) closeBtn.addEventListener("click", function () { setDrawer(false); });
  $$(".mobile-nav a").forEach(function (a) {
    a.addEventListener("click", function () { setDrawer(false); });
  });

  // Focus trap + escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (drawer && drawer.getAttribute("data-open") === "true") setDrawer(false);
      if (lb && lb.getAttribute("data-open") === "true") closeLightbox();
    }
    if (e.key === "Tab" && drawer && drawer.getAttribute("data-open") === "true") {
      var f = $$("a[href], button:not([disabled])", drawer);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------------------------------------------------
     3. OPENING HOURS + "OPEN NOW" STATUS
     --------------------------------------------------------- */
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function toMinutes(hhmm) {
    var p = hhmm.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function pretty(hhmm) {
    var p = hhmm.split(":"), h = parseInt(p[0], 10), m = p[1];
    var suffix = h >= 12 ? "pm" : "am";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return m === "00" ? h12 + suffix : h12 + "." + m + suffix;
  }

  // Returns { open: bool, text: string } or null if hours unconfirmed
  function status(venueKey) {
    var venue = S.hours && S.hours[venueKey];
    if (!venue || !venue.confirmed) return null;

    var now = new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = venue.days[day] || [];

    for (var i = 0; i < today.length; i++) {
      var from = toMinutes(today[i][0]), to = toMinutes(today[i][1]);
      if (mins >= from && mins < to) {
        return { open: true, text: "Open now until " + pretty(today[i][1]) };
      }
    }
    // Later today?
    for (var j = 0; j < today.length; j++) {
      if (mins < toMinutes(today[j][0])) {
        return { open: false, text: "Opens today at " + pretty(today[j][0]) };
      }
    }
    // Next open day within a week
    for (var k = 1; k <= 7; k++) {
      var d = (day + k) % 7;
      var slots = venue.days[d] || [];
      if (slots.length) {
        var label = k === 1 ? "tomorrow" : DAY_NAMES[d];
        return { open: false, text: "Opens " + label + " at " + pretty(slots[0][0]) };
      }
    }
    return null;
  }

  // <span data-status="besties"></span>
  $$("[data-status]").forEach(function (el) {
    var st = status(el.getAttribute("data-status"));
    if (!st) { el.hidden = true; return; }
    el.textContent = st.text;
    el.setAttribute("data-open", st.open ? "true" : "false");
  });

  // Highlight today's row in an hours table: <tr data-day="4">
  $$("[data-day]").forEach(function (row) {
    if (parseInt(row.getAttribute("data-day"), 10) === new Date().getDay()) {
      row.setAttribute("data-today", "true");
    }
  });

  /* ---------------------------------------------------------
     4. BOOKING COMPONENT
     ---------------------------------------------------------
     Every booking button carries data-book. Behaviour is decided
     here from SITE.booking.mode, so swapping in a reservation
     provider later touches one config value and this block only.
     --------------------------------------------------------- */
  var booking = S.booking || { mode: "phone" };
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var panel = $("#booking-panel");

  function openPanel() {
    if (!panel) return;
    panel.setAttribute("data-open", "true");
    var c = $("[data-panel-close]", panel);
    if (c) c.focus();
  }
  function closePanel() {
    if (!panel) return;
    panel.setAttribute("data-open", "false");
  }

  $$("[data-book]").forEach(function (el) {
    if (booking.mode === "widget" && booking.widgetUrl) {
      el.setAttribute("href", booking.widgetUrl);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
      return;
    }
    // Phone mode. The href is already tel: in the HTML so it works
    // without JS. On desktop, intercept and show the details panel.
    if (!coarse && panel) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openPanel();
      });
    }
  });

  if (panel) {
    $$("[data-panel-close]").forEach(function (b) {
      b.addEventListener("click", closePanel);
    });
    panel.addEventListener("click", function (e) {
      if (e.target === panel) closePanel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });
    var copyBtn = $("[data-copy-phone]");
    if (copyBtn && navigator.clipboard) {
      copyBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(S.phone.display).then(function () {
          var old = copyBtn.textContent;
          copyBtn.textContent = "Copied";
          setTimeout(function () { copyBtn.textContent = old; }, 1800);
        });
      });
    }
  }

  /* ---------------------------------------------------------
     5. SCROLL REVEAL
     --------------------------------------------------------- */
  var revealables = $$(".reveal");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------------------------------------------------
     6. MENU SECTION NAV — highlights the section in view
     --------------------------------------------------------- */
  var menuLinks = $$(".menu-nav a");
  if (menuLinks.length && "IntersectionObserver" in window) {
    var sections = menuLinks
      .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
      .filter(Boolean);
    var mo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        menuLinks.forEach(function (a) {
          a.setAttribute("aria-current", a.getAttribute("href") === "#" + entry.target.id ? "true" : "false");
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(function (s) { mo.observe(s); });
  }

  /* ---------------------------------------------------------
     7. GALLERY LIGHTBOX
     --------------------------------------------------------- */
  var lb = $(".gallery-lightbox");
  var lbImg = lb && $("img", lb);
  var lbCap = lb && $(".lightbox__cap", lb);
  var items = $$(".gallery-item");
  var index = 0;
  var lbLastFocus = null;

  function showAt(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    var img = $("img", items[index]);
    if (!img || !lbImg) return;
    lbImg.setAttribute("src", img.getAttribute("data-full") || img.currentSrc || img.src);
    lbImg.setAttribute("alt", img.getAttribute("alt") || "");
    if (lbCap) lbCap.textContent = items[index].getAttribute("data-caption") || img.getAttribute("alt") || "";
  }
  function openLightbox(i) {
    if (!lb) return;
    lbLastFocus = document.activeElement;
    showAt(i);
    lb.setAttribute("data-open", "true");
    lb.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    var c = $(".lightbox__close", lb);
    if (c) c.focus();
  }
  function closeLightbox() {
    if (!lb) return;
    lb.setAttribute("data-open", "false");
    lb.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (lbLastFocus) lbLastFocus.focus();
  }

  items.forEach(function (item, i) {
    item.addEventListener("click", function () { openLightbox(i); });
  });
  if (lb) {
    var cl = $(".lightbox__close", lb); if (cl) cl.addEventListener("click", closeLightbox);
    var pv = $(".lightbox__prev", lb);  if (pv) pv.addEventListener("click", function () { showAt(index - 1); });
    var nx = $(".lightbox__next", lb);  if (nx) nx.addEventListener("click", function () { showAt(index + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
      if (lb.getAttribute("data-open") !== "true") return;
      if (e.key === "ArrowRight") showAt(index + 1);
      if (e.key === "ArrowLeft") showAt(index - 1);
    });
  }

  /* ---------------------------------------------------------
     8. MAP FACADE — loads the Google embed only when asked
     --------------------------------------------------------- */
  var mapBtn = $("[data-load-map]");
  if (mapBtn) {
    mapBtn.addEventListener("click", function () {
      var wrap = mapBtn.closest(".map-facade");
      var frame = document.createElement("iframe");
      frame.setAttribute("title", "Map showing The New Quays, 81 New Harbour Road, Portavogie BT22 1EB");
      frame.setAttribute("loading", "lazy");
      frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      frame.setAttribute("src", mapBtn.getAttribute("data-load-map"));
      wrap.appendChild(frame);
      wrap.setAttribute("data-loaded", "true");
    });
  }

  /* ---------------------------------------------------------
     9. FOOTER YEAR
     --------------------------------------------------------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------------------------------------------------
     10. BIND SCROLL
     --------------------------------------------------------- */
  var bookBar = $(".book-bar");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();
})();
