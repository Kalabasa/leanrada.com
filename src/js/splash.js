"use strict";
define(["three","splash-scene"],
function(THREE,splashScene) {
	// TODO fallback for no WebGL
	return {init: function() {
		const container = document.getElementById("splash");

		const scene = splashScene.init();

		const renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setPixelRatio(2);
		renderer.setClearColor(scene.backgroundColor, 1);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		updateOnResize();

		container.appendChild(renderer.domElement);

		function render() {
			requestAnimationFrame(render);
			renderer.render(scene.scene, scene.camera);
		}
		render();

		function updateOnResize () {
			splashScene.update(container.offsetWidth, container.offsetHeight);
			renderer.setSize(container.offsetWidth, container.offsetHeight);
		}
		window.addEventListener("resize", updateOnResize, true);

		container.addEventListener("click", splashScene.onClick);
		window.addEventListener("scroll", splashScene.onScroll);
	}};
});
