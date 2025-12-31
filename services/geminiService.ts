export async function callGemini(prompt: string) {
  if (!prompt?.trim()) throw new Error("Prompt ว่าง");

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `AI request failed (${res.status})`);
  }

  return (data.text ?? "") as string;
}
