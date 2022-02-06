const TYPE_WEB = 'web';
const TYPE_GAME = 'game';
const TYPE_MUSIC = 'music';
const TYPE_ART = 'art';

export default {
  featured_projects: ["dimensions", "wikawik", "hypertangram"],
  projects: [
    {
      id: "genuary2022",
      name: "Genuary 2022",
      short_description: "Generative art challenge.",
      tech: ["p5.js"],
      image: {
        src: "img/genuary2022_thumb.jpg",
        alt: "pieces",
      },
      type: TYPE_ART,
      tags: ["processing", "art"],
    },
    {
      id: "miniforts",
      name: "MiniForts",
      links: [{ name: "Github", url: "https://github.com/Kalabasa/mini_forts" }],
      short_description: "Mini base-builder RTS game.",
      tech: ["Minetest", "Typescript", "Lua"],
      image: {
        src: "img/miniforts_thumb.png",
        alt: "screenshot",
      },
      type: TYPE_GAME,
      tags: ["game", "videogame", "gamedev"],
    },
    {
      id: "wikawik",
      name: "Wikawik",
      links: [{ name: "Web", url: "https://kalabasa.github.io/wikawik/" }],
      short_description: "Interactive language map of the Philippines.",
      tech: ["D3.js"],
      image: {
        src: "img/wikawik.jpg",
        alt: "screenshot",
      },
      type: TYPE_WEB,
      tags: ["web", "d3js", "app", "language", "map", "visualization"],
    },
    {
      id: "sheetz",
      name: "Sheetz",
      links: [{ name: "Web", url: "https://kalabasa.github.io/sheetz/" }],
      short_description: "Simple spreadsheet clone.",
      tech: ["Svelte"],
      image: {
        src: "img/sheetz.jpg",
        alt: "screenshot",
      },
      type: TYPE_WEB,
      tags: ["web", "app", "svelte", "tiny"],
    },
    {
      id: "isolation",
      name: "Isolation",
      links: [
        {
          name: "Spotify",
          url:
            "https://open.spotify.com/track/4kgEsArxnTj7UKsBJhYflk?si=xAtOncLWRPq64bPX4A5Vdw",
        },
      ],
      short_description: "Chill music to quarantine to.",
      tech: ["LMMS", "Audacity"],
      image: {
        src: "img/isolation.jpg",
        alt: "album art",
      },
      type: TYPE_MUSIC,
      tags: ["art", "music", "jazz", "jazzhop", "chillhop"],
    },
    {
      id: "canvapasko",
      name: "#CanvaPasko",
      links: [{ name: "Web", url: "https://www.canva.com/canvapasko/" }],
      short_description: "Canva’s Christmas billboard design contest!",
      tech: ["React"],
      image: {
        src: "img/canvapasko_thumb.jpg",
        alt: "screenshot",
      },
      type: TYPE_WEB,
      tags: ["web", "animation", "reactjs", "css", "canva", "christmas"],
    },
    {
      id: "dimensions",
      name: "Dimensions",
      short_description: "Generative art and augmented reality.",
      tech: ["three.js", "Vue.js", "Computer vision"],
      image: {
        src: "img/dimensions_thumb.jpg",
        alt: "clip of piece",
      },
      type: TYPE_ART,
      tags: ["vue", "art", "3d", "ar"],
    },
    {
      id: "canvaphotoeditor",
      name: "Canva’s Photo Editor",
      links: [{ name: "Web", url: "https://www.canva.com/photo-editor/" }],
      short_description: "Simple photo editor by Canva.",
      tech: ["React", "MobX", "WebGL"],
      image: {
        src: "img/canvaphotoeditor_thumb.jpg",
        alt: "screenshot",
      },
      type: TYPE_WEB,
      tags: ["web", "app", "reactjs", "webpack", "webgl", "tool", "canva"],
    },
    {
      id: "canvalogomaker",
      name: "Canva’s Logo Maker Page",
      links: [{ name: "Web", url: "https://www.canva.com/tools/logo-maker/" }],
      short_description: "Logo generator using Canva.",
      tech: ["JS", "HTML5", "SCSS"],
      image: {
        src: "img/canvalogomaker_0.jpg",
        alt: "screenshot",
      },
      type: TYPE_WEB,
      tags: ["web", "animation", "css", "tool", "canva"],
    },
    {
      id: "canvaenterprise",
      name: "Canva’s Enterprise Page",
      links: [
        {
          name: "Web",
          url:
            "https://web.archive.org/web/20190401230423/https://about.canva.com/enterprise/",
        },
      ],
      short_description: "Page presenting Canva’s Enterprise offering.",
      tech: ["HTML5", "SCSS", "JS"],
      image: {
        src: "img/canvaenterprise_0.jpg",
        alt: "screenshot",
      },
      type: TYPE_WEB,
      tags: ["web", "animation", "css", "canva"],
    },
    {
      id: "kalabasa",
      name: "kalabasa.github.io",
      short_description: "My portfolio and personal site.",
      tech: ["HTML5", "Stylus", "Javascript"],
      image: {
        src: "img/kalabasa_0.jpg",
        alt: "screenshot of intro page",
      },
      type: TYPE_WEB,
      tags: ["web", "website", "ui", "rollup", "handlebars", "animation"],
    },
    {
      id: "heartgame",
      name: "Heart Game",
      short_description: "A very simple casual game.",
      tech: ["HTMl5", "Javascript"],
      image: {
        src: "img/heartgame.jpg",
        alt: "game visual",
      },
      type: TYPE_GAME,
      tags: ["web", "game", "videogame", "gamedev", "tiny"],
    },
    {
      id: "hypertangram",
      name: "Hypertangram",
      links: [
        {
          name: "Google Play",
          url:
            "https://play.google.com/store/apps/details?id=com.kalabasagames.hypertangram",
        },
      ],
      short_description: "Mobile puzzle game about packing shapes together.",
      tech: ["Android", "Kotlin", "Realm", "Robolectric"],
      image: {
        src: "img/hypertangram_0.jpg",
        alt: "screenshot of gameplay",
      },
      type: TYPE_GAME,
      tags: [
        "mobile",
        "game",
        "videogame",
        "gamedev",
        "design",
        "java",
        "android",
        "ux",
        "graphics",
        "music",
        "app",
      ],
    },
    {
      id: "arosybrokenalbum",
      name: "A Rosy Broken Album",
      links: [
        {
          name: "Soundcloud",
          url: "https://soundcloud.com/lreaadna/sets/a-rosy-broken-album",
        },
      ],
      short_description: "Solo piano pieces about feelings.",
      image: {
        src: "img/arosybrokenalbum_0.jpg",
        alt: "cover art",
      },
      type: TYPE_MUSIC,
      tags: ["art", "music", "piano"],
    },
    {
      id: "freeformgesturedetector",
      name: "FreeformGestureDetector",
      links: [
        {
          name: "Github",
          url: "https://github.com/Kalabasa/FreeformGestureDetector/",
        },
        {
          name: "Android Arsenal",
          url: "https://android-arsenal.com/details/1/6939",
        },
      ],
      short_description: "Multi-touch transform gesture detector for Android.",
      tech: ["Android", "Kotlin"],
      image: {
        src: "img/freeformgesturedetector_head.png",
        alt: "illustration",
      },
      tags: ["library", "java", "android", "open source", "hypertangram"],
    },
    {
      id: "planetdefense",
      name: "PlanetDefense",
      links: [{ name: "Web", url: "https://kalabasa.github.io/PlanetDefense" }],
      short_description:
        "Game made in 48 hours for Ludum Dare 38: A Small World",
      full_description:
        "Web game similar to Missile Command, but it’s circular and it’s made in 48 hours as entry for the popular game jam Ludum Dare.",
      tech: ["Javascript", "PixiJS"],
      image: {
        src: "img/planetdefense_0.jpg",
        alt: "screenshot of gameplay",
      },
      type: TYPE_GAME,
      tags: ["web", "game", "videogame", "gamedev", "pixi"],
    },
    {
      id: "conversations",
      name: "Conversations EP",
      links: [
        {
          name: "Spotify",
          url: "https://open.spotify.com/album/2LEKLuoWYauyAlQ8JwoPc2",
        },
        {
          name: "Bandcamp",
          url: "http://lreaadna.bandcamp.com/album/conversations",
        },
      ],
      short_description: "Chill jazzhop music",
      full_description:
        "Four-piece composition of mellow hip-hop beats, jazz harmony, and mild piano improvisations. Influences range from jazz, funk, and bossa nova to lo-fi, hip-hop, and new-age.",
      tech: ["LMMS", "Audacity"],
      image: {
        src: "img/conversations_0.jpg",
        alt: "album art",
      },
      type: TYPE_MUSIC,
      tags: ["art", "music", "jazz", "jazzhop", "chillhop"],
    },
    {
      id: "dynastymap",
      name: "DynastyMap",
      short_description: "Philippine political dynasty visualization system",
      full_description:
        "System that processes election results and visualizes dynasty data. Features choropleth map plus tag cloud overlay for insightful visualization.",
      tech: [
        "React",
        "Backbone.js",
        "Mapbox",
        "D3.js",
        "Material Design",
        "PHP",
        "Python",
      ],
      image: {
        src: "img/dynastymap_0.jpg",
        alt: `screenshot of welcome screen`,
      },
      type: TYPE_WEB,
      tags: [
        "web",
        "reactjs",
        "backbonejs",
        "mapboxjs",
        "leaflet",
        "d3js",
        "politics",
        "app",
        "map",
        "visualization",
      ],
    },
  ],

  jobs: [
    {
      name: "Frontend Engineer",
      company: "Canva",
      date: ["2018", "now"],
      tech: ["React", "Node", "TypeScript", "Java", "GraphQL", "Storybook", "MobX"],
      description: "Building all sorts of stuff. 🚀",
      thumbnail: {
        src: "img/thumb-canva.png",
        alt: "Canva logo",
      },
    },
    {
      name: "Web Developer",
      company: "Azeus",
      date: ["2017", "2018"],
      tech: [
        "Vue.js",
        "Webpack",
        "Spring Boot",
        "TypeScript",
        "Java",
        "Stylus",
      ],
      description: "Full-stack web development.",
      thumbnail: {
        src: "img/thumb-azeus.png",
        alt: "Azeus logo",
      },
    },
    {
      name: "Android Developer",
      company: "Azeus",
      date: ["2015", "2017"],
      tech: ["Android", "Android Studio", "Java", "SQLite"],
      description:
        "Worked on the Android app for the digital meetings and collaboration system called <a target='_blank' href='https://www.azeusconvene.com/'>Convene</a>.",
      thumbnail: {
        src: "img/thumb-convene.png",
        alt: "Convene logo",
      },
    },
    {
      name: "Software Engineering Intern",
      company: "Azeus",
      date: ["2014"],
      tech: ["Android", "WebSocket", "Java"],
      description:
        "Worked on a peer-to-peer multiplayer card game on Android that features a disturbing Easter egg.",
      thumbnail: {
        src: "img/thumb-azeus.png",
        alt: "Azeus logo",
      },
    },
    {
      name: "Flash Developer",
      alt_company: "Freelance",
      date: ["2009"],
      tech: [
        "ActionScript 3.0",
        "ActionScript 2.0",
        "Adobe Flash",
        "FlashDevelop",
        "Macromedia Flash",
      ],
      description:
        "Created interactive animated Internet ads in Flash. Indirectly contributed to the rise of ad-blockers.",
        thumbnail: {
          src: "img/thumb-free-flash.png",
          alt: "",
        },
    },
    {
      name: "Powerpoint “Engineer”",
      alt_company: "Freelance",
      date: ["2009"],
      tech: ["Photoshop", "Powerpoint", "ACD/ChemSketch"],
      description:
        "Illustrated, animated, and created <em>interactive</em> biochemistry learning materials for some learning institute. In Powerpoint.",
        thumbnail: {
          src: "img/thumb-free-ppt.png",
          alt: "",
        },
    },
  ],

  links: [
    {
      name: "Email",
      img: "img/icon-mail.svg",
      href: "mailto:lgmrada@gmail.com",
    },
    {
      name: "Github",
      img: "img/icon-github.svg",
      href: "https://github.com/Kalabasa",
    },
    {
      name: "LinkedIn",
      img: "img/icon-linkedin.svg",
      href: "https://www.linkedin.com/in/lean-godffrey-rada",
    },
    {
      name: "CodePen",
      img: "img/icon-codepen.svg",
      href: "https://codepen.io/kalabasa/",
    },
    {
      name: "Spotify",
      img: "img/icon-music.svg",
      href: "https://open.spotify.com/artist/7tsco1RLCeUP0UpN3hl5JS?si=VhGKoCxrRMaO6kdL_gGsXA",
    },
    {
      name: "Soundcloud",
      img: "img/icon-music.svg",
      href: "https://soundcloud.com/lreaadna",
    },
  ],
};
