// if deep nested, color yellow
if (window.self !== window.top) {
	const nestedDocument = document.querySelector('#portal').children[0].contentDocument;
	nestedDocument.open("text/html", "replace");
	nestedDocument.close();
	nestedDocument.body.style.background = 'linear-gradient(120deg, #FFDD55 40%, #FFB838)';
}

// if nested, tell parent to bring me up
if (window.self !== window.top && window.parent === window.top) window.top.postMessage('merge', window.location.origin);

// listen to child iframe for breakout request
window.addEventListener('message', event => {
	if (event.origin !== window.location.origin) return;
	if (event.data === 'merge') {
		const container = document.querySelector('#portal');

		const rect = container.getBoundingClientRect();

		const a = {
			left: rect.left,
			top: rect.top,
			right: window.innerWidth - rect.right,
			bottom: window.innerHeight - rect.bottom,
		};
		const b = {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
		};

		const duration = 1500;
		let start, end;

		const expand = () => {
			let t = (Date.now() - start) / duration;
			let v;
			if (t >= 1) {
				window.location = container.children[0].contentWindow.location;
				return;
			} else {
				t = ease(t);
				const u = 1 - t;
				v = {
					left: b.left * t + a.left * u,
					right: b.right * t + a.right * u,
					top: b.top * t + a.top * u,
					bottom: b.bottom * t + a.bottom * u,
				};
				requestAnimationFrame(expand);
			}
			container.style.left = v.left + 'px';
			container.style.right = v.right + 'px';
			container.style.top = v.top + 'px';
			container.style.bottom = v.bottom + 'px';
		};

		setTimeout(() => {
			container.style.position = 'fixed';
			container.style.zIndex = 2000;
			container.style.width = 'unset';
			container.style.height = 'unset';
			container.style.border = 'unset';

			start = Date.now();
			end = Date.now() + duration;

			requestAnimationFrame(expand);
		}, 500);

		container.style.boxShadow = '0 0 200px #0006';
		container.style.transition = 'box-shadow 2s ease';
	}
});

function ease(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t }
