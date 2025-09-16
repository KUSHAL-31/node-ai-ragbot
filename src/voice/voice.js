// src/voice/voice.js
const { OpenAI } = require("openai");
const { AppError } = require("../utils/errors");

/**
 * Convert raw audio Buffer to transcription.
 * Uses buffer directly (no tmp files, no multer).
 */
async function processAudio(buffer, cfg) {
  try {
    const client = new OpenAI({ apiKey: cfg.openai.apiKey });

    // OpenAI SDK accepts a Uint8Array or Blob-like via toFile helper.
    // We'll name it audio.webm by default; set ext via cfg if needed.
    const fileName = cfg.voice?.inputFileName || "audio.webm";
    const transcription = await client.audio.transcriptions.create({
      file: new File([buffer], fileName, { type: "audio/webm" }),
      model: cfg.openai.whisper.model,
      language: cfg.openai.whisper.language,
      response_format: cfg.openai.whisper.response_format,
    });

    return typeof transcription === "string"
      ? transcription
      : `${transcription?.text || ""}`.trim();
  } catch (err) {
    throw new AppError(
      "OPENAI_TRANSCRIPTION_FAILED",
      `Audio transcription failed: ${err.message}`,
      500
    );
  }
}

/**
 * Generate TTS and return base64 audio.
 */
async function generateAudio(text, cfg) {
  try {
    const client = new OpenAI({ apiKey: cfg.openai.apiKey });
    const resp = await client.audio.speech.create({
      model: cfg.openai.tts.model,
      voice: cfg.openai.tts.voice,
      input: text,
      response_format: cfg.openai.tts.response_format, // "mp3" | "wav" | ...
    });

    const buffer = Buffer.from(await resp.arrayBuffer());
    return buffer.toString("base64");
  } catch (err) {
    throw new AppError(
      "OPENAI_TTS_FAILED",
      `Text-to-speech failed: ${err.message}`,
      500
    );
  }
}

/**
 * Utility to split a big base64 audio string into smaller chunks
 * for progressive playback over SSE.
 */
function chunkBase64Audio(base64, size = 48000) {
  const chunks = [];
  for (let i = 0; i < base64.length; i += size) {
    chunks.push(base64.slice(i, i + size));
  }
  return chunks;
}

module.exports = { processAudio, generateAudio, chunkBase64Audio };
