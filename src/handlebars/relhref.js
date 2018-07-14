import path from 'path';

export default {
	use(Handlebars) {
		Handlebars.registerHelper('relhref', function(options) {
			let href = options.fn(this);
			const pageFilename = options.data.root.pageFilename;
			if (pageFilename) {
				if (href === pageFilename) {
					href = '#';
				} else if (href.startsWith(pageFilename) && href.charAt(pageFilename.length) === '#') {
					href = href.substring(pageFilename.length);
				}
			}
			if (href.startsWith('index.html')) {
				href = href.replace(/^index\.html/, '.');
			}
			return href;
		});
	},
};
