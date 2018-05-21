// TODO Use Babel & new modules syntax
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
	requirejs(["jquery", "start", "hello", "nav", "inview", "video", "cursor", "ua", "lazysizes"],
	function ($, start, hello, nav, inview, video, cursor, ua, lazysizes) {
		$(document).ready(function() {
			start.init();
			nav.init();
			video.init();
			cursor.init();
			ua.init();
			startUi();

			// preloader script
			var preloader = document.getElementById("preloader");
			document.body.style.overflow = "auto";
			document.body.style.height = "auto";
			document.body.className += " js";
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
