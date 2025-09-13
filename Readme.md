
# node-ragbot

`node-ragbot` is a Node.js package that enables developers to build intelligent chatbot and voicebot systems with Retrieval-Augmented Generation (RAG) capabilities using OpenAI’s APIs and Langchain.

This package supports two modes of data input:

1. Accept a website URL to scrape and generate a RAG index.
2. Use a set of local files placed in the `files` folder for RAG.

It offers two API endpoints for interactions:

- `/chat` – for text-based chatbot interactions.
- `/voice` – for voice-based interactions using OpenAI’s Whisper and TTS APIs.

---

## ⚙ Requirements

- Node.js v16 or higher
- An OpenAI API key (`OPENAI_API_KEY`)

---

## 📦 Installation

```bash
git clone <your-repo-url>
cd node-ragbot
npm install
```

---

## 📂 Files Folder

Create a `files` folder in the parent directory where this package is located:

```
parent-directory/
└── files/
    ├── document1.txt
    ├── notes.pdf
    └── data.json
```

You can add any number of documents here (PDFs, text files, etc.). These files will be used to build the RAG index.

---

## 🌐 Website Scraping Option

Alternatively, you can provide a website URL to scrape and extract content dynamically. The package will process the content and generate the RAG index for your chatbot or voicebot.

---

## ✅ Environment Variables

Create a `.env` file at the root of the project:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace the value with your OpenAI API key. This key is required for interacting with OpenAI’s Whisper, TTS, and LLM models.

---

## 📡 API Endpoints

### `/chat`

- **Method**: POST  
- **Request body**:
  ```json
  {
    "message": "Your question here"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "answer": "Answer from the chatbot"
  }
  ```

Handles text-based queries by searching the RAG index and generating responses.

---

### `/voice`

- **Method**: POST  
- **Request body**:
  ```json
  {
    "audio": "Base64 encoded audio file"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "transcription": "Detected text from the audio",
    "answer": "Generated answer from the chatbot",
    "audio": "Base64 encoded audio response"
  }
  ```

Processes voice input using OpenAI’s Whisper API and converts the response to speech using TTS.

---

## 📂 Memory Vector Storage

This package uses Langchain’s **Memory Vector Store** to hold indexed data extracted from files or scraped content. It enables fast similarity searches and relevance-based retrieval for conversational AI.

- The data is stored in memory for quick access.
- It is not persistent and will be rebuilt each time the server restarts.
- Suitable for real-time and small-to-medium datasets.

---

## 🔑 Security

- The OpenAI API key is stored in the `.env` file and should never be exposed publicly.
- Audio data is processed in-memory and not stored persistently on the server.

---

## 🚀 Run the Server

```bash
npm start
```

The server will build the RAG index from the files or website, and expose the `/chat` and `/voice` endpoints for interaction.

---

## 📂 Directory Structure

```
node-ragbot/
├── server.js
├── routes/
│   ├── ragRoutes.js
│   └── openAiRoutes.js
├── utils/
│   ├── loaders.js
│   ├── voiceHelper.js
├── .env
├── package.json
└── README.md
```

Files in the `files` folder should be placed in the parent directory.

---

## 📞 Contact

For issues or feature requests, please open a GitHub issue or contact the maintainer.

Happy building with `node-ragbot`! 🚀🤖
