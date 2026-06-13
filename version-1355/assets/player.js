(function () {
    function bindStream(video, source) {
        if (video.dataset.ready === '1') {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            video.dataset.ready = '1';
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });

            hls.loadSource(source);
            hls.attachMedia(video);
            video.dataset.ready = '1';
            video._hlsInstance = hls;
            return;
        }

        video.dataset.ready = '0';
    }

    window.initMoviePlayer = function (videoId, triggerId, source) {
        var video = document.getElementById(videoId);
        var trigger = document.getElementById(triggerId);

        if (!video || !trigger || !source) {
            return;
        }

        function startPlayback() {
            bindStream(video, source);
            trigger.classList.add('is-hidden');

            var promise = video.play();

            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                    trigger.classList.remove('is-hidden');
                });
            }
        }

        trigger.addEventListener('click', startPlayback);

        video.addEventListener('click', function () {
            if (video.paused) {
                startPlayback();
            }
        });

        video.addEventListener('play', function () {
            trigger.classList.add('is-hidden');
        });

        video.addEventListener('pause', function () {
            if (!video.ended) {
                trigger.classList.remove('is-hidden');
            }
        });

        video.addEventListener('ended', function () {
            trigger.classList.remove('is-hidden');
        });
    };
})();
