(function () {
	// if deep nested, color yellow
	if (window.self !== window.top) {
		var nestedDocument = document.querySelector('#showcase').contentDocument;
		nestedDocument.open("text/html", "replace");
		nestedDocument.close();
		nestedDocument.body.style.background = 'linear-gradient(120deg, #FFDD55 40%, #FFB838)';
	}

	// if nested, tell parent to bring me up
	if (window.self !== window.top && window.parent === window.top) window.top.postMessage('merge', window.location.origin);

	// listen to child iframe for breakout request
	window.addEventListener('message', function (event) {
		if (event.origin !== window.location.origin) return;
		if (event.data === 'merge') {
			var iframe = document.querySelector('#showcase');

			var rect = iframe.getBoundingClientRect();
			var initial = {
				left: rect.left + 'px',
				top: rect.top + 'px',
				width: rect.width + 'px',
				height: rect.height + 'px'
			};
			var target = {
				left: '0px',
				top: '0px',
				width: '100vw',
				height: '100vh'
			};

			iframe.style.display = 'block';
			iframe.style.position = 'fixed';
			Object.assign(iframe.style, initial);
			iframe.style.zIndex = 2000;
			iframe.removeAttribute('width');
			iframe.removeAttribute('height');

			requestAnimationFrame(function () {
				requestAnimationFrame(function () {
					iframe.classList.add('growing');
					Object.assign(iframe.style, target);
				});
			});

			var wait = function wait() {
				if (iframe.getBoundingClientRect().top === 0) {
					window.location = iframe.contentWindow.location;
					return;
				} else {
					requestAnimationFrame(wait);
				}
			};
			wait();
		}
	});

}());
