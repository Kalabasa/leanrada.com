<!--{
	"template": "work",
	"data": "projects_byid.freeformgesturedetector"
}-->


# Freeform Gesture Detector

## Multi-touch transform gesture detector for Android.

<video muted autoplay loop>
	<source src="../video/freeformgesturedetector.mp4">
	<iframe src="https://giphy.com/embed/3ohs4glUsYjZA6zUDC" width="270" height="480" frameBorder="0" class="giphy-embed"></iframe>
</video>

FreeformGestureDetector is an Android library to convert multi-touch gestures into a stream of incremental Matrix transformations.

This library arose from the development of <a href="hypertangram.html">Hypertangram</a>. I wanted free manipulation of puzzle pieces in order to have intuitive controls.

One finger must be able to drag pieces around. Two fingers must be able to rotate and scale pieces. This was generalized into N-fingers must be able to transform in N-degrees-of-freedom (or something like that, I'm not very good at math). For the puzzle game, I constrained it to drag, scale, and rotate only, because pieces are rigid and must not be warped.

This library is open-source and is available [on Github](https://github.com/Kalabasa/FreeformGestureDetector).
