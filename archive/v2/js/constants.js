"use strict";
define(["jquery", "jquery-bez"],
function($){
	return Object.freeze({
		// Animation constants (see _animations.scss)
		durationVerySlow: 800,
		durationSlow: 400,
		durationFast: 200,
		durationVeryFast: 100,
		ease: $.bez([0.5,0,0,1]),
		easeOut: $.bez([0.2,0,0.25,1]),
		easeEnter: $.bez([0.2,0.5,0.25,1]),
		easeIn: $.bez([0.75,0,0.8,1]),
		easeExit: $.bez([0.75,0,0.8,0.5])
	});
});