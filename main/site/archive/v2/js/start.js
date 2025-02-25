"use strict";
define(["jquery","constants"],
function($,constants){
	return {init: function() {
		var $window = $(window);
		var $htmlBody = $("html, body");
		var $startBtn = $("#start-btn");

		$startBtn.on("click", function() {
			$window.off("scroll", onScroll);

			$htmlBody.animate({
				scrollTop: $window.height()
			}, constants.durationVerySlow * 2, constants.ease);

			$startBtn.animate({
				bottom: $window.height() / 2
			}, constants.durationVerySlow, constants.easeIn, function() {
				$startBtn.hide();
			});
		});

		function onScroll(e) {
			if (window.scrollY > 20) {
				$window.off("scroll", onScroll);
		
				$startBtn.prop("disabled", true);

				$startBtn.animate({
					opacity: 0
				}, constants.durationVeryFast, constants.easeIn, function() {
					$startBtn.hide();
				});
			}
		}

		$window.on("scroll", onScroll);		
		onScroll();
	}};
});