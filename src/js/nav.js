"use strict";
(function($){
	var $window = $(window);
	var $nav = $("#nav");

	$window.scroll(function() {
		var scroll = $window.scrollTop();
		if (scroll > $nav.innerHeight()) {
			$nav.fadeIn(200);
		} else {
			$nav.fadeOut(100);
		}
	});

	$nav.hide();
})(jQuery);