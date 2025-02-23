export function indent(n) {
  return "  ".repeat(n);
}

export function reindent(html, n) {
  return html.replaceAll(
    "\n" + (n < 0 ? indent(-n) : ""),
    "\n" + (n > 0 ? indent(n) : "")
  );
}

export function dateString() {
  return new Date().toISOString().slice(0, 10);
}
