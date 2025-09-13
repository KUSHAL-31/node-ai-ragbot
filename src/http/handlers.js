const { AppError, errorToHttp } = require("../utils/errors");
const { queryRAG } = require("../rag/query");
const { processAudio, generateAudio } = require("../voice/voice");

const makeChatHandler =
  ({ vectorStore, cfg, logger }) =>
  async (req, res) => {
    try {
      const { question } = req.body || {};
      if (!question || typeof question !== "string" || !question.trim()) {
        throw new AppError(
          "QUESTION_REQUIRED",
          "Question is required in request body."
        );
      }
      const answer = await queryRAG(vectorStore, question, cfg, logger);
      return res.status(200).json({ success: true, answer });
    } catch (err) {
      return errorToHttp(res, err, logger);
    }
  };

const makeVoiceHandler =
  ({ vectorStore, cfg, logger }) =>
  async (req, res) => {
    try {
      const file = req.file;
      if (!file || !file.buffer) {
        throw new AppError(
          "AUDIO_REQUIRED",
          'No audio file uploaded (field name: "audio").'
        );
      }

      const transcription = await processAudio(file.buffer, cfg);
      const answer = await queryRAG(vectorStore, transcription, cfg, logger);
      const audio = await generateAudio(answer, cfg);

      return res.status(200).json({ success: true, answer, audio });
    } catch (err) {
      return errorToHttp(res, err, logger);
    }
  };

module.exports = { makeChatHandler, makeVoiceHandler };
