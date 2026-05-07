"use strict";

// ─── Category detection ───────────────────────────────────────────────────────

const CATEGORY_RULES = [
  { section: "Produce", keywords: ["garlic","onion","tomato","potato","carrot","celery","spinach","broccoli","pepper","lemon","lime","mushroom","ginger","basil","thyme","rosemary","sage","parsley","cilantro","mint","dill","oregano","kale","cabbage","cucumber","zucchini","squash","avocado","corn","green bean","jarlic","minced garlic","scallion","shallot","leek","artichoke","arugula","asparagus","beet","fennel","radish","turnip","yam","sweet potato","apple","banana","berry","cherry","grape","mango","peach","pear","plum","strawberry"] },
  { section: "Meat & Seafood", keywords: ["chicken","beef","steak","pork","turkey","lamb","salmon","shrimp","fish","bacon","sausage","kielbasa","ham","salami","pepperoni","ground beef","ground pork","ribeye","tenderloin","brisket","meatball","chorizo","prosciutto","deli","spicy sausage","ground sausage","ground turkey","cod","tilapia","tuna","crab","lobster","scallop","anchovy","duck","veal","venison","bison"] },
  { section: "Dairy & Eggs", keywords: ["butter","milk","cream","cheese","egg","yogurt","parmesan","mozzarella","cheddar","ricotta","boursin","queso","oatmilk","keifer","kefir","cold foam","heavy cream","sour cream","cream cheese","buttermilk","ghee","provolone","gouda","brie","feta","swiss","jack cheese","pepper jack","shredded"] },
  { section: "Bakery & Bread", keywords: ["bread","roll","bun","tortilla","flatbread","pita","naan","bagel","croissant","hawaiian","sourdough","baguette","english muffin","hoagie","ciabatta","focaccia"] },
  { section: "Canned & Jarred", keywords: ["broth","stock","tomato paste","tomato sauce","fire roasted","diced tomato","coconut milk","bouillon","chickpea","garbanzo","black bean","kidney bean","pinto bean","cannellini","olive","pickle","capers","roasted pepper","tapenade","water chestnut"] },
  { section: "Dry Goods & Pasta", keywords: ["pasta","rice","noodle","orzo","flour","oat","cereal","cracker","chip","breadcrumb","quinoa","barley","couscous","polenta","cornstarch","corn starch","chicken rice","lasagna","spaghetti","penne","rigatoni","fusilli","linguine","tortellini","ramen","stuffing"] },
  { section: "Spices & Seasonings", keywords: ["salt","paprika","cumin","oregano","cinnamon","cayenne","garlic powder","onion powder","chili powder","seasoning","bay leaf","bay leaves","italian seasoning","turmeric","nutmeg","allspice","red pepper flake","black pepper","white pepper","smoked paprika","sweet paprika","cardamom","coriander","fennel seed","garam masala","old bay","taco seasoning","cajun","poppy seed","dried minced","dried onion"] },
  { section: "Condiments & Sauces", keywords: ["soy sauce","honey","mustard","ketchup","mayo","vinegar","worcestershire","sriracha","hot sauce","marinara","pasta sauce","pesto","ranch","dijon","balsamic","vinaigrette","teriyaki","hoisin","molasses","maple syrup","jam","jelly","fish sauce","oyster sauce","tahini","tamari","bbq"] },
  { section: "Oils & Baking", keywords: ["avocado oil","olive oil","vegetable oil","canola oil","sesame oil","coconut oil","baking powder","baking soda","brown sugar","chocolate chip","cocoa","vanilla extract","yeast","shortening","cream of tartar","powdered sugar","cooking spray"] },
  { section: "Beverages & Wine", keywords: ["wine","beer","cabernet","sauvignon blanc","chardonnay","merlot","pinot","prosecco","white wine","red wine","cider","vodka","rum","whiskey","bourbon","tequila","gin","sake","juice","coffee","tea","lemonade","club soda","seltzer","kombucha"] },
  { section: "Frozen", keywords: ["frozen","nugget","ice cream","popsicle","edamame","tater tot","gelato","sherbet"] },
  { section: "Household", keywords: ["toilet paper","paper plate","paper towel","trash bag","dish soap","detergent","aluminum foil","plastic wrap","parchment","ziplock","napkin","sponge","tissue","candle","battery","lotion","hand soap"] },
];

function detectSection(name) {
  const lower = (name || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.section;
    }
  }
  return "Other";
}

// ─── Quantity parser ──────────────────────────────────────────────────────────

const UNICODE_FRACTIONS = { "\u00bc":"1/4","\u00bd":"1/2","\u00be":"3/4","\u2153":"1/3","\u2154":"2/3","\u215b":"1/8","\u215c":"3/8","\u215d":"5/8","\u215e":"7/8" };
const WORD_NUMBERS = { one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10" };
const UNIT_PATTERN = "tablespoons?|tbsps?|tbs?|teaspoons?|tsps?|cups?|fluid ounces?|fl\\.? oz\\.?|ounces?|oz\\.?|pounds?|lbs?\\.?|grams?|g\\.?|kilograms?|kg\\.?|milliliters?|ml\\.?|liters?|l\\.?|quarts?|qt\\.?|pints?|pt\\.?|gallons?|cloves?|cans?|jars?|bags?|boxes?|packages?|pkgs?\\.?|slices?|pieces?|strips?|stalks?|heads?|bunches?|sprigs?|leaves?|pinch(?:es)?|dash(?:es)?|handful(?:s)?|sticks?";
const UNIT_RE = new RegExp("^(" + UNIT_PATTERN + ")\\b", "i");

function parseIngredientLine(raw) {
  let str = raw.trim();
  for (const uc of Object.keys(UNICODE_FRACTIONS)) {
    str = str.split(uc).join(" " + UNICODE_FRACTIONS[uc]);
  }
  str = str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  str = str.replace(/^(one|two|three|four|five|six|seven|eight|nine|ten)\b/i, function(m) {
    return WORD_NUMBERS[m.toLowerCase()] || m;
  });

  const qtyMatch = str.match(/^(\d+(?:[\/\-]\d+)?(?:\.\d+)?(?:\s+\d+\/\d+)?)\s*/);
  let quantity = "";
  let rest = str;

  if (qtyMatch) {
    quantity = qtyMatch[1].trim();
    rest = str.slice(qtyMatch[0].length);
    const unitMatch = rest.match(UNIT_RE);
    if (unitMatch) {
      quantity = quantity + " " + unitMatch[0].trim();
      rest = rest.slice(unitMatch[0].length).trim();
    }
  }

  let name = rest
    .replace(/^,\s*/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/,.*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  return { name: name, quantity: quantity };
}

// ─── Text extraction ──────────────────────────────────────────────────────────

function extractIngredientsFromText(text) {
  const lines = text.split("\n").map(function(l) { return l.trim(); }).filter(Boolean);
  let inIngredients = false;
  const ingredientLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^ingredients?$/i.test(line) || /^what you.?ll need$/i.test(line)) {
      inIngredients = true;
      continue;
    }
    if (inIngredients && /^(directions?|instructions?|method|how to make|preparation|steps?|step 1)$/i.test(line)) {
      break;
    }
    if (inIngredients) ingredientLines.push(line);
  }

  const searchLines = ingredientLines.length > 0 ? ingredientLines : lines;
  const ingredients = [];

  for (let i = 0; i < searchLines.length; i++) {
    const line = searchLines[i];
    if (line.length < 3 || line.length > 120) continue;
    if (/^(directions?|instructions?|notes?|tips?|step \d|print|save|share|jump to|serves|yield|prep|cook|total time|nutrition|per serving|submitted|tested by|gather|preheat|mix |separate|layer|place|bake|slice)/i.test(line)) continue;

    const startsWithQuantity = /^[\d\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e]/.test(line);
    const startsWithBullet = /^[-\u2022*\u00b7]\s/.test(line);
    const cleanLine = line.replace(/^[-\u2022*\u00b7]\s*/, "");

    if (startsWithQuantity || startsWithBullet) {
      const parsed = parseIngredientLine(cleanLine);
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
    if (line.length > 3 && line.length < 100 && !line.startsWith("http") && !line.startsWith("Firefox") && !/^\d/.test(line)) {
      if (/^(print|save|share|jump|by |author|yield|serves|prep|cook|total|submitted|tested|ingredients?|firefox)/i.test(line)) continue;
      return line;
    }
  }
  return "";
}

// ─── Multipart parser ─────────────────────────────────────────────────────────

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

// ─── Vercel handler ───────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Read raw multipart body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) {
    return res.status(400).json({ error: "Invalid request format — expected multipart/form-data" });
  }

  const parts = parseMultipart(body, boundaryMatch[1]);
  const pdfPart = parts.find(function(p) {
    return p.contentType === "application/pdf" || p.filename.toLowerCase().endsWith(".pdf");
  });

  if (!pdfPart) {
    return res.status(400).json({ error: "No PDF found in upload" });
  }

  // Parse PDF
  let pdfText = "";
  try {
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(pdfPart.data);
    pdfText = parsed.text || "";
  } catch (e) {
    return res.status(500).json({ error: "PDF parse error: " + e.message });
  }

  if (!pdfText || pdfText.trim().length < 20) {
    return res.status(400).json({ error: "PDF is empty or image-only. Open the recipe in your browser, then File \u2192 Print \u2192 Save as PDF." });
  }

  const ingredients = extractIngredientsFromText(pdfText);
  const name = extractRecipeName(pdfText);

  return res.status(200).json({ name: name, ingredients: ingredients });
};

module.exports.config = { api: { bodyParser: false } };
