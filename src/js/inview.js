"use strict";
define(["jquery","jquery_appear"],
function($){
	return {init: function(){
		$(".iv").addClass("iv-active iv-invisible").appear();
		$.force_appear();
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
	}};
});