export function renderFeatureCard({
  attrs = "",
  href,
  media = undefined,
  title,
  description,
}) {
  const mediaElement = renderMediaElement({
    media,
    title,
  });

  return html`
    <feature-card ${attrs}>
      <a href="${href}">
        ${mediaElement}
        <hgroup>
          <h1>${title}</h1>
        </hgroup>
        <p>${description}</p>
      </a>
    </feature-card>
  `;
}
function renderMediaElement({ media, title }) {
  if (!media) {
    const text = title.replace(/[^A-Za-z]/g, "").toLowerCase();
    const color =
      "#" +
      randomFF(text.length) +
      randomFF(text.length + 1) +
      randomFF(text.length + 2);
    return html`<media-placeholder style="background:${color}">
      ${text.repeat(Math.ceil(55 / (text.length + 1)))}
    </media-placeholder>`;
  }
  if (media.endsWith(".mp4")) {
    return html`<video
      muted
      autoplay
      loop
      playsinline
      src="${media}"
      loading="lazy"
    ></video>`;
  } else {
    return html`<img src="${media}" loading="lazy" />`;
  }
}

function randomFF(seed) {
  return Math.floor(128 + ((seed * 6394) % 67))
    .toString(16)
    .padStart(2, "0");
}
