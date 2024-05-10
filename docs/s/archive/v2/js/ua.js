// Sets user agent classes for browser-specific CSS (For browser bugs/workarounds only!)
"use strict";
define(["ua-parser-js"],
function(UAParser) {
	return {init: function() {
		var ua = new UAParser().getResult();
		document.body.className +=
			" ua-browser-name_" + ua.browser.name
			+ " ua-os-name_" + ua.os.name;
	}};
});
