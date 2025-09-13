const puppeteer = require("puppeteer");
const { AppError } = require("../utils/errors");

async function extractContentWithPuppeteer(url, browser) {
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    await page.waitForSelector("body", { timeout: 5000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));

    const content = await page.evaluate(() => {
      const elementsToRemove = [
        "script",
        "style",
        "noscript",
        "nav",
        ".cookie-banner",
        ".popup",
        ".modal",
        ".advertisement",
        ".ads",
      ];
      elementsToRemove.forEach((sel) =>
        document.querySelectorAll(sel).forEach((el) => el.remove())
      );

      const title =
        document.querySelector("title")?.innerText?.trim() ||
        document.querySelector("h1")?.innerText?.trim() ||
        "";

      const metaDescription =
        document.querySelector('meta[name="description"]')?.content?.trim() ||
        "";

      const headings = Array.from(
        document.querySelectorAll("h1,h2,h3,h4,h5,h6")
      )
        .map((h) => `${h.tagName}: ${h.innerText.trim()}`)
        .filter((h) => h.length > 3);

      const selectors = [
        "p",
        "li",
        "blockquote",
        "section",
        "article",
        "main",
        "div",
        "span",
        "[role='main']",
        "[role='article']",
        "[role='contentinfo']",
      ];
      const rawTexts = Array.from(
        document.querySelectorAll(selectors.join(","))
      )
        .map((el) => el.innerText?.trim())
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);

      const contentBlocks = rawTexts.filter(
        (txt) => txt.length > 30 && /\w{3,}/.test(txt)
      );

      return [
        title && `TITLE: ${title}`,
        metaDescription && `DESCRIPTION: ${metaDescription}`,
        headings.length && `HEADINGS:\n${headings.join("\n")}`,
        contentBlocks.length && `CONTENT:\n${contentBlocks.join("\n\n")}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    });

    await page.close();
    return content?.trim()?.length > 50 ? { url, content } : null;
  } catch (err) {
    return null; // swallow per-URL errors; upstream decides what to do
  }
}

async function launchBrowser() {
  try {
    return await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  } catch (e) {
    throw new AppError(
      "BROWSER_LAUNCH_FAILED",
      `Failed to launch headless browser: ${e.message}`,
      500
    );
  }
}

module.exports = { extractContentWithPuppeteer, launchBrowser };
