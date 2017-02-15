"use strict";
requirejs.config({
	shim: {
		"jquery-bez": ["jquery"],
		"jquery_appear": ["jquery"],
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
	requirejs(["splash", "start", "hello", "nav", "inview"],
	function (splash, start, hello, nav, inview) {
		splash.init();
		start.init();
		hello.init();
		nav.init();
		inview.init();
	});
});
