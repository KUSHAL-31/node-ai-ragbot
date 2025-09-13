const defaults = require("./config/defaults");
const { normalizeConfig } = require("./config/validate");
const { buildVectorStore } = require("./rag/builder");
const { createRouter } = require("./http/router");

/**
 * Bootstraps vector store + handlers
 */
async function initRagVoiceBot(userConfig = {}) {
  const cfg = normalizeConfig(userConfig, defaults);
  const vectorStore = await buildVectorStore(cfg, cfg.logger);

  const { ragbotRouter, chatHandler, voiceHandler } = createRouter({
    vectorStore,
    cfg,
    logger: cfg.logger,
  });

  return { vectorStore, cfg, ragbotRouter, chatHandler, voiceHandler };
}

/**
 * Attach ragbot to an existing Express app automatically.
 */
function initializeRagbot(app, userConfig = {}) {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "initializeRagbot(app, config) requires a valid Express app instance"
    );
  }

  // Fire async init in background
  initRagVoiceBot(userConfig)
    .then(({ ragbotRouter, cfg }) => {
      app.use("/api/bot", ragbotRouter);
      cfg.logger.info("✅ RAG bot initialized and mounted at /api/bot");
    })
    .catch((err) => {
      console.error("❌ Failed to initialize ragbot:", err);
      process.exit(1);
    });
}

module.exports = { initRagVoiceBot, initializeRagbot };
