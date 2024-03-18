function formatDate(dateStr, style = 'default') {
  const { year, month, day } = formatToParts(new Date(dateStr));
  if (style === 'no-year') {
    return `${day} ${month}`;
  } else {
    return `${day} ${month} ${year}`;
  }
}

const format = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatToParts(dateObj) {
  const parts = format.formatToParts(dateObj);
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;
  return { day, month, year };
}

module.exports = { formatDate };