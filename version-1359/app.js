(function () {
  function setupMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-main-nav]');
    if (!button || !nav) return;
    button.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    if (!slides.length) return;
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function setupSearchAreas() {
    var areas = Array.prototype.slice.call(document.querySelectorAll('[data-search-area]'));
    areas.forEach(function (area) {
      var form = area.querySelector('[data-search-form]');
      var input = area.querySelector('[data-search-input]');
      var chips = Array.prototype.slice.call(area.querySelectorAll('[data-filter]'));
      var cards = Array.prototype.slice.call(area.querySelectorAll('[data-movie-card]'));
      var empty = area.querySelector('[data-empty-state]');
      var keyword = '';
      var filter = '';

      function apply() {
        var shown = 0;
        cards.forEach(function (card) {
          var searchText = (card.getAttribute('data-search') || '').toLowerCase();
          var typeText = card.getAttribute('data-type') || '';
          var matchKeyword = !keyword || searchText.indexOf(keyword) !== -1;
          var matchFilter = !filter || typeText.indexOf(filter) !== -1;
          var visible = matchKeyword && matchFilter;
          card.style.display = visible ? '' : 'none';
          if (visible) shown += 1;
        });
        if (empty) empty.classList.toggle('show', shown === 0);
      }

      if (form) {
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          keyword = input ? input.value.trim().toLowerCase() : '';
          apply();
        });
      }

      if (input) {
        input.addEventListener('input', function () {
          keyword = input.value.trim().toLowerCase();
          apply();
        });
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (item) {
            item.classList.remove('active');
          });
          chip.classList.add('active');
          filter = chip.getAttribute('data-filter') || '';
          apply();
        });
      });
    });
  }

  window.initMoviePlayer = function (streamUrl) {
    var video = document.getElementById('movie-video');
    var overlay = document.getElementById('player-overlay');
    var button = document.getElementById('play-button');
    if (!video || !streamUrl) return;
    var ready = false;
    var hls = null;

    function prepare() {
      if (ready) return;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
      ready = true;
    }

    function play(event) {
      if (event) event.preventDefault();
      prepare();
      video.controls = true;
      if (overlay) overlay.classList.add('is-hidden');
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    }

    if (overlay) overlay.addEventListener('click', play);
    if (button) button.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (!ready || video.paused) play();
    });
    window.addEventListener('pagehide', function () {
      if (hls && typeof hls.destroy === 'function') hls.destroy();
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupSearchAreas();
  });
})();
