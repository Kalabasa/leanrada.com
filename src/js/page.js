import Barba from 'barba.js';

window.pageReadyState = window.pageReadyState || {
	ready: false,
	callbacks: [],
};

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', onLoad);
} else {
	onLoad();
}

function ready(callback) {
	if (window.pageReadyState.ready) {
		callback();
	} else {
		window.pageReadyState.callbacks.push(callback);
	}
}

function onReady() {
	window.pageReadyState.ready = true;
	for (let c of window.pageReadyState.callbacks) {
		c();
	}
	window.pageReadyState.callbacks = [];
}

function onLoad() {
	Barba.Pjax.getTransition = function() { return transition };

	Barba.Pjax.start();
	Barba.Prefetch.init();

	const main = [...document.querySelectorAll('.main')].pop();
	main.dataset.page = getPageName();

	onReady();
}

const transition = Barba.BaseTransition.extend({
	start() {
		window.pageReadyState.ready = false;
		this.finished = false;

		window.scroll({
			top: 0,
			behavior: 'smooth'
		});

		document.body.classList.add('page-transition');
		this.oldContainer.classList.add('page-exit');

		Promise.all([
			new Promise((resolve) => setTimeout(resolve, 250)),
			this.newContainerLoading,
		]).then(() => {
			// transplant new head because Barba.js does not do head
			// new head is in the body in a template called pjax-head
			const newHead = this.newContainer.querySelector('#pjax-head');
			this.oldHeadEls = [];
			if (newHead) {
				const newHeadContent = document.importNode(newHead.content, true);
				for(let c of [...newHeadContent.children]) {
					this.oldHeadEls.push(document.getElementById(c.id));

					if (c.tagName === 'SCRIPT') {
						// Browsers only execute <scripts> freshly created by createElement
						const clone = document.createElement('script');
						for (let attr of c.attributes) {
							clone.setAttribute(attr.name, attr.value);
						}
						newHeadContent.replaceChild(clone, c);
					}
				}
				document.head.appendChild(newHeadContent);
				newHead.remove();
			}

			this.newContainer.dataset.page = getPageName();

			this.newContainer.classList.add('page-enter');

			this.newContainer.addEventListener('animationend', () => this.finish());
			setTimeout(() => this.finish(), 3000);
		});
	},

	finish() {
		if (this.finished) return;
		this.finished = true;

		for(let el of this.oldHeadEls) {
			el.remove();
		}
		this.oldHeadEls = [];

		document.body.classList.remove('page-transition');
		this.newContainer.classList.remove('page-enter');

		this.done();
		onReady();
	},
});

function getPageName() {
	if (window.location.pathname.endsWith('/')) return 'index.html';
	return window.location.pathname.split('/').slice(-1)[0];
}

export default {
	ready,
};
