function isExternal(href) {
  return href.trim()?.match(/^(\w+:)?\/\//);
}

module.exports = { isExternal };
