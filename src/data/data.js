import _ from 'lodash';

// data for the whole site!
export default {
	featured_projects: [ 'hypertangram', 'planetdefense', 'conversations' ],
	projects: [
		{
			id: 'kalabasa',
			name: 'kalabasa.github.io',
			short_description: 'My portfolio and personal site.',
			tech: ['HTML5', 'Stylus', 'Javascript'],
			image: {
				src: 'img/kalabasa_0.jpg',
				alt: 'screenshot of intro page'
			},
			tags: ['css', 'css3', 'portfolio', 'web', 'js', 'rollup', 'ui', 'animation'],
		},
		{
			id: 'hypertangram',
			name: 'Hypertangram',
			links: [{ name: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.kalabasagames.hypertangram' }],
			short_description: 'Mobile puzzle game about packing shapes together.',
			tech: ['Android', 'Kotlin', 'Realm', 'Robolectric'],
			image: {
				src: 'img/hypertangram_0.jpg',
				alt: 'screenshot of gameplay'
			},
			tags: ['game', 'videogame', 'game design', 'java', 'android', 'google play', 'gamedev', 'tangram', 'puzzle', 'ux', 'graphics', 'music', 'sound effects'],
		},
		{
			id: 'arosybrokenalbum',
			name: 'A Rosy Broken Album',
			links: [{ name: 'Soundcloud', url: 'https://soundcloud.com/lreaadna/sets/a-rosy-broken-album' }],
			short_description: 'Solo piano pieces about feelings.',
			image: {
				src: 'img/arosybrokenalbum_0.jpg',
				alt: 'cover art',
			},
			tags: ['music', 'piano', 'solo'],
		},
		{
			id: 'freeformgesturedetector',
			name: 'FreeformGestureDetector',
			links: [
				{ name: 'Github', url: 'https://github.com/Kalabasa/FreeformGestureDetector/' },
				{ name: 'Android Arsenal', url: 'https://android-arsenal.com/details/1/6939' },
			],
			short_description: 'Multi-touch transform gesture detector for Android.',
			tech: ['Android', 'Kotlin'],
			image: {
				src: 'img/freeformgesturedetector_head.png',
				alt: 'illustration',
			},
			tags: ['library', 'java', 'android', 'open source', 'hypertangram', 'gesture', 'ui'],
		},
		{
			id: 'planetdefense',
			name: 'PlanetDefense',
			links: [{ name: 'Web', url: 'https://kalabasa.github.io/PlanetDefense' }],
			short_description: 'Game made in 48 hours for Ludum Dare 38: A Small World',
			full_description: `Web game similar to Missile Command, but it's circular and it's made in 48 hours as entry for the popular game jam Ludum Dare.`,
			tech: ['Javascript', 'PixiJS'],
			image: {
				src: 'img/planetdefense_0.jpg',
				alt: 'screenshot of gameplay'
			},
			tags: ['game', 'videogame', 'js', 'pixi', 'html', 'html5', 'canvas', 'gamedev', 'planet'],
		},
		{
			id: 'conversations',
			name: 'Conversations EP',
		 	links: [
				{ name: 'Spotify', url: 'https://open.spotify.com/album/2LEKLuoWYauyAlQ8JwoPc2' },
				{ name: 'Bandcamp', url: 'http://lreaadna.bandcamp.com/album/conversations' }
			],
			short_description: 'Chill jazzhop music',
			full_description: 'Four-piece composition of mellow hip-hop beats, jazz harmony, and mild piano improvisations. Influences range from jazz, funk, and bossa nova to lo-fi, hip-hop, and new-age.',
			tech: ['LMMS', 'Audacity'],
			image: {
				src: 'img/conversations_0.jpg',
				alt: 'album art'
			},
			tags: ['music', 'jazz', 'jazzhop', 'chillhop', 'art'],
		},
		{
			id: 'dynastymap',
			name: 'DynastyMap',
			short_description: 'Philippine political dynasty visualization system',
			full_description: 'System that processes election results and visualizes dynasty data. Features choropleth map plus tag cloud overlay for insightful visualization.',
			tech: ['React', 'Backbone.js', 'Mapbox', 'D3.js', 'Material Design', 'PHP', 'Python'],
			image: {
				src: 'img/dynastymap_0.jpg',
				alt: `screenshot of welcome screen`
			},
			tags: ['js', 'react', 'reactjs', 'backbone', 'backbonejs', 'mapboxjs', 'leaflet', 'leafletjs', 'd3js', 'html', 'html5', 'css', 'web', 'politics'],
		},
	],

	jobs: [
		{
			name: 'Frontend Engineer',
			company: 'Canva',
			date: ['2018'],
			tech: ['React', 'JavaScript', 'PHP', 'Sass'],
			description: 'Engineering the growth of the Canva product.',
		},
		{
			name: 'Web Developer',
			company: 'Azeus',
			date: ['2017', '2018'],
			tech: ['Vue.js', 'Webpack', 'Spring Boot', 'Gradle', 'JasperReports', 'TypeScript', 'Java', 'Stylus'],
			description: 'Full-stack web and systems development.'
		},
		{
			name: 'Android Developer',
			company: 'Azeus',
			date: ['2015', '2017'],
			tech: ['Android', 'Android Studio', 'Java', 'SQLite'],
			description: `Worked on the Android app for the digital meetings and collaboration system called <a target='_blank' href='https://www.azeusconvene.com/'>Convene</a>.`
		},
		{
			name: 'Software Engineering Intern',
			company: 'Azeus',
			date: ['2014'],
			tech: ['Android', 'AndEngine', 'Vert.x', 'Java'],
			description: 'Worked on a peer-to-peer multiplayer card game on Android that features a disturbing Easter egg.',
		},
		{
			name: 'Flash Developer',
			alt_company: 'Freelance',
			date: ['2009'],
			tech: ['ActionScript 3.0', 'ActionScript 2.0', 'Adobe Flash', 'FlashDevelop', 'Macromedia Flash'],
			description: 'Created animated, sometimes interactive, Internet advertisements. Indirectly contributed to the rise of ad-blockers.'
		},
		{
			name: 'Powerpoint “Engineer”',
			alt_company: 'Freelance',
			date: ['2009'],
			tech: ['Photoshop', 'Powerpoint'],
			description: 'Illustrated, animated, and created <em>interactive</em> biochemistry learning materials for some learning institute. In Powerpoint.'
		}
	],

	links: [
		{ name: 'Email', img: 'img/icon-mail.svg', href: 'mailto:lgmrada@gmail.com' },
		{ name: 'Github', img: 'img/icon-github.svg', href: 'https://github.com/Kalabasa' },
		{ name: 'LinkedIn', img: 'img/icon-linkedin.svg', href: 'https://ph.linkedin.com/in/lean-godffrey-rada' },
		{ name: 'Soundcloud', img: 'img/icon-music.svg', href: 'https://soundcloud.com/lreaadna' },
		{ name: 'Ludum Dare', img: 'img/icon-game.svg', href: 'https://ldjam.com/users/kalabasa/games' },
		// { name: 'Ludum Dare (Legacy)', img: 'img/icon-game.svg', href: 'http://legacy.ludumdare.com/compo/author/kalabasa/' },
	],
};
