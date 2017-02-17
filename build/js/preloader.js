"use script";

document.body.style.overflow = "hidden";
document.body.style.height = "100%";

document.addEventListener("DOMContentLoaded", function() {
	var preloader = document.getElementById("preloader");
	setTimeout(function() {
		document.body.style.overflowY = "auto";
		document.body.style.height = "auto";
		preloader.className = "hide-preloader";
		setTimeout(function() {
			document.body.style.overflow = "auto";
			preloader.parentNode.removeChild(preloader);
		}, 400);
	}, 0);
});

