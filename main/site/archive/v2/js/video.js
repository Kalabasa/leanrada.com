"use strict";
define(["jquery", "underscore"],
function($){
	return {init:function(){
		$("video[autoplay]").each(function(){
			if (this.paused) {
				this.controls = true;
			}
		});
	}};
});