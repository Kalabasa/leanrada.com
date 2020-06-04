<!--{
	"template": "work",
	"data": "projects_byid.sheetz"
}-->

# Sheetz

<p class="center">
<iframe src="https://kalabasa.github.io/sheetz/" width="960" height="420"></iframe>
</p>

A very simple spreadsheet built with [Svelte](https://svelte.dev).

> Svelte is a radical new approach to building user interfaces. Whereas traditional frameworks like React and Vue do the bulk of their work in the browser, Svelte shifts that work into a compile step that happens when you build your app.

I discovered Svelte in 2019. It’s really interesting - a reactive component-based framework without the runtime bulk. There is no VDOM! Apparently, the DOM is updated directly with precise efficiency.

<small>(I’m evidently fond of compact, direct, and seemingly simple frameworks/APIs.)</small>

So, I wanted to try it on a simple webapp. A spreadsheet app seems to be a good case for this.

Svelte syntax is like Vue, except, the script part is not required to be a class/object/function. It’s plain flat script!

It’s somehow liberating to not have to extend classes, or follow pre-defined object shapes.

![example code](../img/sheetz_code.png)

The compiler statically analyzes the source then applies a bunch of hooks for DOM reactivity.

Very innovative 👍

---

[Open the webapp!](https://kalabasa.github.io/sheetz/)

### Features:

- Formulas (arithmetic only). Javascript syntax. (`=1 + 2`)
- Absolute references. (`=A1 + A2`)
- Error detection (cyclic reference detection, syntax errors).

Formulas and references sound like good use of the framework’s reactivity features.

### Not implemented (yet?)

- Math functions.
- Relative references.
- Lazy evaluation. The whole board refreshes on input! <small>But it’s definitely built with lazy evaluation in mind! I just lost interest before I could implement the final leg.</small>

---

[Source on Github!](https://github.com/Kalabasa/sheetz).

It’s not Typescript. <small>Going back to plain JS after so much TS coding is really annoying.</small>
