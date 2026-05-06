// --------------------------------------------------------------------------
// AUTO-CATEGORY DETECTION
// --------------------------------------------------------------------------
const CATEGORY_RULES = [
  {
    section: "Produce",
    keywords: [
      "apple","apricot","artichoke","arugula","asparagus","avocado","banana","basil","beet",
      "bell pepper","blackberry","blueberry","bok choy","broccoli","brussels","butternut",
      "cabbage","cantaloupe","carrot","cauliflower","celery","cherry","chive","cilantro",
      "clementine","collard","corn","cucumber","dill","eggplant","endive","fennel","fig",
      "garlic","ginger","grape","grapefruit","green bean","green onion","herb","jalapeño",
      "jarlic","kale","leek","lemon","lettuce","lime","mango","mint","mushroom","nectarine",
      "onion","orange","parsley","peach","pear","pea","pepper","plum","pomegranate","potato",
      "pumpkin","radicchio","radish","raspberry","rosemary","sage","scallion","shallot",
      "spinach","squash","strawberry","sweet potato","thyme","tomatillo","tomato","turnip",
      "watermelon","yam","zucchini","minced garlic","fresh","sprout","sprouts","microgreen",
    ],
  },
  {
    section: "Meat & Seafood",
    keywords: [
      "bacon","beef","bison","chicken","chorizo","clam","cod","crab","duck","fish","ground beef",
      "ground pork","ground turkey","ham","kielbasa","lamb","lobster","meatball","meatballs",
      "pepperoni","pork","prosciutto","ribeye","roast","salami","salmon","sausage","scallop",
      "shrimp","sirloin","steak","tilapia","tuna","turkey","veal","venison","anchovy","anchov",
      "deli","loin","tenderloin","brisket","short rib","flank","chuck","skirt","drumstick",
      "thigh","breast","wing","filet","fillet","seafood","shellfish",
    ],
  },
  {
    section: "Dairy & Eggs",
    keywords: [
      "butter","buttermilk","cheese","cream cheese","cream","creme","egg","ghee","half and half",
      "heavy cream","kefir","keifer","milk","mozzarella","oat milk","oatmilk","parmesan",
      "provolone","ricotta","sour cream","whipped cream","whipping cream","yogurt",
      "boursin","brie","camembert","cheddar","colby","cottage cheese","feta","gouda",
      "gruyere","havarti","jack cheese","manchego","muenster","pepper jack","queso",
      "romano","swiss","velveeta","american cheese","shredded","cold foam",
    ],
  },
  {
    section: "Bakery & Bread",
    keywords: [
      "bagel","baguette","biscuit","bread","brioche","bun","challah","ciabatta","croissant",
      "crouton","english muffin","flatbread","focaccia","hoagie","hot dog bun","kaiser",
      "naan","panko","pita","pretzel","roll","sourdough","sub roll","tortilla","wrap",
      "hawaiian roll","slider bun","pizza dough","pie crust","phyllo","puff pastry",
    ],
  },
  {
    section: "Canned & Jarred",
    keywords: [
      "artichoke hearts","bean","black bean","cannellini","chickpea","chipotle","chili",
      "coconut milk","diced tomato","fire roasted","garbanzo","green chile","kidney bean",
      "lentil","navy bean","pinto bean","pumpkin puree","refried bean","rotel",
      "sun dried tomato","tomato paste","tomato sauce","whole tomato","bouillon",
      "broth","stock","clam juice","evaporated milk","sweetened condensed",
      "olive","pickle","pickled","capers","roasted pepper","salsa","tapenade",
      "water chestnut","bamboo shoot","hearts of palm",
    ],
  },
  {
    section: "Dry Goods & Pasta",
    keywords: [
      "barley","bread crumb","breadcrumb","brown rice","bulgur","couscous","egg noodle",
      "farro","flour","fusilli","lasagna noodle","lentil","linguine","macaroni","noodle",
      "oat","orzo","pappardelle","pasta","penne","polenta","quinoa","ramen","rice",
      "rigatoni","rotini","spaghetti","tagliatelle","tortellini","vermicelli","white rice",
      "wild rice","whole wheat","corn starch","cornstarch","arrowroot","panko","stuffing",
      "cracker","chip","pretzel chip","popcorn","granola","cereal","oatmeal","grits",
    ],
  },
  {
    section: "Spices & Seasonings",
    keywords: [
      "allspice","ancho","anise","bay leaf","bay leaves","black pepper","cajun","cardamom",
      "cayenne","chili flake","chili powder","chinese five","cinnamon","clove","coriander",
      "cumin","curry","fennel seed","fenugreek","garam masala","garlic powder","ginger powder",
      "herb","italian seasoning","lemon pepper","mace","mustard seed","nutmeg","old bay",
      "onion powder","oregano","paprika","pepper flake","pumpkin spice","red pepper",
      "saffron","salt","seasoning","smoked paprika","star anise","sumac","taco seasoning",
      "turmeric","vanilla","white pepper","za'atar","everything bagel","montreal",
    ],
  },
  {
    section: "Condiments & Sauces",
    keywords: [
      "aioli","balsamic","bbq","buffalo sauce","cocktail sauce","fish sauce","hoisin",
      "honey mustard","hot sauce","ketchup","maggi","marinara","mayo","mayonnaise",
      "mustard","oyster sauce","pasta sauce","pesto","pizza sauce","ponzu","ranch",
      "relish","salsa verde","sriracha","steak sauce","soy sauce","tahini","tamari",
      "teriyaki","vinaigrette","vinegar","worcestershire","yellow mustard","dijon",
      "honey","maple syrup","agave","molasses","jam","jelly","preserve","spread",
    ],
  },
  {
    section: "Oils & Baking",
    keywords: [
      "almond flour","avocado oil","baking powder","baking soda","brown sugar","canola",
      "chocolate chip","cocoa","coconut oil","coconut sugar","confectioner","cooking spray",
      "corn syrup","extracts","gelatin","lard","olive oil","peanut oil","powdered sugar",
      "sesame oil","shortening","sugar","sunflower oil","vanilla extract","vegetable oil",
      "walnut oil","white sugar","yeast","cream of tartar","tapioca","arrowroot",
    ],
  },
  {
    section: "Beverages & Wine",
    keywords: [
      "beer","bourbon","brandy","broth","cabernet","chardonnay","cider","club soda",
      "coffee","espresso","gin","juice","kombucha","lager","liqueur","merlot","mezcal",
      "pinot","prosecco","red wine","rum","sake","sauvignon blanc","seltzer","sparkling",
      "tequila","vodka","whiskey","white wine","wine","cold brew","tea","lemonade",
    ],
  },
  {
    section: "Frozen",
    keywords: [
      "edamame","frozen","ice cream","nugget","popsicle","sorbet","tater tot",
      "frozen pea","frozen corn","frozen spinach","frozen broccoli","frozen berry",
      "frozen mango","ice","gelato","sherbet","frozen meal","frozen pizza",
    ],
  },
  {
    section: "Household",
    keywords: [
      "aluminum foil","bag","battery","candle","cleaner","detergent","dish soap",
      "foil","garbage bag","hand soap","napkin","paper bag","paper plate","paper towel",
      "plastic bag","plastic wrap","parchment","sandwich bag","sponge","toilet paper",
      "toothpaste","trash bag","wax paper","ziplock","ziploc","tissue","lotion",
    ],
  },
];

export function detectSection(ingredientName) {
  const lower = ingredientName.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.section;
    }
  }
  return "Other";
}

// --------------------------------------------------------------------------
// QUANTITY PARSER
// --------------------------------------------------------------------------
const UNICODE_FRACTIONS = {
  "¼": "1/4", "½": "1/2", "¾": "3/4",
  "⅓": "1/3", "⅔": "2/3",
  "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
};

const WORD_NUMBERS = {
  one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
};

const UNITS = [
  "tablespoons?", "tbsps?", "tbs?",
  "teaspoons?", "tsps?",
  "cups?",
  "fluid ounces?", "fl\\.? oz\\.?",
  "ounces?", "oz\\.?",
  "pounds?", "lbs?\\.?",
  "grams?", "g\\.?",
  "kilograms?", "kg\\.?",
  "milliliters?", "ml\\.?",
  "liters?", "l\\.?",
  "quarts?", "qt\\.?",
  "pints?", "pt\\.?",
  "gallons?",
  "inches?", "in\\.?",
  "cloves?",
  "cans?", "jars?", "bags?", "boxes?", "packages?", "pkgs?\\.?",
  "slices?", "pieces?", "strips?", "fillets?", "stalks?", "heads?",
  "bunches?", "sprigs?", "leaves?", "sheets?",
  "pinch(?:es)?", "dash(?:es)?", "handful(?:s)?",
  "sticks?",
];
const UNIT_RE = new RegExp(`^(${UNITS.join("|")})\\b`, "i");

export function parseIngredientLine(raw) {
  let str = raw.trim();

  // Replace unicode fractions
  for (const [uc, rep] of Object.entries(UNICODE_FRACTIONS)) {
    str = str.replace(new RegExp(uc, "g"), ` ${rep}`);
  }

  // Strip HTML
  str = str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // Replace word numbers at start
  str = str.replace(/^(one|two|three|four|five|six|seven|eight|nine|ten)\b/i, (m) => WORD_NUMBERS[m.toLowerCase()] || m);

  // Match leading quantity: number or fraction, optionally followed by unit
  const qtyRe = /^(\d+(?:[\/\-]\d+)?(?:\.\d+)?(?:\s+\d+\/\d+)?)\s*/;
  const qtyMatch = str.match(qtyRe);

  let quantity = "";
  let rest = str;

  if (qtyMatch) {
    quantity = qtyMatch[1].trim();
    rest = str.slice(qtyMatch[0].length);

    // Now try to grab a unit
    const unitMatch = rest.match(UNIT_RE);
    if (unitMatch) {
      quantity = `${quantity} ${unitMatch[0].trim()}`;
      rest = rest.slice(unitMatch[0].length).trim();
    }
  }

  // Clean up the ingredient name
  let name = rest
    .replace(/^,\s*/, "")
    .replace(/\([^)]*\)/g, "")       // remove parentheticals
    .replace(/,.*$/, "")             // remove everything after comma
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);

  return { name, quantity };
}

// --------------------------------------------------------------------------
// VERCEL HANDLER
// --------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  let html = "";
  try {
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
    html = await pageRes.text();
  } catch (e) {
    return res.status(400).json({ error: `Could not fetch that URL: ${e.message}` });
  }

  // --- Try JSON-LD ---
  const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRe.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      const nodes = Array.isArray(json) ? json : [json, ...(json["@graph"] || [])];
      for (const node of nodes) {
        const t = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
        if (t.includes("Recipe")) {
          const name = node.name || "";
          const rawIngredients = node.recipeIngredient || [];
          const ingredients = rawIngredients.map((line) => {
            const { name: ingName, quantity } = parseIngredientLine(line);
            return {
              name: ingName,
              quantity,
              section: detectSection(ingName),
            };
          });
          return res.status(200).json({ name, ingredients });
        }
      }
    } catch (e) {
      continue;
    }
  }

  // --- Fallback: scrape ingredient list items ---
  const liRe = /<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  const ingredients = [];
  let liMatch;
  while ((liMatch = liRe.exec(html)) !== null) {
    const text = liMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) {
      const { name: ingName, quantity } = parseIngredientLine(text);
      ingredients.push({ name: ingName, quantity, section: detectSection(ingName) });
    }
  }

  if (ingredients.length > 0) {
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const name = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    return res.status(200).json({ name, ingredients });
  }

  return res.status(200).json({ name: "", ingredients: [] });
}
