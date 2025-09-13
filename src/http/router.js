const express = require("express");
const multer = require("multer");
const { makeChatHandler, makeVoiceHandler } = require("./handlers");

function createRouter({ vectorStore, cfg, logger }) {
  const ragbotRouter = express.Router();

  // ✅ No CORS here – respect whatever the host app configured globally
  ragbotRouter.use(express.json({ limit: "50mb" }));
  ragbotRouter.use(express.urlencoded({ extended: true, limit: "50mb" }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: (cfg.http?.multer?.fileSizeMb || 10) * 1024 * 1024 },
  });

  const chatHandler = makeChatHandler({ vectorStore, cfg, logger });
  const voiceHandler = makeVoiceHandler({ vectorStore, cfg, logger });

  ragbotRouter.post("/chat", chatHandler);
  ragbotRouter.post("/voice", upload.single("audio"), voiceHandler);

  return { ragbotRouter, chatHandler, voiceHandler };
}

module.exports = { createRouter };
