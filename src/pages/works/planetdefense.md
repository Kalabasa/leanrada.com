<!--{
	"template": "work",
	"data": "projects_byid.planetdefense"
}-->


# Planet Defense

<p class="center" style="background: #000">
<iframe src="https://kalabasa.github.io/PlanetDefense" width="550" height="550"></iframe>

<span class="caption">*Click to launch a missile from the nearest available battery. Missiles detonate on the clicked point.*</span>

</p>

This is my entry for the 38th [Ludum Dare](https://ldjam.com).

Ludum Dare is a Game Jam (a hackathon for games) held every four months. A theme is announced and participants create a game from scratch in *48 hours*.

I participate in these <abbr title="Ludum Dare">LD</abbr> jams occasionally. In LD 38, the theme was **A Small World**. Immediately after the theme was announced, I went self-brainstorming for game concepts. Fortunately, I settled on an idea before the 12-hour mark.

## Missile Command, but circular.

<span>![screenshot of Missile Command](../img/missilecommand.jpg)
	<span class="caption">Missile Command</span>
</span>

[Missile Command](https://en.wikipedia.org/wiki/Missile_Command) is an arcade game from the ’80s. The usual formula of taking a classic and giving it a twist was not very original, but time was limited. Minus points for Innovation, I guess.

48 hours later, I managed to come up with a working game/prototype.

![screenshot of PlanetDefense](../img/planetdefense_0.jpg)

Hooray! A finished game in exchange for precious hours of sleep!

The game was made with [PixiJS](http://www.pixijs.com), a scene-graph based 2D graphics engine for Javascript. I’m used to this graphics model since I started programming with Flash.

I initially tried [Phaser](https://phaser.io), but it was too much for my taste. Having found out that Phaser uses Pixi underneath, I went with Pixi. I prefer simpler libraries.

## Results

Participants judge each other’s games after for 3 weeks. It’s actually nice. Most feedback is constructive and there are suddenly thousands of new free games for you to play!

<span>![ratings of PlanetDefense](../img/planetdefense_results.jpg)
	<span class="caption">Final judging results for PlanetDefense</span>
</span>

My game did okay. Innovation’s low. Fair enough. It’s a clone.

Unexpectedly, Graphics is the highest. I think it’s something to do with the colors, ’cause the pixel art was definitely not great. The color scheme was also mentioned in the comments.

Here’s a little trick I did to improve the game’s color scheme: **Just overlay a solid color on everything.**

![color schemes](../img/planetdefense_colors.jpg)

I learned this from a fellow gamedev somewhere on the Internet. Thanks, stranger!

This project’s source code is available on [Github](https://github.com/Kalabasa/PlanetDefense). Not the prettiest code. It’s a hackathon. No license yet.

You can play it standalone [here](https://kalabasa.github.io/PlanetDefense).
