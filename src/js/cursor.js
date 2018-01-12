"use strict";
define(["jquery"],
function($){
	return {init: function() {
		if (!CSS.supports("mix-blend-mode", "screen") || !CSS.supports("pointer-events", "none")) return;

		var $window = $(window);

		var cursors = [];
		for (var i = 0; i < 2; i++) {
			var div = document.createElement("div");
			div.className = "cursor cursor" + (i + 1);
			document.body.appendChild(div);
			var midX = $(window).width() / 2;
			var midY = $(window).height() / 2;
			cursors.push({
				x: midX,
				y: midY,
				vx: 0,
				vy: 0,
				tx: midX,
				ty: midY,
				r: 0,
				el: div
			});
		};

		var targetElement = null;
		var $targetElement = null;
		var mouseDown = false;

		$(window).mousemove(function(event) {
			cursors.forEach(function(cur, i) {
				cur.tx = event.clientX;
				cur.ty = event.clientY;
			});
			targetElement = findTarget(event.target);
			$targetElement = targetElement && $(targetElement);
		});

		$(window).mousedown(function(event) { mouseDown = true; });
		$(window).mouseup(function(event) { mouseDown = false; });

		update();

		function update() {
			if (targetElement) {
				var offset = $targetElement.offset();
				var targetX = offset.left + $targetElement.outerWidth() / 2 - $window.scrollLeft();
				var targetY = offset.top + $targetElement.outerHeight() / 2 - $window.scrollTop();
			}
			cursors.forEach(function(cur, i) {
				var spinAngle = i*Math.PI + (targetElement ? Date.now() / 403 : Date.now() / 1771);
				var spinRadius = targetElement ? cur.r * 0.006 : cur.r * (0.1 + (1 + Math.sin(Date.now() / 1241)) * 0.05);
				var rtx = (targetElement ? targetX : cur.tx) + Math.sin(spinAngle) * spinRadius;
				var rty = (targetElement ? targetY : cur.ty) + Math.cos(spinAngle) * spinRadius;
				cur.vx += (rtx - cur.x) * 0.1;
				cur.vy += (rty - cur.y) * 0.1;
				cur.x += cur.vx;
				cur.y += cur.vy;
				cur.vx *= targetElement ? 0.6 : 0.4;
				cur.vy *= targetElement ? 0.6 : 0.4;

				var radius = targetElement ? Math.max($targetElement.outerWidth(), $targetElement.outerHeight()) * 1.1 : 0;
				if (mouseDown) radius += 60;
				cur.r += (radius - cur.r) * 0.2;

				cur.el.style.left = cur.x + "px";
				cur.el.style.top = cur.y + "px";
				cur.el.style.width = cur.r + "px";
				cur.el.style.height = cur.r + "px";
			});
			requestAnimationFrame(update);
		}

		function findTarget(el) {
			if (!el) return false;
			if (["a", "button"].includes(el.tagName.toLowerCase())) return el;
			return findTarget(el.parentElement);
		}
	}};
});