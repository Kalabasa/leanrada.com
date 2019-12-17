import Barba from 'barba.js';

window.pageState = window.pageState || {
	initialized: false,
	ready: false,
	readyCallbacks: [],
	leaveCallbacks: [],
	scrollPositions: {},
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
function leave(callback) {
	window.pageState.leaveCallbacks.push(callback);
}

function onReady(container, page) {
	window.pageState.ready = true;
	for (let c of window.pageState.readyCallbacks) c();
	window.pageState.readyCallbacks = [];

	if (window.self === window.top) {
		// mainly for enabling keyboard scroll, because body isn't scrollable, .main is
		container.focus({ preventScroll: true });
	}

	configGtag(page);
}

function onLeave(container, page) {
	for (let c of window.pageState.leaveCallbacks) c();
	window.pageState.leaveCallbacks = [];

	window.pageState.scrollPositions[page] = {
		scrollLeft: container.scrollLeft,
		scrollTop: container.scrollTop,
	};
}

function onLoad() {
	const main = getCurrentMainElement();
	const page = getPageName();
	main.dataset.page = page;

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

		main.classList.add('page-active');
	}

	onReady(main, page);
}

const transition = Barba.BaseTransition.extend({
	start() {
		window.pageState.ready = false;
		onLeave(this.oldContainer, this.oldContainer.dataset.page);

		document.body.classList.add('page-transition');
		document.body.dataset.pageTo = getPageName();
		this.oldContainer.classList.remove('page-active');
		this.oldContainer.classList.add('page-exit');

		Promise.all([
				// prevent too much overlap by setting minimum delay before the next page's transition
				new Promise(resolve => setTimeout(resolve, 400)),

				// load subresources after loading new content
				this.newContainerLoading
					.then(() => {
						// set page name to allow scoped CSS
						this.newContainer.dataset.page = getPageName();
						this.newContainer.classList.remove('page-active');
						this.newContainer.classList.add('page-idle');
						delete this.newContainer.style.visibility;

						// transplant new head because Barba.js does not load <head>
						// new head is in the main content in a template called pjax-head
						const newHead = this.newContainer.querySelector('#pjax-head');

						let newHeadEls = [];
						this.oldHeadEls = [];

						if (newHead) {
							const newHeadContent = document.importNode(newHead.content, true);
							for(const c of [...newHeadContent.children]) {
								newHeadEls.push(c);

								const old = document.getElementById(c.id);
								if (old) this.oldHeadEls.push(old);

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

						// wait for linked subresources to load
						const linksLoaded = newHeadEls.filter(el => el.tagName === 'LINK')
							.map(el => new Promise(resolve => {
								if (el.sheet || !('onload' in el)) {
									resolve();
								} else {
									el.addEventListener('load', resolve);
									el.addEventListener('error', resolve);
								}
							}));
						return Promise.all(linksLoaded);
					}),
			])
			.then(() => {
				// animate entrance after loading all necessary stuff
				this.newContainer.classList.remove('page-idle');
				this.newContainer.classList.add('page-enter');

				// restore scroll position
				const scroll = window.pageState.scrollPositions[this.newContainer.dataset.page];
				if (scroll) {
					this.newContainer.scrollLeft = scroll.scrollLeft;
					this.newContainer.scrollTop = scroll.scrollTop;
				}

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
		onReady(this.newContainer, this.newContainer.dataset.page);
	},
});

function getCurrentMainElement() {
	return [...document.querySelectorAll('.main')].pop();
}

function getPageName() {
	let pathname = window.location.pathname;
	if (window.location.pathname.endsWith('/')) pathname += 'index.html';
	return pathname.substring(1); // remove front slash
}

function countSeps(path) {
	return (path.match(/\//g) || []).length;
}

function isReady() {
	return window.pageState.ready;
}

function configGtag(page) {
	const id = 'UA-141010266-1';

	if (!('gtag' in window)) {
		window.dataLayer = window.dataLayer || [];
		window.gtag = function(){ dataLayer.push(arguments); };
		gtag('js', new Date());

		const gtagScript = document.createElement('script');
		gtagScript.type = 'text/javascript';
		gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
		gtagScript.async = true;
		document.head.appendChild(gtagScript);
	}

	gtag('config', id, {
		page_title: document.title,
		page_path: '/' + page,
	});
}

export default {
	ready,
	leave,
	isReady,
	getCurrentMainElement,
};
