"use strict";
define(["jquery"],
function($){
	return {init:function(){
		$(".more").addClass("more-inactive");
		$(".more>.more-btn").on("click", function(){
			$(this.parentElement)
				.addClass("more-active")
				.removeClass("more-inactive");
		});
	}};
});