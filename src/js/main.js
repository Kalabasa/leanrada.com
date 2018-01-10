// TODO Use CDNs instead of local copies
"use strict";
requirejs.config({
	shim: {
		"jquery-bez": ["jquery"],
		"jquery_appear": ["jquery"]
	}
});

requirejs(["bower-requirejs-config"],
function() {
	requirejs(["jquery", "hello", "nav", "inview", "video"],
	function ($, hello, nav, inview, video) {
		$(document).ready(function() {
			video.init();
			nav.init();
			startUi();

			// preloader script
			var preloader = document.getElementById("preloader");
			document.body.style.overflow = "auto";
			document.body.style.height = "auto";
			preloader.parentNode.removeChild(preloader);
		});

		function startUi() {
			if (document.hidden) {
				$(document).one('visibilitychange', function() {
					startUi();
				});
			} else {
				hello.init();
				inview.init();
			}
		}
	});
});
