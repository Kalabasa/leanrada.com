import { formatDate } from "./format-date.mjs";

export function renderNoteListItem(item, dateStyle = undefined) {
  const tags = item.tags
    .map((tag) => `\n    <tag-chip title="${tag}"></tag-chip>`)
    .join("");
  const formattedDate = formatDate(item.date, dateStyle);
  return `
<li>
  <a href="${item.href}">
    <strong>${item.title}</strong>${tags}
    <time datetime="${item.date}">${formattedDate}</time>
  </a>
</li>`;
}
