<!--{
	"template": "work",
	"data": "projects_byid.hypertangram"
}-->


# Hypertangram

<span class="d3d"><span class="mockup-phone">![phone with Hypertangram](../img/hypertangram_1.jpg)
<span class="phone-body"></span>
</span></span>

## Hypertangram is tangram with a twist.

**Hypertangram** is a challenging geometric puzzle game on Android based on the classic tangram puzzle. What’s different with this one is that, in addition to regular dragging and rotating, *pieces can be resized*.

<video muted autoplay loop>
	<source src="../video/hypertangram_2.webm">
	<source src="../video/hypertangram_2.mp4">
	<a href="../video/hypertangram_2.mp4">Demo video</a>
</video>

This is a personal project, and my first “complete” game in terms of features and polish. This game idea had been sitting in the back of my mind for quite a time, and I finally did it in about 6 months of free-time development.

It wasn’t all smooth sailing. There were lots of problems with the geometry code.

See, I didn’t want grid-based movement like in other tangram apps. I wanted free dragging, rotation, and scaling, with smart edge-snapping.

This design decision proved to be technically demanding later on.

<span>
	<video muted autoplay loop>
		<source src="../video/hypertangram_3.webm">
		<source src="../video/hypertangram_3.mp4">
		<a href="../video/hypertangram_3.mp4">Video of old development version</a>
	</video>
	<span class="caption">Old prototype</span>
</span>

Most of the time spent in development was on making this correct and also feel good.

But that’s not all. There are more *geometrials* ahead.

Due to the nature of the main game mechanic, there can be several solutions to a single puzzle.

![illustration of multiple solutions](../img/ht_solutions.jpg)
<span class="caption">Multiple solutions for a single puzzle</span>

There is no easy way to find them all by hand, nor by algorithm. The solution checking algorithm went through rounds of rethinking.

I ended up with a logical approach, using [boolean operations on polygons](https://en.wikipedia.org/wiki/Boolean_operations_on_polygons), in order to implement the win condition.

*Note to self: Don’t mix geometric operations and floating point numbers. They are oil and water.*

Aside from design & programming, I also created the music and graphics myself. For the look, I wanted it minimal with a physical feel. *Abstract, yet tangible*.

![screenshot detail](../img/hypertangram_4.jpg)

I’m really proud of the amount of polish I’ve done here. Of course, there’s always room for improvement, but finished is better than perfect.

*It was a **geometriumph**.*

Try it out! It’s free.

<p class="center">
	<a class="anchor-plain" href="https://play.google.com/store/apps/details?id=com.kalabasagames.hypertangram&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1"><img class="media-plain" width="200px" alt="Get it on Google Play" src="https://play.google.com/intl/en_gb/badges/images/generic/en_badge_web_generic.png"/></a>
</p>
