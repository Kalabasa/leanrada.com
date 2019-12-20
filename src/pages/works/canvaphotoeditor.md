<!--{
	"template": "work",
	"data": "projects_byid.canvaphotoeditor"
}-->


# Canva Photo Editor

<span class="d3d"><span class="mockup-phone">![phone with Photo Editor](../img/canvaphotoeditor_0.jpg)
<span class="phone-body"></span>
</span></span>

## Edit photos online

**Photo Editor** is an online tool by Canva for simple image editing. It features pre-set filters, simple adjustment sliders, crop, resize, and rotation tools.

This tool existed primarily as a way to promote the main design platform [Canva](https://www.canva.com). Users coming in to edit photos are likely to have more design needs than image editing, so there are a few promotional paths to Canva in the photo editor itself.

<span class="bleed">![desktop screenshot](../img/canvaphotoeditor_1.jpg)</span>

The Photo Editor had a previous version which was made by a third party developer in a proprietary framework on top of Angular 1 and Node 5. It was a bit difficult to maintain and iterate on. It was also not responsive so we're missing out on mobile users.

A redesign and rewrite was needed for future improvement.

<span class="bleed">![old version](../img/canvaphotoeditor_old.jpg)</span>
<span class="caption">Old version</span>

So around Summer 2019 <small>(Australian Summer 2018–2019)</small>, a redesign was made and the app was rewritten in a more modern stack. The revamped version looks better, more modern, and is responsive.

![mobile screenshot](../img/canvaphotoeditor_0.jpg)

My part in this redesign was the coding of the webapp and the landing page.

I chose to write the app in [**React**](https://reactjs.org/) with [**MobX**](https://mobx.js.org/). MobX really helped simplify the state management. It made React feel like Vue, which is what I like.

This is also close to the frontend stack that our team is moving to in general.

There are a few WebGL and canvas filter algorithms from the old app that I reused. The old app used [**glfx.js**](http://evanw.github.io/glfx.js/) for WebGL browsers and [**CamanJS**](http://camanjs.com/) for non-WebGL browsers, and I basically just adapted these stuff to the new code.

The backend is a simple server written with [**Express**](https://expressjs.com/) and the whole app was deployed on [**Heroku**](https://www.heroku.com/).

<span class="bleed">![desktop screenshot](../img/canvaphotoeditor_2.jpg)</span>

The app needs to be discoverable by search engines, and React as it is can't help with that, so an accompanying landing page was made. It was written in our usual landing page stack of WordPress and PHP, though WordPress was mostly just for infrastructure.

The project was completed in around 2 months.

<span class="bleed">![landing page screenshot](../img/canvaphotoeditor_3.jpg)</span>
<span class="caption">The landing page</span>

After the revamp we saw an increase of 50% in conversions (that is, Canva signups), so we can say that the project was a success! 🎉

[Take a look!](https://www.canva.com/photo-editor/)
