<!--{
	"template": "work",
	"data": "projects_byid.kalabasa",
	"style": "kalabasa.css",
	"script": "kalabasa.js"
}-->


# kalabasa.github.io

<div class="center">
	<!-- size is percentage of viewport for aesthetic nesting -->
	<div style="width: 90vmin; height: 90vmin; border: solid 2px #EEE">
		<iframe id="showcase" src="/" width="100%" height="100%"></iframe>
	</div>
</div>

## My place on the web.

Bold & bright colors, minimalist elements, angular forms, and swift motion. This is my website. And this represents me <small>(Can’t say I’m bold and swift, though).</small>

I made this as an exercise to brush up my web development skills, and also to get on with the digital trends. This is actually the third iteration of my personal website.

The first one was around **2012**. I was attending college back then for my computer science degree.

<span class="bleed">![first personal website](../img/kalabasa_1.png)</span>
<span class="caption">My first personal site.</span>

This version of the site mainly hosted my course projects and other small games. [I did Ludum Dare](http://ludumdare.com/compo/author/kalabasa/) more back then. It also sported an interactive Flash header (now obsolete). Good times.

A second version was made in **2015**. It was more minimalist and better represented my personality.

<span class="bleed">
	<video muted autoplay loop>
		<source src="../video/kalabasa_2.webm">
		<source src="../video/kalabasa_2.mp4">
		<a href="../video/kalabasa_2.mp4">Video</a>
	</video>
</span>

This one had an interactive splash screen that was made with [three.js](https://threejs.org).

I like minimalism, but I grew tired of this look soon enough. Eventually, I decided that a revamp was needed, bringing us to the present time. 2018. The third and current version.

![screenshot](../img/kalabasa_0.jpg)

This current website is a static site generated at build time. It is progressively enhanced using [**Vanilla JS**](http://vanilla-js.com), plus [**Barba.js**](http://barbajs.org) for smooth page transitions. Client-side search was made possible through [**Elasticlunr.js**](http://elasticlunr.com).

It’s a static site because you can’t do server-side on Github Pages. It’s also fast. And cool.

<span>![phone in CSS](../img/kalabasa_phone.jpg)
	<span class="caption">Phone mockup in CSS 3D.</span>
</span>

I use my own build script, which calls a bunch of other tools, like [**rollup.js**](https://rollupjs.org) for Babel and JS bundling, [**Marked.js**](https://marked.js.org/) for markdown, [**Handlebars.js**](https://handlebarsjs.com), and [**Stylus**](http://stylus-lang.com) for CSS.

Maybe I should use Webpack like everyone else.

This website’s source is available on [Github](https://github.com/Kalabasa/kalabasa.github.io) (duh). You can check out some of the tricks in here.
