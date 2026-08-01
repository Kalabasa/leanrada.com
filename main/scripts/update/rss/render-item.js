import * as cheerio from "cheerio";
import path from "node:path";

export function renderItem({ mainInnerHTML, pageHref, title, date, domain }) {
  const url = new URL(pageHref, `https://${domain}`);
  url.searchParams.set("ref", "rss");

  const ch = cheerio.load(`<main>${mainInnerHTML}</main>`);
  let content = ch("main");

  content.find("style").remove();
  content.find("script").remove();
  content.find(`[data-rss="hidden"]`).remove();

  const interactiveElements = content.find(`iframe,[data-rss="interactive"]`);

  interactiveElements.each((i, el) => {
    const cel = ch(el);
    const label = cel.attr("alt") ?? cel.attr("aria-label") ?? "";
    cel.replaceWith(
      `<pre>Interactive content: <a href="${url.href}">Visit the post to interact with this content.</a>` +
        (label ? `\nAlternative text: ${label}` : "") +
        `</pre>`
    );
  });

  content.find("img,video,source").each((i, el) => {
    const cel = ch(el);
    const src = cel.attr("src");
    if (src) {
      cel.attr("src", makeURL(pageHref, src, domain));
    }
  });
  content.find("[href]").each((i, el) => {
    const cel = ch(el);
    const href = cel.attr("href");
    if (href) {
      cel.attr("href", makeURL(pageHref, href, domain));
    }
  });

  // RSS viewers ignore unknown tags and their contents, so flatten them
  ch(content.find("*").get().reverse()).each((i, el) => {
    if (el.name?.includes("-")) {
      ch(el).replaceWith(el.children);
    }
  });
 
  // format HTML
  const tempRoot = ch("<div></div>");
  content.contents().each((i, el) => {
    if (el.type === "text" && el.data.trim() === "") {
      return;
    }

    const isBlock = [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ol",
      "ul",
      "pre",
      "figure",
      "img",
      "video",
      "details",
    ].includes(el.name);
    if (isBlock) tempRoot.append("\n");
    tempRoot.append(el);
    if (isBlock) tempRoot.append("\n");
  });
  content = tempRoot;

  const description = content.html();

  return `

    <item>
      <title><![CDATA[${title}]]></title>
      <link><![CDATA[${url}]]></link>
      <guid isPermaLink="true"><![CDATA[${url}]]></guid>
      <pubDate>${formatDate(date)}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>

    `;
}

function makeURL(pageHref, href, domain) {
  if (/^(.+):/.test(href)) return href;
  const urlPath = path.resolve("/", pageHref, href);
  const url = new URL(urlPath, `https://${domain}`);
  url.searchParams.set("ref", "rss");
  return url.href;
}

function formatDate(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year} 00:00:00 GMT`;
}
