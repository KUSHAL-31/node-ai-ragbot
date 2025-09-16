/**
 * BotRequest: minimal shape we expect.
 * - method, url, headers, query, body
 * - audioBuffer? (Buffer) for /voice
 */
class BotRequest {
  constructor({ method, url, headers, query, body, audioBuffer, raw }) {
    this.method = method || "GET";
    this.url = url || "/";
    this.headers = headers || {};
    this.query = query || {};
    this.body = body || null;
    this.audioBuffer = audioBuffer || null; // Buffer | null
    this.raw = raw; // optional framework native req
  }

  getHeader(name) {
    return this.headers?.[name.toLowerCase()] ?? this.headers?.[name];
  }
}

/**
 * BotResponse: the portable response surface used by handlers.
 * Adapters must implement these to map to their framework.
 */
class BotResponse {
  status(_) {
    throw new Error("not implemented");
  }
  setHeader(_, __) {
    throw new Error("not implemented");
  }
  json(_) {
    throw new Error("not implemented");
  }
  text(_) {
    throw new Error("not implemented");
  }
  // SSE
  sseStart() {
    throw new Error("not implemented");
  }
  sseSend(_, __) {
    throw new Error("not implemented");
  }
  sseEnd() {
    throw new Error("not implemented");
  }
  // For completeness if needed:
  write(_) {
    throw new Error("not implemented");
  }
  end() {
    throw new Error("not implemented");
  }
}

module.exports = { BotRequest, BotResponse };
