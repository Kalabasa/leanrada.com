<!--{
	"template": "work",
	"data": "projects_byid.dimensions"
}-->

# Dimensions

## Part 2: Augmented reality

<small class="small-block">[Part 1 of this post.](dimensions.html)</small>

The idea of including augmented reality was wholly inspired by [AR.js](https://github.com/jeromeetienne/AR.js), an awesome project that brings fast and easy augmented reality to the web.

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/0MtvjFg7tik" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

The planned user flow was like this:

* User sees the piece and notices QR code.
* User whips out smartphone to scan QR code.
* Smartphone is directed to the app.
* App opens the phone’s camera to track the piece.
* App superimposes virtual art on the physical art.

Implementing piece tracking (step 4) was met with difficulty. AR.js required special markers in order to track the 3D scene.

The prints were already finalized, so I couldn’t add AR markers on it then. Plus, the piece already had a QR code slapped on it. Adding any more technological tags would’ve ruined it.

I looked around for alternatives like **Tracking.js**, **OpenCV**, and even **TensorFlow**, but ultimately implemented my own **image recognition** algorithm.

---

## Image recognition

[**Image recognition**](https://en.wikipedia.org/wiki/Computer_vision#Recognition) is a computer vision problem of determining whether an image contains some specific object or not. I used this to determine if the piece has been aligned in front of the camera.

<span class="bleed">
  <video muted autoplay loop playsinline>
    <source src="../video/dimensions_imagerec.mp4">
    <a href="../video/dimensions_imagerec.mp4">Demo video</a>
  </video>
</span>
<span class="caption">The app recognizes when the target piece has been aligned.</span>

There exists many solutions to this problem, ranging from simple histogram matching to convolutional neural networks. These days everyone just uses neural networks and deep learning if possible.

These technologies power some apps like Face Swap and Snaphchat filters, and is also used for things like mass camera surveillance.

In my case however, I’ve simplified the problem to determining whether any of the three pieces are in the center frame in the user’s camera, or not. No more position tracking. This is just a yes/no problem.

Consequently, my algorithm was very simple:

I start by picking three regions over the camera image.

Then I get the average color of each region.

TODO DEMO

These specific regions were picked so as to obtain the pieces’ key characteristics.

Then the top and middle colors are subtracted, as well as the middle and bottom, producing two colors.

TODO DEMO

The subtraction operation cancels out variances in lighting, camera quality, and white balance. This step can be compared to a convolution in 2D image processing.

TODO Theory behind subtraction?
PerceivedColor = TrueColor * Light + Noise

The channels of the differences are separated and combined as one series of numbers. This series of numbers is called a feature vector, i.e., numbers that summarize the image.

TODO DEMO

Finally, the vector is normalized.

Turning images into vectors makes the problem of comparing images a mathematical one.

The Euclidean distance between two feature vectors approximate the difference between two corresponding images.

This can be used to compare the camera image with a reference image - a target image to match.

I obtained reference feature vectors from the raw pixel data and on-site photos. On each frame, these reference vectors are compared to the feature vectors processed from the camera. If the vectors match, then the images match.

TODO Live demo with vector matching

Once it gets a match the **augmented reality** experience starts rolling in.

---

## Augmented reality

Remember the concept for the tiles? The pen, pencil, brush, et al?

The vision for the augmented reality part was that these tiles would come alive, burst out of the piece, and start drawing streaks of paint, ink, or whatever in the air.

![AR notes](../img/dimensions_arnotes.jpg)

The AR part was rendered using [three.js](https://threejs.org/). I’ve used three.js before and it was great, very easy-to-learn API, great examples.

I was quickly able to render virtual objects in real space:

<video muted autoplay loop playsinline>
  <source src="../video/dimensions_ar1.mp4">
  <a href="../video/dimensions_ar1.mp4">Demo video</a>
</video>

This was made by simply overlaying a transparent three.js `<canvas>` onto the `<video>` that’s streaming the camera feed.

A three.js extension called `DeviceOrientationControls` provides synchronization between the device’s orientation and the virtual camera.

Note that only device orientation can be tracked. Translations in space weren’t tracked, so virtual objects would appear follow the device. The experience was designed around this limitation.

<small class="small-block">There was a bug on iOS Safari with orientation tracking due to changes in their permissions model (?), which apparently was just released July 2019. The bug was only discovered in production (i.e., at the exhibit) and I sadly witnessed some iPhone users not getting the full experience.</small>

Modeling the tiles as 3D objects were simply extrusions of the tiles’ paths, made easy with three.js’s `ExtrudeGeometry`.

The “paint” trails were made using an old unmaintained library called [**TrailRendererJS**](https://github.com/mkkellogg/TrailRendererJS), which surprisingly still works, although it bugs out when the camera isn’t at the origin.

The floating tiles’ movement behavior were guided by the triangle wave function defined as `arccos(sin(x))`. It looks like this:

<span>![triangle wave function](../img/dimensions_trianglewave.png)
  <span class="caption">`y = arccos(sin(x))`</span>
</span>

Multiplying the sine value smoothens out the curve which makes the tiles’ movement more organic.

<span>![smooth triangle wave function](../img/dimensions_trianglewave2.png)
  <span class="caption">`y = arccos(0.95 sin(x))`</span>
</span>

Imagine that path multplied for each floating tile.

![many smooth triangle wave function](../img/dimensions_waves.png)

Then the paths are wrapped around an imaginary cylinder around the user’s position. A little bit of randomness added.

resulting in an organized chaos of particles orbiting the user, and creating criss-crossing trails.

<video muted autoplay loop playsinline>
  <source src="../video/dimensions_trail.mp4">
  <a href="../video/dimensions_trail.mp4">Demo video</a>
</video>

A fun experiment is when the paint trails are allowed to go on indefinitely. These trails would eventually produce another piece of 2D generative art.

<span>![](../img/dimensions_trailart.png)
  <span class="caption">Trail art</span>
</span>

