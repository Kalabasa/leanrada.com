// TODO Use CDNs instead of local copies
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
	requirejs(["jquery", "splash", "start", "hello", "nav", "inview", "more", "video"],
	function ($, splash, start, hello, nav, inview, more, video) {
		// TODO Lazyload images
		$(document).ready(function() {
			splash.init();
			start.init();
			hello.init();
			nav.init();
			inview.init();
			more.init();
		});
		$(window).on("load", function() {
			video.init();
		});
	});
});
