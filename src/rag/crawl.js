async function crawlSiteWithPuppeteer(startUrl, browser, maxPages = 50) {
  const visited = new Set();
  const toVisit = [startUrl];
  const base = new URL(startUrl).origin;
  const found = [];

  while (toVisit.length && visited.size < maxPages) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("a[href]"));
        const urls = anchors
          .map((a) => a.href.trim())
          .filter(Boolean)
          .filter(
            (h) =>
              h.startsWith("http") &&
              !h.startsWith("mailto:") &&
              !h.startsWith("tel:") &&
              !h.toLowerCase().includes("javascript:") &&
              !h.includes("#") &&
              !h.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|docx?|xls|pptx?)$/i)
          );
        return [...new Set(urls)];
      });

      await page.close();
      visited.add(url);
      found.push(url);

      for (const link of links) {
        try {
          const abs = new URL(link, base).href;
          if (
            abs.startsWith(base) &&
            !visited.has(abs) &&
            !toVisit.includes(abs)
          ) {
            toVisit.push(abs);
          }
        } catch {}
      }
    } catch {
      // ignore per-page failures
    }
  }
  return found;
}

module.exports = { crawlSiteWithPuppeteer };
