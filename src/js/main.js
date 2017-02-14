"use strict";
requirejs.config({
	shim: {
		"jquery-bez": ["jquery"],
		three: {
			exports: "THREE"
		}
	},
	paths: {
		three: "../threejs/build/three.min"
	}
});

requirejs(["bower-requirejs-config"],
function() {
	requirejs(["hello", "nav", "splash"],
	function (hello, nav, splash) {
		hello.init();
		nav.init();
		splash.init();
	});
});
