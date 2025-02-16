"use strict";
define(["underscore","jquery","constants"],
function(_,$,constants){
	return {init: function() {
		const $window = $(window);
		const $document = $(document);
		const $htmlBody = $("html, body");
		const $nav = $("#nav");
		const $mainContainer = $("#main-container");
		const $firstSection = $mainContainer.children("section:first-of-type");


		/* Scroll reveal handling */

		var raised = false;

		function updateOnScroll(initial) {
			const navHeight = $nav.height();
			const scroll = $window.scrollTop() + $window.height();

			const fadeInterval = navHeight / 2;
			const fadeThreshold = $firstSection.offset().top + $window.height() - scrollDestOffset() - fadeInterval;

			const delta = scroll - fadeThreshold;
			const opacity = Math.max(0, Math.min(delta/fadeInterval, 1));
			$nav.css("opacity", opacity);

			if (opacity == 0) {
				$nav.hide();
			} else {
				$nav.show();
			}

			const raiseThreshold = fadeInterval;
			const toRaise = delta > raiseThreshold
				&& scroll + 1 < $document.height();

			if (toRaise) {
				if (!raised) {
					raised = true;
					$nav.addClass("raised");
				}
			} else if (raised) {
				raised = false;
				$nav.removeClass("raised");
			}
			if (!initial) {
				$nav.addClass("animated");
			}
		}

		updateOnScroll(true);
		$window.scroll(_.bind(updateOnScroll, this, false));


		/* Click handling */

		$nav.on("click", ">ol>li>a", function(event) {
			const target = event.target;
			const $dest = $(target.hash);

			var scrollTopTarget = $dest.offset().top - scrollDestOffset();
			// Clamp to scrollable range
			scrollTopTarget = Math.max(0, Math.min(scrollTopTarget, $document.height() - $window.height()));

			$htmlBody.animate({
				scrollTop: scrollTopTarget
			}, constants.durationSlow, constants.ease);

			event.preventDefault();
			window.history.replaceState(null, null, target.hash);
		});


		function scrollDestOffset() {
			return $window.height()/10;
		}
	}};
});