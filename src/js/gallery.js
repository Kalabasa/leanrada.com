"use strict";
(function($){
	var $window = $(window);
	var $body = $("html,body");
	var $gallery = $("#gallery");
	var $btn_left = $("#btn-left");
	var $btn_right = $("#btn-right");
	var $btn_down = $("#btn-down");

	// NOTE: sync variables with _layout.scss
	const gallery_col_size = 200; // $gallery-col-size
	const gallery_col_size_expanded = 400; // $gallery-col-size-expanded
	const media_break_sm = 600; // $media_break_sm

	// NOTE: sync variables with _animations.scss
	const gallery_animation_duration = 400; // $speed
	const gallery_animation_ease = $.bez([0.5,0,0,1]); // $ease

	const gallery_page_scroll_delta = compute_page_scroll_delta();

	var expanded_gallery_item = null;
	var last_mouse = {x:0, y:0};

	function compute_page_scroll_delta() {
		var win_width = $window.width();
		return win_width < media_break_sm ? win_width : win_width * 2/3;
	}

	// Auto-scroll when hovering a gallery item
	$gallery.on("mousemove", "article", function(e) {
		if (last_mouse.x === e.pageX && last_mouse.y === e.pageY) return;
		last_mouse.x = e.pageX;
		last_mouse.y = e.pageY;
		if (this === expanded_gallery_item) return;

		var win_width = $window.width();
		var bounds = this.getBoundingClientRect();
		if (bounds.left < 0) {
			var scroll_target = $gallery.scrollLeft() + bounds.left;
			$gallery.animate({
				scrollLeft: scroll_target
			}, gallery_animation_duration, gallery_animation_ease);
		} else if (bounds.left + gallery_col_size_expanded > win_width) {
			var scroll_target = $gallery.scrollLeft() + bounds.left + gallery_col_size_expanded - win_width;
			if (null !== expanded_gallery_item) {
				var other_width = $(expanded_gallery_item).innerWidth();
				scroll_target += gallery_col_size_expanded - other_width - gallery_col_size;
			}
			$gallery.animate({
				scrollLeft: scroll_target
			}, gallery_animation_duration, gallery_animation_ease);
		}
		expanded_gallery_item = this;
	}).on("mouseleave", "article", function() {
		setTimeout(function() {
			if(this === expanded_gallery_item) expanded_gallery_item = null;
		}.bind(this), 0);
	});

	// Gallery paging buttons
	$btn_left.click(function() {
		$gallery.animate({
			scrollLeft: "-=" + gallery_page_scroll_delta
		});
	});
	$btn_right.click(function() {
		$gallery.animate({
			scrollLeft: "+=" + gallery_page_scroll_delta
		});
	});

	// The scroll down button
	$btn_down.click(function() {
		$body.animate({
			scrollTop: $window.height()
		});
	});

	// Hide the buttons when not at the top + Reveal effect
	$window.scroll(function() {
		var scroll = $window.scrollTop();
		var visible_down = $btn_down.is(":visible");
		if (scroll > $window.height()/2) {
			if (visible_down) $btn_down.fadeOut();
		} else {
			if (!visible_down) $btn_down.fadeIn();
		}
		update_gallery_btn_visibility();
	});

	// Gallery buttons visibility
	var debounced_update_gallery_btn_visibility = _.debounce(update_gallery_btn_visibility, 50);
	$gallery
		.scroll(debounced_update_gallery_btn_visibility)
		.mousemove(debounced_update_gallery_btn_visibility);
	$btn_left.mousemove(debounced_update_gallery_btn_visibility);
	$btn_right.mousemove(debounced_update_gallery_btn_visibility);

	function update_gallery_btn_visibility() {
		var scroll_window = $window.scrollTop();
		var scroll_gallery = $gallery.scrollLeft();
		var visible_left = $btn_left.is(":visible");
		var visible_right = $btn_right.is(":visible");

		if (scroll_window > $window.height()/2) {
			if (visible_left || visible_right) {
				$btn_left.fadeOut();
				$btn_right.fadeOut();
			}
		} else {
			var tolerance = 10;
			if (scroll_gallery > tolerance) {
				if(!visible_left) $btn_left.fadeIn();
			} else if(visible_left) {
				$btn_left.fadeOut();
			}
			if (scroll_gallery + $gallery.innerWidth() + tolerance < $gallery.get(0).scrollWidth) {
				if(!visible_right) $btn_right.fadeIn();
			} else if(visible_right) {
				$btn_right.fadeOut();
			}
		}
	}

	$btn_left.hide();
	$btn_right.hide();
	update_gallery_btn_visibility();
})(jQuery);