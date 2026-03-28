// app/api/coach/route.js
function fallbackCoach(heartRate, targetLow, targetHigh) {
  if (heartRate > targetHigh + 8) return "hidasta";
  if (heartRate > targetHigh) return "kevyt";
  if (heartRate < targetLow - 8) return "nopeuta";
  return "pidä tämä";
}

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

export async function POST(req) {
  const body = await req.json();

  const mode = String(body.mode || "running");
  const heartRate = Number(body.heartRate ?? 0);
  const targetLow = Number(body.targetLow ?? 0);
  const targetHigh = Number(body.targetHigh ?? 0);

  const fallback = fallbackCoach(heartRate, targetLow, targetHigh);

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) {
    return Response.json({ text: fallback, source: "local" });
  }

  const prompt = `
Olet urheilun HUD-valmentaja.
Käyttötila: ${mode}
Syke: ${heartRate}
Tavoitealue: ${targetLow}-${targetHigh}

Säännöt:
- vastaa suomeksi
- 1-2 sanaa
- ei selitystä
- ei pisteitä
- vain yksi komento

Mahdollisia vastauksia:
- pidä tämä
- hidasta
- nopeuta
- kevyt
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a tiny sports HUD. Output only a very short Finnish instruction."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 16
      })
    });

    if (!response.ok) {
      return Response.json({ text: fallback, source: "local" }, { status: 200 });
    }

    const data = await response.json();
    const text = cleanText(data?.choices?.[0]?.message?.content) || fallback;

    return Response.json({ text, source: "groq", model });
  } catch {
    return Response.json({ text: fallback, source: "local" }, { status: 200 });
  }
}
