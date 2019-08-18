<!--{
	"template": "work",
	"data": "projects_byid.dimensions",
	"script": "dimensions.js"
}-->

# Dimensions

![example](../img/dimensions_0.jpg)

## Generative art and augmented reality

On the 1st of August 2019, Canva Manila turned five years old. As part of the celebration, Canva organized an art exhibit featuring the works of Canvanauts.

It sounded like a fun opportunity to push myself and learn new things, so I joined!

I knew right away that the art medium had to be **HTML**, **CSS**, and **JS**, but I just didn’t know what to make (yet).

<span class="bleed">![](../img/dimensions_sketches.jpg)</span>
<span class="caption">Early concept sketches</span>

After struggling for inspiration (and after one failed attempt), I’ve come up with a generative art and augmented reality concept.

The general plan was to make two components - one physical print and one <abbr title="augmented reality">AR</abbr> app.

A **QR code** would link the two components, making it a seamless single experience.

<span class="bleed">![](../img/dimensions_xlikha.jpg)</span>
<span class="caption">Scrapped first attempt.</span>

This project hopefully demonstrates the potential of tech in art (and in life!)

The project began with the creation of the print component using **generative art** techniques.

---

## Generative art

[**Generative art**](https://en.wikipedia.org/wiki/Generative_art) is a kind of art where a set of rules or instructions creates the artwork, instead of the artist rendering it manually.

These rules are usually in the form of computer programs written by the artist.

<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/BnSBALPBGaF/" data-instgrm-version="12" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a class="anchor-plain" href="https://www.instagram.com/p/BnSBALPBGaF/" style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank"> <div style=" display: flex; flex-direction: row; align-items: center;"> <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;"></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center;"> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;"></div> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;"></div></div></div><div style="padding: 19% 0;"></div> <div style="display:block; height:50px; margin:0 auto 12px; width:50px;"><svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="https://www.w3.org/2000/svg" xmlns:xlink="https://www.w3.org/1999/xlink"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-511.000000, -20.000000)" fill="#000000"><g><path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path></g></g></g></svg></div><div style="padding-top: 8px;"> <div style=" color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;"> View this post on Instagram</div></div><div style="padding: 12.5% 0;"></div> <div style="display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;"><div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);"></div> <div style="background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;"></div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);"></div></div><div style="margin-left: 8px;"> <div style=" background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;"></div> <div style=" width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)"></div></div><div style="margin-left: auto;"> <div style=" width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);"></div> <div style=" background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);"></div> <div style=" width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);"></div></div></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center; margin-bottom: 24px;"> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 224px;"></div> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 144px;"></div></div></a><p style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;"><a class="anchor-plain" href="https://www.instagram.com/p/BnSBALPBGaF/" style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none;" target="_blank">A post shared by Tyler Hobbs (@tylerxhobbs)</a> on <time style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px;" datetime="2018-09-03T22:55:42+00:00">Sep 3, 2018 at 3:55pm PDT</time></p></div></blockquote>
<span class="caption">Example of generative art</span>

This process is also known in different contexts as *algorithmic art*, *procedural art*, and *creative coding*.

One of the simpler kinds of generative art revolves around [**tessellations**](https://en.wikipedia.org/wiki/Tessellation) or tilings. I used this technique due to lack of time.

The main idea was that the whole image would be a random arrangement of different tiles. The tiles would be laid out side-by-side with no overlaps nor gaps. The resulting geometric pattern itself would be the source of aesthetic value.

Firstly, a tiling configuration must be chosen. Could be triangles, hexagons, etc. I opted for a simple square grid.

The next step was determining how the individual tiles would look. The **“tileset”**, as it is called in gamedev.

For this I decided to symbolize *Creativity*, one of the event’s themes. Creative tools and instruments served as inspiration for the tiles’ appearances.

![notes for the second attempt](../img/dimensions_notes1.jpg)

Pen, paper, pencil, brush, and tablet: these would become the building blocks of the piece.

<span>![](../img/dimensions_notes2.jpg)
  <span class="caption">Testing some random tiling</span>
</span>

In designing the individual tiles I restricted myself to only use a single basic shape.

After some exploration I settled on quarter circles as the basis for each tile.

<span>![](../img/dimensions_notes0.jpg)
  <span class="caption">Studies of how different tilesets look in the same tiling compositions</span>
</span>

This restriction was to create unity across the whole piece and mitigate chaos from the randomness of the algorithm.

The tiles’ curves were designed to seamlessly connect with neighboring tiles, forming more complex shapes like semicircles and S-curves.

<span>![](../img/dimensions_tiletypes.jpg)
  <span class="caption">Tile types from left to right:<br /> a paintbrush head, paper with dog-ear fold, pencil tip, fountain pen tip, and a tablet</span>
</span>

So, three pages of doodling later, it was time to actually render in pixels!

The image generator was implemented in Javascript with [**Vue.js**](https://vuejs.org/). The individual shapes themselves were implemented using CSS (lots of `border-radius`!).

The image generation process worked along these lines:

Make a 9in&nbsp;×&nbsp;12in canvas, subdivided into a 6&nbsp;×&nbsp;8 grid of tiles.

![grid base](../img/dimensions_grid.jpg)

<small class="small-block">That day I learned that CSS inches don’t actually match physical inches on a computer screen.</small>

For each cell, randomly render any of the five tile types:

<span>![](../img/dimensions_1tiles.jpg)
  <span class="caption">Random tiles added with placeholder colors. Image truncated to a square for brevity.</span>
</span>

Each tile is also randomly rotated in 90-degree increments, or flipped horizontally or vertically.

<span>![](../img/dimensions_2tiles.jpg)
  <span class="caption">Tiles randomly oriented</span>
</span>

You may start seeing some semicircles and larger contours forming across tiles.

This might help you better see what I mean:

<span>![](../img/dimensions_tileedges.jpg)
  <span class="caption">Contours highlighted via edge detector.<br/> The effect actually looks cool though, could’ve been an entirely different direction for the piece?</span>
</span>

See those other shapes *emerging* from the five basic tiles? I see pacman, maybe an apple logo... a bird? This is called “emergence”.

*Emergence* is the idea that something more arises from simple systems - whether intentional or coincidental. It’s a common feature of generative art.

But this piece is a weak example of emergence. A good example is [fractal art](https://en.wikipedia.org/wiki/Fractal_art).

Anyway, the next step was to pick a palette from a color scheme generator <small>(because everything’s generated!)</small>, and randomly assign each shape a color.

<span>![](../img/dimensions_coloring.jpg)
  <span class="caption">Each tile colored randomly</span>
</span>

Random noise textures were added as well. The textures were generated solely using [GIMP](https://www.gimp.org/)’s noise generators and filters. No manual edits! <small>I could’ve implemented a live texture generator, but time was limited.</small>

The result of all the rules above was this:

<span class="bleed">![](../img/dimensions_tfull.jpg)</span>
<span class="caption">First decent result</span>

I was pretty happy with the results so far. This one could probably pass as MVP.

You may notice a lack of structure or composition in the image. It was kinda monotonous all throughout.

This is the downside of tile-based algorithms. But nothing that can’t be fixed!

What it needed were macro elements and points of interest. Things that can nudge the flow of the user’s gaze.

So I tried adding big off-the-grid circles. They manifested as different color schemes for intersecting tiles.

<span>![](../img/dimensions_tcircle2.jpg)
  <span class="caption">Circle intersections added</span>
</span>

This addition seemed to solve the issue. It created contrasting regions which enhanced composition. Points of interest also emerged from the intersections between edges. And it broke the monotony of the grid.

I implemented the effect by overlaying multiple copies of the board, each having a different palette. Then on each copy I applied circular clipping masks (CSS `clip-path`) that correspond to regions in the image.

Next adjustment was on color selection. I changed the selection from a uniform random distribution to a [normal distribution](https://en.wikipedia.org/wiki/Normal_distribution).

Instead of having equal chances for each color to be picked, colors in the middle of the palette got higher chances of getting picked than those near the ends.

<span>![](../img/dimensions_colorweight.jpg)
  <span class="caption">Uniform palette distribution (left) and normal distribution (right, not to scale!)</span>
</span>

This made some colors more prominent than others, building a hierarchy of colors that produced a less chaotic image.

<span>![](../img/dimensions_tsmall.jpg)
  <span class="caption">Experimenting with color schemes and tile sizes</span>
</span>

The image generation algorithm evolved a little more before reaching the final form.

<span class="bleed">![](../img/dimensions_tfinal.jpg)</span>
<span class="caption">The final form (almost)</span>

This here is how generative art works. It’s experimental, explorative, and iterative.

Going back to the exhibit. Each participant can submit a maximum of six pieces. So far I’ve got one.

Luckily, this is generative art! I could just generate more pieces to submit!

So I randomized the big circles, generated hundreds of instances, and picked some of the good ones.

![set of random renders](../img/dimensions_renders.png)

I could’ve randomized the palette too, but color is tricky and best left to human eyes.

All that’s left was adding the QR code that would link to the AR app.

This involved changing the center tiles to a lighter palette before adding in the QR. It ensured that the code will be readable in every randomly-generated instance of the piece.

<span class="bleed">![](../img/dimensions_finalset.jpg)</span>
<span class="caption">The final set</span>

_Fun fact: QR codes are also generated by an algorithm!_

And that’s how I made the physical prints! The next part is about the non-physical half of the piece, the augmented reality component.

*\[Part 2 yet to be written]*

---

### Bonus art: randomized color scheme and recursive tiles edition!

<span class="bleed">![](../img/dimensions_e1.jpg)</span>
<span class="caption">“Frog”</span>

<span class="bleed">![](../img/dimensions_e2.jpg)</span>
<span class="caption">“Coffee”</span>

<span class="bleed">![](../img/dimensions_e3.jpg)</span>
<span class="caption">“Earth”</span>

---

*\[Part 2 yet to be written]*
