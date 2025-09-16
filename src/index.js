// src/index.js
const defaults = require("./config/defaults");
const { normalizeConfig } = require("./config/validate");
const { buildVectorStore } = require("./rag/builder");
const { makeChatHandler, makeVoiceHandler } = require("./http/handlers");
const adapters = require("./http/adapters");

/**
 * Initialize vector store + framework-agnostic handlers.
 */
async function initRagVoiceBot(userConfig = {}) {
  const cfg = normalizeConfig(userConfig, defaults);
  const vectorStore = await buildVectorStore(cfg, cfg.logger);

  const chatHandler = makeChatHandler({ vectorStore, cfg, logger: cfg.logger });

  const voiceHandler = makeVoiceHandler({
    vectorStore,
    cfg,
    logger: cfg.logger,
  });

  return { vectorStore, cfg, chatHandler, voiceHandler, adapters };
}

module.exports = { initRagVoiceBot, adapters };
