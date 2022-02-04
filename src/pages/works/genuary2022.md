<!--{
	"template": "work",
	"data": "projects_byid.genuary2022"
}-->

# Genuary 2022

![example](../img/genuary2022_thumb.jpg)

## A month of generative art

As 2022 rolled in, I stumbled upon a site called <a href="https://genuary.art/" target="_blank">**genuary.art**</a>. It’s a month of daily creative coding challenges, like *an Inktober for programmers*. [Check it out!](https://twitter.com/hashtag/genuary)

The challenge was to create a **generative art** piece for every day of January. Each day there was a prompt, and each code art was supposed to be based on the day’s prompt.

Having done some <a href="dimension1.html">generative art</a> in the past, I committed myself to the challenge. Sounds like fun!

Here I’ll show you all of my Genuary 2022 works and some info about the techniques I used.

---

## Day 01 - Draw 10,000 of something.

<span class="bleed">![genuary 01](../img/genuary2022_01.jpg)</span>
<span class="caption">A hexagonal lattice of tiny lines.</span>

10,000+ tiny lines are placed in a hexagonal pattern.

Each line’s length is mapped from a [coherent noise](https://en.wikipedia.org/wiki/Perlin_noise) map, resulting in this undulating structure.

![genuary 01](../img/genuary2022_01_det.jpg)

The lines aren’t straight. They’re a bit wiggly for a more natural look, achieved by perturbing the line with Gaussian random values.

* [Live generator](https://kalabasa.github.io/genuary_2022/01/)

---

## Day 02 - Dithering.

<span class="bleed">![genuary 02](../img/genuary2022_02.png)</span>

[**Dithering**](https://en.wikipedia.org/wiki/Dither) is a digital trick to create more shades than possible in a limited color palette. It creates the illusion of more shades by varying the distribution of pixels in an image.

![genuary 01](../img/genuary2022_02_det.png)

My dithering technique was simple lattice patterns with 7 possible shades.

Some extra care was given to the boundaries between shades to prevent odd-looking clusters that result from accidental alignment with neighboring patterns.

* [Live generator](https://kalabasa.github.io/genuary_2022/02/)

---

## Day 03 - Space.

<span class="bleed">![genuary 03](../img/genuary2022_03.jpg)</span>
<span class="caption">Simulated watercolor painting of a nebula.</span>

I tried simulating watercolor here.

The simulation consists of a moisture map, a color map, and the following model:
* Any part of the canvas can be wet in varying degrees.
* Moisture spreads and evaporates.
* **Colors spread and bleed when wet.**
* **Colors don’t spread when dry.**

<span>![genuary 03](../img/genuary2022_03_debug.png)</span>
<span class="caption">Moisture map debug view.</span>

The result wasn’t perfect. Some boundary errors resulted in dark blobs and unnaturally bright edges. I wasn’t able to fix it in time for the day. In any case, it looked OK.

![genuary 03](../img/genuary2022_03_det.jpg)

---

## Day 04 - The next next Fidenza.

<span class="bleed">![genuary 04](../img/genuary2022_04.jpg)</span>
<span class="caption">Fun with flow fields.</span>

**Fidenza** is a highly-valued ($$$) generative algorithm by [Tyler Hobbs](https://tylerxhobbs.com/fidenza), popular generative artist.

The core idea behind Fidenza is a flow field. So, I made flow field art.

<span class="bleed">![genuary 04](../img/genuary2022_04_0.jpg)</span>
<span class="caption">Uncurated set generated just for this article.</span>

Instead of using coherent noise to generate the field, I used poles. It’s a bit like how magnetic poles influence magnetic fields.

With fewer poles, the polar / radial structure of the field becomes obvious, while more poles result in more complex patterns.

* [Live generator](https://kalabasa.github.io/genuary_2022/04/)

---

## Day 05 - Destroy a square.

<span class="bleed">![genuary 05](../img/genuary2022_05.jpg)</span>

Some abstract art involving lines across square frames. Feels like something that could be hung on a wall in some lobby somewhere.

---

## Day 06 - Trade styles with a friend.

<span class="bleed">![genuary 06](../img/genuary2022_06.jpg)</span>
<span class="caption">Simulated cross-stitch of generated plants.</span>

A friend gave me the prompt “cross-stitch”, and it was fun.

Everything was generated, from the canvas fabric, the threads, to the plant structures.

The smallest structure is the thread. A thread is simply a helix of colored curves with some highlights and shadows to imply depth.

At the opposite end of the scale is the largest structure, the plant. It is generated using a recursive *branch*ing algorithm (each branch can generate two smaller branches, and so on) with leaves at each node and potential flowers at the *leaf nodes*.

<span>![genuary 06](../img/genuary2022_06_det.jpg)</span>
<span class="caption">Backside simulation.</span>

For fun, I wrote a backside simulation using a flood-fill algorithm.

---

## Day 07 - Sol LeWitt Wall Drawing.

<span class="bleed">![genuary 07](../img/genuary2022_07.jpg)</span>

[**Sol LeWitt**](https://en.wikipedia.org/wiki/Sol_LeWitt) once said: “The idea or concept is the most important aspect of the work. The idea becomes a machine that makes the art.” (1967)

LeWitt has been making drawing algorithms decades before generative computer art even existed. The instructions were executed by other people to produce the tangible art thing. It was called [**conceptual art**](https://en.wikipedia.org/wiki/Conceptual_art).

Now, JavaScript is doing the execution.

<small>I also made some typewriter emulation on the side</small>

* [Live generator](https://kalabasa.github.io/genuary_2022/07/) (Press Space to generate a new one.)

---

## Day 08 - Single curve only.

<span class="bleed">![genuary 08](../img/genuary2022_08.jpg)</span>
<span class="caption">Continuous line drawing of a face.</span>

For this prompt, the idea of continuous line drawing immediately came into mind.

It’s the style of drawing where you don’t lift the pen until you finish the piece.

<span class="bleed">![genuary 08](../img/genuary2022_08_set.jpg)</span>
<span class="caption">100+ outputs of the algorithm.</span>

At the core of this piece is a [**graph algorithm**](https://en.wikipedia.org/wiki/Graph_theory).

First, I lay out all the possible contours of the face as a set of hardcoded curves. A diverse variation of proportions, angle, and facial expressions are randomly applied to the contours.

Then the curves are converted into a graph. Each of the curve’s endpoints becomes a node, which connects to its opposite endpoint as well as other nearby curves.

<span>![genuary 08](../img/genuary2022_08_debug.jpg)</span>
<span class="caption">Debug view of the graph.</span>

Starting from a random curve, it performs a pathfinding algorithm, a variation of [A*](https://en.wikipedia.org/wiki/A*_search_algorithm), that maximizes the number of important contours and minimizes the jumps between curves.

The final path is then traced by a virtual pen with some physics for realistic-looking strokes.

---

## Day 09 - Architecture.

<span class="bleed">![genuary 09](../img/genuary2022_09.jpg)</span>
<span class="caption">Abstract perspective on the corner of a building.</span>

Probably the lamest piece I’ve done.

---

## Day 10 - Machine learning, wrong answers only.

<span class="bleed">
<div style="display: flex; gap: 2%; max-height: 70vh">
	<video muted playsinline autoplay loop style="flex: 1 1 auto; object-fit: cover; width: 30%">
		<source src=https://github.com/Kalabasa/genuary_2022/blob/master/10/outputs/Neurons%20%238815.webm?raw=true">
		<a href=https://github.com/Kalabasa/genuary_2022/blob/master/10/outputs/Neurons%20%238815.webm?raw=true">Video</a>
	</video>
	<video muted playsinline autoplay loop style="flex: 1 1 auto; object-fit: cover; width: 30%">
		<source src=https://github.com/Kalabasa/genuary_2022/blob/master/10/outputs/Neurons%20%23543.webm?raw=true">
		<a href=https://github.com/Kalabasa/genuary_2022/blob/master/10/outputs/Neurons%20%23543.webm?raw=true">Video</a>
	</video>
	<video muted playsinline autoplay loop style="flex: 1 1 auto; object-fit: cover; width: 30%">
		<source src=https://github.com/Kalabasa/genuary_2022/blob/master/10/outputs/Neurons%20%239199.webm?raw=true">
		<a href=https://github.com/Kalabasa/genuary_2022/blob/master/10/outputs/Neurons%20%239199.webm?raw=true">Video</a>
	</video>
</div>
</span>
<span class="caption">Random spiking neural network.</span>

Visualization of a randomly-initialized [**spiking neural network**](https://en.wikipedia.org/wiki/Spiking_neural_network).

Sometimes the synapses are biased in some general direction.

---

## Day 11 - No computer.

<span class="bleed">![genuary 11](../img/genuary2022_11.jpg)</span>
<span class="caption">Harmonograph drawings.</span>

This was an interesting prompt. How do you make generative art without a computer to generate it?

I ended up building a [**harmonograph**](https://en.wikipedia.org/wiki/Harmonograph) using cardboard and a scissor arm.

<video muted playsinline autoplay loop>
	<source src="../video/genuary2022_11.mp4">
	<a href="../video/genuary2022_11.mp4">Video</a>
</video>

It was a nice change of pace. Though, unlike computer art, generating new pieces costed real paper and real ink. The physical world is messy.

---

## Day 13 - 800x80.

<span class="bleed">![genuary 13](../img/genuary2022_13.jpg)</span>
<span class="caption">Watercolor moons.</span>

Apparently, [**#800x80**](https://twitter.com/hashtag/800x80) is a thing.

A sequence of images depicting a process seemed like a good fit for the long format. So I settled on rendering phases of the moon.

I tried to simulate watercolor again using the same technique as Day 03. This time I was able to fix the bugs, and I think it looks more like watercolor now.

---

As you might notice, I started skipping days at this point. Day 12 (Packing (squares, circles)) was missing. I was starting to get busy at work around this time.

---

## Day 21 - Combine two of your pieces from previous days to make a new piece.

<span class="bleed">![genuary 21](../img/genuary2022_21.jpg)</span>
<span class="caption">Cross-stitch flow fields.</span>

This was an easy one, so I didn’t skip this prompt.

![genuary 21](../img/genuary2022_21_det.jpg)

All I had to do was replace the plant generator in my cross-stitch renderer from Day 06 with a flow field image based on Day 04.

Some adjustments were made so that lines were able to overlap and fill the space, which looked great in cross-stitch.

---

That’s it for now. I got a couple of WIPs for other days, but maybe I’ll hold off until Genuary 2023.

This was all made in [**p5.js**](https://p5js.org/), a JS port of the Processing library.

Some other libraries were [**chroma.js**](https://gka.github.io/chroma.js/) for colors and [**ccapture.js**](https://github.com/spite/ccapture.js) to record videos.

Source [here](https://github.com/Kalabasa/genuary_2022/).
