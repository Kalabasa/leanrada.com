<!--{
	"template": "work",
	"data": "projects_byid.planetdefense"
}-->


# Planet Defense

<p class="center" style="background: #000">
<iframe src="https://kalabasa.github.io/PlanetDefense" width="550" height="550"></iframe>

<span class="caption">*Click to launch a missile from the nearest available battery. Missiles detonate on the clicked point.*</span>

</p>

This is my entry for the 38th [Ludum Dare](https://ldjam.com), a game development competition where devs make a game *from scratch* in 48 hours.

Ludum Dare is a Game Jam (a hackathon for games) held every four months. A theme is announced and participants are given two or three days to create a game.

I participate in these <abbr title="Ludum Dare">LD</abbr> jams occasionally. In LD 38, the theme was **A Small World**. I made a [Missile Command (1980)](https://en.wikipedia.org/wiki/Missile_Command) clone, but circular.

<span>![screenshot of Missile Command](../img/missilecommand.jpg)
	<span class="caption">Missile Command</span>
</span>

48 hours later...

![screenshot of PlanetDefense](../img/planetdefense_0.jpg)

The game was made with [PixiJS](http://www.pixijs.com), a scene-graph based 2D graphics engine for Javascript. I’m used to this graphics model since I started programming with Flash.

I initially tried [Phaser](https://phaser.io), but it was too much for my taste. Having found out that Phaser uses Pixi underneath, I went with Pixi. I prefer simpler libraries.

## Results (and postmortem)

<span>![ratings of PlanetDefense](../img/planetdefense_results.jpg)
	<span class="caption">Final judging results for PlanetDefense</span>
</span>

I did not expect to rank high in Graphics, but it was the highest criterion in my submission. I think it’s something to do with the colors, ’cause the pixel art was definitely not great. That was also the gist of some of the comments I received.

Here's a little trick to improving any color scheme: **Just overlay a solid color on everything.** It makes every color suddenly connect with each other and gives an overall “mood”.

![color schemes](../img/planetdefense_colors.jpg)

Another simple principle is that dark places are cold, and bright places are warm. So, make shadows go blue, and highlights go yellow. You can use the *Color Balance* tool to do this easily.

This is actually what most Instagram filters do.

This project’s source code is available on [Github](https://github.com/Kalabasa/PlanetDefense). Not the prettiest code. It’s a hackathon. No license yet.

You can play it standalone [here](https://kalabasa.github.io/PlanetDefense).
