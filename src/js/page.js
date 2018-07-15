import Barba from 'barba.js';

document.addEventListener('DOMContentLoaded', () => {
	Barba.Pjax.preventCheck = function() { return preventCheck.apply(this, arguments) };
	Barba.Pjax.getTransition = function() { return transition };

	Barba.Pjax.start();
	Barba.Prefetch.init();

	const main = document.querySelector('.main');
	main.dataset.page = getPageName();
});

const transition = Barba.BaseTransition.extend({
	start() {
		this.finished = false;

		window.scroll({
			top: 0,
			behavior: 'smooth'
		});

		document.body.classList.add('page-transition');
		this.oldContainer.classList.add('page-exit');

		this.newContainerLoading.then(() => {
			// transplant new head because Barba.js does not do head
			// new head is in the body in a template called pjax-head
			const newHead = this.newContainer.querySelector('#pjax-head');
			this.oldHeadEls = [];
			if (newHead) {
				for(let el of [...newHead.content.children]) {
					this.oldHeadEls.push(document.getElementById(el.id));
					document.head.appendChild(el);
				}
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