import Barba from 'barba.js';

window.readyState = window.readyState || {
	ready: false,
	callbacks: [],
};

function ready(callback) {
	if (window.readyState.ready) {
		callback();
	} else {
		window.readyState.callbacks.push(callback);
	}
}

function onReady() {
	window.readyState.ready = true;
	for (let c of window.readyState.callbacks) {
		c();
	}
	window.readyState.callbacks = [];
}

document.addEventListener('DOMContentLoaded', () => {
	Barba.Pjax.preventCheck = function() { return preventCheck.apply(this, arguments) };
	Barba.Pjax.getTransition = function() { return transition };

	Barba.Pjax.start();
	Barba.Prefetch.init();

	const main = document.querySelector('.main');
	main.dataset.page = getPageName();

	onReady();
});

const transition = Barba.BaseTransition.extend({
	start() {
		window.readyState.ready = false;
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

// Modified from barba.js 965a266 to allow hash on different page
function preventCheck(evt, element) {
    if (!window.history.pushState)
      return false;

    var href = this.getHref(element);

    //User
    if (!element || !href)
      return false;

    //Middle click, cmd click, and ctrl click
    if (evt.which > 1 || evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey)
      return false;

    //Ignore target with _blank target
    if (element.target && element.target === '_blank')
      return false;

    //Check if it's the same domain
    if (window.location.protocol !== element.protocol || window.location.hostname !== element.hostname)
      return false;

    //Check if the port is the same
    if (Barba.Utils.getPort() !== Barba.Utils.getPort(element.port))
      return false;

    // REMOVED HASH CHECK

    //Ignore case where there is download attribute
    if (element.getAttribute && typeof element.getAttribute('download') === 'string')
      return false;

    //In case you're trying to load the same page
    if (Barba.Utils.cleanLink(href) == Barba.Utils.cleanLink(location.href))
      return false;

    if (element.classList.contains(this.ignoreClassLink))
      return false;

    return true;
}

export default {
	ready,
};
