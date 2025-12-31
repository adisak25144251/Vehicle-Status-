export default async function handler(req: Request): Promise<Response> {
  // อนุญาตเฉพาะ POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  // อ่านคีย์จาก ENV บน Vercel
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY on server" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // รับ prompt จาก body
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const prompt = body?.prompt;
  const model = body?.model || "gemini-2.5-flash"; // เปลี่ยนได้ตามต้องการ

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // เรียก Gemini API (REST)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const geminiRes = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  const data = await geminiRes.json().catch(() => ({}));

  if (!geminiRes.ok) {
    return new Response(JSON.stringify({ error: "Gemini API error", details: data }), {
      status: geminiRes.status,
      headers: { "content-type": "application/json" },
    });
  }

  // ดึงข้อความที่ได้ออกมาแบบง่าย
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text)
      ?.filter(Boolean)
      ?.join("") || "";

  return new Response(JSON.stringify({ text, raw: data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
