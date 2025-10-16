import { Readable } from "node:stream";
import supertest from "supertest";


function createRequestStream(method, url, body, headers = {}) {
  const normalizedMethod = method.toUpperCase();
  const baseHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  if (body === undefined || body === null) {
    return Object.assign(new Readable({ read() { this.push(null); } }), {
      method: normalizedMethod,
      url,
      headers: baseHeaders,
      cookies: {},
    });
  }

  const payload = typeof body === "string" ? body : JSON.stringify(body);
  const stream = new Readable({
    read() {
      this.push(payload);
      this.push(null);
    },
  });

  const contentHeaders = {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
  };

  return Object.assign(stream, {
    method: normalizedMethod,
    url,
    headers: { ...contentHeaders, ...baseHeaders },
    cookies: {},
  });
}

function createResponseStub() {
  const headers = new Map();
  let resolveFinished;

  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  const res = {
    statusCode: 200,
    body: undefined,
    rawBody: "",
    headers,
    finished,
    ended: false,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(name.toLowerCase());
    },
    removeHeader(name) {
      headers.delete(name.toLowerCase());
    },
    get(field) {
      return this.getHeader(field);
    },
    set(field, value) {
      if (typeof field === "object") {
        Object.entries(field).forEach(([key, val]) => this.setHeader(key, val));
      } else {
        this.setHeader(field, value);
      }
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    type(value) {
      this.setHeader("content-type", value);
      return this;
    },
    json(payload) {
      this.type("application/json");
      this.body = payload;
      this.rawBody = JSON.stringify(payload);
      return this.end(this.rawBody);
    },
    send(payload) {
      const output =
        typeof payload === "string" || Buffer.isBuffer(payload)
          ? payload
          : JSON.stringify(payload);
      if (typeof payload === "object" && !Buffer.isBuffer(payload)) {
        this.type("application/json");
      }
      return this.end(output);
    },
    end(chunk = "") {
      if (typeof chunk === "string") {
        this.rawBody = chunk;
      } else if (Buffer.isBuffer(chunk)) {
        this.rawBody = chunk.toString();
      }
      if (this.body === undefined && this.rawBody) {
        try {
          this.body = JSON.parse(this.rawBody);
        } catch {
          this.body = this.rawBody;
        }
      }
      this.ended = true;
      resolveFinished(this);
      return this;
    },
  };

  return res;
}

export async function request(app, { method = "GET", url = "/", headers = {}, body } = {}) {
  const req = createRequestStream(method, url, body, headers);
  const res = createResponseStub();

  let handlerError;

  try {
    app.handle(req, res, (err) => {
      if (err) {
        handlerError = err;
        if (!res.ended) res.end();
        return;
      }
      if (!res.ended) {
        res.end();
      }
    });
  } catch (err) {
    handlerError = err;
    if (!res.ended) {
      res.end();
    }
  }

  await res.finished;

  if (handlerError) {
    throw handlerError;
  }

  return {
    status: res.statusCode,
    body: res.body,
    rawBody: res.rawBody,
    headers: Object.fromEntries(res.headers.entries()),
  };
}
 export default (app) => supertest(app);