import { H as Hls } from "./hls-dru42stk.js";

function onReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
    return;
  }

  callback();
}

function normalizeText(value) {
  return (value || "").toString().trim().toLowerCase();
}

function initMobileNav() {
  const toggle = document.querySelector("[data-mobile-toggle]");
  const nav = document.querySelector("[data-mobile-nav]");

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

function initHero() {
  const hero = document.querySelector("[data-hero]");

  if (!hero) {
    return;
  }

  const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
  const picks = Array.from(hero.querySelectorAll("[data-hero-pick]"));
  const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
  let current = 0;
  let timer = null;

  const activate = (index) => {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, position) => {
      slide.classList.toggle("active", position === current);
    });

    picks.forEach((pick, position) => {
      pick.classList.toggle("active", position === current);
    });

    dots.forEach((dot, position) => {
      dot.classList.toggle("active", position === current);
    });
  };

  const startTimer = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => activate(current + 1), 5200);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      activate(index);
      startTimer();
    });
  });

  picks.forEach((pick, index) => {
    pick.addEventListener("mouseenter", () => {
      activate(index);
      startTimer();
    });
  });

  if (slides.length > 1) {
    startTimer();
  }
}

function initFilters() {
  const container = document.querySelector("[data-card-container]");
  const input = document.getElementById("site-search");
  const yearSelect = document.getElementById("year-filter");
  const typeSelect = document.getElementById("type-filter");
  const sortSelect = document.getElementById("sort-filter");
  const count = document.querySelector("[data-result-count]");

  if (!container) {
    return;
  }

  const cards = Array.from(container.querySelectorAll("[data-movie-card]"));
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");

  if (query && input) {
    input.value = query;
  }

  const matchYear = (card, filter) => {
    const year = Number(card.dataset.year || 0);

    if (!filter || filter === "全部年份") {
      return true;
    }

    if (filter === "2026+") {
      return year >= 2026;
    }

    if (filter === "2021及以前") {
      return year <= 2021;
    }

    return String(year) === filter;
  };

  const matchType = (card, filter) => {
    if (!filter || filter === "全部类型") {
      return true;
    }

    const type = `${card.dataset.type || ""} ${card.dataset.tags || ""}`;
    return type.includes(filter);
  };

  const apply = () => {
    const keyword = normalizeText(input ? input.value : "");
    const yearFilter = yearSelect ? yearSelect.value : "全部年份";
    const typeFilter = typeSelect ? typeSelect.value : "全部类型";
    let visible = 0;

    cards.forEach((card) => {
      const haystack = normalizeText(`${card.dataset.title} ${card.dataset.tags} ${card.dataset.region} ${card.dataset.type} ${card.dataset.year}`);
      const matched = (!keyword || haystack.includes(keyword)) && matchYear(card, yearFilter) && matchType(card, typeFilter);
      card.classList.toggle("hidden-by-filter", !matched);

      if (matched) {
        visible += 1;
      }
    });

    if (count) {
      count.textContent = String(visible);
    }
  };

  const sortCards = () => {
    const mode = sortSelect ? sortSelect.value : "year-desc";
    const sorted = [...cards].sort((left, right) => {
      if (mode === "year-asc") {
        return Number(left.dataset.year || 0) - Number(right.dataset.year || 0);
      }

      if (mode === "title-asc") {
        return (left.dataset.title || "").localeCompare(right.dataset.title || "", "zh-Hans-CN");
      }

      return Number(right.dataset.year || 0) - Number(left.dataset.year || 0);
    });

    sorted.forEach((card) => container.appendChild(card));
    apply();
  };

  [input, yearSelect, typeSelect].forEach((control) => {
    if (control) {
      control.addEventListener("input", apply);
      control.addEventListener("change", apply);
    }
  });

  if (sortSelect) {
    sortSelect.addEventListener("change", sortCards);
  }

  sortCards();
}

export function initMoviePlayer(videoId, sourceUrl) {
  const video = document.getElementById(videoId);

  if (!video || !sourceUrl) {
    return;
  }

  const shell = video.closest(".player-shell");
  const cover = shell ? shell.querySelector("[data-player-cover]") : null;
  const buttons = shell ? shell.querySelectorAll("[data-play-button]") : [];
  let hls = null;

  const attachSource = () => {
    if (video.dataset.ready === "true") {
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
    } else if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
    } else {
      video.src = sourceUrl;
    }

    video.dataset.ready = "true";
  };

  const startPlayback = () => {
    attachSource();

    if (cover) {
      cover.classList.add("is-hidden");
    }

    video.controls = true;
    const playTask = video.play();

    if (playTask && typeof playTask.catch === "function") {
      playTask.catch(() => {
        video.controls = true;
      });
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", startPlayback);
  });

  if (cover) {
    cover.addEventListener("click", startPlayback);
  }

  video.addEventListener("click", () => {
    if (video.paused) {
      startPlayback();
    }
  });

  window.addEventListener("pagehide", () => {
    if (hls) {
      hls.destroy();
    }
  });
}

onReady(() => {
  initMobileNav();
  initHero();
  initFilters();
});
