<!--{
	"template": "work",
	"data": "projects_byid.freeformgesturedetector"
}-->


# Freeform Gesture Detector

<video muted autoplay loop>
	<source src="../video/freeformgesturedetector.mp4">
	<iframe src="https://giphy.com/embed/3ohs4glUsYjZA6zUDC" width="270" height="480" frameBorder="0" class="giphy-embed"></iframe>
</video>

## Multi-touch transform gestures for Android.

**FreeformGestureDetector** is an Android library that converts multi-touch gestures into incremental Matrix transformations.

It processes any kind of touch gesture, from single-finger dragging to multitouch skew and scale, and outputs the corresponding Matrix transforms needed to render that manipulation.

Credits to [Matrix.setPolyToPoly](https://developer.android.com/reference/android/graphics/Matrix) for making this easy.

This library arose from the development of <a href="hypertangram.html">Hypertangram</a>. I wanted free manipulation of puzzle pieces because I wanted the game’s controls to be intuitive.

It’s open-source and available on [Github](https://github.com/Kalabasa/FreeformGestureDetector).
