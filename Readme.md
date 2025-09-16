# node-ai-ragbot

`node-ai-ragbot` is a modular and framework-agnostic Node.js package for building intelligent chatbot and voicebot systems with **Retrieval-Augmented Generation (RAG)**, powered by **OpenAI** and **LangChain**.

It allows you to quickly integrate both text-based chatbots and voice-enabled assistants into your application with minimal setup. The package provides ready-to-use request handlers and adapters for popular frameworks, so you can focus on building your application instead of reinventing backend logic.

---

## Features

- Supports multiple local files as knowledge sources (`.pdf`, `.docx`, `.txt`, `.md`)
- Supports website scraping with sitemap crawling or exact URL fetching
- Chatbot via `/chat` endpoint
- Voicebot via `/voice` endpoint (speech-to-text using Whisper, text-to-speech using OpenAI TTS)
- Fully configurable: choose models, voices, embeddings, chunk sizes, and logging
- Provides handlers and adapters for **Express**, **Fastify**, **Koa**, **NestJS**, and raw **Node.js (http)**
- Simple initialization with sensible defaults
- In-memory vector store using LangChain for quick query retrieval

---

## Requirements

- Node.js v16 or higher  
- An OpenAI API key  

---

## Installation

```bash
npm install node-ai-ragbot
```

---

## Quick Start with Express

The easiest way to get started is with Express. You can initialize the bot and then attach the provided handlers to your routes.

```js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { initRagVoiceBot, useInExpress } = require("node-ai-ragbot");

const app = express();

(async () => {
  const { chatHandler, voiceHandler } = await initRagVoiceBot({
    sources: {
      files: ["files/knowledge.txt", "files/knowledge.pdf"],
      // urls: ["https://docs.myproduct.com"],
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      chat: { model: "gpt-4o", temperature: 0.3 },
      whisper: { model: "whisper-1", language: "en" },
      tts: { model: "tts-1-hd", voice: "nova" },
    },
  });

  // Mounts /api/bot/chat and /api/bot/voice
  useInExpress(app, chatHandler, voiceHandler, "/api/bot");

  app.listen(3000, () =>
    console.log("Server running on http://localhost:3000")
  );
})();
```

This will expose the following endpoints:

- `POST /api/bot/chat`
- `POST /api/bot/voice`

---

## Using Handlers with Other Frameworks

If you are not using Express, you can still initialize handlers with `initRagVoiceBot` and then connect them to your chosen framework using the adapters provided in this package.

```js
const { initRagVoiceBot, useInFastify, useInKoa, useInNestJS, useInHttp } = require("node-ai-ragbot");

(async () => {
  const { chatHandler, voiceHandler } = await initRagVoiceBot({
    sources: { files: ["files/knowledge.txt"] },
    openai: { apiKey: process.env.OPENAI_API_KEY },
  });

  // Fastify
  const fastify = require("fastify")();
  useInFastify(fastify, chatHandler, voiceHandler, "/api/bot");

  // Koa
  const Koa = require("koa");
  const Router = require("koa-router");
  const koaApp = new Koa();
  const koaRouter = new Router();
  useInKoa(koaRouter, chatHandler, voiceHandler, "/api/bot");
  koaApp.use(koaRouter.routes());

  // NestJS
  const { chat, voice } = useInNestJS(chatHandler, voiceHandler);
  // Example in controller:
  // @Post("chat") chat(@Req() req, @Res() res) { return chat(req, res); }
  // @Post("voice") voice(@Req() req, @Res() res) { return voice(req, res); }

  // Raw Node.js
  const http = require("http");
  const server = http.createServer();
  useInHttp(server, chatHandler, voiceHandler, "/api/bot");
  server.listen(4000, () => console.log("Raw server on http://localhost:4000"));
})();
```

By using adapters, you can integrate seamlessly with any backend framework without being locked to a specific one.

---

## API Endpoints

### `/chat`
- **Method**: POST  
- **Request body**:
  ```json
  {
    "question": "What is in the knowledge base?"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "answer": "Answer from the chatbot"
  }
  ```

---

### `/voice`
- **Method**: POST  
- **Request body**: raw audio buffer (e.g. `audio/webm`)  
- **Response**:
  ```json
  {
    "success": true,
    "transcription": "Your transcribed question",
    "answer": "Generated answer",
    "audio": "Base64 encoded audio response"
  }
  ```

---

## Configuration

You can customize how the bot processes data by passing a configuration object.

```ts
interface RagConfig {
  sources: {
    files?: string[];   // Local file paths (.pdf, .docx, .txt, .md)
    urls?: string[];    // Website URLs
  };
  rag?: {
    maxPagesPerSite?: number; // default: 30
    textSplit?: {
      chunkSize?: number;     // default: 1000
      chunkOverlap?: number;  // default: 200
    };
    topK?: number;            // default: 3
  };
  openai: {
    apiKey: string;
    embeddings?: { model?: string }; // default: text-embedding-3-small
    chat?: {
      model?: string;         // default: gpt-4o
      temperature?: number;   // default: 0.3
      maxTokens?: number;     // default: 200
      promptTemplate?: string;
    };
    stt?: {
      model?: string;         // default: whisper-1
      language?: string;      // default: en
    };
    tts?: {
      model?: string;         // default: tts-1
      voice?: string;         // default: alloy
    };
  };
  logger?: Console;           // default: console
}
```

---

## Memory Vector Storage

The package uses LangChain’s in-memory vector store to hold embeddings of indexed data extracted from files or websites.

- Data is stored only in memory and rebuilt on every server restart
- Provides fast query responses for small to medium datasets
- Best suited for real-time, non-persistent workloads

---

## Security Considerations

- The OpenAI API key is passed via configuration, never hardcoded
- CORS is not modified; you control it in your hosting app
- Audio files are processed in memory only and not stored on disk
- No persistent database is included; vector data is rebuilt each run

---

## Example Project Structure

```
my-app/
├── files/
│   ├── knowledge.txt
│   ├── knowledge.pdf
├── server.js
├── package.json
└── README.md
```

---

## Contributing and Support

If you encounter issues or have feature requests, please open a GitHub issue.  
For custom requirements, the package can be extended by wrapping handlers or building new adapters.

---

Happy building with node-ai-ragbot!
