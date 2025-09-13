const fs = require("fs");
const path = require("path");
const { assert } = require("../utils/errors");

// --- Helpers ---
const isURL = (u) => {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
};

const inferTypeFromExt = (p) => {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".doc" || ext === ".docx") return "docx";
  if (ext === ".txt" || ext === ".md") return "txt";
  return null;
};

// --- Main function ---
function normalizeConfig(userConfig, defaults) {
  const cfg = JSON.parse(JSON.stringify(defaults));

  // Simple deep merge
  const deepMerge = (a, b) => {
    Object.keys(b || {}).forEach((k) => {
      if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) {
        a[k] = a[k] || {};
        deepMerge(a[k], b[k]);
      } else {
        a[k] = b[k];
      }
    });
    return a;
  };

  deepMerge(cfg, userConfig || {});

  // ✅ Always inject a logger
  if (!cfg.logger || typeof cfg.logger.info !== "function") {
    cfg.logger = console;
  }

  const { urls, files } = cfg.sources;

  // Validate sources
  assert(
    (Array.isArray(urls) && urls.length) ||
      (Array.isArray(files) && files.length),
    "INVALID_SOURCES",
    "At least one URL or file path must be provided in `sources`."
  );

  if (urls && urls.length) {
    urls.forEach((u) =>
      assert(isURL(u), "INVALID_URL", `Invalid website URL: ${u}`, 400, {
        url: u,
      })
    );
  }

  if (files && files.length) {
    files.forEach((fp) => {
      const abs = path.isAbsolute(fp) ? fp : path.resolve(process.cwd(), fp);
      assert(
        fs.existsSync(abs),
        "FILE_NOT_FOUND",
        `Source file not found: ${fp}`,
        400,
        { file: fp }
      );
      const t = inferTypeFromExt(fp);
      assert(
        ["pdf", "docx", "txt"].includes(t),
        "UNSUPPORTED_FILE_TYPE",
        `Unsupported file type for: ${fp} (allowed: pdf, doc/docx, txt/md)`,
        400,
        { file: fp }
      );
    });
  }

  // Validate OpenAI config
  assert(
    cfg.openai &&
      typeof cfg.openai.apiKey === "string" &&
      cfg.openai.apiKey.trim(),
    "OPENAI_API_KEY_MISSING",
    "OpenAI API key is required in config.openai.apiKey."
  );

  const cors = cfg.http?.cors;
  if (cors && Array.isArray(cors.origins)) {
    cors.origins.forEach((o) => {
      // allow "*" OR valid URLs
      assert(
        o === "*" || isURL(o),
        "INVALID_CORS_ORIGIN",
        `Invalid CORS origin: ${o}`,
        400,
        { origin: o }
      );
    });
  }

  // Normalize file paths to absolute
  cfg.sources.files = (files || []).map((fp) =>
    path.isAbsolute(fp) ? fp : path.resolve(process.cwd(), fp)
  );

  return cfg;
}

module.exports = { normalizeConfig };
