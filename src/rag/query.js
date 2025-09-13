const { OpenAI } = require("openai");

function renderTemplate(template, vars) {
  return template
    .replace(/{{\s*context\s*}}/g, vars.context)
    .replace(/{{\s*question\s*}}/g, vars.question);
}

async function queryRAG(vectorStore, question, cfg, logger = console) {
  const results = await vectorStore.similaritySearch(question, cfg.rag.topK);
  const context = results.map((doc) => doc.pageContent).join("\n---\n");

  const prompt = renderTemplate(cfg.openai.chat.promptTemplate, {
    context,
    question,
  });

  const client = new OpenAI({ apiKey: cfg.openai.apiKey });

  const response = await client.chat.completions.create({
    model: cfg.openai.chat.model,
    messages: [{ role: "user", content: prompt }],
    temperature: cfg.openai.chat.temperature,
    max_tokens: cfg.openai.chat.maxTokens,
  });

  const answer = response?.choices?.[0]?.message?.content?.trim() || "";
  if (!answer) {
    logger.warn("OpenAI returned empty answer.");
  }
  return answer;
}

module.exports = { queryRAG };
