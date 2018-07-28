// generates reference IDs to data and back

export function fromRef(data, ref) {
	const refSplit = ref.split('/', 2);
	const type = refSplit[0];
	const id = refSplit[1];
	switch(type) {
		case 'projects':
			const item = data.projects.find(p => p.id === id);
			return { item, type: 'project', url: `/works/${item.id}.html` };
		default:
			throw new Error(`unknown type: ${type}`);
	}
}

export function toRef(data, item) {
	if (data.projects.includes(item)) return `projects/${item.id}`;
	throw new Error('unknown type');
}

export function refId(ref) {
	return ref.split('/', 2)[1];
}

export function dataUrl(data, item) {
	if (data.projects.includes(item)) return `/works/${item.id}.html`;
	throw new Error('unknown type');
}