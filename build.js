import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

import rimraf from 'rimraf';
import glob from 'glob';
import ncp from 'ncp';
import Handlebars from 'handlebars';
import stylus from 'stylus';
import autoprefixer from 'autoprefixer-stylus';

import relhref from './src/handlebars/relhref.js';
import data from './src/data.js';

const prod = process.argv.includes('--prod');
if (prod) console.log('prod mode');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const globAsync = promisify(glob);

// Begin build

if (!fs.existsSync('build')) fs.mkdirSync('build');

relhref.use(Handlebars);

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

const htmlFiles = partials
	.then(() => globAsync('src/pages/*.handlebars'))
	.then(files => {
		let htmlFiles = [];
		for (let file of files) {
			const pageName = path.basename(file, path.extname(file));
			const pageFilename = `${pageName}.html`;
			const pageData = { ...data, pageFilename };
			const out = `build/${pageFilename}`;

			console.log(`compiling ${file} ➔ ${out}`);

			const htmlFile = readFileAsync(file, 'utf8')
				.then(src => Handlebars.compile(src)(pageData))
				.then(html => writeFileAsync(out, html))
				.then(() => out);
			htmlFiles.push(htmlFile);
		}
		return Promise.all(htmlFiles);
	});

const cssFiles = globAsync('src/pages/*.styl')
	.then(files => {
		let cssFiles = [];
		for (let file of files) {
			const styleName = path.basename(file, path.extname(file));
			const out = `build/${styleName}.css`;

			console.log(`compiling ${file} ➔ ${out}`);

			const paths = ['node_modules', 'src/pages'].map(p => path.resolve(__dirname, p));
			const cssFile = readFileAsync(file, 'utf8')
				.then(src => stylus(src)
					.use(autoprefixer())
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
				.then(css => writeFileAsync(out, css))
				.then(() => out);
			cssFiles.push(cssFile);
		}
		return Promise.all(cssFiles);
	});

console.log('copying src/assets ➔ build');
ncp('src/assets', 'build')

if (prod) {
	Promise.all([cssFiles, htmlFiles])
		.then(([_, files]) => {
			for (let file of files) {
				console.log(`optimizing fonts ${file}`);
				spawn('node_modules/.bin/subfont', [file, '-i']);
			}
		});
}
