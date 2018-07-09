import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import rimraf from 'rimraf';
import glob from 'glob';
import ncp from 'ncp';
import Handlebars from 'handlebars';
import stylus from 'stylus';
import autoprefixer from 'autoprefixer-stylus';

import data from './src/data.js';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

if (!fs.existsSync('build')) fs.mkdirSync('build');

glob('src/pages/*.handlebars', (err, files) => {
	for (let file of files) {
		const pageName = path.basename(file, path.extname(file));
		const filename = `build/${pageName}.html`;

		console.log(`compiling ${file} ➔ ${filename}`);

		readFileAsync(file, 'utf8')
			.then(src => Handlebars.compile(src)(data))
			.then(html => writeFileAsync(filename, html));
	}
});

glob('src/pages/*.styl', (err, files) => {
	for (let file of files) {
		const styleName = path.basename(file, path.extname(file));
		const filename = `build/${styleName}.css`;

		console.log(`compiling ${file} ➔ ${filename}`);

		const paths = ['node_modules', 'src/pages'].map(p => path.resolve(__dirname, p));
		readFileAsync(file, 'utf8')
			.then(src => stylus(src)
				.use(autoprefixer())
				.set('filename', filename)
				.set('paths', paths))
			.then(stylusObj => promisify(stylusObj.render).call(stylusObj))
			.then(css => writeFileAsync(filename, css));
	}
});

console.log(`copying src/assets ➔ build`);
ncp('src/assets', 'build')
