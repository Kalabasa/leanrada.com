function isExternal(href) {
  return href?.match(/^(\w+:)?\/\//);
}

module.exports = { isExternal };
