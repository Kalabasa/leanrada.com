"use strict";
(function(_,$){
	var $window = $(window);
	var hello_me_title = document.getElementById("hello-me-title");
	var $hello_me_title = $(hello_me_title);

	const interval = 3500;
	var titles = window.bio.titles;

	var next_title_index = 0;
	var next_titles = _.shuffle(titles.slice(1));

	var change_title = function(new_title) {
		$hello_me_title.fadeOut(60, function() {
			$hello_me_title.text(new_title);
			$hello_me_title.fadeIn(150);
		});
	}

	var on_title_scroll_visible = _.once(function() {
		setInterval(function() {
			change_title(next_titles[next_title_index++]);
			if (next_title_index >= next_titles.length) {
				next_title_index = 0;
				next_titles = _.shuffle(titles);
			}
		}, interval);
	});

	$window.scroll(function() {
		var rect = hello_me_title.getBoundingClientRect();
		if (rect.top >= 0 && rect.bottom < window.innerHeight) {
			on_title_scroll_visible();
		}
	});
})(_,jQuery);