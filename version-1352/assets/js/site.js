(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-hero]').forEach(function (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }

        function start() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                start();
            });
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                start();
            });
        });

        show(0);
        start();
    });

    document.querySelectorAll('[data-search-area]').forEach(function (area) {
        var input = area.querySelector('[data-search-input]');
        var cards = Array.prototype.slice.call(area.querySelectorAll('[data-keywords]'));
        if (!cards.length) {
            cards = Array.prototype.slice.call(document.querySelectorAll('[data-keywords]'));
        }
        var buttons = Array.prototype.slice.call(area.querySelectorAll('[data-filter]'));
        var activeFilter = '';

        function normalize(value) {
            return String(value || '').toLowerCase().trim();
        }

        function apply() {
            var query = normalize(input ? input.value : '');
            cards.forEach(function (card) {
                var keywords = normalize(card.getAttribute('data-keywords'));
                var matchedQuery = !query || keywords.indexOf(query) !== -1;
                var matchedFilter = !activeFilter || keywords.indexOf(normalize(activeFilter)) !== -1;
                card.classList.toggle('is-hidden-by-search', !(matchedQuery && matchedFilter));
            });
        }

        if (input) {
            input.addEventListener('input', apply);
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                activeFilter = button.getAttribute('data-filter') || '';
                buttons.forEach(function (item) {
                    item.classList.toggle('is-active', item === button);
                });
                apply();
            });
        });
    });
}());
