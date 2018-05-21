"use strict";
define(["jquery","constants"],
function($,constants){
	return {init: function() {
		const threshold = 20;
		var $window = $(window);
		var $htmlBody = $("html, body");
		var $startBtn = $("#start-btn");
		
		if (window.scrollY <= threshold) {
			$startBtn.show();
		
			$startBtn.on("click", function() {
				$window.off("scroll", this);

				$htmlBody.animate({
					scrollTop: $window.height()
				}, constants.durationVerySlow * 2, constants.ease);

				$startBtn.animate({
					bottom: $window.height() / 2
				}, constants.durationVerySlow, constants.easeIn, function() {
					$startBtn.hide();
				});
			});

			$window.on("scroll", onScroll);

			function onScroll() {
				if (window.scrollY > threshold) {
					$window.off("scroll", onScroll);
			
					$startBtn.prop("disabled", true);

					$startBtn.animate({
						opacity: 0
					}, constants.durationVeryFast, constants.easeIn, function() {
						$startBtn.hide();
					});
				}
			}
		}
	}};
});