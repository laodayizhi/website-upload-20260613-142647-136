(function () {
    var root = document.body ? document.body.getAttribute("data-root") || "./" : "./";

    function all(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    function one(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function bindNavigation() {
        var button = one("[data-nav-toggle]");
        var nav = one("[data-mobile-nav]");
        if (!button || !nav) {
            return;
        }
        button.addEventListener("click", function () {
            nav.classList.toggle("is-open");
            button.textContent = nav.classList.contains("is-open") ? "×" : "☰";
        });
    }

    function bindHero() {
        var slides = all("[data-hero-slide]");
        var dots = all("[data-hero-dot]");
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, position) {
                slide.classList.toggle("is-active", position === index);
            });
            dots.forEach(function (dot, position) {
                dot.classList.toggle("is-active", position === index);
            });
        }

        dots.forEach(function (dot, position) {
            dot.addEventListener("click", function () {
                show(position);
                if (timer) {
                    clearInterval(timer);
                }
                timer = setInterval(function () {
                    show(index + 1);
                }, 6200);
            });
        });

        timer = setInterval(function () {
            show(index + 1);
        }, 6200);
    }

    function cardText(card) {
        return normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-year"),
            card.getAttribute("data-region"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-category"),
            card.textContent
        ].join(" "));
    }

    function bindFilters() {
        all("[data-filter-panel]").forEach(function (panel) {
            var input = one("[data-filter-input]", panel);
            var sort = one("[data-sort-select]", panel);
            var section = panel.parentElement;
            var grid = one("[data-card-grid]", section);
            var empty = one("[data-empty-state]", section);
            if (!grid) {
                return;
            }
            var cards = all("[data-movie-card]", grid);
            cards.forEach(function (card, position) {
                card.setAttribute("data-order", String(position));
                card.setAttribute("data-search-text", cardText(card));
            });

            function applyFilter() {
                var query = normalize(input ? input.value : "");
                var visible = 0;
                cards.forEach(function (card) {
                    var matched = !query || card.getAttribute("data-search-text").indexOf(query) !== -1;
                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }

            function applySort() {
                var value = sort ? sort.value : "default";
                var ordered = cards.slice();
                ordered.sort(function (a, b) {
                    if (value === "year-desc") {
                        return Number(b.getAttribute("data-year") || 0) - Number(a.getAttribute("data-year") || 0);
                    }
                    if (value === "year-asc") {
                        return Number(a.getAttribute("data-year") || 0) - Number(b.getAttribute("data-year") || 0);
                    }
                    if (value === "title") {
                        return String(a.getAttribute("data-title") || "").localeCompare(String(b.getAttribute("data-title") || ""), "zh-Hans-CN");
                    }
                    return Number(a.getAttribute("data-order") || 0) - Number(b.getAttribute("data-order") || 0);
                });
                ordered.forEach(function (card) {
                    grid.appendChild(card);
                });
            }

            if (input) {
                input.addEventListener("input", applyFilter);
            }
            if (sort) {
                sort.addEventListener("change", function () {
                    applySort();
                    applyFilter();
                });
            }
            applySort();
            applyFilter();
        });
    }

    function bindSearchPage() {
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        var pageSearch = one("[data-page-search]");
        var filterInput = one("[data-filter-input]");
        if (pageSearch && query) {
            pageSearch.value = query;
        }
        if (filterInput && query) {
            filterInput.value = query;
            filterInput.dispatchEvent(new Event("input"));
        }
    }

    function loadVideo(video, block) {
        var source = video.getAttribute("data-video");
        if (!source || video.getAttribute("data-loaded") === "true") {
            if (video.play) {
                video.play().catch(function () {});
            }
            return;
        }
        video.setAttribute("data-loaded", "true");
        block.classList.add("is-loading");
        var play = function () {
            block.classList.remove("is-loading");
            block.classList.add("is-playing");
            video.play().catch(function () {});
        };
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
            video.addEventListener("loadedmetadata", play, { once: true });
            video.load();
            play();
            return;
        }
        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(source);
            hls.attachMedia(video);
            if (window.Hls.Events && window.Hls.Events.MANIFEST_PARSED) {
                hls.on(window.Hls.Events.MANIFEST_PARSED, play);
            } else {
                video.addEventListener("canplay", play, { once: true });
            }
            hls.on(window.Hls.Events.ERROR, function (event, data) {
                if (!data || !data.fatal) {
                    return;
                }
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                    hls.startLoad();
                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                } else {
                    hls.destroy();
                    video.src = source;
                    video.load();
                }
            });
            return;
        }
        video.src = source;
        video.addEventListener("loadedmetadata", play, { once: true });
        video.load();
        play();
    }

    function bindPlayers() {
        all("[data-player]").forEach(function (block) {
            var video = one("video", block);
            var button = one(".play-overlay", block);
            if (!video) {
                return;
            }
            var start = function () {
                loadVideo(video, block);
            };
            if (button) {
                button.addEventListener("click", start);
            }
            video.addEventListener("click", function () {
                if (video.getAttribute("data-loaded") !== "true") {
                    start();
                }
            });
            video.addEventListener("play", function () {
                block.classList.add("is-playing");
            });
            video.addEventListener("pause", function () {
                if (!video.ended && video.getAttribute("data-loaded") === "true") {
                    block.classList.add("is-playing");
                }
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        bindNavigation();
        bindHero();
        bindFilters();
        bindSearchPage();
        bindPlayers();
    });
})();
