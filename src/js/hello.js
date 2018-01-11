"use strict";
define(["underscore", "jquery", "hello-data"],
function(_,$,data){
	return {init: function() {
		var $window = $(window);
		var helloMeTitle = document.getElementById("hello-me-title");
		var $helloMeTitle = $(helloMeTitle);

		const interval = 2400;
		var titles = data.titles;

		var also = true;

		var nextTitleIndex = 0;
		var nextTitles = _.shuffle(titles.slice(1));

		function changeTitle(newTitle) {
			$helloMeTitle.fadeOut(60, function() {
				$helloMeTitle.text((also ? "also " : "") + newTitle);
				$helloMeTitle.fadeIn(150);
				also = false;
			});
		}

		setInterval(function() {
			changeTitle(nextTitles[nextTitleIndex++]);
			if (nextTitleIndex >= nextTitles.length) {
				nextTitleIndex = 0;
				nextTitles = _.shuffle(titles);
			}
		}, interval);
	}};
});