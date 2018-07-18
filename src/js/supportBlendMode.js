document.addEventListener('DOMContentLoaded', () => {
	if (typeof window.getComputedStyle(document.body).backgroundBlendMode !== 'undefined') {
		document.body.classList.add('support-blend-mode');
	}
});
