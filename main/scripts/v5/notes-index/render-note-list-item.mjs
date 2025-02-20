export function renderNoteListItem(item) {
  const tags = item.tags
    .map((tag) => `<tag-chip title="${tag}"></tag-chip>`)
    .join("\n    ");
  const formattedDate = item.date;
  return `
<li>
  <a href="${item.href}">
    <strong>${item.title}</strong>
    ${tags}
    <time datetime="${item.date}">${formattedDate}</time>
  </a>
</li>`;
}
