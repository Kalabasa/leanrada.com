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
	requirejs(["jquery", "start", "hello", "nav", "inview", "video", "cursor"],
	function ($, start, hello, nav, inview, video, cursor) {
		$(document).ready(function() {
			start.init();
			nav.init();
			video.init();
			// cursor.init();
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
