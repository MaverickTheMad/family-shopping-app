"use strict";

module.exports = async function handler(req, res) {
  console.log("=== import-recipe called ===");
  console.log("method:", req.method);
  console.log("content-type:", req.headers["content-type"]);

  if (req.method !== "POST") return res.status(405).end();

  // Step 1: read body
  let body;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
    console.log("body size:", body.length);
  } catch (e) {
    console.error("body read error:", e.message);
    return res.status(500).json({ error: "Body read failed: " + e.message });
  }

  // Step 2: parse boundary
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) {
    console.error("no boundary found in:", contentType);
    return res.status(400).json({ error: "No boundary in content-type: " + contentType });
  }
  console.log("boundary:", boundaryMatch[1]);

  // Step 3: find PDF part
  const parts = parseMultipart(body, boundaryMatch[1]);
  console.log("parts found:", parts.length, parts.map(function(p) { return p.filename + "/" + p.contentType + "/" + p.data.length; }));

  const pdfPart = parts.find(function(p) {
    return p.contentType === "application/pdf" || p.filename.toLowerCase().endsWith(".pdf");
  });

  if (!pdfPart) {
    return res.status(400).json({ error: "No PDF part found. Parts: " + JSON.stringify(parts.map(function(p) { return { f: p.filename, ct: p.contentType, size: p.data.length }; })) });
  }
  console.log("pdf part size:", pdfPart.data.length);

  // Step 4: load pdf-parse
  let pdfParse;
  try {
    pdfParse = require("pdf-parse");
    console.log("pdf-parse loaded, type:", typeof pdfParse);
  } catch (e) {
    console.error("pdf-parse load error:", e.message);
    return res.status(500).json({ error: "pdf-parse load failed: " + e.message });
  }

  // Step 5: parse PDF
  let pdfText = "";
  try {
    const parsed = await pdfParse(pdfPart.data);
    pdfText = parsed.text || "";
    console.log("pdf text length:", pdfText.length);
    console.log("pdf text sample:", pdfText.slice(0, 200));
  } catch (e) {
    console.error("pdf parse error:", e.message);
    return res.status(500).json({ error: "PDF parse failed: " + e.message });
  }

  if (!pdfText || pdfText.trim().length < 20) {
    return res.status(400).json({ error: "PDF text too short: " + pdfText.length + " chars" });
  }

  const ingredients = extractIngredientsFromText(pdfText);
  const name = extractRecipeName(pdfText);
  console.log("extracted:", name, ingredients.length, "ingredients");

  return res.status(200).json({ name: name, ingredients: ingredients });
};

module.exports.config = { api: { bodyParser: false } };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findInBuffer(buffer, search, start) {
  start = start || 0;
  for (let i = start; i <= buffer.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buffer[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}

function parseMultipart(body, boundary) {
  const parts = [];
  const sep = Buffer.from("--" + boundary);
  let start = 0;
  while (start < body.length) {
    const sepIdx = findInBuffer(body, sep, start);
    if (sepIdx === -1) break;
    const headerStart = sepIdx + sep.length + 2;
    const headerEnd = findInBuffer(body, Buffer.from("\r\n\r\n"), headerStart);
    if (headerEnd === -1) break;
    const headerText = body.slice(headerStart, headerEnd).toString();
    const dataStart = headerEnd + 4;
    const nextSep = findInBuffer(body, sep, dataStart);
    const dataEnd = nextSep === -1 ? body.length : nextSep - 2;
    const data = body.slice(dataStart, dataEnd);
    const filenameMatch = headerText.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
    parts.push({
      filename: filenameMatch ? filenameMatch[1] : "",
      contentType: contentTypeMatch ? contentTypeMatch[1].trim() : "",
      data: data,
    });
    start = nextSep === -1 ? body.length : nextSep;
  }
  return parts;
}

const UNICODE_FRACTIONS = { "\u00bc":"1/4","\u00bd":"1/2","\u00be":"3/4","\u2153":"1/3","\u2154":"2/3","\u215b":"1/8","\u215c":"3/8","\u215d":"5/8","\u215e":"7/8" };
const WORD_NUMBERS = { one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10" };
const UNIT_RE = /^(tablespoons?|tbsps?|tbs?|teaspoons?|tsps?|cups?|ounces?|oz\.?|pounds?|lbs?\.?|grams?|g\.?|cloves?|cans?|jars?|bags?|packages?|slices?|pieces?|stalks?|bunches?|sprigs?|pinch(?:es)?|dash(?:es)?|sticks?)\b/i;

function parseIngredientLine(raw) {
  let str = raw.trim();
  for (const uc of Object.keys(UNICODE_FRACTIONS)) str = str.split(uc).join(" " + UNICODE_FRACTIONS[uc]);
  str = str.replace(/\s+/g, " ").trim();
  str = str.replace(/^(one|two|three|four|five|six|seven|eight|nine|ten)\b/i, function(m) { return WORD_NUMBERS[m.toLowerCase()] || m; });
  const qtyMatch = str.match(/^(\d+(?:[\/\-]\d+)?(?:\.\d+)?(?:\s+\d+\/\d+)?)\s*/);
  let quantity = "", rest = str;
  if (qtyMatch) {
    quantity = qtyMatch[1].trim();
    rest = str.slice(qtyMatch[0].length);
    const unitMatch = rest.match(UNIT_RE);
    if (unitMatch) { quantity = quantity + " " + unitMatch[0].trim(); rest = rest.slice(unitMatch[0].length).trim(); }
  }
  let name = rest.replace(/^,\s*/, "").replace(/\([^)]*\)/g, "").replace(/,.*$/, "").replace(/\s+/g, " ").trim();
  if (name.length > 0) name = name.charAt(0).toUpperCase() + name.slice(1);
  return { name: name, quantity: quantity };
}

function detectSection(name) {
  const lower = (name || "").toLowerCase();
  const rules = [
    { s: "Produce", k: ["garlic","onion","tomato","potato","carrot","celery","spinach","broccoli","pepper","lemon","lime","mushroom","ginger","basil","thyme","rosemary","sage","parsley","cilantro","mint","oregano","kale","cucumber","avocado","corn","green bean","jarlic","scallion","shallot","leek","beet","fennel","yam","sweet potato"] },
    { s: "Meat & Seafood", k: ["chicken","beef","steak","pork","turkey","lamb","salmon","shrimp","fish","bacon","sausage","kielbasa","ham","salami","pepperoni","ribeye","tenderloin","meatball","chorizo","prosciutto","deli"] },
    { s: "Dairy & Eggs", k: ["butter","milk","cream","cheese","egg","yogurt","parmesan","mozzarella","cheddar","ricotta","boursin","queso","oatmilk","kefir","heavy cream","sour cream","ghee","feta","swiss","pepper jack","shredded"] },
    { s: "Bakery & Bread", k: ["bread","roll","bun","tortilla","flatbread","pita","naan","bagel","croissant","hawaiian","sourdough","baguette"] },
    { s: "Canned & Jarred", k: ["broth","stock","tomato paste","tomato sauce","fire roasted","diced tomato","coconut milk","bouillon","chickpea","black bean","kidney bean","olive","pickle","capers"] },
    { s: "Dry Goods & Pasta", k: ["pasta","rice","noodle","orzo","flour","oat","cereal","cracker","chip","breadcrumb","quinoa","couscous","polenta","cornstarch","corn starch","spaghetti","penne","tortellini"] },
    { s: "Spices & Seasonings", k: ["salt","paprika","cumin","oregano","cinnamon","cayenne","garlic powder","onion powder","chili powder","seasoning","bay leaf","bay leaves","italian seasoning","turmeric","nutmeg","black pepper","white pepper","smoked paprika","poppy seed","dried minced","dried onion"] },
    { s: "Condiments & Sauces", k: ["soy sauce","honey","mustard","ketchup","mayo","vinegar","worcestershire","sriracha","hot sauce","marinara","pasta sauce","pesto","ranch","dijon","balsamic","vinaigrette","hoisin","maple syrup","jam"] },
    { s: "Oils & Baking", k: ["avocado oil","olive oil","vegetable oil","canola oil","sesame oil","coconut oil","baking powder","baking soda","brown sugar","chocolate chip","cocoa","vanilla extract","yeast","sugar","cooking spray"] },
    { s: "Beverages & Wine", k: ["wine","beer","white wine","red wine","cider","vodka","rum","whiskey","bourbon","tequila","gin","sake","juice","coffee","tea"] },
    { s: "Frozen", k: ["frozen","nugget","ice cream","edamame","tater tot"] },
    { s: "Household", k: ["toilet paper","paper plate","paper towel","trash bag","dish soap","detergent","aluminum foil","plastic wrap","parchment","ziplock","napkin","sponge"] },
  ];
  for (const rule of rules) { for (const kw of rule.k) { if (lower.includes(kw)) return rule.s; } }
  return "Other";
}

function extractIngredientsFromText(text) {
  const lines = text.split("\n").map(function(l) { return l.trim(); }).filter(Boolean);
  let inIngredients = false;
  const ingredientLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^ingredients?$/i.test(line) || /^what you.?ll need$/i.test(line)) { inIngredients = true; continue; }
    if (inIngredients && /^(directions?|instructions?|method|steps?|step 1)$/i.test(line)) break;
    if (inIngredients) ingredientLines.push(line);
  }
  const searchLines = ingredientLines.length > 0 ? ingredientLines : lines;
  const ingredients = [];
  for (let i = 0; i < searchLines.length; i++) {
    const line = searchLines[i];
    if (line.length < 3 || line.length > 120) continue;
    if (/^(directions?|instructions?|notes?|tips?|step \d|print|save|share|serves|yield|prep|cook|total|nutrition|per serving|submitted|tested|gather|preheat|mix |separate|layer|place|bake|slice|firefox|https?:)/i.test(line)) continue;
    const startsWithQty = /^[\d\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e]/.test(line);
    const startsWithBullet = /^[-\u2022*\u00b7]\s/.test(line);
    if (startsWithQty || startsWithBullet) {
      const parsed = parseIngredientLine(line.replace(/^[-\u2022*\u00b7]\s*/, ""));
      if (parsed.name && parsed.name.length > 1 && parsed.name.length < 80) {
        ingredients.push({ name: parsed.name, quantity: parsed.quantity, section: detectSection(parsed.name) });
      }
    }
  }
  return ingredients;
}

function extractRecipeName(text) {
  const lines = text.split("\n").map(function(l) { return l.trim(); }).filter(Boolean);
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    if (line.length > 3 && line.length < 100 && !/^https?:/i.test(line) && !/^firefox/i.test(line) && !/^\d/.test(line)) {
      if (/^(print|save|share|jump|by |author|yield|serves|prep|cook|total|submitted|tested|ingredients?)/i.test(line)) continue;
      return line;
    }
  }
  return "";
}
