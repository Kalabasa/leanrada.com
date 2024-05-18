const generateMediaHTML = (() => {
  function generateHTML(type, id) {
    switch (type) {
      case "youtube":
        return generateYouTube(id);
      case "soundcloud":
        return generateSoundCloud(id);
      case "spotify":
        return generateSpotify(id);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  function generateSoundCloud(id) {
    return `<iframe width="100%" height="150" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${id}&color=%23e95961&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe>`;
  }

  function generateYouTube(id) {
    return `<iframe width="100%" height="150" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
  }

  function generateSpotify(id) {
    return `<iframe src="https://open.spotify.com/embed/track/${id}" width="100%" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
  }

  return generateHTML;
})();
