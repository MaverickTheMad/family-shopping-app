import pdfParse from "pdf-parse/lib/pdf-parse.js";

// ─── Auto-category detection ──────────────────────────────────────────────────

const CATEGORY_RULES = [
  { section: "Produce", keywords: ["garlic","onion","tomato","potato","carrot","celery","spinach","broccoli","pepper","lemon","lime","mushroom","ginger","basil","thyme","rosemary","sage","parsley","cilantro","mint","dill","oregano","kale","cabbage","cucumber","zucchini","squash","avocado","corn","green bean","jarlic","minced garlic","scallion","shallot","leek","artichoke","arugula","asparagus","beet","bok choy","fennel","radish","turnip","yam","sweet potato","apple","banana","berry","cherry","grape","mango","peach","pear","plum","strawberry"] },
  { section: "Meat & Seafood", keywords: ["chicken","beef","steak","pork","turkey","lamb","salmon","shrimp","fish","bacon","sausage","kielbasa","ham","salami","pepperoni","ground beef","ground pork","ribeye","tenderloin","brisket","meatball","chorizo","prosciutto","deli","spicy sausage","ground sausage","ground turkey","cod","tilapia","tuna","crab","lobster","scallop","anchovy","duck","veal","venison","bison"] },
  { section: "Dairy & Eggs", keywords: ["butter","milk","cream","cheese","egg","yogurt","parmesan","mozzarella","cheddar","ricotta","boursin","queso","oatmilk","keifer","kefir","cold foam","heavy cream","sour cream","cream cheese","buttermilk","ghee","provolone","gouda","brie","feta","swiss","jack cheese","pepper jack","shredded"] },
  { section: "Bakery & Bread", keywords: ["bread","roll","bun","tortilla","flatbread","pita","naan","bagel","croissant","hawaiian","sourdough","baguette","english muffin","hoagie","ciabatta","focaccia"] },
  { section: "Canned & Jarred", keywords: ["broth","stock","tomato paste","tomato sauce","fire roasted","diced tomato","coconut milk","bouillon","chickpea","garbanzo","black bean","kidney bean","pinto bean","cannellini","olive","pickle","capers","roasted pepper","tapenade","water chestnut"] },
  { section: "Dry Goods & Pasta", keywords: ["pasta","rice","noodle","orzo","flour","oat","cereal","cracker","chip","breadcrumb","quinoa","barley","couscous","polenta","cornstarch","corn starch","chicken rice","lasagna","spaghetti","penne","rigatoni","fusilli","linguine","tortellini","ramen","stuffing"] },
  { section: "Spices & Seasonings", keywords: ["salt","paprika","cumin","oregano","cinnamon","cayenne","garlic powder","onion powder","chili powder","seasoning","bay leaf","bay leaves","italian seasoning","turmeric","nutmeg","allspice","red pepper flake","black pepper","white pepper","smoked paprika","sweet paprika","cardamom","coriander","fennel seed","garam masala","old bay","taco seasoning","cajun"] },
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

const UNICODE_FRACTIONS = { "¼":"1/4","½":"1/2","¾":"3/4","⅓":"1/3","⅔":"2/3","⅛":"1/8","⅜":"3/8","⅝":"5/8","⅞":"7/8" };
const WORD_NUMBERS = { one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10" };
const UNITS = ["tablespoons?","tbsps?","tbs?","teaspoons?","tsps?","cups?","fluid ounces?","fl\\.? oz\\.?","ounces?","oz\\.?","pounds?","lbs?\\.?","grams?","g\\.?","kilograms?","kg\\.?","milliliters?","ml\\.?","liters?","l\\.?","quarts?","qt\\.?","pints?","pt\\.?","gallons?","cloves?","cans?","jars?","bags?","boxes?","packages?","pkgs?\\.?","slices?","pieces?","strips?","stalks?","heads?","bunches?","sprigs?","leaves?","pinch(?:es)?","dash(?:es)?","handful(?:s)?","sticks?"];
const UNIT_RE = new RegExp(`^(${UNITS.join("|")})\\b`, "i");

function parseIngredientLine(raw) {
  let str = raw.trim();
  for (const [uc, rep] of Object.entries(UNICODE_FRACTIONS)) str = str.replace(new RegExp(uc, "g"), ` ${rep}`);
  str = str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  str = str.replace(/^(one|two|three|four|five|six|seven|eight|nine|ten)\b/i, (m) => WORD_NUMBERS[m.toLowerCase()] || m);

  const qtyRe = /^(\d+(?:[\/\-]\d+)?(?:\.\d+)?(?:\s+\d+\/\d+)?)\s*/;
  const qtyMatch = str.match(qtyRe);
  let quantity = "";
  let rest = str;

  if (qtyMatch) {
    quantity = qtyMatch[1].trim();
    rest = str.slice(qtyMatch[0].length);
    const unitMatch = rest.match(UNIT_RE);
    if (unitMatch) {
      quantity = `${quantity} ${unitMatch[0].trim()}`;
      rest = rest.slice(unitMatch[0].length).trim();
    }
  }

  let name = rest
    .replace(/^,\s*/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/,.*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  name = name.charAt(0).toUpperCase() + name.slice(1);
  return { name, quantity };
}

// ─── Extract ingredients from PDF plain text ──────────────────────────────────

function extractIngredientsFromText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const ingredients = [];
  let inIngredients = false;
  let ingredientLines = [];

  for (const line of lines) {
    if (/^ingredients?$/i.test(line) || /^what you.?ll need$/i.test(line)) {
      inIngredients = true;
      continue;
    }
    if (inIngredients && /^(instructions?|directions?|method|how to make|preparation|steps?)$/i.test(line)) {
      break;
    }
    if (inIngredients) ingredientLines.push(line);
  }

  // If no section header found, use whole doc
  if (ingredientLines.length === 0) ingredientLines = lines;

  for (const line of ingredientLines) {
    if (line.length < 3 || line.length > 120) continue;
    if (/^(instructions?|directions?|notes?|tips?|step \d|print|save|share|jump to|serves|yield|prep|cook|total time)/i.test(line)) continue;

    const startsWithQuantity = /^[\d¼½¾⅓⅔⅛⅜⅝⅞]/.test(line);
    const startsWithBullet = /^[-•*·]/.test(line);
    const cleanLine = line.replace(/^[-•*·]\s*/, "");

    if (startsWithQuantity || startsWithBullet) {
      const { name, quantity } = parseIngredientLine(cleanLine);
      if (name && name.length > 1 && name.length < 80) {
        ingredients.push({ name, quantity, section: detectSection(name) });
      }
    }
  }

  return ingredients;
}

function extractRecipeName(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    if (line.length > 3 && line.length < 100 && !line.startsWith("http")) {
      if (/^(print|save|share|jump|by |author|yield|serves|prep|cook|total)/i.test(line)) continue;
      return line;
    }
  }
  return "";
}

// ─── Vercel handler ───────────────────────────────────────────────────────────

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) return res.status(400).json({ error: "Invalid request format" });

  const parts = parseMultipart(body, boundaryMatch[1]);
  const pdfPart = parts.find((p) => p.contentType === "application/pdf" || (p.filename && p.filename.toLowerCase().endsWith(".pdf")));

  if (!pdfPart) return res.status(400).json({ error: "No PDF file found in request" });

  let pdfText = "";
  try {
    const data = await pdfParse(pdfPart.data);
    pdfText = data.text;
  } catch (e) {
    return res.status(400).json({ error: "Could not read PDF. Make sure it's a valid PDF file." });
  }

  if (!pdfText || pdfText.trim().length < 20) {
    return res.status(400).json({ error: "PDF appears to be empty or image-only. Try a text-based PDF (print-to-PDF from a recipe site)." });
  }

  const ingredients = extractIngredientsFromText(pdfText);
  const name = extractRecipeName(pdfText);

  return res.status(200).json({ name, ingredients });
}

// ─── Multipart parser ─────────────────────────────────────────────────────────

function parseMultipart(body, boundary) {
  const parts = [];
  const sep = Buffer.from(`--${boundary}`);
  let start = 0;

  while (start < body.length) {
    const sepIdx = indexOf(body, sep, start);
    if (sepIdx === -1) break;
    const headerStart = sepIdx + sep.length + 2;
    const headerEnd = indexOf(body, Buffer.from("\r\n\r\n"), headerStart);
    if (headerEnd === -1) break;
    const headerText = body.slice(headerStart, headerEnd).toString();
    const dataStart = headerEnd + 4;
    const nextSep = indexOf(body, sep, dataStart);
    const dataEnd = nextSep === -1 ? body.length : nextSep - 2;
    const data = body.slice(dataStart, dataEnd);
    const filenameMatch = headerText.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
    parts.push({
      filename: filenameMatch ? filenameMatch[1] : "",
      contentType: contentTypeMatch ? contentTypeMatch[1].trim() : "",
      data,
    });
    start = nextSep === -1 ? body.length : nextSep;
  }
  return parts;
}

function indexOf(buffer, search, start = 0) {
  for (let i = start; i <= buffer.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buffer[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}
