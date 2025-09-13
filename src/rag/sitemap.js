const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");

async function findSitemap(baseUrl) {
  try {
    const robotsUrl = `${baseUrl.replace(/\/$/, "")}/robots.txt`;
    const { data } = await axios.get(robotsUrl, { timeout: 10000 });
    const lines = `${data}`.split("\n");
    for (const line of lines) {
      if (line.toLowerCase().startsWith("sitemap:")) {
        return line.split(":").slice(1).join(":").trim();
      }
    }
  } catch {}
  for (const path of ["/sitemap.xml", "/sitemap_index.xml"]) {
    try {
      const url = `${baseUrl.replace(/\/$/, "")}${path}`;
      await axios.head(url, { timeout: 10000 });
      return url;
    } catch {}
  }
  return null;
}

async function fetchSitemapLinks(sitemapUrl, maxUrls = 100) {
  const { data } = await axios.get(sitemapUrl, { timeout: 15000 });
  const parser = new XMLParser({ ignoreAttributes: false });
  const jsonData = parser.parse(data);
  let urls = [];
  if (jsonData.sitemapindex?.sitemap) {
    const sitemaps = Array.isArray(jsonData.sitemapindex.sitemap)
      ? jsonData.sitemapindex.sitemap
      : [jsonData.sitemapindex.sitemap];
    for (const sm of sitemaps) {
      if (sm.loc && urls.length < maxUrls) {
        const childUrls = await fetchSitemapLinks(
          sm.loc,
          maxUrls - urls.length
        );
        urls = urls.concat(childUrls);
      }
    }
  } else if (jsonData.urlset?.url) {
    const entries = Array.isArray(jsonData.urlset.url)
      ? jsonData.urlset.url
      : [jsonData.urlset.url];
    for (const entry of entries) {
      if (entry.loc) urls.push(entry.loc);
      if (urls.length >= maxUrls) break;
    }
  }
  return [...new Set(urls)].slice(0, maxUrls);
}

module.exports = { findSitemap, fetchSitemapLinks };
