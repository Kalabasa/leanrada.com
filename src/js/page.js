import Barba from 'barba.js';

window.pageState = window.pageState || {
	initialized: false,
	ready: false,
	readyCallbacks: [],
};

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', onLoad);
} else {
	onLoad();
}

function ready(callback) {
	if (window.pageState.ready) {
		callback();
	} else {
		window.pageState.readyCallbacks.push(callback);
	}
}

function onReady() {
	window.pageState.ready = true;
	for (let c of window.pageState.readyCallbacks) {
		c();
	}
	window.pageState.readyCallbacks = [];

	const main = [...document.querySelectorAll('.main')].pop();
	main.focus(); // mainly for enabling keyboard scroll, because body isn't scrollable, .main is
}

function onLoad() {
	if (!window.pageState.initialized) {
		window.pageState.initialized = true;

		Barba.Pjax.getTransition = function() { return transition };

		Barba.Pjax.start();
		Barba.Prefetch.init();

		let lastHref = window.location.href;
		Barba.Dispatcher.on('initStateChange', (status) => {
			const currentLevel = countSeps(lastHref);
			const targetLevel = countSeps(status.url);
			if (targetLevel < currentLevel) {
				document.body.classList.add('page-going-up');
			}
			lastHref = status.url;
		});
		Barba.Dispatcher.on('transitionCompleted', (el) => {
			document.body.classList.remove('page-going-up');
		});

		const main = [...document.querySelectorAll('.main')].pop();
		main.dataset.page = getPageName();
	}

	onReady();
}

const transition = Barba.BaseTransition.extend({
	start() {
		window.pageState.ready = false;
		this.finished = false;

		window.scroll({
			top: 0,
			behavior: 'smooth'
		});

		document.body.classList.add('page-transition');
		document.body.dataset.pageTo = getPageName();
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
		delete document.body.dataset.pageTo;
		this.newContainer.classList.remove('page-enter');

		this.done();
		onReady();
	},
});

function getPageName() {
	let pathname = window.location.pathname;
	if (window.location.pathname.endsWith('/')) pathname += 'index.html';
	return pathname.substring(1); // remove front slash
}

function countSeps(path) {
	return (path.match(/\//g) || []).length;
}

export default {
	ready,
};
