const { BotRequest } = require("./types");
const { errorToHttpPayload } = require("../utils/errors");
const { formatSseEvent, sseHeaders } = require("./sse");

// ---------------- Common helpers ----------------

function makePortableResponse(resLike) {
  let statusCode = 200;

  const setHeader = (k, v) => {
    if (resLike.setHeader) resLike.setHeader(k, v);
  };

  const status = (code) => {
    statusCode = code;
    if ("status" in resLike && typeof resLike.status === "function") {
      resLike.status(code);
    } else {
      resLike.statusCode = code;
    }
    return api;
  };

  const json = (obj) => {
    setHeader("Content-Type", "application/json");
    const payload = JSON.stringify(obj);
    if (resLike.send) return resLike.send(payload);
    resLike.write(payload);
    resLike.end();
  };

  const text = (s) => {
    setHeader("Content-Type", "text/plain; charset=utf-8");
    if (resLike.send) return resLike.send(s);
    resLike.write(s);
    resLike.end();
  };

  // SSE
  let sseActive = false;
  const sseStart = () => {
    if (sseActive) return;
    Object.entries(sseHeaders()).forEach(([k, v]) => setHeader(k, v));
    sseActive = true;
  };
  const sseSend = (event, data) => {
    if (!sseActive) sseStart();
    resLike.write(formatSseEvent(event, data));
  };
  const sseEnd = () => resLike.end();

  const error = (err) => {
    const { status: sc, body, headers } = errorToHttpPayload(err);
    Object.entries(headers || {}).forEach(([k, v]) => setHeader(k, v));
    return status(sc).json(body);
  };

  const api = {
    status,
    setHeader,
    json,
    text,
    sseStart,
    sseSend,
    sseEnd,
    error,
  };
  return api;
}

/**
 * Collect and parse body:
 * - JSON if Content-Type is application/json
 * - Buffer if Content-Type is audio/*
 */
function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const buf = Buffer.concat(chunks);
      const ct = req.headers["content-type"] || "";
      if (ct.includes("application/json")) {
        try {
          return resolve({ body: JSON.parse(buf.toString("utf8")) });
        } catch {
          return resolve({ body: {} });
        }
      }
      if (ct.startsWith("audio/")) {
        return resolve({ audioBuffer: buf, body: {} });
      }
      // default fallback: try JSON, else empty
      try {
        return resolve({ body: JSON.parse(buf.toString("utf8")) });
      } catch {
        return resolve({ body: {} });
      }
    });
    req.on("error", reject);
  });
}

// ---------------- Adapters ----------------

// Express
function useInExpress(app, chatHandler, voiceHandler, prefix = "") {
  const base = prefix || "";

  app.post(`${base}/chat`, async (req, res) => {
    let body = req.body;
    if (!body || Object.keys(body).length === 0) {
      ({ body } = await collectBody(req));
    }

    const preq = new BotRequest({
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body,
      raw: req,
    });

    const pres = makePortableResponse(res);
    await chatHandler(preq, pres);
  });

  app.post(`${base}/voice`, async (req, res) => {
    let body = {},
      audioBuffer = null;

    if (req.body && Buffer.isBuffer(req.body)) {
      audioBuffer = req.body;
    } else {
      ({ body, audioBuffer } = await collectBody(req));
    }

    const preq = new BotRequest({
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body,
      audioBuffer,
      raw: req,
    });

    const pres = makePortableResponse(res);
    await voiceHandler(preq, pres);
  });
}

// Fastify
function useInFastify(fastify, chatHandler, voiceHandler, prefix = "") {
  const base = prefix || "";

  fastify.post(`${base}/chat`, async (req, reply) => {
    let body = req.body || {};
    if (!Object.keys(body).length) {
      ({ body } = await collectBody(req.raw));
    }

    const preq = new BotRequest({
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body,
      raw: req.raw,
    });

    const pres = makePortableResponse(reply.raw);
    await chatHandler(preq, pres);
  });

  fastify.post(`${base}/voice`, async (req, reply) => {
    let body = {},
      audioBuffer = null;
    if (req.body && Buffer.isBuffer(req.body)) {
      audioBuffer = req.body;
    } else {
      ({ body, audioBuffer } = await collectBody(req.raw));
    }

    const preq = new BotRequest({
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body,
      audioBuffer,
      raw: req.raw,
    });

    const pres = makePortableResponse(reply.raw);
    await voiceHandler(preq, pres);
  });
}

// Koa
function useInKoa(router, chatHandler, voiceHandler, prefix = "") {
  const base = prefix || "";

  router.post(`${base}/chat`, async (ctx) => {
    let body = ctx.request.body || {};
    if (!Object.keys(body).length) {
      ({ body } = await collectBody(ctx.req));
    }

    const preq = new BotRequest({
      method: ctx.method,
      url: ctx.url,
      headers: ctx.headers,
      query: ctx.query,
      body,
      raw: ctx.req,
    });

    const pres = makePortableResponse(ctx.res);
    await chatHandler(preq, pres);
    ctx.respond = false;
  });

  router.post(`${base}/voice`, async (ctx) => {
    let body = {},
      audioBuffer = null;
    if (ctx.request.body && Buffer.isBuffer(ctx.request.body)) {
      audioBuffer = ctx.request.body;
    } else {
      ({ body, audioBuffer } = await collectBody(ctx.req));
    }

    const preq = new BotRequest({
      method: ctx.method,
      url: ctx.url,
      headers: ctx.headers,
      query: ctx.query,
      body,
      audioBuffer,
      raw: ctx.req,
    });

    const pres = makePortableResponse(ctx.res);
    await voiceHandler(preq, pres);
    ctx.respond = false;
  });
}

// NestJS
function useInNestJS(chatHandler, voiceHandler, prefix = "") {
  const base = prefix || "";
  return {
    chat: async (req, res) => {
      let body = req.body || {};
      if (!Object.keys(body).length) {
        ({ body } = await collectBody(req));
      }

      const preq = new BotRequest({
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body,
        raw: req,
      });

      const pres = makePortableResponse(res);
      await chatHandler(preq, pres);
    },
    voice: async (req, res) => {
      let body = {},
        audioBuffer = null;
      if (req.body && Buffer.isBuffer(req.body)) {
        audioBuffer = req.body;
      } else {
        ({ body, audioBuffer } = await collectBody(req));
      }

      const preq = new BotRequest({
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body,
        audioBuffer,
        raw: req,
      });

      const pres = makePortableResponse(res);
      await voiceHandler(preq, pres);
    },
    prefix: base,
  };
}

// Raw Node
function useInHttp(server, chatHandler, voiceHandler, prefix = "") {
  const base = prefix || "";

  server.on("request", async (req, res) => {
    if (req.method === "POST" && req.url === `${base}/chat`) {
      const { body } = await collectBody(req);
      const preq = new BotRequest({
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: {},
        body,
        raw: req,
      });
      const pres = makePortableResponse(res);
      await chatHandler(preq, pres);
    } else if (req.method === "POST" && req.url === `${base}/voice`) {
      const { body, audioBuffer } = await collectBody(req);
      const preq = new BotRequest({
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: {},
        body,
        audioBuffer,
        raw: req,
      });
      const pres = makePortableResponse(res);
      await voiceHandler(preq, pres);
    } else {
      res.statusCode = 404;
      res.end("Not Found");
    }
  });
}

module.exports = {
  useInExpress,
  useInFastify,
  useInKoa,
  useInNestJS,
  useInHttp,
};
