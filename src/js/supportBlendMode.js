// adds .support-blend-mode class to <body> if background-blend-mode is supported
export default function supportBlendMode() {
	if (typeof window.getComputedStyle(document.body).backgroundBlendMode !== 'undefined') {
		document.body.classList.add('support-blend-mode');
	} else {
		if (ENV_DEBUG) console.warn('background-blend-mode not supported!');
	}
}
