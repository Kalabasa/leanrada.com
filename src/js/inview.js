"use strict";
define(["jquery","jquery_appear"],
function($){
	return {init: function(){
		$(window).resize(function() {
			$(".iv").data("appear-top-offset", -$(window).height() / 3);
		});
		$(".iv").addClass("iv-active iv-invisible")
			.data("appear-top-offset", -$(window).height() / 3)
			.appear();
		$(document.body)
			.on("appear", ".iv", function(event, $appeared) {
				$appeared
					.addClass("iv-entered")
					.addClass("iv-visible")
					.removeClass("iv-invisible");
			})
			.on("disappear", ".iv", function(event, $appeared) {
				$appeared
					.addClass("iv-exited")
					.addClass("iv-invisible")
					.removeClass("iv-visible");
			});
		$.force_appear();
	}};
});
