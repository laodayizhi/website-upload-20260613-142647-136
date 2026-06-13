(function() {
  var menuButton = document.querySelector("[data-menu-toggle]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function() {
      mobileMenu.classList.toggle("open");
    });
  }

  var hero = document.querySelector("[data-hero]");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function playSlides() {
      clearInterval(timer);
      timer = setInterval(function() {
        showSlide(current + 1);
      }, 5200);
    }

    dots.forEach(function(dot, index) {
      dot.addEventListener("click", function() {
        showSlide(index);
        playSlides();
      });
    });

    if (prev) {
      prev.addEventListener("click", function() {
        showSlide(current - 1);
        playSlides();
      });
    }

    if (next) {
      next.addEventListener("click", function() {
        showSlide(current + 1);
        playSlides();
      });
    }

    showSlide(0);
    playSlides();
  }

  var searchInput = document.querySelector("[data-search-input]");
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
  var empty = document.querySelector("[data-empty]");
  var sortSelect = document.querySelector("[data-sort-select]");
  var sortGrid = document.querySelector("[data-sort-grid]");

  function normalize(text) {
    return String(text || "").toLowerCase().trim();
  }

  function applySearch() {
    if (!searchInput || !cards.length) {
      return;
    }
    var keyword = normalize(searchInput.value);
    var visible = 0;

    cards.forEach(function(card) {
      var matched = !keyword || normalize(card.textContent).indexOf(keyword) !== -1;
      card.classList.toggle("hidden-card", !matched);
      if (matched) {
        visible += 1;
      }
    });

    if (empty) {
      empty.classList.toggle("show", visible === 0);
    }
  }

  function applySort() {
    if (!sortSelect || !sortGrid) {
      return;
    }
    var mode = sortSelect.value;
    var nodes = Array.prototype.slice.call(sortGrid.children);

    nodes.sort(function(a, b) {
      var ay = parseInt(a.getAttribute("data-year") || "0", 10) || 0;
      var by = parseInt(b.getAttribute("data-year") || "0", 10) || 0;
      var at = normalize(a.querySelector("h3") ? a.querySelector("h3").textContent : a.textContent);
      var bt = normalize(b.querySelector("h3") ? b.querySelector("h3").textContent : b.textContent);

      if (mode === "year-asc") {
        return ay - by || at.localeCompare(bt, "zh-Hans-CN");
      }
      if (mode === "year-desc") {
        return by - ay || at.localeCompare(bt, "zh-Hans-CN");
      }
      if (mode === "title") {
        return at.localeCompare(bt, "zh-Hans-CN");
      }
      return 0;
    });

    nodes.forEach(function(node) {
      sortGrid.appendChild(node);
    });
    applySearch();
  }

  if (searchInput) {
    searchInput.addEventListener("input", applySearch);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", applySort);
  }
})();

function initMoviePlayer(mediaUrl) {
  var shell = document.querySelector(".player-shell");
  var video = document.querySelector(".movie-video");
  var layer = document.querySelector(".play-layer");
  var ready = false;
  var instance = null;

  if (!shell || !video || !layer || !mediaUrl) {
    return;
  }

  function bindMedia() {
    if (ready) {
      return;
    }
    ready = true;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = mediaUrl;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      instance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      instance.loadSource(mediaUrl);
      instance.attachMedia(video);
      return;
    }

    video.src = mediaUrl;
  }

  function start(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    bindMedia();
    video.controls = true;
    layer.classList.add("is-hidden");
    var promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function() {
        layer.classList.remove("is-hidden");
      });
    }
  }

  layer.addEventListener("click", start);
  shell.addEventListener("click", function(event) {
    if (!ready && event.target !== video) {
      start(event);
    }
  });

  window.addEventListener("pagehide", function() {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  });
}
