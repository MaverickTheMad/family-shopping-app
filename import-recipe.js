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

  // Try JSON-LD first (used by most major recipe sites)
  const jsonLdMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const json = JSON.parse(match[1]);
      const recipes = [json, ...(json["@graph"] || [])];
      for (const node of recipes) {
        if (node["@type"] === "Recipe" || (Array.isArray(node["@type"]) && node["@type"].includes("Recipe"))) {
          const name = node.name || "";
          const rawIngredients = node.recipeIngredient || [];
          const ingredients = rawIngredients.map(stripQuantities);
          return res.status(200).json({ name, ingredients });
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Fallback: look for ingredient-looking list items in the HTML
  const ingMatches = html.matchAll(/<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/li>/gi);
  const ingredients = [];
  for (const match of ingMatches) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text) ingredients.push(stripQuantities(text));
  }

  if (ingredients.length > 0) {
    // Try to grab the title as recipe name
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const name = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    return res.status(200).json({ name, ingredients });
  }

  return res.status(200).json({ name: "", ingredients: [] });
}

// Strip quantities and prep notes, return just the ingredient name
function stripQuantities(str) {
  return str
    .replace(/<[^>]+>/g, "")           // strip HTML tags
    .replace(/^\s*[\d¼½¾⅓⅔⅛⅜⅝⅞]+[\s\/\-–]*/u, "") // leading numbers/fractions
    .replace(/^\s*(one|two|three|four|five|six|seven|eight|nine|ten)\s+/i, "")
    .replace(/\([^)]*\)/g, "")          // parentheticals like (optional)
    .replace(/,.*$/, "")                // everything after first comma
    .replace(/\b(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|ml|liter|liters|clove|cloves|can|cans|bunch|package|pkg|slice|slices|large|medium|small|fresh|dried|chopped|minced|diced|sliced|whole|ground)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
