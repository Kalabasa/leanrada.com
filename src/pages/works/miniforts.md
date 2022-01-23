<!--{
	"template": "work",
	"data": "projects_byid.miniforts"
}-->


# MiniForts

![preview](../img/miniforts_header.png)

## A game about building and defending a fort.

In 2021, I made a small base-builder RTS game. It runs on the [**Minetest**](https://www.minetest.net/) voxel game engine.

The goal of this game is to defend a central core from invaders. The player commands minions to build up a fort around the core.

<span class="bleed">![minion shooting a slug](../img/miniforts_0.gif)</span>

Minions are indirectly commanded by putting construction orders in the world.

![gif](../img/miniforts_2.gif)

It has some rudimentary physics, where structures disconnected from the ground get destroyed.

![gif](../img/miniforts_3.gif)

The game is not *complete*, but it's decent enough for a few minutes of gameplay.

<span class="bleed">![minions building a wall](../img/miniforts_1.gif)</span>

The game's development slowed down to a halt as I found myself being more and more limited with Minetest's API and engine design - particularly its client-server design.

I guess it's partly my fault. Minetest is a first-person creative-survival voxel game "engine" - a Minecraft clone, if you will. It's not particularly suited for a base-builder RTS experience.

Here, I'll write about some of the major limitations and the solutions I came up with.

---

## The scripting language

My first problem was **Lua**. I didn't like Lua. It's not type-safe and lacks some of the modern expressions like the conditional (ternary) operator.

To solve this, MiniForts was written in **TypeScript**. Then I used [**TypeScriptToLua**](https://typescripttolua.github.io/).

With the addition of `.d.ts` declaration files, I was able to use Minetest's API in a type-safe way. It also unlocks fancy OOP, which is very useful in developing a game.

---

## The GUI engine

Another problem is Minetest's **GUI system**. It's not very usable. It has absolute positioning and a lack of nesting or layouting. Interaction and UI updates are procedural.

To solve this I used [**JSX**](https://www.typescriptlang.org/docs/handbook/jsx.html), an XML-like syntax for defining UI in code.

But there isn't anything in Minetest that knows how to render JSX elements, so I had to create a **GUI engine** within the game that takes in JSX elements and renders the it via Minetest's APIs.

The end-result is a more flexible GUI system, with bonus reactive data-binding and callbacks.

<span class="bleed">
	<div class="center">
		<div>
			<img class="image" src="../img/miniforts_formspec.png"/>
			<span class="caption">Minetest's formspec</span>
		</div>
		<div>
			<img class="image" src="../img/miniforts_tsx.png"/>
			<span class="caption">JSX (TSX) version</span>
		</div>
	</div>
</span>

Here's one layout that I've implemented. It's the radial layout that renders an arbitrary number of elements in a circular fashion:

![hud code](../img/miniforts_radial.png)

Here's another example which is the HUD that shows the player's current resources in the upper-right corner of the screen.

![hud](../img/miniforts_hud.png)
![hud code](../img/miniforts_hud_code.png)

It was fun recreating a React-like environment on top of a very limited GUI API.

I've only been able to use it for the HUD so far, but I imagine it would be very useful when doing RTS-type build menus. Or maybe even for changing door states and swapping ballista ammo.

---

## Pathfinding

Minetest has a simple A* voxel-based ground-based pathfinding algorithm, implemneted in C++.

But that algorithm won't do. This game has multiple agents, a complex 3D terrain, and destructible walls.

I ended up implementing a hierarchical pathfinding algorithm with a structure similar to [**RimWorld**'s region system](https://www.youtube.com/watch?v=RMBQn_sg7DA), also inspired by [**Castle** Story's pathfinder](https://www.gdcvault.com/play/1025151/Hierarchical-Dynamic-Pathfinding-for-Large).

<span class="bleed">
	<video muted autoplay loop>
		<source src="../video/miniforts_path.mp4">
		<a href="../video/miniforts_path.mp4">Video</a>
	</video>
</span>

The system divides the world into components, each of which contains a set of positions reachable from one another.

<span>![debug pathfinding](../img/miniforts_debug_path.png)
	<span class="caption">Component debug view</span>
</span>

Then the pathfinder finds a path through the components first, which is very fast, and only resolving voxel-level paths when the agent is moving through from one component to the next.

<span class="bleed">
	<video muted autoplay loop>
		<source src="../video/miniforts_order_path.mp4">
		<a href="../video/miniforts_order_path.mp4">Video</a>
	</video>
</span>

---

## World generation

Unfortunately, I was only able to create one world type - the forest.

![forest](../img/miniforts_forest0.png)

The terrain is a combination of stepped gradient noise maps generated from Minetest's Perlin noise generator.

The trees are a bit different. They are positioned by placing trees in a grid and randomizing their locations within their grid cell.

![forest](../img/miniforts_forest1.png)

And the roots are simply the difference of two gradient noise maps, which creates these snaking patterns, with height falloff based on the nearest tree.

---

## The art

I like pixel art. It's easy to make passable results.

<span class="bleed">![art collection](../img/miniforts_art.png)</span>

Well, it's not that easy. I struggled with the ground textures a lot.

I realized that what's more important at this resolution is the readability of something rather than the details of it.

<span class="bleed">![grass comparison](../img/miniforts_grass.gif)</span>

I got a lot of inspiration from **The Legend of Zelda: The Minish Cap**, which has similar miniature environments.

<span>![minish cap](../img/miniforts_zelda.jpg)
	<span class="caption">Source: <a href="https://www.zeldaspalace.com/theminishcap/screenshots.php" target="_blank">Zelda's Palace</a></span>
</span>

---

In the end, I did not publicize this game to the community, either by announcing it in the forum or by uploading it to the [community mod repository](https://content.minetest.net/). I think I intend to finish this game at some point, before releasing a "launch version".

It was great to get back to this game development hobby again.

Source [here](https://github.com/Kalabasa/mini_forts).
