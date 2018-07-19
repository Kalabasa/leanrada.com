import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

import _ from 'lodash';
import rimraf from 'rimraf';
import glob from 'glob';
import ncp from 'ncp';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const globAsync = promisify(glob);

import Handlebars from 'handlebars';
import marked from 'marked';

import stylus from 'stylus';
import stylusAutoprefixer from 'autoprefixer-stylus';
import uglifycss from 'uglifycss';

import { rollup } from 'rollup';
import rollupReplace from 'rollup-plugin-replace';
import rollupResolve from 'rollup-plugin-node-resolve';
import rollupCommonjs from 'rollup-plugin-commonjs';
import rollupBabel from 'rollup-plugin-babel';

import relhref from './src/handlebars/relhref.js';
import data from './src/data.js';

const prod = process.argv.includes('--prod');
if (prod) console.log('prod mode');

const jsConstants = {
	ENV: prod ? 'production' : 'debug',
	ENV_PROD: prod,
	ENV_DEBUG: !prod,
};

// Begin build

[
	'build',
	'build/works',
].forEach(dir => {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir);
})

relhref.use(Handlebars);
Handlebars.registerPartial('content', '{{{ content }}}')

const partials = globAsync('src/handlebars/*.partial.handlebars')
	.then(files => {
		let partials = [];
		for (let file of files) {
			const partialName = path.basename(file, '.partial.handlebars');

			console.log(`compiling partial ${file} ➔ ${partialName}`);

			const partial = readFileAsync(file, 'utf8')
				.then(template => {
					Handlebars.registerPartial(partialName, template);
					return partialName;
				});
			partials.push(partial);
		}
		return Promise.all(partials);
	});

const pageHtmlFiles = partials
	.then(() => globAsync('src/pages/*.handlebars'))
	.then(files => {
		let pageHtmlFiles = [];
		for (let file of files) {
			const pageName = path.basename(file, path.extname(file));
			const pagePath = `/${pageName}.html`;
			const pageData = { ...data, pagePath };
			const out = `build/${pagePath}`;

			console.log(`compiling ${file} ➔ ${out}`);

			const htmlFile = readFileAsync(file, 'utf8')
				.then(src => Handlebars.compile(src)(pageData))
				.then(html => writeFileAsync(out, html))
				.then(() => out);
			pageHtmlFiles.push(htmlFile);
		}
		return Promise.all(pageHtmlFiles);
	});

const mdHtmlFiles = partials
	.then(() => globAsync('src/pages/**/*.md'))
	.then(files => {
		let mdHtmlFiles = [];
		for (let file of files) {
			const fileMd = file.replace(/\.md$/, '.html');
			const pagePath = fileMd.replace(/^src\/pages\//, '/');
			const out = fileMd.replace(/^src\/pages/, 'build');

			console.log(`compiling ${file} ➔ ${out}`);

			const htmlFile = readFileAsync(file, 'utf8')
				.then(md => {
					// extract metadata
					const metaMatch = md.match(/<!--({(.|\r|\n)+})-->/);
					const meta = metaMatch ? JSON.parse(metaMatch[1]) : {};
					return { md: md.substring(metaMatch.index + metaMatch[0].length), meta };
				})
				.then(({ md, meta }) => {
					// supply variables in md itself
					if (meta.template) {
						const pageData = meta.data ? _.get(data, meta.data) : {};
						md = Handlebars.compile(md)(pageData);
					}
					return { md, meta };
				})
				.then(({ md, ...obj }) =>
					// convert md to html
					promisify(marked)(md)
						.then(html => ({ html, ...obj }))
				)
				.then(({ html, meta }) => {
					// provide page template
					if (meta.template) {
						const template = fs.readFileSync(`src/handlebars/${meta.template}.handlebars`, 'utf8');
						const pageData = meta.data ? _.get(data, meta.data) : {};
						html = Handlebars.compile(template)({
							...pageData,
							pagePath,
							content: new Handlebars.SafeString(html)
						});
					}
					return html;
				})
				.then(html => writeFileAsync(out, html))
				.then(() => out);
			mdHtmlFiles.push(htmlFile);
		}
		return Promise.all(mdHtmlFiles);
	});

const htmlFiles = Promise.all([pageHtmlFiles, mdHtmlFiles])
	.then(arrs => arrs.reduce((acc, arr) => acc.concat(arr), []));

const cssFiles = globAsync('src/pages/**/*.styl')
	.then(files => {
		const autoprefixer = stylusAutoprefixer();

		let cssFiles = [];
		for (let file of files) {
			const out = file.replace(/^src\/pages/, 'build').replace(/\.styl$/, '.css');

			console.log(`compiling ${file} ➔ ${out}`);

			const paths = ['node_modules', 'src/pages'].map(p => path.resolve(__dirname, p));
			const cssFile = readFileAsync(file, 'utf8')
				.then(src => stylus(src)
					.use(autoprefixer)
					.set('filename', out)
					.set('paths', paths))
				.then(stylusObj => {
					if (prod) {
						return stylusObj.set('compress');
					} else {
						return stylusObj.set('sourcemap');
					}
				})
				.then(stylusObj => promisify(stylusObj.render).call(stylusObj))
				.then(css => {
					if (prod) {
						return uglifycss.processString(css);
					} else {
						return css;
					}
				})
				.then(css => writeFileAsync(out, css))
				.then(() => out);
			cssFiles.push(cssFile);
		}
		return Promise.all(cssFiles);
	});

const jsFiles = globAsync('src/pages/**/*.js')
	.then(files => {
		const replace = rollupReplace(jsConstants);
		const resolve = rollupResolve({
			browser: true,
		});
		const commonjs = rollupCommonjs();
		const babel = rollupBabel({
			exclude: 'node_modules/**',
		});

		const plugins = [
			replace,
			resolve,
			commonjs,
		];
		if (prod) {
			plugins.push(babel);
		}

		let jsFiles = [];
		for (let file of files) {
			const scriptName = path.basename(file, path.extname(file));
			const out = file.replace(/^src\/pages/, 'build');

			console.log(`compiling ${file} ➔ ${out}`);

			const jsFile = rollup({
					input: file,
					plugins,
				})
				.then(bundle => {
					return bundle.write({
						file: out,
						format: 'iife',
						name: scriptName,
					});
				})
				.then(() => out);
			jsFiles.push(jsFile);
		}
		return Promise.all(jsFiles);
	});

console.log('copying src/assets ➔ build');
ncp('src/assets', 'build')

if (prod) {
	Promise.all([cssFiles, htmlFiles])
		.then(() => {
			console.log('optimizing fonts');
			spawn('node_modules/.bin/subfont', ['build/index.html', '-i']);
		});
}
