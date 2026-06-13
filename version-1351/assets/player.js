const activePlayers = new WeakMap();

async function attachStream(video, streamUrl) {
  if (activePlayers.has(video)) {
    return;
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = streamUrl;
    activePlayers.set(video, true);
    return;
  }

  const module = await import("./hls.js");
  const Hls = module.H;

  if (Hls && Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });

    await new Promise((resolve, reject) => {
      hls.on(Hls.Events.MANIFEST_PARSED, resolve);
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data && data.fatal) {
          reject(new Error("load"));
        }
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    });

    activePlayers.set(video, hls);
    return;
  }

  throw new Error("support");
}

export function startMoviePlayer(streamUrl, videoId, wrapperId) {
  const video = document.getElementById(videoId || "mainVideo");
  const wrapper = document.getElementById(wrapperId || "moviePlayer");
  const cover = wrapper ? wrapper.querySelector(".player-cover") : null;
  const message = wrapper ? wrapper.querySelector(".player-message") : null;

  if (!video || !wrapper) {
    return;
  }

  async function begin() {
    if (message) {
      message.classList.remove("is-visible");
      message.textContent = "";
    }

    try {
      await attachStream(video, streamUrl);
      if (cover) {
        cover.classList.add("is-hidden");
      }
      video.controls = true;
      await video.play();
    } catch (error) {
      if (message) {
        message.textContent = "视频加载失败，请稍后再试";
        message.classList.add("is-visible");
      }
    }
  }

  if (cover) {
    cover.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      begin();
    });
  }

  video.addEventListener("click", () => {
    if (video.paused) {
      begin();
    }
  });
}
