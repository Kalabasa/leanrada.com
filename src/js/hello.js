"use strict";
(function(_,$){
	var $window = $(window);
	var $hello_me_title = $("#hello-me-title");

	const interval = 4000;
	var titles = window.bio.titles;

	var next_title_index = 0;
	var next_titles = _.shuffle(titles.slice(1));

	var change_title = function(new_title) {
		$hello_me_title.fadeOut(60, function() {
			$hello_me_title.text(new_title);
			$hello_me_title.fadeIn(150);
		});
	}

	setInterval(function() {
		change_title(next_titles[next_title_index++]);
		if (next_title_index >= next_titles.length) {
			next_title_index = 0;
			next_titles = _.shuffle(titles);
		}
	}, interval);
})(_,jQuery);