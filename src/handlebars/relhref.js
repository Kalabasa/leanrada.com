import path from 'path';

export default {
	use(Handlebars) {
		Handlebars.registerHelper('relhref', function(options) {
			let href = options.fn(this);
			if (href[0] !== '/') throw new Error(`href must be absolute. got: ${href}`);

			const pagePath = options.data.root.pagePath;
			if (pagePath[0] !== '/') throw new Error(`pagePath must be absolute. got: ${pagePath}`);

			if (pagePath === href) return '#';

			const pathBase = pagePath.match(/^([^#]*\/)[^\/]+$/)[1];

			return path.relative(pathBase, href);
		});
	},
};
