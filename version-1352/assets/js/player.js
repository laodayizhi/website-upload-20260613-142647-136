(function () {
    function setupPlayer(box) {
        var video = box.querySelector('video');
        var cover = box.querySelector('[data-play]');
        var stream = box.getAttribute('data-stream');
        var hls = null;
        var loaded = false;
        var readyPromise = null;

        function markReady(resolve) {
            window.setTimeout(resolve, 120);
        }

        function loadStream() {
            if (readyPromise) {
                return readyPromise;
            }

            readyPromise = new Promise(function (resolve) {
                if (!video || !stream) {
                    resolve();
                    return;
                }

                if (loaded) {
                    resolve();
                    return;
                }

                loaded = true;

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = stream;
                    video.load();
                    markReady(resolve);
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(stream);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        resolve();
                    });
                    hls.on(window.Hls.Events.ERROR, function (eventName, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            hls.startLoad();
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            hls.recoverMediaError();
                            return;
                        }
                        hls.destroy();
                    });
                    markReady(resolve);
                    return;
                }

                video.src = stream;
                video.load();
                markReady(resolve);
            });

            return readyPromise;
        }

        function hideCover() {
            if (cover) {
                cover.classList.add('is-hidden');
            }
        }

        function showCover() {
            if (cover && video && video.currentTime === 0) {
                cover.classList.remove('is-hidden');
            }
        }

        function startVideo() {
            loadStream().then(function () {
                if (!video) {
                    return;
                }
                hideCover();
                var attempt = video.play();
                if (attempt && typeof attempt.catch === 'function') {
                    attempt.catch(function () {
                        showCover();
                    });
                }
            });
        }

        if (cover) {
            cover.addEventListener('click', startVideo);
        }

        if (video) {
            video.addEventListener('click', function () {
                if (video.paused) {
                    startVideo();
                }
            });
            video.addEventListener('play', hideCover);
            video.addEventListener('pause', showCover);
            video.addEventListener('ended', showCover);
        }
    }

    document.querySelectorAll('[data-player]').forEach(setupPlayer);
}());
