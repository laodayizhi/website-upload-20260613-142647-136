(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initPlayer() {
    var shells = Array.prototype.slice.call(document.querySelectorAll("[data-player-stream]"));
    shells.forEach(function (shell) {
      var video = shell.querySelector("video");
      var startButton = shell.querySelector(".player-start");
      var stream = shell.getAttribute("data-player-stream");
      var instance = null;

      if (!video || !stream) {
        return;
      }

      function prepare() {
        if (video.getAttribute("data-ready") === "true") {
          return Promise.resolve();
        }
        video.setAttribute("data-ready", "true");
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          return Promise.resolve();
        }
        if (window.Hls && window.Hls.isSupported()) {
          instance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          instance.loadSource(stream);
          instance.attachMedia(video);
          return new Promise(function (resolve) {
            instance.on(window.Hls.Events.MANIFEST_PARSED, resolve);
            instance.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal && instance) {
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                  instance.startLoad();
                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                  instance.recoverMediaError();
                } else {
                  instance.destroy();
                }
              }
            });
          });
        }
        video.src = stream;
        return Promise.resolve();
      }

      function begin() {
        if (startButton) {
          startButton.classList.add("is-hidden");
        }
        prepare().then(function () {
          var attempt = video.play();
          if (attempt && attempt.catch) {
            attempt.catch(function () {
              if (startButton) {
                startButton.classList.remove("is-hidden");
              }
            });
          }
        });
      }

      if (startButton) {
        startButton.addEventListener("click", begin);
      }

      video.addEventListener("click", function () {
        if (video.paused) {
          begin();
        }
      });

      video.addEventListener("play", function () {
        if (startButton) {
          startButton.classList.add("is-hidden");
        }
      });

      video.addEventListener("pause", function () {
        if (startButton && !video.ended) {
          startButton.classList.remove("is-hidden");
        }
      });

      window.addEventListener("beforeunload", function () {
        if (instance) {
          instance.destroy();
        }
      });
    });
  }

  function initSearch() {
    var form = document.querySelector("[data-search-form]");
    var input = document.querySelector("[data-search-input]");
    var region = document.querySelector("[data-search-region]");
    var year = document.querySelector("[data-search-year]");
    var genre = document.querySelector("[data-search-genre]");
    var results = document.querySelector("[data-search-results]");
    var note = document.querySelector("[data-search-note]");
    var source = window.MOVIE_SEARCH_INDEX || [];

    if (!form || !input || !results || !source.length) {
      return;
    }

    function includesText(value, needle) {
      return String(value || "").toLowerCase().indexOf(needle) !== -1;
    }

    function makeCard(movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      }).join("");
      return "" +
        "<article class=\"movie-card\">" +
        "<a class=\"movie-poster\" href=\"" + movie.url + "\">" +
        "<img src=\"" + movie.cover + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
        "<span class=\"year-badge\">" + escapeHtml(movie.year) + "</span>" +
        "</a>" +
        "<div class=\"movie-card-body\">" +
        "<h2><a href=\"" + movie.url + "\">" + escapeHtml(movie.title) + "</a></h2>" +
        "<p>" + escapeHtml(movie.oneLine) + "</p>" +
        "<div class=\"movie-meta\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.genre) + "</span></div>" +
        "<div class=\"tag-row\">" + tags + "</div>" +
        "</div>" +
        "</article>";
    }

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function applyInitialQuery() {
      var params = new URLSearchParams(window.location.search);
      var keyword = params.get("q");
      if (keyword) {
        input.value = keyword;
      }
    }

    function render() {
      var needle = input.value.trim().toLowerCase();
      var regionValue = region ? region.value : "";
      var yearValue = year ? year.value : "";
      var genreValue = genre ? genre.value : "";
      var filtered = source.filter(function (movie) {
        var textMatch = !needle ||
          includesText(movie.title, needle) ||
          includesText(movie.oneLine, needle) ||
          includesText(movie.summary, needle) ||
          includesText((movie.tags || []).join(" "), needle);
        var regionMatch = !regionValue || movie.region === regionValue;
        var yearMatch = !yearValue || movie.year === yearValue;
        var genreMatch = !genreValue || includesText(movie.genre, genreValue);
        return textMatch && regionMatch && yearMatch && genreMatch;
      }).slice(0, 80);

      if (!filtered.length) {
        results.innerHTML = "<p class=\"search-result-note\">换一个片名、地区、年份或标签试试。</p>";
        if (note) {
          note.textContent = "片库检索";
        }
        return;
      }

      results.innerHTML = filtered.map(makeCard).join("");
      if (note) {
        note.textContent = "片库检索";
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      render();
    });
    input.addEventListener("input", render);
    if (region) {
      region.addEventListener("change", render);
    }
    if (year) {
      year.addEventListener("change", render);
    }
    if (genre) {
      genre.addEventListener("change", render);
    }
    applyInitialQuery();
    render();
  }

  ready(function () {
    initMenu();
    initHero();
    initPlayer();
    initSearch();
  });
})();
