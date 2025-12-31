// api/gemini.ts
// Vercel Functions (Web Handler: Request -> Response) :contentReference[oaicite:2]{index=2}

const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), { status, headers });
}

export default async function handler(req: Request): Promise<Response> {
  // ✅ ตอบ OPTIONS ทันที
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  // ✅ ตอบ GET ทันที (เอาไว้เช็คว่า route มีจริง ไม่ timeout)
  if (req.method === "GET") return json(200, { ok: true, route: "/api/gemini" });

  // ✅ รองรับเฉพาะ POST สำหรับเรียก AI
  if (req.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  // ✅ อ่าน body แบบกันพัง
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const prompt = payload?.prompt;
  const model =
    typeof payload?.model === "string" && payload.model.trim()
      ? payload.model.trim()
      : "gemini-2.5-flash";

  if (!prompt || typeof prompt !== "string") {
    return json(400, { error: "BAD_REQUEST", hint: "Body ต้องเป็น { prompt: string }" });
  }

  // ✅ อ่านคีย์จาก Vercel Env เท่านั้น (ไม่ฝังใน client)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, {
      error: "MISSING_API_KEY",
      hint: "ตั้ง GEMINI_API_KEY ใน Vercel Project Settings > Environment Variables แล้ว Redeploy",
    });
  }

  // ✅ จำกัดเวลา (กัน timeout ของ Vercel)
  // แนะนำ 8–9s สำหรับแพลนที่จำกัดเวลาสั้น ๆ :contentReference[oaicite:3]{index=3}
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });

    const raw = await upstream.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }

    if (!upstream.ok) {
      return json(502, {
        error: "GEMINI_UPSTREAM_ERROR",
        status: upstream.status,
        detail: data?.error?.message || data,
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        ?.filter(Boolean)
        ?.join("") || "";

    return json(200, { text });
  } catch (e: any) {
    const detail = e?.name === "AbortError" ? "Upstream timeout" : e?.message || "SERVER_ERROR";
    return json(500, { error: "SERVER_ERROR", detail });
  } finally {
    clearTimeout(timeout);
  }
}
