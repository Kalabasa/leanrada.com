<!--{
	"template": "work",
	"data": "projects_byid.dimensions"
}-->

# Dimensions

## Part 2. Augmented reality

The idea of including augmented reality into the art piece was wholly inspired by [AR.js](https://github.com/jeromeetienne/AR.js), an awesome project that brings fast and easy augmented reality to the web.

<iframe width="512" height="288" src="https://www.youtube-nocookie.com/embed/0MtvjFg7tik" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

The AR.js demo looked really cool and smooth.

With augmented reality, the art piece became an art experience. The user flow for the experience went like this:

1. User sees the piece and notices the **QR code**.
1. User whips out smartphone to **scan** the QR code.
1. Smartphone is directed to the **app**.
1. App opens the phone’s camera to **track** the piece in 3D space.
1. App superimposes virtual art on the physical art, *augmenting reality*. ✨

Implementing object tracking (step 4) proved to be difficult. With AR.js, it required special **markers** in order to track the 3D scene.

The prints were already finalized, so I couldn’t add AR markers on it by then. Plus, the piece already had a QR code slapped on it. Adding any more technical tags would’ve ruined it.

I looked around for alternatives like **Tracking.js**, **OpenCV**, and even **TensorFlow**, but ultimately implemented my own **image recognition** algorithm.

---

## Image recognition

[**Image recognition**](https://en.wikipedia.org/wiki/Computer_vision#Recognition) is a computer vision problem of determining whether an image contains some specific object or not. For this project, I applied a simple image recognition algorithm to determine when the piece has been aligned in front of the camera.

<span class="bleed">
  <video muted autoplay loop playsinline>
    <source src="../video/dimensions_imagerec.mp4">
    <a href="../video/dimensions_imagerec.mp4">Demo video</a>
  </video>
</span>
<span class="caption">The app recognizes when the target piece has been aligned.</span>

There exists many solutions to this problem, ranging from simple histogram matching to convolutional neural networks. These days everyone just uses neural networks and deep learning if possible.

These technologies power some apps like Face Swap and Snaphchat filters, and is also used for things like mass camera surveillance.

In my case however, I’ve simplified the problem to determining whether any of the three specific art pieces is in the center frame in the user’s camera, or not. No position tracking.

This reduced the problem to a yes/no problem.

Consequently, my algorithm was very simple:

I started by picking three regions over the camera image. These predetermined regions were selected to obtain key characteristics of the pieces.

TODO illo

On each frame, I get the average color of each region.

TODO illo

The top and middle colors are subtracted, as well as the middle and bottom, producing two difference colors.

This subtraction step can be likened to a convolution in 2D image processing.

TODO illo

The two difference colors are then normalized.

TODO illo

The two resulting normalized colors can be used to compare the image for a match.

The theory behind this was based on the fact that camera sensors don’t actually pick up the true color of an object. The perceived color is affected by room lighting, camera quality, and other factors.

To work with this theory, colors were modeled as:

```
PC = TC * a + b
```

Where
* `PC` is the color perceived from the camera sensor
* `TC` is true color of the material (unknown)
* `a` and `b` are lighting parameters that describe the white balance, environmental illumination, camera quality, and other factors (unknown).

By subtracting two perceived colors, the unknown lighting variable `b` could be eliminated.

```
PC2 - PC1 = (TC2 * a + b) - (TC1 * a + b)
          = TC2 * a - TC1 * a
          = (TC2 - TC1) * a
```

TODO illo, with labels

Let’s call the differences `D1` and `D2`:

```
D1 = (TC2 - TC1) * a
D2 = (TC3 - TC2) * a
```

To eliminate the lighting variable `a`, the values were normalized, that is, divided each by the highest value.

Let’s call the normalized values `N1` and `N2`, for normalized `D1` and `D2`, respectively.

```
N1 = D1 / max(D1, D2)
   = (TC2 - TC1) * a / max(D1, D2)
   = (TC2 - TC1) / max(D1 / a, D2 / a)
   = (TC2 - TC1) / max(TC2 - TC1, TC3 - TC2)
```

TODO illo, with labels

The final values are:

```
N1 = (TC2 - TC1) / max(TC2 - TC1, TC3 - TC2)
N2 = (TC3 - TC2) / max(TC2 - TC1, TC3 - TC2)
```

As you can see the final values `N1` and `N2` are not affected by the lighting parameters at all. They are purely derived from true color. <small>According to the model anyway.</small>

Using these normalized colors meant that the image matching algorithm would be robust across different lighting conditions and various smartphone cameras.

The final step was to combine the RGB channels of the normalized colors into one series of numbers, called the **feature vector** of the image, i.e., a set of numbers that *summarize* the image.

TODO illo

Turning the image into a vector made the problem of comparing image similarity a mathematical one.

The Euclidean distance between two feature vectors approximate the difference between two corresponding images.

On each frame, the target images’ feature vectors are compared to the feature vectors processed from the camera. If the vectors match, then the images match.

TODO Live demo with vector matching

Once it gets a match the **augmented reality** experience starts rolling in.

---

## Augmented reality

The vision for the augmented reality part was that the tiles in the piece would come alive, burst out of the piece, and start drawing streaks of paint, ink, or whatever in the air, depending on the tile type.

![AR notes](../img/dimensions_arnotes.jpg)

The AR part was rendered using [three.js](https://threejs.org/). I’ve used three.js before and it was great, with very easy to learn API and good examples.

I was quickly able to sketch out virtual objects in space.

<video muted autoplay loop playsinline>
  <source src="../video/dimensions_ar1.mp4">
  <a href="../video/dimensions_ar1.mp4">Prototype video</a>
</video>

This was made by simply overlaying a transparent three.js `<canvas>` onto the `<video>` that’s streaming the camera feed.

A three.js extension called `DeviceOrientationControls` provides synchronization between the device’s orientation and the virtual camera.

Note that only device orientation can be tracked. Tracking translations in space weren’t possible yet, so virtual objects would appear follow the device when it moves.

The experience was designed around this limitation by keeping the objects at constant distance to the user, subtly hinting that there’s no need to move or walk, only looking around.

<video muted autoplay loop playsinline>
  <source src="../video/dimensions_1.mp4">
  <a href="../video/dimensions_1.mp4">Demo video</a>
</video>

<small class="small-block">There was a bug on iOS Safari with orientation tracking, which apparently was just introduced July 2019, one month before the event. Sadly most iPhone users did not get the full experience.</small>

Modeling the tiles as 3D objects were simply extrusions of the tiles’ 2D shape paths, made very easy with three.js’s `ExtrudeGeometry`.

The “paint” trails were made using an old unmaintained library called [**TrailRendererJS**](https://github.com/mkkellogg/TrailRendererJS), which surprisingly still works, although it bugs out when the virtual camera isn’t at the origin.

TODO model

The floating tiles’ movement behavior were guided by a smooth triangle wave function defined as `arccos(0.95 sin(x))`.

<span>![smooth triangle wave function](../img/dimensions_trianglewave2.png)
  <span class="caption">`y = arccos(0.95 sin(x))`</span>
</span>

This triangle wave path was wrapped around a virtual cylinder around the user’s position.

With each floating tile following a variant of this path, the result was an organized chaos of criss-crossing particles orbiting the user.

<video muted autoplay loop playsinline>
  <source src="../video/dimensions_trail.mp4">
  <a href="../video/dimensions_trail.mp4">Demo video</a>
</video>

A fun experiment is when the paint trails are allowed to go on indefinitely. The trails would eventually paint the whole scene, producing a different piece of generative art.

<span>![](../img/dimensions_trailart.png)
  <span class="caption">Trail art</span>
</span>

