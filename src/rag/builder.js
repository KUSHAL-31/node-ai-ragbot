const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { DocxLoader } = require("@langchain/community/document_loaders/fs/docx");
const { TextLoader } = require("langchain/document_loaders/fs/text");

const { extractContentWithPuppeteer, launchBrowser } = require("./extract");
const { findSitemap, fetchSitemapLinks } = require("./sitemap");
const { crawlSiteWithPuppeteer } = require("./crawl");
const { AppError } = require("../utils/errors");

function getLoaderForFile(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".pdf")) return new PDFLoader(filePath);
  if (lower.endsWith(".doc") || lower.endsWith(".docx"))
    return new DocxLoader(filePath);
  if (lower.endsWith(".txt") || lower.endsWith(".md"))
    return new TextLoader(filePath);
  throw new AppError("UNSUPPORTED_FILE_TYPE", `Unsupported file: ${filePath}`);
}

async function buildFromUrls(urls, maxPagesPerSite, splitter) {
  if (!urls.length) return [];

  const browser = await launchBrowser();
  const pages = [];

  try {
    for (const baseUrl of urls) {
      let urlList = [];
      const sitemapUrl = await findSitemap(baseUrl);
      if (sitemapUrl) {
        urlList = await fetchSitemapLinks(sitemapUrl, maxPagesPerSite);
      }
      if (urlList.length === 0) {
        const crawled = await crawlSiteWithPuppeteer(
          baseUrl,
          browser,
          maxPagesPerSite
        );
        urlList = crawled;
      }
      if (!urlList.includes(baseUrl)) urlList.unshift(baseUrl);

      for (const u of urlList) {
        const page = await extractContentWithPuppeteer(u, browser);
        if (page?.content?.trim()) {
          pages.push({
            pageContent: page.content,
            metadata: { url: page.url },
          });
        }
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  return splitter.splitDocuments(pages);
}

async function buildFromFiles(files, splitter) {
  const docs = [];
  for (const fp of files) {
    const loader = getLoaderForFile(fp);
    const rawDocs = await loader.load();
    const split = await splitter.splitDocuments(rawDocs);
    docs.push(...split);
  }
  return docs;
}

async function buildVectorStore(cfg, logger = console) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: cfg.rag.textSplit.chunkSize,
    chunkOverlap: cfg.rag.textSplit.chunkOverlap,
  });

  const allDocs = [];

  // URLs
  if (cfg.sources.urls.length) {
    logger.info(`Crawling ${cfg.sources.urls.length} site(s)...`);
    const urlDocs = await buildFromUrls(
      cfg.sources.urls,
      cfg.rag.maxPagesPerSite,
      splitter
    );
    allDocs.push(...urlDocs);
  }

  // Files
  if (cfg.sources.files.length) {
    logger.info(`Loading ${cfg.sources.files.length} file(s)...`);
    const fileDocs = await buildFromFiles(cfg.sources.files, splitter);
    allDocs.push(...fileDocs);
  }

  if (!allDocs.length) {
    throw new AppError(
      "NO_DOCUMENTS",
      "No documents were extracted from the provided sources.",
      400
    );
  }

  const embeddings = new OpenAIEmbeddings({
    apiKey: cfg.openai.apiKey, // IMPORTANT: pass explicitly; no env reliance
    model: cfg.openai.embeddings.model,
  });

  return MemoryVectorStore.fromDocuments(allDocs, embeddings);
}

module.exports = { buildVectorStore };
