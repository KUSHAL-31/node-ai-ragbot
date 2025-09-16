module.exports = {
  sources: {
    urls: [], // array of base URLs
    files: [], // array of file paths; type is inferred by extension
  },
  rag: {
    maxPagesPerSite: 30,
    textSplit: { chunkSize: 1000, chunkOverlap: 200 },
    topK: 3, // number of chunks to use as context
  },
  openai: {
    apiKey: undefined, // REQUIRED (no env reliance in library)
    embeddings: {
      model: "text-embedding-3-small",
    },
    chat: {
      model: "gpt-4o",
      maxTokens: 150,
      temperature: 0.3,
      promptTemplate: `You are an expert assistant answering questions using ONLY the information provided in the context below. Respond naturally, in simple language, under 70 words. If the context is insufficient, say you don’t have enough information and ask for another question.\n\nCONTEXT:\n{{context}}\n\nQUESTION:\n{{question}}\n\nANSWER:`,
    },
    stt: {
      model: "whisper-1",
      language: "en",
      response_format: "text",
    },
    tts: {
      model: "tts-1",
      voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer, marin (if supported), etc.
      response_format: "mp3",
    },
  },
  logger: console, // can be replaced by your custom logger
};
