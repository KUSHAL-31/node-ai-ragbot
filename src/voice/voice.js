const fs = require("fs");
const path = require("path");
const tmp = require("tmp");
const { OpenAI } = require("openai");
const { AppError } = require("../utils/errors");

function bufferToTempFile(buffer, ext = ".webm") {
  const tmpFile = tmp.fileSync({ postfix: ext });
  fs.writeFileSync(tmpFile.name, buffer);
  return tmpFile;
}

async function processAudio(buffer, cfg) {
  try {
    const client = new OpenAI({ apiKey: cfg.openai.apiKey });
    const tmpFile = bufferToTempFile(buffer, ".webm");

    try {
      const stream = fs.createReadStream(tmpFile.name);
      const transcription = await client.audio.transcriptions.create({
        file: stream,
        model: cfg.openai.whisper.model,
        language: cfg.openai.whisper.language,
        response_format: cfg.openai.whisper.response_format,
      });
      return typeof transcription === "string"
        ? transcription
        : `${transcription?.text || ""}`.trim();
    } finally {
      try {
        fs.unlinkSync(tmpFile.name);
      } catch {}
    }
  } catch (err) {
    throw new AppError(
      "OPENAI_TRANSCRIPTION_FAILED",
      `Audio transcription failed: ${err.message}`,
      500
    );
  }
}

async function generateAudio(text, cfg) {
  try {
    const client = new OpenAI({ apiKey: cfg.openai.apiKey });
    const resp = await client.audio.speech.create({
      model: cfg.openai.tts.model,
      voice: cfg.openai.tts.voice,
      input: text,
      response_format: cfg.openai.tts.response_format,
    });

    const buffer = Buffer.from(await resp.arrayBuffer());
    return buffer.toString("base64"); // return base64 mp3/wav per response_format
  } catch (err) {
    throw new AppError(
      "OPENAI_TTS_FAILED",
      `Text-to-speech failed: ${err.message}`,
      500
    );
  }
}

module.exports = { processAudio, generateAudio };
