# node-ragbot

`node-ragbot` is a plug-and-play Node.js package for building intelligent chatbot and voicebot systems with **Retrieval-Augmented Generation (RAG)**, powered by **OpenAI** and **LangChain**.

It supports:
- 🗂 Multiple local files (`.pdf`, `.docx`, `.txt`, `.md`)
- 🌐 Website scraping with sitemap + recursive crawling or **exact URLs**
- 💬 Text-based chatbot via `/chat`
- 🎙 Voice-based chatbot via `/voice` (Whisper + TTS)
- ⚡ Fully configurable (models, voice, chunking, embeddings, logger, etc.)
- 🔌 Works with **Express (plug & play)** or **any backend framework** (handlers provided)

---

## ⚙ Requirements

- Node.js v16 or higher  
- An OpenAI API key  

---

## 📦 Installation

```bash
npm install node-ragbot
```

---

## 🚀 Quick Start with Express

`node-ragbot` mounts its routes automatically on your existing Express app.  
Just call `expressRagBot(app, config)`.

```js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { expressRagBot } = require("node-ragbot");

const app = express();

// Initialize bot – mounts /api/bot/chat and /api/bot/voice automatically
expressRagBot(app, {
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

```

That’s it ✅ — now your app has:

- `POST /api/bot/chat`  
- `POST /api/bot/voice`

---

## 🌐 Usage in Other Frameworks or Raw Node.js

If you don’t use Express, you can still use the raw handlers directly.

```js
const { createRagBot } = require("node-ragbot");
const http = require("http");

(async () => {
  const { chatHandler, voiceHandler } = await createRagBot({
    sources: { files: ["files/knowledge.txt"] },
    openai: { apiKey: process.env.OPENAI_API_KEY },
  });

  const server = http.createServer((req, res) => {
    if (req.url === "/chat" && req.method === "POST") {
      chatHandler(req, res); // raw Node.js usage
    } else if (req.url === "/voice" && req.method === "POST") {
      voiceHandler(req, res);
    }
  });

  server.listen(5000, () => console.log("Server running on :5000"));
})();
```

This makes it framework-agnostic: you can integrate with **Fastify**, **Koa**, **Hapi**, or any other backend.

---

## 📡 API Endpoints

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
- **Form-data**: `audio` field with uploaded audio file (e.g. `.webm`)  
- **Response**:
  ```json
  {
    "success": true,
    "answer": "Generated answer",
    "audio": "Base64 encoded audio response"
  }
  ```

---

## ⚙ Configuration

Pass configuration directly when calling the initialization function.

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
    whisper?: {
      model?: string;         // default: whisper-1
      language?: string;      // default: en
    };
    tts?: {
      model?: string;         // default: tts-1-hd
      voice?: string;         // default: nova
    };
  };
  logger?: Console;           // default: console
}
```

---

## 📂 Memory Vector Storage

This package uses LangChain’s **Memory Vector Store** to hold indexed data extracted from files or scraped content.

- Data is stored in memory for quick access.  
- It is not persistent and will be rebuilt each time the server restarts.  
- Suitable for real-time and small-to-medium datasets.  

---

## 🔒 Security

- The OpenAI API key is **passed via config**, not hardcoded.  
- CORS is handled by the host server.  
- Audio is processed in-memory, not stored.  
- Vector store is in-memory (rebuilt on restart).  

---

## 📂 Example Project Structure

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

## 📞 Contact

For issues or feature requests, please open a GitHub issue or contact the maintainer.

Happy building with `node-ragbot`! 🚀🤖
