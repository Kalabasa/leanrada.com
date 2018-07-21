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

		if (ENV_DEBUG) console.log('initializing page');

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
		main.classList.add('page-active');
	}

	onReady();
}

const transition = Barba.BaseTransition.extend({
	start() {
		window.pageState.ready = false;

		window.scroll({
			top: 0,
			behavior: 'smooth'
		});

		document.body.classList.add('page-transition');
		document.body.dataset.pageTo = getPageName();
		this.oldContainer.classList.remove('page-active');
		this.oldContainer.classList.add('page-exit');

		Promise.all([
				// prevent too much overlap by setting minimum delay before the next page's transition
				new Promise(resolve => setTimeout(resolve, 300)),

				// load subresources after loading new content
				this.newContainerLoading
					.then(() => {
						// set page name to allow scoped CSS
						this.newContainer.dataset.page = getPageName();
						this.newContainer.classList.add('page-idle');
						this.newContainer.scrollTop = 0;
						delete this.newContainer.style.visibility;

						// transplant new head because Barba.js does not load <head>
						// new head is in the main content in a template called pjax-head
						const newHead = this.newContainer.querySelector('#pjax-head');

						let newHeadEls = [];
						this.oldHeadEls = [];

						if (newHead) {
							const newHeadContent = document.importNode(newHead.content, true);
							for(let c of [...newHeadContent.children]) {
								newHeadEls.push(c);
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

						// wait for subresources to load
						return Promise.all([
							newHeadEls.map(el => resolve => {
								el.addEventListener('load', resolve);
							}),
						]);
					}),
			])
			.then(() => {
				// animate entrance after loading all necessary stuff
				this.newContainer.classList.remove('page-idle');
				this.newContainer.classList.add('page-enter');

				return new Promise(resolve => {
					let resolved = false;
					const resolveOnce = () => {
						if (!resolved) resolve();
						resolved = true;
					};

					this.newContainer.addEventListener('animationend', resolveOnce);

					setTimeout(resolveOnce, 4000); // maximum transition time
				});
			})
			.then(() => this.finish());
	},

	finish() {
		for(let el of this.oldHeadEls) {
			el.remove();
		}
		this.oldHeadEls = [];

		document.body.classList.remove('page-transition');
		delete document.body.dataset.pageTo;
		this.newContainer.classList.remove('page-enter');
		this.newContainer.classList.add('page-active');

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
