"use strict";
define(["underscore", "jquery", "hello-data"],
function(_,$,data){
	return {init: function() {
		var $window = $(window);
		var helloMeTitle = document.getElementById("hello-me-title");
		var $helloMeTitle = $(helloMeTitle);

		const interval = 2200;
		var titles = data.titles;

		var nextTitleIndex = 0;
		var nextTitles = _.shuffle(titles.slice(1));

		function changeTitle(newTitle) {
			$helloMeTitle.fadeOut(60, function() {
				$helloMeTitle.text(newTitle);
				$helloMeTitle.fadeIn(150);
			});
		}

		const onTitleScrollVisible = _.once(function() {
			setInterval(function() {
				changeTitle(nextTitles[nextTitleIndex++]);
				if (nextTitleIndex >= nextTitles.length) {
					nextTitleIndex = 0;
					nextTitles = _.shuffle(titles);
				}
			}, interval);
		});

		$window.scroll(function() {
			var rect = helloMeTitle.getBoundingClientRect();
			if (rect.top >= 0 && rect.bottom < window.innerHeight) {
				onTitleScrollVisible();
			}
		});
	}};
});