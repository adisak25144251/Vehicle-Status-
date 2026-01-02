// api/gemini.ts (Vercel Serverless Function - Node style: req, res)

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function safeJson(res: any, status: number, body: any) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  // ✅ GET = health check (ต้องตอบไว ห้ามเรียก Gemini)
  if (req.method === "GET") {
    return safeJson(res, 200, {
      ok: true,
      route: "/api/gemini",
      hasKey: Boolean(process.env.GEMINI_API_KEY),
      model: MODEL,
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    });
  }

  if (req.method !== "POST") return safeJson(res, 405, { error: "METHOD_NOT_ALLOWED" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return safeJson(res, 500, { error: "MISSING_API_KEY" });

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  if (!prompt.trim()) return safeJson(res, 400, { error: "INVALID_PROMPT" });

  // ✅ กัน timeout ของ Vercel
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
      `?key=${encodeURIComponent(apiKey)}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return safeJson(res, r.status, {
        error: "GEMINI_API_ERROR",
        message: data?.error?.message || data,
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .join("") || "";

    return safeJson(res, 200, { text });
  } catch (e: any) {
    return safeJson(res, 500, { error: e?.name === "AbortError" ? "UPSTREAM_TIMEOUT" : "SERVER_ERROR" });
  } finally {
    clearTimeout(timer);
  }
}
