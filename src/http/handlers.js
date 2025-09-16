// src/http/handlers.js
const { AppError } = require("../utils/errors");
const { queryRAG } = require("../rag/query");
const { processAudio, generateAudio } = require("../voice/voice");

const makeChatHandler =
  ({ vectorStore, cfg, logger }) =>
  async (req, res) => {
    try {
      const { question } = req.body || {};
      if (!question || typeof question !== "string" || !question.trim()) {
        throw new AppError("QUESTION_REQUIRED", "Question is required.", 400);
      }

      // Get answer from RAG
      const answer = await queryRAG(vectorStore, question, cfg, logger);

      // Return complete response
      return res.status(200).json({ success: true, answer });
    } catch (err) {
      // Let adapters map errors consistently
      if (res.error) return res.error(err);
      throw err;
    }
  };

const makeVoiceHandler =
  ({ vectorStore, cfg, logger }) =>
  async (req, res) => {
    try {
      const audioBuffer = req.audioBuffer;
      if (!audioBuffer || !Buffer.isBuffer(audioBuffer)) {
        throw new AppError(
          "AUDIO_REQUIRED",
          "audioBuffer (Buffer) is required in request.",
          400
        );
      }

      // Process audio to get transcription
      const transcription = await processAudio(audioBuffer, cfg);

      // Get answer from RAG
      const answer = await queryRAG(vectorStore, transcription, cfg, logger);

      // Generate audio response
      const audio = await generateAudio(answer, cfg);

      // Return everything in one response
      return res
        .status(200)
        .json({ success: true, transcription, answer, audio });
    } catch (err) {
      if (res.error) return res.error(err);
      throw err;
    }
  };

module.exports = { makeChatHandler, makeVoiceHandler };
