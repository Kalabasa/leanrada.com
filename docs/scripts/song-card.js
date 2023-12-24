
  (() => {
    const noop = () => {};
    let stopCurrentlyPlaying = noop;

    const songCards = document.querySelectorAll(".song-card");
    for (const songCard of songCards) {
      let isPlaying = false;

      const audio = songCard.querySelector(".song-card-audio");
      audio.style.display = "none";
      audio.addEventListener("timeupdate", () => {
        const progress = audio.currentTime / audio.duration;
        songCard.style.setProperty(
          "--song-card-progress",
          Math.round(progress * 10_000) / 100 + "%"
        );
      });
      audio.addEventListener("ended", () => {
        isPlaying = false;
        stopCurrentlyPlaying = noop;
        songCard.classList.toggle("song-card-playing", isPlaying);
      });

      const play = songCard.querySelector(".song-card-play");
      play.addEventListener("click", () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
          audio.play();
          stopCurrentlyPlaying();
          stopCurrentlyPlaying = () => {
            audio.pause();
            isPlaying = false;
            songCard.classList.toggle("song-card-playing", isPlaying);
          };
        } else {
          audio.pause();
          stopCurrentlyPlaying = noop;
        }

        songCard.classList.toggle("song-card-playing", isPlaying);
      });
    }
  })();
