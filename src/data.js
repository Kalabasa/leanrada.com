// data for the whole site!
export default {
	projects: [
		{
			name: "Hypertangram",
			links: [{ name: "Google Play", url: "https://play.google.com/store/apps/details?id=com.kalabasagames.hypertangram" }],
			short_description: "Mobile puzzle game about packing shapes together",
			full_description: "Android game that features tangram with a twist. Pieces can be resized, adding a new dimension to the classic puzzle.",
			tech: ["Android", "Kotlin", "Realm", "Robolectric"],
			image: {
				src: "img/hypertangram_0.png",
				title: "screenshot of Hypertangram gameplay"
			}
		},
		{
			name: "PlanetDefense",
			links: [{ name: "Web", url: "https://kalabasa.github.io/PlanetDefense" }],
			short_description: "Game made in 48 hours for Ludum Dare 38: A Small World",
			full_description: "Web game similar to Missile Command, but it's circular and it's made in 48 hours as entry for the popular game jam Ludum Dare.",
			tech: ["Javascript", "PixiJS"],
			image: {
				src: "img/planetdefense_0.jpg",
				title: "screenshot of PlanetDefense gameplay"
			},
		},
		{
			name: "DynastyMap",
			short_description: "Philippine political dynasty visualization system",
			full_description: "System that processes election results and visualizes dynasty data. Features choropleth map plus tag cloud overlay for insightful visualization.",
			tech: ["React", "Backbone.js", "Mapbox", "D3.js", "Material Design", "PHP", "Python"],
			image: {
				src: "img/dynastymap_0.jpg",
				title: "screenshot of DynastyMap's welcome screen"
			}
		},
		{
			name: "Conversations EP",
		 	links: [
				{ name: "Spotify", url: "https://open.spotify.com/album/2LEKLuoWYauyAlQ8JwoPc2" },
				{ name: "Bandcamp", url: "http://lreaadna.bandcamp.com/album/conversations" }
			],
			short_description: "Chill jazzhop music",
			full_description: "Four-piece composition of mellow hip-hop beats, jazz harmony, and mild piano improvisations. Influences range from jazz, funk, and bossa nova to lo-fi, hip-hop, and new-age.",
			tech: ["LMMS", "Audacity"],
			image: {
				src: "img/conversations_0.jpg",
				title: "Conversations album art"
			}
		}
	],

	jobs: [
		// {
		// 	name: "Frontend Engineer",
		// 	company: "Canva",
		// 	date: ["2018"],
		// 	tech: [],
		// 	description: "TBA"
		// },
		{
			name: "Web Developer",
			company: "Azeus",
			date: ["2017", "2018"],
			tech: ["Vue.js", "Webpack", "Spring Boot", "Gradle", "JasperReports", "TypeScript", "Java"],
			description: "Full-stack web and systems development."
		},
		{
			name: "Android Developer",
			company: "Azeus",
			date: ["2015", "2017"],
			tech: ["Android", "Android Studio", "Java", "SQLite"],
			description: "Worked on the Android app for the digital meetings and collaboration system called <a target='_blank' href='https://www.azeusconvene.com/'>Convene</a>."
		},
		{
			name: "Software Engineering Intern",
			company: "Azeus",
			date: ["2014"],
			tech: ["Android", "AndEngine", "Vert.x", "Java"],
			description: "Worked on a peer-to-peer multiplayer card game on Android that features a disturbing Easter egg.",
		},
		{
			name: "Flash Developer",
			alt_company: "Freelance",
			date: ["2009"],
			tech: ["ActionScript 3.0", "ActionScript 2.0", "Adobe Flash", "FlashDevelop", "Macromedia Flash"],
			description: "Created animated, sometimes interactive, Internet advertisements. Indirectly contributed to the rise of ad-blockers."
		},
		{
			name: "Powerpoint “Engineer”",
			alt_company: "Freelance",
			date: ["2009"],
			tech: ["Photoshop", "Powerpoint"],
			description: "Illustrated, animated, and created <em>interactive</em> biochemistry learning materials for some learning institute. In Powerpoint."
		}
	],

	links: [
		{ name: "Email", img: "img/icon-mail.svg", href: "mailto:lgmrada@gmail.com" },
		{ name: "Github", img: "img/icon-github.svg", href: "https://github.com/Kalabasa" },
		{ name: "LinkedIn", img: "img/icon-linkedin.svg", href: "https://ph.linkedin.com/in/lean-godffrey-rada" },
		{ name: "Soundcloud", img: "img/icon-music.svg", href: "https://soundcloud.com/lreaadna" },
		{ name: "Ludum Dare", img: "img/icon-game.svg", href: "https://ldjam.com/users/kalabasa/games" },
		// { name: "Ludum Dare (Legacy)", img: "img/icon-game.svg", href: "http://legacy.ludumdare.com/compo/author/kalabasa/" },
	],
};
