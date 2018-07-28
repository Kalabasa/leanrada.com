import fs from 'fs';
import path from 'path';

import elasticlunr from 'elasticlunr';
import marked from 'marked';
import markedPlaintext from 'marked-plaintext';
import h2p from 'html2plaintext';

import { toRef } from './dataRef.js';
import data from './data.js';

const markedOptions = { renderer: new markedPlaintext };

console.log('generating index');

// homogenize searchable data
// format: id, name, text, tags
const documents = [
	...data.projects.map(p => ({
		id: toRef(data, p),
		name: p.name,
		text: [
			p.short_description,
			p.full_description,
			marked(
				fs.readFileSync(path.join(__dirname, `../pages/works/${p.id}.md`), 'utf8'),
				markedOptions)
		].filter(v => v).map(v => h2p(v)).join(' ').replace(/\s+/g, ' '),
		tags: [
			...(p.tags || []),
			...(p.tech || []),
			...(p.links || []).map(l => l.name)
		].map(v => v.toLowerCase()).filter((v, i, self) => self.indexOf(v) === i).join(' '),
	})),
];

const idx = elasticlunr(function() {
	this.setRef('id');
	this.addField('name');
	this.addField('text');
	this.addField('tags');
	this.saveDocument(false);
});

documents.forEach(d => idx.addDoc(d));

if (!fs.existsSync('gen')) fs.mkdirSync('gen');
fs.writeFileSync(path.join(__dirname, '../../gen/idx.json'), JSON.stringify(idx.toJSON()));
