import { H as Hls } from './hls.js';

const SELECTORS = {
  menuToggle: '[data-menu-toggle]',
  mobileNav: '[data-mobile-nav]',
  globalSearch: '[data-global-search]',
  filterForm: '[data-filter-form]',
  filterInput: '[data-filter-input]',
  filterRegion: '[data-filter-region]',
  filterType: '[data-filter-type]',
  filterYear: '[data-filter-year]',
  filterCount: '[data-filter-count]',
  searchableCard: '[data-searchable-card]',
  emptyState: '[data-empty-state]',
  player: '[data-player]',
  playButton: '[data-play-button]',
  playerError: '[data-player-error]',
  heroSlider: '[data-hero-slider]',
  heroPick: '[data-hero-pick]',
};

function ready(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
    return;
  }

  callback();
}

function initializeMobileMenu() {
  const toggle = document.querySelector(SELECTORS.menuToggle);
  const nav = document.querySelector(SELECTORS.mobileNav);

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
    toggle.textContent = nav.classList.contains('is-open') ? '×' : '☰';
  });
}

function initializeGlobalSearch() {
  document.querySelectorAll(SELECTORS.globalSearch).forEach((form) => {
    form.addEventListener('submit', (event) => {
      const input = form.querySelector('input[name="q"]');
      if (!input || !input.value.trim()) {
        event.preventDefault();
      }
    });
  });
}

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

function initializeFilters() {
  const forms = document.querySelectorAll(SELECTORS.filterForm);

  forms.forEach((form) => {
    const scope = form.closest('main') || document;
    const input = form.querySelector(SELECTORS.filterInput);
    const regionSelect = form.querySelector(SELECTORS.filterRegion);
    const typeSelect = form.querySelector(SELECTORS.filterType);
    const yearSelect = form.querySelector(SELECTORS.filterYear);
    const cards = Array.from(scope.querySelectorAll(SELECTORS.searchableCard));
    const count = scope.querySelector(SELECTORS.filterCount);
    const emptyState = scope.querySelector(SELECTORS.emptyState);
    const initialQuery = getQueryParam('q');

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function matches(card) {
      const query = normalize(input ? input.value : '');
      const region = normalize(regionSelect ? regionSelect.value : '');
      const type = normalize(typeSelect ? typeSelect.value : '');
      const year = normalize(yearSelect ? yearSelect.value : '');
      const searchText = normalize(card.dataset.search);

      if (query && !searchText.includes(query)) {
        return false;
      }

      if (region && normalize(card.dataset.region) !== region) {
        return false;
      }

      if (type && normalize(card.dataset.type) !== type) {
        return false;
      }

      if (year && normalize(card.dataset.year) !== year) {
        return false;
      }

      return true;
    }

    function applyFilter() {
      let visible = 0;

      cards.forEach((card) => {
        const isVisible = matches(card);
        card.hidden = !isVisible;
        if (isVisible) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = `共 ${visible} 部影片`;
      }

      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      applyFilter();
    });

    form.addEventListener('reset', () => {
      window.setTimeout(applyFilter, 0);
    });

    [input, regionSelect, typeSelect, yearSelect].forEach((control) => {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  });
}

function initializePlayers() {
  document.querySelectorAll(SELECTORS.player).forEach((player) => {
    const video = player.querySelector('video');
    const playButton = player.querySelector(SELECTORS.playButton);
    const errorBox = player.querySelector(SELECTORS.playerError);
    let hlsInstance = null;
    let loaded = false;

    if (!video) {
      return;
    }

    function showError(message) {
      if (errorBox) {
        errorBox.textContent = message;
        errorBox.hidden = false;
      }
    }

    function loadVideo() {
      if (loaded) {
        return Promise.resolve();
      }

      const source = video.dataset.m3u8;
      if (!source) {
        showError('当前影片暂时无法加载播放源。');
        return Promise.reject(new Error('Missing m3u8 source'));
      }

      loaded = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return Promise.resolve();
      }

      if (Hls && Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data && data.fatal) {
            showError('视频加载失败，请检查网络后重试。');
            if (hlsInstance) {
              hlsInstance.destroy();
              hlsInstance = null;
            }
            loaded = false;
          }
        });

        return new Promise((resolve) => {
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, resolve);
        });
      }

      showError('当前浏览器不支持 HLS 视频播放。');
      return Promise.reject(new Error('HLS is not supported'));
    }

    function startPlayback() {
      loadVideo()
        .then(() => video.play())
        .then(() => {
          player.classList.add('is-playing');
        })
        .catch((error) => {
          if (error && error.name === 'NotAllowedError') {
            showError('浏览器阻止了自动播放，请再次点击播放按钮。');
          }
        });
    }

    playButton?.addEventListener('click', startPlayback);
    video.addEventListener('click', () => {
      if (video.paused) {
        startPlayback();
      }
    });

    video.addEventListener('play', () => player.classList.add('is-playing'));
    video.addEventListener('pause', () => {
      if (!video.ended) {
        player.classList.remove('is-playing');
      }
    });
  });
}

function initializeHero() {
  const hero = document.querySelector(SELECTORS.heroSlider);

  if (!hero) {
    return;
  }

  const title = hero.querySelector('[data-hero-title]');
  const line = hero.querySelector('[data-hero-line]');
  const meta = hero.querySelector('[data-hero-meta]');
  const image = hero.querySelector('[data-hero-image]');
  const link = hero.querySelector('[data-hero-link]');
  const picks = Array.from(hero.querySelectorAll(SELECTORS.heroPick));

  picks.forEach((pick) => {
    pick.addEventListener('mouseenter', () => {
      if (title) {
        title.textContent = pick.dataset.title || title.textContent;
      }

      if (line) {
        line.textContent = pick.dataset.line || line.textContent;
      }

      if (meta) {
        const metaParts = String(pick.dataset.meta || '').split('·').map((item) => item.trim()).filter(Boolean);
        meta.innerHTML = metaParts.map((item) => `<span>${item}</span>`).join('');
      }

      if (image && pick.dataset.image) {
        image.src = pick.dataset.image;
        image.alt = pick.dataset.title || image.alt;
      }

      if (link) {
        link.href = pick.href;
      }
    });
  });
}

ready(() => {
  initializeMobileMenu();
  initializeGlobalSearch();
  initializeFilters();
  initializePlayers();
  initializeHero();
});
