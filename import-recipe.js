export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  // Fetch the page
  let html = "";
  try {
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; recipe-importer/1.0)" },
    });
    html = await pageRes.text();
  } catch (e) {
    return res.status(400).json({ error: "Could not fetch that URL" });
  }

  // Strip to plain text
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 8000);

  // Call Claude
  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: `You are a recipe parser. Extract recipe information and return ONLY valid JSON with no markdown, no backticks, no explanation:
{"name": "Recipe Name", "ingredients": ["Ingredient 1", "Ingredient 2"]}
Ingredients should be simple names only, no quantities or prep notes. Example: "Chicken" not "2 lbs boneless chicken breast". If no recipe found, return {"name": "", "ingredients": []}.`,
      messages: [{ role: "user", content: `Extract the recipe:\n\n${text}` }],
    }),
  });

  const data = await apiRes.json();
  const raw = data.content?.[0]?.text || "{}";
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch {
    return res.status(500).json({ error: "Parse failed" });
  }
}
