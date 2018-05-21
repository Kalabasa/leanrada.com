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
			div.style.display = 'none';
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
				el: div,
				visible: false,
			});
		};

		var targetElement = null;
		var $targetElement = null;
		var mouse = {x: 0, y: 0, down: false};

		$(window).mousemove(function(event) {
			cursors.forEach(function(cur, i) {
				cur.visible = true;
				cur.tx = event.clientX;
				cur.ty = event.clientY;
			});
			targetElement = findTarget(event.target);
			$targetElement = targetElement && $(targetElement);
			mouse.x = event.clientX;
			mouse.y = event.clientY;
		});

		$(window).mousedown(function(event) { mouse.down = true; });
		$(window).mouseup(function(event) { mouse.down = false; });

		update();

		function update() {
			// check if target no longer under mouse
			if (targetElement) {
				var clientRect =  targetElement.getBoundingClientRect();
				if (mouse.x < clientRect.left || mouse.y < clientRect.top
					|| mouse.x > clientRect.right || mouse.y > clientRect.bottom) {
					targetElement = null;
				} else {
					var offset = $targetElement.offset();
					var targetX = offset.left + $targetElement.outerWidth() / 2 - $window.scrollLeft();
					var targetY = offset.top + $targetElement.outerHeight() / 2 - $window.scrollTop();
				}
			}

			// update cursors
			cursors.forEach(function(cur, i) {
				var spinAngle = i*Math.PI + (targetElement ? Date.now() / 403 : Date.now() / 1771);
				var spinRadius = targetElement
					? cur.r * 0.006
					: cur.r * ((1 + Math.sin(Date.now() / 1241)) * 0.05);
				var rtx = (targetElement ? targetX : cur.tx) + Math.sin(spinAngle) * spinRadius;
				var rty = (targetElement ? targetY : cur.ty) + Math.cos(spinAngle) * spinRadius;
				cur.vx += (rtx - cur.x) * 0.1;
				cur.vy += (rty - cur.y) * 0.1;
				cur.x += cur.vx;
				cur.y += cur.vy;
				cur.vx *= targetElement ? 0.6 : 0.4;
				cur.vy *= targetElement ? 0.6 : 0.4;

				var radius = cur.visible
					? targetElement
						? Math.max($targetElement.outerWidth(), $targetElement.outerHeight()) * 1.1
						: 100 + (Math.sqrt(cur.vx*cur.vx + cur.vy*cur.vy) * 2)
					: 0;
				if (mouse.down) radius += 60;
				cur.r += (radius - cur.r) * 0.2;

				cur.el.style.left = cur.x + "px";
				cur.el.style.top = cur.y + "px";
				cur.el.style.width = cur.r + "px";
				cur.el.style.height = cur.r + "px";
				cur.el.style.display = cur.visible ? 'block' : 'none';
			});
			requestAnimationFrame(update);
		}

		function findTarget(el) {
			if (!el) return false;
			if (["a", "button"].includes(el.tagName.toLowerCase())) return el;
			if (["hello-portrait-img"].includes(el.id)) return el;
			return findTarget(el.parentElement);
		}
	}};
});