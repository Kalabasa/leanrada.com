"use strict";
define(["jquery","three","splash-scene"],
function($,THREE,splashScene) {
	// TODO fallback for no WebGL
	return {init: function() {
		const container = document.getElementById("splash");

		const scene = splashScene.init();

		const renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setPixelRatio(2);
		renderer.setClearColor(scene.backgroundColor, 1);

		var isVisible = true;
		updateOnResize();

		container.appendChild(renderer.domElement);

		function render() {
			if (isVisible) {
				requestAnimationFrame(render);
			}
			renderer.render(scene.scene, scene.camera);
		}
		render();

		function updateOnResize () {
			splashScene.update(container.offsetWidth, container.offsetHeight);
			renderer.setSize(container.offsetWidth, container.offsetHeight);
		}
		window.addEventListener("resize", updateOnResize, true);

		container.addEventListener("mouseup", splashScene.onMouseUp);
		container.addEventListener("touchend", splashScene.onTouchEnd);
		container.addEventListener("mousemove", splashScene.onMouseMove);
		window.addEventListener("scroll", function(e) {
			var wasVisible = isVisible;
			isVisible = window.scrollY < $(window).height();
			if (!wasVisible && isVisible) {
				render();
			}
			splashScene.onScroll(e);
		});
	}};
});
