(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      toggle.textContent = nav.classList.contains("open") ? "×" : "☰";
    });
  }

  function setupHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    start();
  }

  function setupSearch() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-movie-search]"));
    if (!inputs.length) {
      return;
    }
    inputs.forEach(function (input) {
      input.addEventListener("input", function () {
        var keyword = input.value.trim().toLowerCase();
        var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
        cards.forEach(function (card) {
          var text = [
            card.getAttribute("data-title") || "",
            card.getAttribute("data-tags") || "",
            card.getAttribute("data-region") || "",
            card.getAttribute("data-year") || "",
            card.textContent || ""
          ].join(" ").toLowerCase();
          card.classList.toggle("hidden-by-search", keyword && text.indexOf(keyword) === -1);
        });
      });
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
    players.forEach(function (player) {
      var video = player.querySelector("video[data-video]");
      if (!video) {
        return;
      }
      var source = video.getAttribute("data-video");
      var hlsInstance = null;

      function load() {
        if (!source || video.getAttribute("data-loaded") === "true") {
          return;
        }
        video.setAttribute("data-loaded", "true");
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else {
          video.src = source;
        }
      }

      function togglePlay() {
        load();
        if (video.paused) {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
          }
        } else {
          video.pause();
        }
      }

      function refreshState() {
        player.classList.toggle("is-playing", !video.paused);
        player.classList.toggle("is-paused", video.paused);
        Array.prototype.slice.call(player.querySelectorAll("[data-play-toggle]")).forEach(function (button) {
          if (button.classList.contains("big-play")) {
            return;
          }
          button.textContent = video.paused ? "播放" : "暂停";
        });
      }

      Array.prototype.slice.call(player.querySelectorAll("[data-play-toggle]")).forEach(function (button) {
        button.addEventListener("click", togglePlay);
      });

      var muteButton = player.querySelector("[data-mute-toggle]");
      if (muteButton) {
        muteButton.addEventListener("click", function () {
          video.muted = !video.muted;
          muteButton.textContent = video.muted ? "已静音" : "静音";
        });
      }

      var fullscreenButton = player.querySelector("[data-fullscreen]");
      if (fullscreenButton) {
        fullscreenButton.addEventListener("click", function () {
          if (video.requestFullscreen) {
            video.requestFullscreen();
          } else if (player.requestFullscreen) {
            player.requestFullscreen();
          }
        });
      }

      video.addEventListener("click", togglePlay);
      video.addEventListener("play", refreshState);
      video.addEventListener("pause", refreshState);
      video.addEventListener("ended", refreshState);
      refreshState();
      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  onReady(function () {
    setupMenu();
    setupHero();
    setupSearch();
    setupPlayers();
  });
})();
