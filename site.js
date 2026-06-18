const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof window.gsap !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
const light = document.querySelector(".cursor-light");
const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };

const formatNumber = (value, suffix = "", format = "") => {
  const number = Math.round(value);
  if (format === "compact" && number >= 1000) {
    if (number >= 1000000) {
      const compact = Math.round(number / 100000) / 10;
      return `${compact}m${suffix}`;
    }
    return `${Math.round(number / 1000)}k${suffix}`;
  }
  return number >= 1000 ? number.toLocaleString("zh-CN") + suffix : number + suffix;
};

const animateNumber = (node, force = false) => {
  if (!node || (node.dataset.done && !force)) return;
  const target = Number(node.dataset.count || 0);
  const suffix = node.dataset.suffix || "";
  const format = node.dataset.format || "";
  node.dataset.done = "true";

  if (hasGsap && !reducedMotion) {
    const state = { value: 0 };
    gsap.to(state, {
      value: target,
      duration: 1.15,
      ease: "power4.out",
      overwrite: true,
      onUpdate: () => { node.textContent = formatNumber(state.value, suffix, format); },
      onComplete: () => { node.textContent = formatNumber(target, suffix, format); }
    });
    return;
  }

  const duration = 1000;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = formatNumber(target * eased, suffix, format);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const makeDataField = () => {
  if (reducedMotion || document.querySelector(".digital-rain")) return;
  const canvas = document.createElement("canvas");
  canvas.className = "digital-rain";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  const alphabet = ["00", "01", "AI", "CV", "RAG", "GPU", "API", "379", "125", "126", "500+", "6W+", "TRACE", "STATE", "AGENT"];
  const streams = [];
  const state = { scrollBoost: 0, mouseBoost: 0 };
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  const hex = accent.startsWith("#") ? accent.slice(1) : "1b61c9";
  const accentRgb = [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16)
  ];
  const rgba = (alpha) => `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, ${alpha})`;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    streams.length = 0;
    const count = window.innerWidth < 720 ? 52 : 112;
    for (let i = 0; i < count; i += 1) {
      streams.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 0.28 + Math.random() * 0.9,
        drift: -0.45 + Math.random() * 0.9,
        size: 10 + Math.random() * 18,
        alpha: 0.08 + Math.random() * 0.22,
        token: alphabet[Math.floor(Math.random() * alphabet.length)],
        phase: Math.random() * Math.PI * 2
      });
    }
  };

  const draw = (time = 0) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.textBaseline = "middle";

    const px = (pointer.x - window.innerWidth / 2) / window.innerWidth;
    const py = (pointer.y - window.innerHeight / 2) / window.innerHeight;
    const scrollY = window.scrollY || 0;

    streams.forEach((stream, index) => {
      const wave = Math.sin(time * 0.001 + stream.phase) * 10;
      stream.y += stream.speed + state.scrollBoost * 0.06;
      stream.x += stream.drift + px * 0.42;

      if (stream.y > window.innerHeight + 40) {
        stream.y = -30 - Math.random() * 120;
        stream.x = Math.random() * window.innerWidth;
        stream.token = alphabet[(index + Math.floor(scrollY / 160)) % alphabet.length];
      }
      if (stream.x < -80) stream.x = window.innerWidth + 40;
      if (stream.x > window.innerWidth + 80) stream.x = -40;

      const alpha = Math.max(0.035, stream.alpha + state.mouseBoost * 0.08);
      ctx.fillStyle = rgba(alpha);
      ctx.font = `${stream.size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.fillText(stream.token, stream.x + wave + px * 22, stream.y + py * 12);

      if (index % 7 === 0) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(stream.x - 18, stream.y + 14);
        ctx.lineTo(stream.x + 52, stream.y + 14);
        ctx.strokeStyle = rgba(0.18);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    state.scrollBoost *= 0.92;
    state.mouseBoost *= 0.94;
    requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", () => {
    state.scrollBoost = Math.min(12, state.scrollBoost + 2.2);
  }, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    state.mouseBoost = 1;
  }, { passive: true });
};

const makeDomDataField = () => {
  if (reducedMotion || document.querySelector(".data-field")) return;
  const field = document.createElement("div");
  field.className = "data-field";
  field.setAttribute("aria-hidden", "true");
  const streamCount = window.innerWidth < 720 ? 8 : 16;
  const labels = ["AI", "RAG", "CV", "AGT", "CUG", "UI", "GPU", "API", "TRACE", "STATE"];

  for (let i = 0; i < streamCount; i += 1) {
    const stream = document.createElement("div");
    stream.className = "data-stream";
    stream.style.setProperty("--x", `${5 + Math.random() * 90}%`);
    stream.style.setProperty("--o", `${0.08 + Math.random() * 0.18}`);
    stream.style.setProperty("--b", `${Math.random() > 0.72 ? 0.7 : 0}px`);

    for (let j = 0; j < 7; j += 1) {
      const cell = document.createElement("span");
      const label = labels[(i + j) % labels.length];
      cell.textContent = `${label}.${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
      stream.appendChild(cell);
    }
    field.appendChild(stream);
  }
  document.body.prepend(field);
};

const initFallbackReveal = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      entry.target.querySelectorAll?.("[data-count]").forEach((node) => {
        animateNumber(node);
      });
      if (entry.target.matches("[data-count]") && !entry.target.dataset.done) {
        animateNumber(entry.target);
      }
    });
  }, { threshold: 0.18 });

  document.querySelectorAll(".reveal, [data-count]").forEach((node) => observer.observe(node));
};

const initPointer = () => {
  if (!light || reducedMotion) return;

  if (hasGsap) {
    const xTo = gsap.quickTo(light, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(light, "y", { duration: 0.35, ease: "power3.out" });
    gsap.set(light, { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    window.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
      document.documentElement.style.setProperty("--my", `${event.clientY}px`);
      xTo(event.clientX);
      yTo(event.clientY);
      gsap.to(light, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
    }, { passive: true });
    return;
  }

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
    document.documentElement.style.setProperty("--my", `${event.clientY}px`);
    light.style.opacity = "1";
    light.style.left = `${event.clientX}px`;
    light.style.top = `${event.clientY}px`;
  }, { passive: true });
};

const initJumps = () => {
  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.jump);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    });
  });

  document.querySelectorAll(".topnav nav a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    });
  });
};

const initCopyButtons = () => {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        const original = button.textContent;
        button.textContent = "已复制";
        setTimeout(() => { button.textContent = original; }, 1200);
      } catch {
        button.textContent = "复制受限";
        setTimeout(() => { button.textContent = "复制简介"; }, 1200);
      }
    });
  });
};

const initTabs = () => {
  document.querySelectorAll("[role='tab']").forEach((tab) => {
    tab.addEventListener("click", () => {
      const root = tab.closest(".tabs");
      if (!root) return;
      const nextPanel = root.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      root.querySelectorAll("[role='tab']").forEach((item) => item.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");

      if (hasGsap && nextPanel) {
        const current = root.querySelector(".panel.active");
        if (current && current !== nextPanel) {
          gsap.to(current, {
            autoAlpha: 0,
            y: 10,
            duration: 0.16,
            onComplete: () => {
              current.classList.remove("active");
              nextPanel.classList.add("active");
              gsap.fromTo(nextPanel, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out" });
            }
          });
        }
      } else {
        root.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.remove("active"));
        nextPanel?.classList.add("active");
      }
    });
  });
};

const initFunctionConsole = () => {
  const shells = document.querySelectorAll(".function-shell");
  shells.forEach((shell) => {
    const tabs = shell.querySelectorAll(".function-tab");
    const panels = shell.querySelectorAll(".function-panel");

    const activate = (name) => {
      const nextPanel = shell.querySelector(`[data-feature-panel="${name}"]`);
      if (!nextPanel || nextPanel.classList.contains("active")) return;
      const current = shell.querySelector(".function-panel.active");

      tabs.forEach((tab) => {
        const isActive = tab.dataset.feature === name;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      const playCounts = () => {
        nextPanel.querySelectorAll("[data-count]").forEach((node) => {
          node.dataset.done = "";
          node.textContent = "0";
          animateNumber(node, true);
        });
      };

      const scrollToPanel = () => {
        if (window.innerWidth > 920) return;
        const stage = shell.querySelector(".function-stage");
        if (!stage) return;
        const top = stage.getBoundingClientRect().top + window.pageYOffset - 72;
        window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      };

      if (hasGsap && !reducedMotion && current) {
        gsap.to(current, {
          autoAlpha: 0,
          y: 18,
          scale: 0.99,
          duration: 0.18,
          ease: "power2.out",
          onComplete: () => {
            current.classList.remove("active");
            nextPanel.classList.add("active");
            gsap.fromTo(nextPanel,
              { autoAlpha: 0, y: 24, scale: 0.985 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out", onStart: playCounts }
            );
            scrollToPanel();
          }
        });
        return;
      }

      panels.forEach((panel) => panel.classList.remove("active"));
      nextPanel.classList.add("active");
      playCounts();
      scrollToPanel();
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab.dataset.feature));
    });

    shell.querySelector(".function-panel.active")?.querySelectorAll("[data-count]").forEach((node) => animateNumber(node, true));
  });
};

const initMobileNav = () => {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".topnav nav");
  if (!hamburger || !nav) return;

  hamburger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !nav.contains(event.target) && !hamburger.contains(event.target)) {
      nav.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  });
};

const initResumeDrawer = () => {
  const drawer = document.querySelector(".resume-side-drawer");
  const drawerTab = document.querySelector(".side-drawer-tab");
  const entries = document.querySelectorAll("[data-resume-page]");
  const workspace = document.querySelector("#workspace");
  if (!drawer || !entries.length) return;

  let closeTimer = 0;

  const setDrawerOpen = (open) => {
    window.clearTimeout(closeTimer);
    drawer.classList.toggle("is-open", open);
    drawerTab?.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const scheduleDrawerClose = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (drawer.contains(document.activeElement)) return;
      setDrawerOpen(false);
    }, 180);
  };

  const activateFeature = (name) => {
    const targetTab = document.querySelector(`.function-tab[data-feature="${name}"]`);
    if (!targetTab) return;
    entries.forEach((entry) => {
      entry.classList.toggle("active", entry.dataset.resumePage === name);
    });
    targetTab.click();
    setDrawerOpen(false);
    if (workspace) {
      const top = workspace.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    }
  };

  drawer.classList.remove("is-open");
  drawerTab?.setAttribute("aria-expanded", "false");

  const isMobile = window.matchMedia("(max-width: 920px)").matches;
  if (!isMobile) {
    drawer.addEventListener("pointerenter", () => setDrawerOpen(true), { passive: true });
    drawer.addEventListener("pointerleave", scheduleDrawerClose, { passive: true });
  }
  drawer.addEventListener("focusin", () => setDrawerOpen(true));
  drawer.addEventListener("focusout", scheduleDrawerClose);
  drawerTab?.addEventListener("click", () => setDrawerOpen(!drawer.classList.contains("is-open")));
  if (isMobile) {
    document.addEventListener("click", (event) => {
      if (drawer.classList.contains("is-open") && !drawer.contains(event.target)) {
        setDrawerOpen(false);
      }
    });
  }
  entries.forEach((entry) => {
    entry.addEventListener("click", () => {
      activateFeature(entry.dataset.resumePage);
      entry.blur();
    });
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) setDrawerOpen(false);
  });
};

const initCertificateCarousel = () => {
  const carousel = document.querySelector("[data-certificate-carousel]");
  if (!carousel) return;

  const books = Array.from(carousel.querySelectorAll(".cert-book"));
  const prev = carousel.querySelector(".cert-prev");
  const next = carousel.querySelector(".cert-next");
  const title = carousel.querySelector("[data-cert-title]");
  const date = carousel.querySelector("[data-cert-date]");
  const dotsWrap = carousel.querySelector(".cert-dots");
  if (!books.length || !dotsWrap) return;

  let active = 0;
  let autoTimer = 0;
  let paused = false;

  const getOffset = (index) => {
    const raw = index - active;
    const half = books.length / 2;
    if (raw > half) return raw - books.length;
    if (raw < -half) return raw + books.length;
    return raw;
  };

  const dots = books.map((book, index) => {
    const dot = document.createElement("button");
    dot.className = "cert-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `查看${book.dataset.title || "证书"}`);
    dot.addEventListener("click", () => update(index, true));
    dotsWrap.appendChild(dot);
    return dot;
  });

  const setBookPosition = (book, index) => {
    const offset = getOffset(index);
    const visible = Math.abs(offset) <= 3;
    const abs = Math.abs(offset);
    const x = offset * 126;
    const y = abs * 10;
    const z = 120 - abs * 108;
    const rotate = offset * -18;
    const scale = 1 - abs * 0.105;
    const opacity = visible ? Math.max(0.18, 1 - abs * 0.22) : 0;

    book.classList.toggle("active", offset === 0);
    book.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
    book.style.zIndex = String(20 - abs);
    book.style.pointerEvents = visible ? "auto" : "none";
    book.style.filter = offset === 0 ? "none" : `saturate(${Math.max(0.64, 1 - abs * 0.1)}) blur(${Math.max(0, abs - 2) * 0.4}px)`;
    book.style.setProperty("--flow-x", `${x}px`);
    book.style.setProperty("--flow-y", `${y}px`);
    book.style.setProperty("--flow-z", `${z}px`);
    book.style.setProperty("--flow-rotate", `${rotate}deg`);
    book.style.setProperty("--flow-scale", `${scale}`);
    book.style.setProperty("--flow-opacity", `${opacity}`);
  };

  const updateMeta = (book) => {
    if (!book || !title || !date) return;
    const nextTitle = book.dataset.title || "获奖证书";
    const nextDate = book.dataset.date || "日期待确认";
    if (hasGsap && !reducedMotion) {
      gsap.to([title, date], {
        autoAlpha: 0,
        y: -4,
        duration: 0.12,
        overwrite: true,
        onComplete: () => {
          title.textContent = nextTitle;
          date.textContent = nextDate;
          gsap.fromTo([date, title], { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.035 });
        }
      });
      return;
    }
    title.textContent = nextTitle;
    date.textContent = nextDate;
  };

  function update(nextIndex, userDriven = false) {
    active = (nextIndex + books.length) % books.length;
    books.forEach(setBookPosition);
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === active);
      dot.setAttribute("aria-current", index === active ? "true" : "false");
    });
    updateMeta(books[active]);
    if (userDriven) restartAuto();
  }

  const move = (delta, userDriven = false) => update(active + delta, userDriven);

  const startAuto = () => {
    window.clearInterval(autoTimer);
    if (reducedMotion) return;
    autoTimer = window.setInterval(() => {
      if (!paused) move(1);
    }, 3600);
  };

  function restartAuto() {
    window.clearInterval(autoTimer);
    startAuto();
  }

  prev?.addEventListener("click", () => move(-1, true));
  next?.addEventListener("click", () => move(1, true));
  books.forEach((book, index) => {
    book.addEventListener("click", () => {
      if (index !== active) update(index, true);
    });
  });

  carousel.addEventListener("pointerenter", () => { paused = true; }, { passive: true });
  carousel.addEventListener("pointerleave", () => { paused = false; }, { passive: true });
  carousel.addEventListener("focusin", () => { paused = true; });
  carousel.addEventListener("focusout", () => { paused = false; });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1, true);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1, true);
    }
  });

  update(0);
  startAuto();
};

const initProjectGlow = () => {
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--card-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--card-y", `${event.clientY - rect.top}px`);
    }, { passive: true });
  });
};

const initWinkyCompanion = () => {
  const bot = document.querySelector("[data-winky]");
  if (!bot || reducedMotion) return;

  const pupils = bot.querySelectorAll(".winky-eye i");
  const arms = bot.querySelectorAll(".winky-arm");
  const clap = bot.querySelector(".pixel-clap");
  const stage = bot.closest(".target-area");
  const smartCursor = stage?.querySelector(".smart-cursor");
  const guideFlow = stage?.querySelector(".guide-flow");
  const hotspot = stage?.querySelector(".guide-hotspot");
  const hotspotRing = stage?.querySelector(".hotspot-ring");
  const speech = bot.querySelector(".winky-speech");
  const targetCard = stage?.querySelector(".target-card");

  if (clap && !clap.children.length) {
    for (let i = 0; i < 18; i += 1) {
      const pixel = document.createElement("span");
      pixel.style.left = `${10 + Math.random() * 80}%`;
      pixel.style.top = `${22 + Math.random() * 48}px`;
      clap.appendChild(pixel);
    }
  }

  const updateEyes = (event) => {
    const rect = bot.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.34;
    const dx = Math.max(-5, Math.min(5, (event.clientX - cx) / 24));
    const dy = Math.max(-4, Math.min(4, (event.clientY - cy) / 28));
    bot.style.setProperty("--eye-x", `${dx}px`);
    bot.style.setProperty("--eye-y", `${dy}px`);
  };

  const blink = () => {
    bot.classList.add("is-blinking");
    window.setTimeout(() => bot.classList.remove("is-blinking"), 120);
  };

  const clapPixels = () => {
    if (hasGsap && !reducedMotion) {
      gsap.fromTo(arms,
        { rotation: (index) => index === 0 ? 16 : -16 },
        { rotation: (index) => index === 0 ? -32 : 32, yoyo: true, repeat: 3, duration: 0.11, ease: "power2.inOut" }
      );
      gsap.fromTo(clap?.querySelectorAll("span") || [],
        { autoAlpha: 1, x: 0, y: 0, scale: 0.7 },
        {
          autoAlpha: 0,
          x: () => gsap.utils.random(-62, 62),
          y: () => gsap.utils.random(-76, -18),
          scale: () => gsap.utils.random(0.6, 1.45),
          stagger: 0.012,
          duration: 0.72,
          ease: "power3.out"
        }
      );
      gsap.fromTo(bot, { y: 0, rotation: 0 }, { y: -5, rotation: -2, yoyo: true, repeat: 1, duration: 0.16, ease: "power2.out" });
    }
    blink();
  };

  window.addEventListener("pointermove", updateEyes, { passive: true });
  bot.addEventListener("click", clapPixels);
  bot.addEventListener("pointerenter", clapPixels, { passive: true });
  window.setInterval(blink, 4200);

  if (hasGsap && stage && smartCursor && guideFlow && hotspot && speech) {
    gsap.set([smartCursor, hotspot, speech], { autoAlpha: 0 });
    gsap.set(guideFlow, { strokeDashoffset: 260 });
    const guideTl = gsap.timeline({
      repeat: -1,
      repeatDelay: 1.35,
      defaults: { ease: "power3.out" }
    });

    guideTl
      .set(bot, { "--eye-x": "-3px", "--eye-y": "-2px" })
      .fromTo(smartCursor,
        { autoAlpha: 0, x: -18, y: -8, scale: 0.9 },
        { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.35 }
      )
      .to(guideFlow, { strokeDashoffset: 96, duration: 0.72, ease: "power2.inOut" }, "<")
      .to(smartCursor, { x: 128, y: 72, rotation: 7, duration: 0.72, ease: "power2.inOut" }, "<")
      .to(bot, { x: -8, rotation: -2, duration: 0.45 }, "<0.18")
      .to(bot, { "--eye-x": "-1px", "--eye-y": "-1px", duration: 0.32 }, "<")
      .to(guideFlow, { strokeDashoffset: -84, duration: 0.92, ease: "power2.inOut" })
      .to(smartCursor, { x: 250, y: 142, rotation: 14, duration: 0.92, ease: "power2.inOut" }, "<")
      .to(bot, { x: -14, y: -3, rotation: -4, duration: 0.46 }, "<0.24")
      .to(bot, { "--eye-x": "-5px", "--eye-y": "-3px", duration: 0.38 }, "<")
      .fromTo(hotspot,
        { autoAlpha: 0, scale: 0.72 },
        { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(1.8)" },
        "-=0.18"
      )
      .fromTo(hotspotRing,
        { scale: 0.72 },
        { scale: 1.18, yoyo: true, repeat: 2, duration: 0.28, ease: "power2.out" },
        "<"
      )
      .to(targetCard, {
        y: -4,
        duration: 0.28,
        yoyo: true,
        repeat: 1,
        boxShadow: "0 0 1px rgba(0, 0, 0, 0.32), 0 0 2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(45, 127, 249, 0.28), inset 0 0 0 1px var(--accent)"
      }, "<")
      .fromTo(speech,
        { autoAlpha: 0, y: 10, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.5)" },
        "-=0.1"
      )
      .add(clapPixels, ">-0.05")
      .to([speech, hotspot, smartCursor], { autoAlpha: 0, duration: 0.32, stagger: 0.05 }, "+=1.1")
      .to(bot, { x: 0, y: 0, rotation: 0, "--eye-x": "0px", "--eye-y": "0px", duration: 0.42 }, "<")
      .to(targetCard, { y: 0, clearProps: "boxShadow", duration: 0.2 }, "<")
      .set(guideFlow, { strokeDashoffset: 260 });
  }
};

const initGsapMotion = () => {
  if (!hasGsap || reducedMotion) {
    initFallbackReveal();
    return;
  }

  gsap.defaults({ duration: 0.72, ease: "power3.out" });
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  gsap.set(".reveal", { autoAlpha: 0, y: 26 });
  gsap.set(".bar i", { scaleX: 0, transformOrigin: "left center" });

  gsap.timeline()
    .from(".topnav", { y: -22, autoAlpha: 0, duration: 0.45 })
    .to(".hero .reveal", { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.82 }, "-=0.12")
    .from(".hero .btn", { y: 12, autoAlpha: 0, stagger: 0.07, duration: 0.42 }, "-=0.35");

  if (hasScrollTrigger) {
    const nonHeroReveals = Array.from(document.querySelectorAll(".reveal"))
      .filter((node) => !node.closest(".hero"));

    ScrollTrigger.batch(nonHeroReveals, {
      start: "top 84%",
      once: true,
      batchMax: 6,
      interval: 0.08,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        stagger: { each: 0.08, from: "start" },
        overwrite: true
      })
    });

    document.querySelectorAll("[data-count]").forEach((node) => {
      ScrollTrigger.create({
        trigger: node,
        start: "top 86%",
        once: true,
        onEnter: () => animateNumber(node)
      });
    });

    gsap.to(".data-stream", {
      y: "128vh",
      ease: "none",
      stagger: { each: 0.18, from: "random" },
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.1
      }
    });

    document.querySelectorAll(".section").forEach((section, index) => {
      gsap.fromTo(section, { "--section-shift": 0 }, {
        "--section-shift": 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: index % 2 ? 0.8 : 1.2
        }
      });
    });

    gsap.to(".orbit-grid, .screen-grid", {
      yPercent: 8,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    });

    gsap.to(".bar i", {
      scaleX: 1,
      stagger: 0.12,
      scrollTrigger: {
        trigger: ".scan-list",
        start: "top 78%",
        once: true
      }
    });

    ScrollTrigger.batch(".project-card, .flow-step, .node, .metric, .log-row", {
      start: "top 88%",
      once: true,
      interval: 0.08,
      batchMax: 5,
      onEnter: (batch) => gsap.fromTo(batch,
        { autoAlpha: 0, y: 34, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, stagger: 0.08, overwrite: true }
      )
    });
  }

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const rotateX = gsap.quickTo(card, "rotationX", { duration: 0.35, ease: "power3.out" });
    const rotateY = gsap.quickTo(card, "rotationY", { duration: 0.35, ease: "power3.out" });
    const lift = gsap.quickTo(card, "y", { duration: 0.3, ease: "power3.out" });
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 9;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * -9;
      rotateY(x);
      rotateX(y);
      lift(-3);
    }, { passive: true });
    card.addEventListener("pointerleave", () => {
      rotateY(0);
      rotateX(0);
      lift(0);
    });
  });

  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("pointerenter", () => {
      gsap.to(button, { y: -1, scale: 1.01, duration: 0.18, ease: "power2.out", overwrite: "auto" });
    }, { passive: true });
    button.addEventListener("pointerleave", () => {
      gsap.to(button, { x: 0, y: 0, scale: 1, duration: 0.22, ease: "power2.out", overwrite: true });
    });
  });
};

makeDataField();
initPointer();
initJumps();
initCopyButtons();
initTabs();
initFunctionConsole();
initMobileNav();
initResumeDrawer();
initCertificateCarousel();
initProjectGlow();
initWinkyCompanion();
initGsapMotion();
