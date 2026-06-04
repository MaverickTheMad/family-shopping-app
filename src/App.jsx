import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChefHat, ShoppingCart, Package, PlusCircle, Search, X, Check,
  Trash2, Edit3, ExternalLink, RefreshCw, Plus, Save, Link, Loader2,
  BookOpen, Clock, Users,
} from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { db: { schema: "shopping" } }
);

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTION_ORDER = [
  "Produce","Meat & Seafood","Dairy & Eggs","Bakery & Bread",
  "Canned & Jarred","Dry Goods & Pasta","Spices & Seasonings",
  "Condiments & Sauces","Oils & Baking","Beverages & Wine",
  "Frozen","Household","Other",
];

const RECIPE_CATEGORIES = [
  "Soup","Pasta","Sandwich","Steak","Chicken","Pork","Seafood","Salad","Breakfast","Other",
];

// ─── Auto-category detection ─────────────────────────────────────────────────

const DETECT_RULES = [
  // Spices FIRST — before produce, so "black pepper", "dried thyme" etc. don't get caught by produce keywords
  { s: "Spices & Seasonings", k: ["black pepper","white pepper","red pepper flake","cayenne pepper","garlic powder","onion powder","garlic salt","celery salt","kosher salt","sea salt","table salt","pink salt","smoked paprika","sweet paprika","paprika","cumin","oregano","cinnamon","cayenne","chili powder","chili flake","seasoning","bay leaf","bay leaves","italian seasoning","turmeric","nutmeg","allspice","cardamom","coriander","fennel seed","garam masala","old bay","taco seasoning","cajun","dried thyme","dried rosemary","dried sage","dried basil","dried oregano","dried dill","dried parsley","dried mint","dried cilantro","ground coriander","ground cumin","ground ginger","ground clove","ground nutmeg","ground cinnamon","cracked pepper","pepper flake","red flake","five spice","za'atar","sumac","turmeric","saffron","mustard powder","cream of tartar","poppy seed","sesame seed","caraway","anise","star anise","clove","peppercorn"] },
  { s: "Produce", k: ["fresh garlic","garlic clove","garlic bulb","yellow onion","red onion","white onion","green onion","vidalia","shallot","scallion","leek","chive","tomato","potato","sweet potato","yam","carrot","celery","spinach","broccoli","bell pepper","jalapeño","serrano","anaheim pepper","poblano","habanero","lemon","lime","orange","grapefruit","mushroom","fresh ginger","basil","thyme","rosemary","sage","parsley","cilantro","mint","dill","fresh herb","kale","cabbage","cucumber","zucchini","squash","avocado","corn","green bean","jarlic","minced garlic","artichoke","arugula","asparagus","beet","bok choy","fennel","radish","turnip","banana","apple","mango","berry","strawberry","blueberry","raspberry","cherry","grape","peach","pear","plum","watermelon","cantaloupe","pineapple","pomegranate"] },
  { s: "Meat & Seafood", k: ["chicken breast","chicken thigh","chicken drumstick","chicken wing","chicken tender","whole chicken","ground chicken","ground turkey","turkey breast","beef","steak","pork","lamb","veal","bison","venison","duck","salmon","shrimp","fish","tilapia","cod","tuna","halibut","bacon","sausage","kielbasa","ham","salami","pepperoni","ground beef","ground pork","ribeye","tenderloin","brisket","meatball","chorizo","prosciutto","deli meat","spicy sausage","ground sausage","chicken"] },
  { s: "Dairy & Eggs", k: ["unsalted butter","salted butter","butter","whole milk","skim milk","2% milk","oat milk","almond milk","milk","heavy cream","heavy whipping cream","whipping cream","light cream","half and half","sour cream","cream cheese","cream","egg","yogurt","parmesan","parmigiano","mozzarella","cheddar","ricotta","boursin","queso","oatmilk","keifer","kefir","cold foam","buttermilk","ghee","provolone","gouda","brie","feta","swiss","jack cheese","pepper jack","shredded cheese","cottage cheese","mascarpone"] },
  { s: "Bakery & Bread", k: ["bread","sandwich roll","dinner roll","hamburger bun","hot dog bun","tortilla","flatbread","pita","naan","bagel","croissant","hawaiian roll","slider bun","sourdough","baguette","english muffin","hoagie","ciabatta","focaccia","pretzel bun","brioche"] },
  { s: "Canned & Jarred", k: ["chicken broth","beef broth","vegetable broth","chicken stock","beef stock","vegetable stock","broth","stock","tomato paste","tomato sauce","crushed tomato","diced tomato","whole tomato","fire roasted tomato","fire roasted","coconut milk","bouillon cube","chicken bouillon","beef bouillon","canned chickpea","canned garbanzo","black bean","kidney bean","pinto bean","cannellini","white bean","olive","kalamata","green olive","pickle","dill pickle","bread and butter pickle","capers","roasted red pepper","salsa verde","tapenade","water chestnut","artichoke heart","sun dried tomato","chipotle","adobo"] },
  { s: "Dry Goods & Pasta", k: ["pasta","spaghetti","penne","rigatoni","fusilli","linguine","fettuccine","tortellini","gnocchi","lasagna noodle","egg noodle","ramen noodle","noodle","orzo","rice","brown rice","white rice","jasmine rice","basmati rice","arborio","couscous","quinoa","barley","farro","lentil","oat","rolled oat","flour","all purpose flour","bread flour","wheat flour","almond flour","breadcrumb","panko","cracker","graham cracker","corn starch","cornstarch","arrowroot","stuffing","polenta","grits","chicken rice mix","cereal","granola","chip","tortilla chip","potato chip"] },
  { s: "Condiments & Sauces", k: ["soy sauce","tamari","worcestershire","fish sauce","oyster sauce","hoisin","teriyaki","sriracha","hot sauce","buffalo sauce","honey","maple syrup","agave","molasses","mustard","dijon","yellow mustard","whole grain mustard","ketchup","mayo","mayonnaise","ranch","blue cheese dressing","italian dressing","balsamic vinegar","red wine vinegar","white wine vinegar","apple cider vinegar","rice vinegar","vinegar","vinaigrette","balsamic","pesto","marinara","pasta sauce","pizza sauce","tomato sauce","bbq sauce","steak sauce","ponzu","tahini","jam","jelly","preserves","chutney","relish"] },
  { s: "Oils & Baking", k: ["olive oil","extra virgin olive oil","avocado oil","vegetable oil","canola oil","coconut oil","sesame oil","peanut oil","sunflower oil","grapeseed oil","cooking spray","baking powder","baking soda","active dry yeast","instant yeast","vanilla extract","almond extract","brown sugar","white sugar","powdered sugar","granulated sugar","confectioner","chocolate chip","semi sweet chocolate","dark chocolate","cocoa powder","unsweetened cocoa","shortening","lard","nonstick spray"] },
  { s: "Beverages & Wine", k: ["white wine","red wine","cabernet sauvignon","sauvignon blanc","chardonnay","merlot","pinot noir","pinot grigio","prosecco","sparkling wine","dry white wine","dry red wine","beer","lager","ale","cider","sake","bourbon","whiskey","vodka","rum","tequila","gin","brandy","orange juice","apple juice","lemon juice","lime juice","juice","coffee","espresso","tea","kombucha","club soda","sparkling water","seltzer","lemonade"] },
  { s: "Frozen", k: ["frozen pea","frozen corn","frozen spinach","frozen broccoli","frozen berry","frozen mango","frozen edamame","frozen shrimp","tater tot","french fry","ice cream","gelato","sherbet","popsicle","frozen nugget","frozen waffle","frozen pizza"] },
  { s: "Household", k: ["toilet paper","paper plate","paper towel","paper napkin","trash bag","garbage bag","dish soap","laundry detergent","aluminum foil","plastic wrap","saran wrap","parchment paper","wax paper","ziplock bag","ziploc","sandwich bag","freezer bag","sponge","tissue","kleenex","candle","battery","hand lotion","hand soap","dish sponge"] },
];

function detectSection(name) {
  const lower = (name || "").toLowerCase();
  for (const rule of DETECT_RULES) {
    for (const kw of rule.k) {
      if (lower.includes(kw)) return rule.s;
    }
  }
  return "Other";
}

function getSection(name, sections) {
  return sections[name] || detectSection(name);
}

function sectionOrder(s) {
  const i = SECTION_ORDER.indexOf(s);
  return i === -1 ? 999 : i;
}

function normIng(i) {
  if (typeof i === "string") return { name: i, quantity: "" };
  return { name: i.name || "", quantity: i.quantity || "" };
}

// ─── Quantity math ────────────────────────────────────────────────────────────

// Unit normalization — map aliases to canonical form
const UNIT_ALIASES = {
  "tablespoon": "tbsp", "tablespoons": "tbsp", "tbsps": "tbsp", "tbs": "tbsp",
  "teaspoon": "tsp", "teaspoons": "tsp", "tsps": "tsp",
  "cup": "cup", "cups": "cup",
  "ounce": "oz", "ounces": "oz",
  "pound": "lb", "pounds": "lb", "lbs": "lb",
  "gram": "g", "grams": "g",
  "kilogram": "kg", "kilograms": "kg",
  "milliliter": "ml", "milliliters": "ml",
  "liter": "l", "liters": "l",
  "quart": "qt", "quarts": "qt",
  "pint": "pt", "pints": "pt",
  "clove": "clove", "cloves": "clove",
  "can": "can", "cans": "can",
  "sprig": "sprig", "sprigs": "sprig",
};

function parseQtyNum(str) {
  if (!str) return null;
  const UNICODE_FRACS = { "\u00bc":"1/4","\u00bd":"1/2","\u00be":"3/4","\u2153":"1/3","\u2154":"2/3","\u215b":"1/8","\u215c":"3/8","\u215d":"5/8","\u215e":"7/8" };
  let s = str.trim();
  for (const [uc, rep] of Object.entries(UNICODE_FRACS)) s = s.split(uc).join(" " + rep);
  s = s.replace(/\s+/g, " ").trim();
  const m = s.match(/^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*(.*)/);
  if (!m) return null;
  let num = 0;
  const parts = m[1].trim().split(/\s+/);
  for (const p of parts) {
    if (p.includes("/")) { const [n, d] = p.split("/"); num += parseInt(n) / parseInt(d); }
    else num += parseFloat(p) || 0;
  }
  const rawUnit = m[2].trim().toLowerCase().replace(/\.$/, "");
  const unit = UNIT_ALIASES[rawUnit] || rawUnit;
  return { num, unit };
}

// Sum an array of quantity strings — adds same-unit quantities, joins different units
function sumQuantities(qtys) {
  if (!qtys || qtys.length === 0) return "";
  if (qtys.length === 1) return qtys[0];

  // Group by unit
  const byUnit = {};
  const unparsed = [];
  for (const q of qtys) {
    const parsed = parseQtyNum(q);
    if (!parsed) { unparsed.push(q); continue; }
    const key = parsed.unit;
    if (!byUnit[key]) byUnit[key] = 0;
    byUnit[key] += parsed.num;
  }

  const parts = Object.entries(byUnit).map(([unit, total]) => {
    const n = formatNumber(total);
    return unit ? `${n} ${unit}` : n;
  });

  return [...parts, ...unparsed].join(" + ");
}

// Normalize ingredient name for matching — lowercase, strip common adjectives
function normalizeIngName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/\b(fresh|dried|ground|whole|unsalted|salted|boneless|skinless|large|medium|small|organic|low.sodium|low.fat|heavy|light|extra|fine|coarse|cracked|minced|crushed|chopped|sliced|diced|shredded|grated|packed|heaping|about|approximately)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Are two ingredient names similar enough to merge?
// e.g. "Black pepper" and "Cracked black pepper" → true
// "Chicken broth" and "Chicken stock" → false (different ingredients)
function ingredientsSimilar(a, b) {
  const na = normalizeIngName(a);
  const nb = normalizeIngName(b);
  if (na === nb) return true;
  // One contains the other (e.g. "butter" vs "unsalted butter")
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
}


function scaleQuantity(qty, mult) {
  if (!qty || mult === 1) return qty;
  // Extract leading number (integer, decimal, or fraction)
  const match = qty.match(/^(\d+(?:\.\d+)?(?:\/\d+)?(?:\s+\d+\/\d+)?)\s*(.*)/);
  if (!match) return qty;
  const numStr = match[1].trim();
  const unit = match[2].trim();

  // Parse the number (handle fractions like "1/2" or mixed "1 1/2")
  let num = 0;
  const parts = numStr.split(/\s+/);
  for (const part of parts) {
    if (part.includes("/")) {
      const [n, d] = part.split("/");
      num += parseInt(n) / parseInt(d);
    } else {
      num += parseFloat(part) || 0;
    }
  }
  const scaled = num * mult;

  // Format nicely: use fractions for common values, otherwise decimal
  const formatted = formatNumber(scaled);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatNumber(n) {
  if (Number.isInteger(n)) return String(n);
  // Common fractions
  const fracs = [[1/4,"1/4"],[1/3,"1/3"],[1/2,"1/2"],[2/3,"2/3"],[3/4,"3/4"]];
  const whole = Math.floor(n);
  const frac = n - whole;
  for (const [val, str] of fracs) {
    if (Math.abs(frac - val) < 0.05) {
      return whole > 0 ? `${whole} ${str}` : str;
    }
  }
  // Fall back to 1 decimal place
  return parseFloat(n.toFixed(1)).toString();
}

// Subtract haveQty from neededQty — returns remainder or null if fully covered
// e.g. subtractQuantity("4 cups", "2 cups") => "2 cups"
function subtractQuantity(needed, have) {
  if (!needed || !have) return needed;

  function parseQty(str) {
    if (!str) return null;
    const fracs = { "1/4": 0.25, "1/3": 0.333, "1/2": 0.5, "2/3": 0.667, "3/4": 0.75 };
    str = str.trim();
    // Replace unicode fractions
    const unicodeFracs = { "\u00bc": "1/4", "\u00bd": "1/2", "\u00be": "3/4", "\u2153": "1/3", "\u2154": "2/3" };
    for (const [uc, rep] of Object.entries(unicodeFracs)) str = str.split(uc).join(rep);
    const m = str.match(/^(\d+(?:\.\d+)?(?:\/\d+)?(?:\s+\d+\/\d+)?)\s*(.*)/);
    if (!m) return null;
    let num = 0;
    const parts = m[1].trim().split(/\s+/);
    for (const part of parts) {
      if (part.includes("/")) { const [n, d] = part.split("/"); num += parseInt(n) / parseInt(d); }
      else if (fracs[part]) num += fracs[part];
      else num += parseFloat(part) || 0;
    }
    return { num, unit: m[2].trim().toLowerCase() };
  }

  const n = parseQty(needed);
  const h = parseQty(have);
  if (!n || !h) return needed;
  // Only subtract if units match (or both have no unit)
  if (n.unit !== h.unit) return needed;
  const remainder = n.num - h.num;
  if (remainder <= 0) return null; // fully covered
  return formatNumber(remainder) + (n.unit ? " " + n.unit : "");
}

function timeAgo(isoString) {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "made today";
  if (days === 1) return "made yesterday";
  if (days < 7) return `made ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "made 1 week ago";
  if (weeks < 5) return `made ${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "made 1 month ago";
  return `made ${months} months ago`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_RECIPES = [
  { name: "Balsamic Pork Medallions", url: "https://www.nourish-and-fete.com/wprm_print/balsamic-pork-tenderloin-medallions", category: "Pork", ingredients: [{name:"Pork Tenderloin",quantity:"1 lb"},{name:"Thyme",quantity:""},{name:"Rosemary",quantity:""},{name:"Sweet Paprika",quantity:"1 tsp"},{name:"Garlic Powder",quantity:"1 tsp"},{name:"Butter",quantity:"2 tbsp"},{name:"Chicken Broth",quantity:"1 cup"},{name:"Balsamic Vinaigrette",quantity:"3 tbsp"}] },
  { name: "Beef Stew", url: "https://thecozycook.com/slow-cooker-beef-stew/", category: "Other", ingredients: [{name:"Beef Broth",quantity:"4 cups"},{name:"Beef Roast",quantity:"2 lbs"},{name:"Potatoes",quantity:""},{name:"Carrots",quantity:""},{name:"Celery",quantity:""},{name:"Onion",quantity:"1"},{name:"Cabernet Sauvignon",quantity:"1 cup"},{name:"Beef Bouillon Cubes",quantity:"2"},{name:"Worcestershire Sauce",quantity:"2 tbsp"},{name:"Tomato Paste",quantity:"2 tbsp"},{name:"Bay leaves",quantity:"2"},{name:"Corn Starch",quantity:"2 tbsp"}] },
  { name: "Birria", url: "", category: "Other", ingredients: [] },
  { name: "Calzones", url: "", category: "Other", ingredients: [] },
  { name: "Chicken Alfredo", url: "", category: "Chicken", ingredients: [] },
  { name: "Chicken Parm", url: "", category: "Chicken", ingredients: [{name:"Chicken",quantity:"2 lbs"},{name:"Pasta Sauce",quantity:"1 jar"},{name:"Parmesan",quantity:"1 cup"},{name:"Mozzarella",quantity:"2 cups"}] },
  { name: "Dutch Oven Chicken", url: "https://biteswithbri.com/wprm_print/dutch-oven-chicken-breast", category: "Chicken", ingredients: [{name:"Butter",quantity:"3 tbsp"},{name:"Garlic",quantity:"4 cloves"},{name:"Thyme",quantity:""},{name:"Sage",quantity:""},{name:"Rosemary",quantity:""},{name:"Lemon",quantity:"1"},{name:"Chicken",quantity:"2 lbs"},{name:"Onion",quantity:"1"},{name:"White Wine",quantity:"1/2 cup"},{name:"Flour",quantity:"2 tbsp"},{name:"Chicken Broth",quantity:"1 cup"}] },
  { name: "Flatbread Pizza", url: "", category: "Other", ingredients: [{name:"Flatbread",quantity:""},{name:"Marinara",quantity:"1 cup"},{name:"Shredded Cheese",quantity:"2 cups"},{name:"Mozzarella",quantity:""},{name:"Pepperoni",quantity:""}] },
  { name: "Garlic Chicken", url: "https://simplehomeedit.com/recipe/creamy-garlic-chicken/", category: "Chicken", ingredients: [{name:"Chicken",quantity:"2 lbs"},{name:"Paprika",quantity:"1 tsp"},{name:"Onion Powder",quantity:"1 tsp"},{name:"Thyme",quantity:""},{name:"Flour",quantity:"2 tbsp"},{name:"Butter",quantity:"2 tbsp"},{name:"Minced Garlic",quantity:"4 cloves"},{name:"Chicken Stock",quantity:"1 cup"},{name:"Heavy Cream",quantity:"1/2 cup"},{name:"Dijon Mustard",quantity:"1 tbsp"},{name:"Parmesan",quantity:"1/2 cup"},{name:"Potatoes",quantity:""}] },
  { name: "Ham & Cheese Sliders", url: "https://www.allrecipes.com/recipe/216756/baked-ham-and-cheese-party-sandwiches/", category: "Sandwich", ingredients: [{name:"Butter",quantity:"1/2 cup"},{name:"Dijon Mustard",quantity:"2 tbsp"},{name:"Worcestershire Sauce",quantity:"1 tbsp"},{name:"Poppy Seeds",quantity:"1 tbsp"},{name:"Sandwhich Pickles",quantity:""},{name:"Hawaiian Rolls",quantity:"1 pack"},{name:"Deli Ham",quantity:"1 lb"},{name:"Cheddar Cheese",quantity:"1 lb"}] },
  { name: "Kielbasa & Rice", url: "", category: "Other", ingredients: [{name:"Kielbasa",quantity:"1 lb"},{name:"Chicken Rice",quantity:"2 cups"},{name:"Chicken Broth",quantity:"2 cups"},{name:"Fire Roasted Tomatoes",quantity:"1 can"},{name:"Boursin Cheese",quantity:"1 pkg"}] },
  { name: "Lasagna Soup", url: "", category: "Soup", ingredients: [{name:"Onion",quantity:"1"},{name:"Ricotta",quantity:"1 cup"},{name:"Parmesan",quantity:"1/2 cup"},{name:"Mozzarella",quantity:"1 cup"},{name:"Thyme",quantity:""},{name:"Sage",quantity:""},{name:"Rosemary",quantity:""},{name:"Ground Sausage",quantity:"1 lb"},{name:"Jarlic",quantity:"2 tbsp"},{name:"Tomato Paste",quantity:"2 tbsp"},{name:"Calabrian Chili Peppers",quantity:""},{name:"Chicken Bouillon",quantity:"2"},{name:"Tomato Sauce",quantity:"1 can"},{name:"Heavy Cream",quantity:"1/2 cup"},{name:"Noodles",quantity:"8 oz"}] },
  { name: "Pasta & Meatballs", url: "", category: "Pasta", ingredients: [{name:"Pasta",quantity:"1 lb"},{name:"Meatballs",quantity:""},{name:"Ground Sausage",quantity:"1 lb"}] },
  { name: "Pepper Jack Soup", url: "", category: "Soup", ingredients: [{name:"Onion",quantity:"1"},{name:"Peppers",quantity:""},{name:"Pepper Jack Cheese",quantity:"2 cups"},{name:"Butter",quantity:"2 tbsp"},{name:"Jarlic",quantity:"2 tbsp"},{name:"Small Potatoes",quantity:""},{name:"Flour",quantity:"2 tbsp"},{name:"White Wine",quantity:"1/2 cup"},{name:"Chicken Broth",quantity:"4 cups"},{name:"Ground Sausage",quantity:"1 lb"},{name:"Heavy Cream",quantity:"1 cup"},{name:"White Pepper",quantity:"1 tsp"},{name:"Cornstarch",quantity:"2 tbsp"}] },
  { name: "Quesadillas", url: "", category: "Chicken", ingredients: [{name:"Tortilla Shells",quantity:""},{name:"Shredded Cheddar",quantity:"2 cups"},{name:"Butter",quantity:"2 tbsp"},{name:"Chicken",quantity:"1 lb"}] },
  { name: "Steak & Potatoes", url: "", category: "Steak", ingredients: [] },
  { name: "Steak Bowls", url: "", category: "Steak", ingredients: [{name:"Ribeye Steak",quantity:"1 lb"},{name:"Rice",quantity:"2 cups"},{name:"Queso Fresco",quantity:""},{name:"Balsamic Vinaigrette",quantity:""},{name:"Lime Chips",quantity:""}] },
  { name: "Stir Fry - Chicken", url: "https://natashaskitchen.com/chicken-stir-fry-recipe/", category: "Chicken", ingredients: [{name:"Chicken",quantity:"1.5 lbs"},{name:"Green Beans",quantity:""},{name:"Broccoli",quantity:""},{name:"Carrots",quantity:""},{name:"Peppers",quantity:""},{name:"Onion",quantity:"1"},{name:"Garlic Cloves",quantity:"3 cloves"},{name:"Chicken Broth",quantity:"1/4 cup"},{name:"Soy Sauce",quantity:"3 tbsp"},{name:"Honey",quantity:"2 tbsp"},{name:"Corn Starch",quantity:"1 tbsp"}] },
  { name: "Stir Fry - Steak", url: "https://natashaskitchen.com/chicken-stir-fry-recipe/", category: "Steak", ingredients: [{name:"Steak",quantity:"1.5 lbs"},{name:"Green Beans",quantity:""},{name:"Broccoli",quantity:""},{name:"Carrots",quantity:""},{name:"Peppers",quantity:""},{name:"Onion",quantity:"1"},{name:"Garlic Cloves",quantity:"3 cloves"},{name:"Beef Broth",quantity:"1/4 cup"},{name:"Soy Sauce",quantity:"3 tbsp"},{name:"Honey",quantity:"2 tbsp"},{name:"Corn Starch",quantity:"1 tbsp"}] },
  { name: "Tortellini Soup", url: "https://www.smalltownwoman.com/wprm_print/sausage-tortellini-soup-recipe", category: "Soup", ingredients: [{name:"Ground Sausage",quantity:"1 lb"},{name:"Onion",quantity:"1"},{name:"Minced Garlic",quantity:"3 cloves"},{name:"Basil",quantity:""},{name:"Oregano",quantity:""},{name:"Parsley",quantity:""},{name:"Thyme",quantity:""},{name:"Red Pepper Flakes",quantity:"1 tsp"},{name:"Beef Broth",quantity:"4 cups"},{name:"Tomato Paste",quantity:"2 tbsp"},{name:"Fire Roasted Tomatoes",quantity:"1 can"},{name:"Chicken Broth",quantity:"2 cups"},{name:"Cheese Tortellini",quantity:"9 oz"},{name:"Spinach",quantity:"2 cups"}] },
  { name: "Italian Wedding Soup", url: "", category: "Soup", ingredients: [{name:"Ground Beef",quantity:"1 lb"},{name:"Spicy Sausage",quantity:"1/2 lb"},{name:"Breadcrumbs",quantity:"1/2 cup"},{name:"Egg",quantity:"1"},{name:"Parmesan",quantity:"1/2 cup"},{name:"Parsley",quantity:""},{name:"Garlic Powder",quantity:"1 tsp"},{name:"Onion Powder",quantity:"1 tsp"},{name:"Salt",quantity:"1 tsp"},{name:"Black Pepper",quantity:"1 tsp"},{name:"Paprika",quantity:"1 tsp"},{name:"Italian Seasoning",quantity:"1 tsp"},{name:"Calabrian Peppers",quantity:""},{name:"Avocado Oil",quantity:"2 tbsp"},{name:"Onion",quantity:"1"},{name:"Celery",quantity:""},{name:"Carrots",quantity:""},{name:"Garlic Cloves",quantity:"3 cloves"},{name:"White Wine",quantity:"1/2 cup"},{name:"Chicken Broth",quantity:"6 cups"},{name:"Orzo",quantity:"1 cup"},{name:"Spinach",quantity:"2 cups"}] },
];

const SEED_EXTRAS = [
  "Little Potatoes","Cereal","Breakfast Crackers","Bagels","Chicken Nugs","Oatmilk",
  "Cold Foam","Bread","Ham","Salami","Keifer","Chocolate Chips","Toilet Paper","Paper Plates (Small)",
];

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function seedIfEmpty() {
  const { count } = await supabase.from("recipes").select("*", { count: "exact", head: true });
  if (count !== 0) return;
  await supabase.from("recipes").insert(SEED_RECIPES.map((r) => ({ name: r.name, url: r.url || null, category: r.category, ingredients: r.ingredients })));
  await supabase.from("extras").insert(SEED_EXTRAS.map((name, i) => ({ name, active: false, sort_order: i })));
  const secMap = {};
  SEED_RECIPES.forEach((r) => r.ingredients.forEach((ing) => { if (ing.name && !secMap[ing.name]) secMap[ing.name] = detectSection(ing.name); }));
  SEED_EXTRAS.forEach((name) => { if (!secMap[name]) secMap[name] = detectSection(name); });
  await supabase.from("sections").insert(Object.entries(secMap).map(([ingredient, section]) => ({ ingredient, section, sort_order: sectionOrder(section) })));
}

async function fetchAll() {
  const [rr, er, sr, stateR, histR] = await Promise.all([
    supabase.from("recipes").select("*").order("name"),
    supabase.from("extras").select("*").order("sort_order"),
    supabase.from("sections").select("*"),
    supabase.from("shopping_state").select("*").eq("id", "current").single(),
    supabase.from("meal_history").select("recipe_id, cooked_at").order("cooked_at", { ascending: false }),
  ]);
  const sections = {};
  (sr.data || []).forEach((r) => { sections[r.ingredient] = r.section; });
  const st = stateR.data || {};
  // Build map: recipe_id -> most recent cooked_at
  const lastCooked = {};
  (histR.data || []).forEach((h) => {
    if (!lastCooked[h.recipe_id]) lastCooked[h.recipe_id] = h.cooked_at;
  });
  return {
    recipes: rr.data || [],
    extras: er.data || [],
    sections,
    selectedMeals: st.selected_meals || [],
    pantryItems: st.pantry_items || [],
    checkedItems: st.checked_items || [],
    mealPlan: st.meal_plan || {},
    lastCooked,
  };
}

async function saveState(sel, pantry, checked, mealPlan) {
  await supabase.from("shopping_state").upsert({ id: "current", selected_meals: sel, pantry_items: pantry, checked_items: checked, meal_plan: mealPlan || {} });
}

async function upsertSection(ingredient, section) {
  await supabase.from("sections").upsert({ ingredient, section, sort_order: sectionOrder(section) });
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [recipes, setRecipes] = useState(null);
  const [extras, setExtras] = useState([]);
  const [sections, setSections] = useState({});
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [mealMultipliers, setMealMultipliers] = useState({});
  const [pantryItems, setPantryItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [lastCooked, setLastCooked] = useState({});
  const [mealPlan, setMealPlan] = useState({}); // { "0": recipeId, "1": recipeId, ... } keyed by day index 0=Sun
  const [tab, setTab] = useState("meals");
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [toast, setToast] = useState("");
  const [shoppingModal, setShoppingModal] = useState(false);
  const [shoppingDate, setShoppingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const stateTimer = useRef(null);
  const lastSavedState = useRef(null);
  const isSaving = useRef(false);

  useEffect(() => {
    seedIfEmpty().then(fetchAll).then((d) => {
      setRecipes(d.recipes);
      setExtras(d.extras);
      setSections(d.sections);
      setSelectedMeals(d.selectedMeals);
      setPantryItems(d.pantryItems);
      setCheckedItems(d.checkedItems);
      setLastCooked(d.lastCooked);
      setMealPlan(d.mealPlan);
    });

    // Refetch shopping state when app comes back into focus
    // This handles switching devices without realtime overwriting local changes
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !isSaving.current) {
        supabase.from("shopping_state").select("*").eq("id", "current").single().then(({ data }) => {
          if (!data) return;
          setSelectedMeals(data.selected_meals || []);
          setPantryItems(data.pantry_items || []);
          setCheckedItems(data.checked_items || []);
          setMealPlan(data.meal_plan || {});
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ── Real-time subscriptions (recipes, extras, sections only — NOT shopping_state) ──
    const recipesSub = supabase
      .channel("recipes_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "recipes" }, (payload) => {
        setRecipes((prev) => [...prev, payload.new].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "recipes" }, (payload) => {
        setRecipes((prev) => prev.map((r) => r.id === payload.new.id ? payload.new : r));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "recipes" }, (payload) => {
        setRecipes((prev) => prev.filter((r) => r.id !== payload.old.id));
      })
      .subscribe();

    const extrasSub = supabase
      .channel("extras_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "extras" }, (payload) => {
        setExtras((prev) => [...prev, payload.new]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "extras" }, (payload) => {
        setExtras((prev) => prev.map((e) => e.id === payload.new.id ? payload.new : e));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "extras" }, (payload) => {
        setExtras((prev) => prev.filter((e) => e.id !== payload.old.id));
      })
      .subscribe();

    const sectionsSub = supabase
      .channel("sections_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sections" }, (payload) => {
        if (payload.new && payload.new.ingredient) {
          setSections((prev) => ({ ...prev, [payload.new.ingredient]: payload.new.section }));
        }
      })
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(recipesSub);
      supabase.removeChannel(extrasSub);
      supabase.removeChannel(sectionsSub);
    };
  }, []);

  useEffect(() => {
    if (recipes === null) return;
    if (stateTimer.current) clearTimeout(stateTimer.current);
    stateTimer.current = setTimeout(() => {
      isSaving.current = true;
      saveState(selectedMeals, pantryItems, checkedItems, mealPlan).finally(() => {
        setTimeout(() => { isSaving.current = false; }, 2000);
      });
    }, 600);
  }, [selectedMeals, pantryItems, checkedItems, mealPlan]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2000); }

  if (recipes === null) return <LoadingScreen />;

  // Aggregate: name -> { count, quantities[], canonicalName }
  // Merges similar ingredient names (e.g. "Black pepper" + "Cracked black pepper")
  const agg = {};
  const aggNameMap = {}; // normalized name -> canonical key in agg

  selectedMeals.forEach((id) => {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    const mult = mealMultipliers[id] || 1;
    (recipe.ingredients || []).forEach((raw) => {
      const { name, quantity } = normIng(raw);
      if (!name) return;

      // Find if a similar ingredient already exists in agg
      const normName = normalizeIngName(name);
      let key = aggNameMap[normName];

      if (!key) {
        // Check existing keys for similarity
        const similarKey = Object.keys(agg).find((k) => ingredientsSimilar(k, name));
        if (similarKey) {
          key = similarKey;
          aggNameMap[normName] = key;
        } else {
          key = name;
          aggNameMap[normName] = key;
        }
      }

      if (!agg[key]) agg[key] = { count: 0, quantities: [] };
      agg[key].count += mult;
      if (quantity) {
        const scaled = scaleQuantity(quantity, mult);
        agg[key].quantities.push(scaled);
      }
    });
  });

  // Normalize pantryItems — supports both legacy string[] and new {name, haveQty}[]
  const pantryMap = {}; // name -> haveQty (or "" if fully have it)
  pantryItems.forEach((p) => {
    if (typeof p === "string") pantryMap[p] = "";
    else pantryMap[p.name] = p.haveQty || "";
  });

  const allIngredients = Object.keys(agg).sort();

  const shoppingGroups = (() => {
    const map = {};
    Object.entries(agg).forEach(([name, info]) => {
      if (name in pantryMap) {
        const haveQty = pantryMap[name];
        // If no partial quantity specified, skip entirely
        if (!haveQty) return;
        // If partial quantity: subtract what they have and show remainder
        const neededQtys = info.quantities.map((q) => subtractQuantity(q, haveQty)).filter(Boolean);
        if (neededQtys.length === 0) return; // fully covered
        const sec = getSection(name, sections);
        if (!map[sec]) map[sec] = [];
        map[sec].push({ name, count: info.count, quantities: neededQtys, partial: true });
        return;
      }
      const sec = getSection(name, sections);
      if (!map[sec]) map[sec] = [];
      map[sec].push({ name, count: info.count, quantities: info.quantities });
    });
    extras.filter((e) => e.active || e.is_staple).forEach((e) => {
      const sec = getSection(e.name, sections);
      if (!map[sec]) map[sec] = [];
      const ex = map[sec].find((x) => x.name === e.name);
      if (ex) ex.count += 1;
      else map[sec].push({ name: e.name, count: 1, quantities: e.quantity ? [e.quantity] : [] });
    });
    return Object.keys(map)
      .sort((a, b) => sectionOrder(a) - sectionOrder(b))
      .map((sec) => ({ section: sec, items: map[sec].sort((a, b) => a.name.localeCompare(b.name)) }));
  })();

  const pantrySkipCount = Object.keys(pantryMap).filter((p) => agg[p]).length;
  const totalItems = shoppingGroups.reduce((s, g) => s + g.items.length, 0);

  function toggleMeal(id) {
    setSelectedMeals((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    setMealMultipliers((p) => {
      if (p[id]) { const next = { ...p }; delete next[id]; return next; }
      return p;
    });
  }

  function setMultiplier(id, val) {
    const n = Math.max(1, Math.min(10, Number(val) || 1));
    setMealMultipliers((p) => ({ ...p, [id]: n }));
  }

  function togglePantry(name, haveQty) {
    setPantryItems((prev) => {
      const exists = prev.find((p) => (typeof p === "string" ? p : p.name) === name);
      if (exists) return prev.filter((p) => (typeof p === "string" ? p : p.name) !== name);
      return [...prev, { name, haveQty: haveQty || "" }];
    });
  }

  function setPantryQty(name, haveQty) {
    setPantryItems((prev) =>
      prev.map((p) => {
        const n = typeof p === "string" ? p : p.name;
        if (n !== name) return p;
        return { name, haveQty };
      })
    );
  }

  async function toggleExtra(id) {
    const e = extras.find((x) => x.id === id);
    if (!e) return;
    await supabase.from("extras").update({ active: !e.active }).eq("id", id);
    setExtras((p) => p.map((x) => x.id === id ? { ...x, active: !x.active } : x));
  }

  async function addExtra(name, quantity = "", isStaple = false) {
    if (!name.trim()) return;
    // Staples are always active (they always appear on the list)
    const { data } = await supabase.from("extras").insert({ name: name.trim(), quantity: quantity.trim(), active: true, is_staple: isStaple, sort_order: extras.length }).select().single();
    if (data) setExtras((p) => [...p, data]);
  }

  async function deleteExtra(id) {
    await supabase.from("extras").delete().eq("id", id);
    setExtras((p) => p.filter((x) => x.id !== id));
  }

  async function updateExtraQty(id, quantity) {
    await supabase.from("extras").update({ quantity }).eq("id", id);
    setExtras((p) => p.map((x) => x.id === id ? { ...x, quantity } : x));
  }

  function toggleChecked(name) {
    setCheckedItems((p) => p.includes(name) ? p.filter((x) => x !== name) : [...p, name]);
  }

  async function handleSetSection(ing, section) {
    setSections((p) => ({ ...p, [ing]: section }));
    await upsertSection(ing, section);
  }

  async function saveRecipe(recipe) {
    const payload = { name: recipe.name, url: recipe.url || null, category: recipe.category, notes: recipe.notes || "", cook_time: recipe.cook_time || "", servings: recipe.servings || "", pdf_url: recipe.pdf_url || "", ingredients: recipe.ingredients };
    const newSections = { ...sections };
    const toUpsert = [];
    recipe.ingredients.forEach((raw) => {
      const { name } = normIng(raw);
      if (name && !newSections[name]) {
        newSections[name] = detectSection(name);
        toUpsert.push({ ingredient: name, section: newSections[name], sort_order: sectionOrder(newSections[name]) });
      }
    });
    if (toUpsert.length) { setSections(newSections); await supabase.from("sections").upsert(toUpsert); }

    if (recipe.id && !String(recipe.id).startsWith("new")) {
      const { data } = await supabase.from("recipes").update(payload).eq("id", recipe.id).select().single();
      if (data) setRecipes((p) => p.map((r) => r.id === recipe.id ? data : r));
      showToast("Recipe saved");
    } else {
      const { data } = await supabase.from("recipes").insert(payload).select().single();
      if (data) setRecipes((p) => [...p, data].sort((a, b) => a.name.localeCompare(b.name)));
      showToast("Recipe added");
    }
    setEditingRecipe(null);
  }

  async function deleteRecipe(id) {
    if (!confirm("Delete this recipe?")) return;
    await supabase.from("recipes").delete().eq("id", id);
    setRecipes((p) => p.filter((r) => r.id !== id));
    setSelectedMeals((p) => p.filter((x) => x !== id));
    setEditingRecipe(null);
    showToast("Recipe deleted");
  }

  async function toggleFavorite(id) {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    const next = !recipe.is_favorite;
    await supabase.from("recipes").update({ is_favorite: next }).eq("id", id);
    setRecipes((p) => p.map((r) => r.id === id ? { ...r, is_favorite: next } : r));
  }

  function assignDay(dayIndex, recipeId) {
    setMealPlan((p) => {
      const next = { ...p };
      // If this recipe is already assigned to another day, clear that day
      Object.keys(next).forEach((k) => { if (next[k] === recipeId) delete next[k]; });
      if (recipeId) next[String(dayIndex)] = recipeId;
      else delete next[String(dayIndex)];
      return next;
    });
    // Also add to selected meals if not already there
    if (recipeId && !selectedMeals.includes(recipeId)) {
      setSelectedMeals((p) => [...p, recipeId]);
    }
  }

  async function handleWentShopping() {
    const shopDate = new Date(shoppingDate + "T12:00:00");
    const nextShopDate = new Date(shopDate);
    nextShopDate.setDate(shopDate.getDate() + 14);

    // Log selected meals as cooked on the shopping date
    if (selectedMeals.length > 0) {
      const iso = shopDate.toISOString();
      await supabase.from("meal_history").insert(
        selectedMeals.map((id) => ({ recipe_id: id, cooked_at: iso }))
      );
      const updated = { ...lastCooked };
      selectedMeals.forEach((id) => { updated[id] = iso; });
      setLastCooked(updated);
    }

    // Shift meal plan forward 14 days so next shop cycle starts fresh
    // Meals planned >= 14 days out carry forward; earlier ones are cleared
    const startOfCurrentWeek = new Date();
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay());

    const daysUntilNext = Math.round((nextShopDate - startOfCurrentWeek) / (1000 * 60 * 60 * 24));
    const newPlan = {};
    Object.entries(mealPlan).forEach(([k, v]) => {
      const offset = parseInt(k);
      if (offset >= daysUntilNext) {
        newPlan[String(offset - daysUntilNext)] = v;
      }
    });
    setMealPlan(newPlan);

    // Clear pantry checks, shopping check-offs, one-time extras
    // Keep: selected meals, multipliers, meal plan (shifted above)
    setPantryItems([]);
    setCheckedItems([]);
    await supabase.from("extras").update({ active: false }).eq("is_staple", false);
    setExtras((p) => p.map((e) => e.is_staple ? e : { ...e, active: false }));

    setShoppingModal(false);
    showToast(`Shopped on ${shopDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — next trip around ${nextShopDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
    setTab("meals");
  }

  return (
    <div className="font-body grove-app">
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  /* ══ GROVE TOKENS — Meal Hub (Clay) ══════════════════════════════════════ */
  :root {
    --bg:#10140E; --bg-paper:#171C13; --bg-elevated:#1E241A; --bg-sunken:#0B0F09;
    --border:#2A3122; --text:#ECEFE6; --text-soft:#9BA690;
    --accent:#4FA06F; --secondary:#9B82BE;
    --app-accent:#CB7A4F;
    --ok:#5FB47E; --warn:#D8A24F; --danger:#D2685F; --info:#6F86C2;
    --accent-weak:color-mix(in srgb,var(--accent) 14%,var(--bg-paper));
    --accent-soft:color-mix(in srgb,var(--accent) 28%,var(--bg-paper));
    --app-weak:color-mix(in srgb,var(--app-accent) 16%,var(--bg-paper));
    --app-soft:color-mix(in srgb,var(--app-accent) 30%,var(--bg-paper));
    --font-display:'Fraunces',Georgia,serif;
    --font-body:'Plus Jakarta Sans',system-ui,sans-serif;
    --font-mono:'JetBrains Mono',ui-monospace,monospace;
    --fs-xs:.64rem; --fs-sm:.8rem; --fs-base:1rem; --fs-lg:1.25rem;
    --fs-xl:1.563rem; --fs-2xl:1.953rem; --fs-3xl:2.441rem;
    --fw-title:600; --fw-body:400; --fw-med:500;
    --r-sm:6px; --r-md:12px; --r-lg:16px; --r-xl:24px; --r-full:999px;
    --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px; --sp-6:32px; --sp-8:48px;
  }
  @media (prefers-color-scheme:light){:root:not(.theme-dark){
    --bg:#F3F5EE; --bg-paper:#FAFBF5; --bg-elevated:#FFFFFF; --bg-sunken:#E8ECE0;
    --border:#D8DECF; --text:#1A1F15; --text-soft:#5C6651;
    --accent:#2F6B47; --secondary:#6E5891; --app-accent:#A85F36;
    --ok:#2E7D4F; --warn:#B07F2E; --danger:#B03A30; --info:#4E66A6;
    --accent-weak:color-mix(in srgb,var(--accent) 14%,var(--bg-paper));
    --accent-soft:color-mix(in srgb,var(--accent) 28%,var(--bg-paper));
    --app-weak:color-mix(in srgb,var(--app-accent) 16%,var(--bg-paper));
    --app-soft:color-mix(in srgb,var(--app-accent) 30%,var(--bg-paper));
  }}

  /* ══ Base ════════════════════════════════════════════════════════════════ */
  *, *::before, *::after { box-sizing:border-box; }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); -webkit-font-smoothing:antialiased; }
  input, select, textarea { font-family:var(--font-body); }
  button { font-family:var(--font-body); cursor:pointer; }
  @media (prefers-reduced-motion:reduce) { *, *::before, *::after { transition-duration:0ms !important; animation-duration:0ms !important; } }

  /* ══ Primitives ══════════════════════════════════════════════════════════ */
  .grove-app { background:var(--bg); min-height:100vh; }
  .font-display { font-family:var(--font-display); }
  .font-body    { font-family:var(--font-body); }
  .font-mono    { font-family:var(--font-mono); }

  /* Card */
  .g-card { background:var(--bg-paper); border:1px solid var(--border); border-radius:var(--r-lg); }
  .g-card-elevated { background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--r-lg); }

  /* Buttons */
  .g-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:10px 16px; border-radius:var(--r-md); font-weight:var(--fw-med); font-size:var(--fs-sm); border:1px solid var(--border); background:var(--bg-sunken); color:var(--text); transition:160ms cubic-bezier(.2,.8,.2,1); }
  .g-btn:active { transform:scale(.97); }
  .g-btn:disabled { opacity:.4; cursor:default; transform:none; }
  .g-btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; font-weight:var(--fw-title); }
  .g-btn.app { background:var(--app-accent); border-color:var(--app-accent); color:#fff; font-weight:var(--fw-title); }
  .g-btn.ghost { background:transparent; border-color:transparent; color:var(--text-soft); }
  .g-btn.danger { color:var(--danger); border-color:color-mix(in srgb,var(--danger) 35%,transparent); background:color-mix(in srgb,var(--danger) 10%,transparent); }
  .g-btn.sm { padding:6px 12px; font-size:var(--fs-xs); border-radius:var(--r-sm); }
  .g-btn.block { width:100%; }
  .g-btn.pill { border-radius:var(--r-full); }

  /* Chips / filter pills */
  .g-chip { padding:6px 14px; border-radius:var(--r-full); background:var(--bg-sunken); color:var(--text-soft); font-size:var(--fs-xs); font-weight:var(--fw-med); border:1px solid transparent; transition:160ms; white-space:nowrap; }
  .g-chip.on { background:var(--app-weak); color:var(--app-accent); border-color:var(--app-accent); }
  .g-chip.on-green { background:var(--accent-weak); color:var(--accent); border-color:var(--accent); }

  /* Inputs */
  .g-input { background:var(--bg-sunken); border:1px solid var(--border); border-radius:var(--r-md); padding:10px 12px; color:var(--text); width:100%; font-size:var(--fs-sm); transition:160ms; }
  .g-input::placeholder { color:var(--text-soft); }
  .g-input:focus { outline:2px solid var(--app-accent); outline-offset:-1px; border-color:transparent; }
  .g-input.sm { padding:7px 10px; border-radius:var(--r-sm); }
  .g-textarea { background:var(--bg-sunken); border:1px solid var(--border); border-radius:var(--r-md); padding:10px 12px; color:var(--text); width:100%; font-size:var(--fs-sm); resize:none; }
  .g-textarea:focus { outline:2px solid var(--app-accent); outline-offset:-1px; border-color:transparent; }

  /* Bottom nav */
  .g-tabbar { position:fixed; bottom:0; left:0; right:0; z-index:30; display:flex; background:color-mix(in srgb,var(--bg-paper) 92%,transparent); backdrop-filter:blur(12px); border-top:1px solid var(--border); padding-bottom:env(safe-area-inset-bottom); }
  .g-tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 0 8px; color:var(--text-soft); transition:color 160ms; position:relative; }
  .g-tab.on { color:var(--accent); }
  .g-tab-label { font-size:var(--fs-xs); font-weight:var(--fw-med); text-transform:uppercase; letter-spacing:.04em; }

  /* Header */
  .g-header { position:sticky; top:0; z-index:30; background:color-mix(in srgb,var(--bg) 88%,transparent); backdrop-filter:blur(12px); border-bottom:1px solid var(--border); }

  /* Sheets / modals */
  .g-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:50; display:flex; align-items:flex-end; justify-content:center; animation:g-fade .2s ease; }
  .g-sheet { background:var(--bg-elevated); border-radius:var(--r-xl) var(--r-xl) 0 0; width:100%; max-width:640px; padding:8px 20px calc(env(safe-area-inset-bottom) + 24px); max-height:90vh; overflow-y:auto; animation:g-rise .26s cubic-bezier(.2,.8,.2,1); }
  .g-dialog { background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--r-xl); padding:24px; width:100%; max-width:360px; animation:g-pop .26s cubic-bezier(.2,.8,.2,1); margin:16px; }
  @keyframes g-fade { from{opacity:0} }
  @keyframes g-rise { from{transform:translateY(100%)} }
  @keyframes g-pop  { from{transform:scale(.93);opacity:0} }
  @keyframes g-slide { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
  .slidein { animation:g-slide .25s ease-out both; }

  /* Section headers */
  .g-eyebrow { font-size:var(--fs-xs); font-weight:var(--fw-med); text-transform:uppercase; letter-spacing:.12em; color:var(--app-accent); }
  .g-section-title { font-family:var(--font-display); font-size:var(--fs-2xl); font-weight:var(--fw-title); color:var(--text); letter-spacing:-.01em; }
  .g-section-sub { font-size:var(--fs-sm); color:var(--text-soft); margin-top:2px; }

  /* Calendar specific */
  .cal-cell { background:var(--bg-paper); border-right:1px solid var(--border); border-bottom:1px solid var(--border); }
  .cal-cell:hover { background:var(--bg-elevated); }
  .cal-cell.picking { background:var(--app-weak); outline:2px solid var(--app-accent); outline-offset:-2px; }
  .cal-cell.has-meal { background:var(--bg-elevated); }
  .cal-cell.past { background:var(--bg-sunken); opacity:.6; }
  .cal-cell.dragging { opacity:.35; }
  .cal-cell.drag-target { background:color-mix(in srgb,var(--accent) 15%,var(--bg-paper)); outline:2px solid var(--accent); outline-offset:-2px; }

  /* Checklist items */
  .g-check { width:20px; height:20px; border-radius:var(--r-sm); border:2px solid var(--border); background:var(--bg-sunken); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:160ms; }
  .g-check.on { background:var(--accent); border-color:var(--accent); }
  .g-check.ok { background:var(--ok); border-color:var(--ok); }
  .g-check.warn { background:var(--warn); border-color:var(--warn); }

  /* Section label (store section in list) */
  .g-section-label { font-size:var(--fs-xs); font-weight:var(--fw-title); text-transform:uppercase; letter-spacing:.14em; color:var(--app-accent); padding:2px 0 6px; border-bottom:1px solid var(--border); margin-bottom:8px; }

  /* Badge / pill */
  .g-badge { font-size:var(--fs-xs); font-weight:var(--fw-title); padding:2px 8px; border-radius:var(--r-full); background:var(--app-weak); color:var(--app-accent); }
  .g-badge.green { background:var(--accent-weak); color:var(--accent); }
  .g-badge.ok { background:color-mix(in srgb,var(--ok) 18%,transparent); color:var(--ok); }

  /* Toast */
  .g-toast { position:fixed; bottom:88px; left:50%; transform:translateX(-50%); background:var(--bg-elevated); border:1px solid var(--border); color:var(--text); padding:10px 20px; border-radius:var(--r-full); font-size:var(--fs-sm); font-weight:var(--fw-med); z-index:60; white-space:nowrap; animation:g-slide .25s ease-out; box-shadow:0 4px 24px rgba(0,0,0,.4); }

  /* Misc */
  .strike { text-decoration:line-through; text-decoration-color:var(--text-soft); text-decoration-thickness:1.5px; }
  .ridge { background-image:repeating-linear-gradient(90deg,transparent 0 7px,var(--border) 7px 8px); opacity:.4; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .spin { animation:spin 1s linear infinite; }
  .paper-bg { background:var(--bg); }
  .card-shadow { box-shadow:none; }
  .mono { font-family:var(--font-mono); }
`}</style>
      <div className="paper-bg min-h-screen pb-28" style={{color:"var(--text)"}}>
        <Header onWentShopping={() => setShoppingModal(true)} />
        <main className="max-w-3xl mx-auto px-4 pt-2">
          {tab === "meals" && (
            <MealsTab
              recipes={recipes}
              selected={selectedMeals}
              multipliers={mealMultipliers}
              lastCooked={lastCooked}
              mealPlan={mealPlan}
              onToggle={toggleMeal}
              onSetMultiplier={setMultiplier}
              onToggleFavorite={toggleFavorite}
              onAssignDay={assignDay}
              onEdit={setEditingRecipe}
              onAddRecipe={() => setEditingRecipe({ id: "new", name: "", url: "", category: "Other", notes: "", cook_time: "", servings: "", ingredients: [] })}
            />
          )}
          {tab === "recipes" && (
            <RecipesTab
              recipes={recipes}
              selected={selectedMeals}
              lastCooked={lastCooked}
              onView={setViewingRecipe}
              onToggleFavorite={toggleFavorite}
              onAddRecipe={() => setEditingRecipe({ id: "new", name: "", url: "", category: "Other", notes: "", cook_time: "", servings: "", ingredients: [] })}
            />
          )}
          {tab === "pantry" && (
            <PantryTab
              ingredients={allIngredients}
              agg={agg}
              pantryMap={pantryMap}
              onToggle={togglePantry}
              onSetQty={setPantryQty}
              skipCount={pantrySkipCount}
              sections={sections}
            />
          )}
          {tab === "extras" && (
            <ExtrasTab extras={extras} onToggle={toggleExtra} onAdd={addExtra} onDelete={deleteExtra} onUpdateQty={updateExtraQty} />
          )}
          {tab === "list" && (
            <ListTab
              groups={shoppingGroups}
              checked={checkedItems}
              onToggle={toggleChecked}
              total={totalItems}
              sections={sections}
              onSetSection={handleSetSection}
            />
          )}
        </main>
        <BottomNav
          tab={tab}
          setTab={setTab}
          counts={{ meals: selectedMeals.length, pantry: pantrySkipCount, extras: extras.filter((e) => e.active || e.is_staple).length, list: totalItems, recipes: recipes.length }}
        />
        {editingRecipe && (
          <RecipeEditor
            recipe={editingRecipe}
            sections={sections}
            onSave={saveRecipe}
            onCancel={() => setEditingRecipe(null)}
            onDelete={editingRecipe.id && !String(editingRecipe.id).startsWith("new") ? () => deleteRecipe(editingRecipe.id) : null}
            onSetSection={handleSetSection}
          />
        )}
        {viewingRecipe && (
          <RecipeView
            recipe={viewingRecipe}
            isSelected={selectedMeals.includes(viewingRecipe.id)}
            onToggle={() => toggleMeal(viewingRecipe.id)}
            onEdit={() => { setEditingRecipe(viewingRecipe); setViewingRecipe(null); }}
            onClose={() => setViewingRecipe(null)}
            onToggleFavorite={toggleFavorite}
            lastCooked={lastCooked}
          />
        )}
        {shoppingModal && (
          <div className="g-backdrop flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShoppingModal(false)}>
            <div className="bg-[var(--bg)] w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="font-display text-2xl text-[var(--text)] mb-1">Went Shopping</div>
              <p className="text-sm text-[var(--text-soft)] mb-5">When did you go? The calendar shifts forward 14 days and pantry checks reset. Your meal plan stays for reference.</p>
              <div className="mb-5">
                <label className="text-xs uppercase tracking-wider text-[var(--text-soft)] font-semibold">Shopping date</label>
                <input
                  type="date"
                  value={shoppingDate}
                  onChange={(e) => setShoppingDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 g-input/50 focus:ring-2 focus:"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShoppingModal(false)} className="flex-1 py-2.5 rounded-full text-sm font-medium text-[var(--text-soft)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]">cancel</button>
                <button onClick={handleWentShopping} className="flex-1 py-2.5 rounded-full text-sm font-medium bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent)]">confirm</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 slidein pointer-events-none">
            <div className="bg-[var(--bg-sunken)] text-white px-5 py-2.5 rounded-full text-sm font-medium">{toast}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 spin mx-auto" style={{ color: "var(--app-accent)" }} />
        <div className="mt-3 text-sm font-display italic" style={{ color: "var(--text-soft)" }}>loading your kitchen…</div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onWentShopping }) {
  return (
    <header className="g-header">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-end justify-between gap-3">
        <div>
          <div className="g-eyebrow">meal hub</div>
          <h1 className="font-display leading-none mt-1" style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-title)", color: "var(--text)", letterSpacing: "-.02em" }}>
            Pantry <span className="italic" style={{ color: "var(--app-accent)", fontWeight: 400 }}>&amp;</span> List
          </h1>
        </div>
        <button onClick={onWentShopping} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition-colors" style={{ borderColor: "var(--border)", color: "var(--text-soft)", background: "var(--bg-sunken)" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.color = "var(--app-accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-soft)"; }}>
          <ShoppingCart className="w-3.5 h-3.5" />went shopping
        </button>
      </div>
      <div className="ridge h-[2px]" />
    </header>
  );
}

// ─── Meals Tab ────────────────────────────────────────────────────────────────

function MealsTab({ recipes, selected, multipliers, lastCooked, mealPlan, onToggle, onSetMultiplier, onToggleFavorite, onAssignDay, onEdit, onAddRecipe }) {
  const [assigningDay, setAssigningDay] = useState(null);
  const [search, setSearch] = useState("");
  const [dragFrom, setDragFrom] = useState(null);  // day offset being dragged
  const [dragOver, setDragOver] = useState(null);  // day offset being hovered

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  today.setHours(0,0,0,0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  function getDate(dayOffset) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + dayOffset);
    return d;
  }

  const filteredForPicker = [...recipes]
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const assignedIds = new Set(Object.values(mealPlan).filter(Boolean));
  const unplanned = selected.filter((id) => !assignedIds.has(id));

  // Month label for a week row
  function weekMonthLabel(weekIdx) {
    const sunday = getDate(weekIdx * 7);
    const saturday = getDate(weekIdx * 7 + 6);
    if (sunday.getMonth() === saturday.getMonth()) {
      return sunday.toLocaleDateString("en-US", { month: "long" });
    }
    return sunday.toLocaleDateString("en-US", { month: "short" }) + " / " + saturday.toLocaleDateString("en-US", { month: "short" });
  }

  return (
    <section className="pt-4">
      <SectionHeader eyebrow="step one" title="meal planner" subtitle="tap any day to assign a meal. all three weeks feed into your shopping list." />

      {/* Calendar grid — 3 weeks */}
      <div className="g-card rounded-2xl overflow-hidden mb-5">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {DAYS.map((d) => (
            <div key={d} className="text-center py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">{d}</div>
          ))}
        </div>

        {/* 3 week rows */}
        {[0, 1, 2].map((weekIdx) => (
          <div key={weekIdx}>
            {/* Week label */}
            <div className="px-3 py-1 bg-[var(--bg-sunken)] border-b border-[var(--border)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-soft)] flex items-center justify-between">
              <span>{weekIdx === 0 ? "This week" : weekIdx === 1 ? "Next week" : "Week after"}</span>
              <span>{weekMonthLabel(weekIdx)}</span>
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 divide-x divide-[var(--border)] border-b border-[var(--border)] last:border-b-0">
              {DAYS.map((_, i) => {
                const dayOffset = weekIdx * 7 + i;
                const date = getDate(dayOffset);
                const isToday = date.getTime() === today.getTime();
                const isPast = date < today && !isToday;
                const assignedId = mealPlan[String(dayOffset)];
                const assignedRecipe = assignedId ? recipes.find((r) => r.id === assignedId) : null;
                const isPicking = assigningDay === dayOffset;
                const isDragTarget = dragOver === dayOffset && dragFrom !== dayOffset;

                return (
                  <div
                    key={dayOffset}
                    draggable={!!assignedRecipe}
                    onDragStart={() => { setDragFrom(dayOffset); setAssigningDay(null); }}
                    onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(dayOffset); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragFrom === null || dragFrom === dayOffset) return;
                      // Swap the two days
                      const fromId = mealPlan[String(dragFrom)];
                      const toId = mealPlan[String(dayOffset)];
                      onAssignDay(dragFrom, toId || null);
                      onAssignDay(dayOffset, fromId || null);
                      setDragFrom(null);
                      setDragOver(null);
                    }}
                    onClick={() => !dragFrom && setAssigningDay(isPicking ? null : dayOffset)}
                    className={"flex flex-col p-1.5 min-h-[72px] text-left transition-colors relative cursor-pointer select-none " + (
                      isDragTarget ? "bg-[var(--app-soft)] ring-2 ring-inset ring-[var(--accent)]"
                      : isPicking ? "bg-[var(--app-weak)] ring-2 ring-inset ring-[var(--app-accent)]"
                      : dragFrom === dayOffset ? "opacity-40"
                      : assignedRecipe ? "bg-[var(--bg-paper)] hover:bg-[var(--bg-elevated)]"
                      : isPast ? "bg-[var(--bg-sunken)]"
                      : "bg-[var(--bg-paper)] hover:bg-[var(--bg-elevated)]"
                    )}
                  >
                    {/* Date number */}
                    <div className="text-xs font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full"
                      style={{
                        background: isToday ? "var(--accent)" : "transparent",
                        color: isToday ? "#fff" : isPast ? "var(--text-soft)" : "var(--text-soft)"
                      }}>{date.getDate()}</div>

                    {/* Assigned meal */}
                    {assignedRecipe ? (
                      <div className={"text-[9px] leading-tight font-medium flex-1 " + (isPast ? "text-[var(--text-soft)]" : "text-[var(--text)]")}
                        style={{display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                        {assignedRecipe.name}
                      </div>
                    ) : (
                      !isPast && <div className="text-[var(--text-soft)] text-base flex-1 flex items-end pb-0.5">+</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Meal picker */}
      {assigningDay !== null && (
        <div className="bg-[var(--bg-paper)] rounded-2xl border border-[var(--app-accent)] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-lg text-[var(--text)]">
              {getDate(assigningDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              {mealPlan[String(assigningDay)] && (
                <button onClick={() => { onAssignDay(assigningDay, null); setAssigningDay(null); }}
                  className="text-xs text-[var(--danger)] hover:text-red-800 font-medium px-2 py-1 rounded-full border border-[var(--danger)] hover:bg-[var(--bg-sunken)]">
                  clear
                </button>
              )}
              <button onClick={() => setAssigningDay(null)} className="text-[var(--text-soft)] hover:text-[var(--text-soft)] p-1"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search recipes…"
              className="w-full pl-8 pr-3 py-2 g-input rounded-full/50" />
          </div>
          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
            {filteredForPicker.map((r) => {
              const isAssigned = mealPlan[String(assigningDay)] === r.id;
              const isSel = selected.includes(r.id);
              const assignedElsewhere = Object.entries(mealPlan).find(([k, v]) => v === r.id && Number(k) !== assigningDay);
              const elsewhereLabel = assignedElsewhere
                ? getDate(Number(assignedElsewhere[0])).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                : null;
              return (
                <button key={r.id}
                  onClick={() => { onAssignDay(assigningDay, r.id); setAssigningDay(null); setSearch(""); }}
                  className="text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
                  style={{ background: isAssigned ? "var(--app-accent)" : "transparent", color: isAssigned ? "#fff" : "var(--text)" }}>
                  <span className="flex-1">{r.name}</span>
                  {r.category && r.category !== "Other" && (
                    <span className={"text-[10px] uppercase tracking-wider shrink-0 " + (isAssigned ? "text-[var(--app-weak)]" : "text-[var(--text-soft)]")}>{r.category}</span>
                  )}
                  {elsewhereLabel && !isAssigned && <span className="text-[9px] text-[var(--text-soft)] shrink-0">{elsewhereLabel}</span>}
                  {isSel && !isAssigned && !elsewhereLabel && <span className="text-[9px] text-[var(--ok)] font-semibold shrink-0">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Unplanned selected meals */}
      {unplanned.length > 0 && (
        <div className="mb-4">
          <SectionLabel name="also this week" count={unplanned.length} />
          <div className="grid gap-1.5">
            {unplanned.map((id) => {
              const r = recipes.find((x) => x.id === id);
              if (!r) return null;
              const ings = (r.ingredients || []).map(normIng);
              const mult = multipliers[r.id] || 1;
              return (
                <div key={id} className="bg-[var(--bg-paper)] rounded-xl border border-[var(--app-accent)] bg-[var(--app-weak)]">
                  <div className="flex items-stretch">
                    <button onClick={() => onToggle(r.id)} className="flex-1 flex items-center gap-3 p-3 text-left">
                      <Checkbox checked={true} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-display text-lg leading-tight text-[var(--text)]">{r.name}</span>
                          {r.category && r.category !== "Other" && <span className="text-[10px] uppercase tracking-wider text-[var(--text-soft)] font-semibold">{r.category}</span>}
                        </div>
                        {ings.length > 0 && (
                          <div className="text-xs text-[var(--text-soft)] truncate mt-0.5">{ings.slice(0, 4).map((i) => i.name).join(" · ")}{ings.length > 4 && " +" + (ings.length - 4)}</div>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center pr-2 gap-1">
                      <div className="flex items-center gap-0.5 rounded-full px-1.5 py-1" style={{background:"var(--bg-elevated)",border:"1px solid var(--border)"}}" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onSetMultiplier(r.id, mult - 1)} disabled={mult <= 1} className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--text-soft)] hover:bg-[var(--bg-paper)] disabled:opacity-30 font-bold text-sm transition-colors">−</button>
                        <span className="text-xs font-bold text-[var(--app-accent)] min-w-[22px] text-center">{mult}×</span>
                        <button onClick={() => onSetMultiplier(r.id, mult + 1)} disabled={mult >= 10} className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--text-soft)] hover:bg-[var(--bg-paper)] disabled:opacity-30 font-bold text-sm transition-colors">+</button>
                      </div>
                      <button onClick={() => onEdit(r)} className="p-2 text-[var(--text-soft)] hover:text-[var(--text)]"><Edit3 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(mealPlan).length === 0 && selected.length === 0 && (
        <EmptyState icon={<ChefHat className="w-8 h-8" />} message="tap any day on the calendar to assign a meal." />
      )}

      <div className="flex justify-center pt-2">
        <button onClick={onAddRecipe} className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)] hover:text-[var(--app-accent)] px-4 py-2 rounded-full border border-[var(--border)] hover:border-[var(--app-accent)] transition-colors">
          <Plus className="w-3.5 h-3.5" />add new recipe
        </button>
      </div>
    </section>
  );
}

// ─── Pantry Tab ───────────────────────────────────────────────────────────────

function PantryTab({ ingredients, agg, pantryMap, onToggle, onSetQty, skipCount, sections }) {
  const [qtyPopup, setQtyPopup] = useState(null); // { name, needed, haveQty }
  const [qtyInput, setQtyInput] = useState("");

  function handleIngredientTap(name, neededQty) {
    const alreadyHave = name in pantryMap;
    if (alreadyHave) {
      // Tap again to remove
      onToggle(name);
      return;
    }
    // Open quantity popup
    setQtyPopup({ name, needed: neededQty });
    setQtyInput("");
  }

  function handleHaveAll(name) {
    onToggle(name, "");
    setQtyPopup(null);
  }

  function handleHavePartial(name) {
    onToggle(name, qtyInput.trim());
    setQtyPopup(null);
  }

  if (ingredients.length === 0) {
    return (
      <section className="pt-4">
        <SectionHeader eyebrow="step two" title="check your pantry" subtitle="select meals first and ingredients will appear here." />
        <EmptyState icon={<Package className="w-8 h-8" />} message="no ingredients yet. pick some meals first." />
      </section>
    );
  }

  const grouped = {};
  ingredients.forEach((name) => {
    const sec = getSection(name, sections);
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(name);
  });

  return (
    <section className="pt-4">
      <SectionHeader eyebrow="step two" title="check your pantry" subtitle={`tap items you already have. ${skipCount} of ${ingredients.length} marked.`} />
      <div className="space-y-5">
        {Object.keys(grouped).sort((a, b) => sectionOrder(a) - sectionOrder(b)).map((sec) => (
          <div key={sec}>
            <SectionLabel name={sec} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {grouped[sec].sort().map((name) => {
                const have = name in pantryMap;
                const haveQty = pantryMap[name];
                const info = agg[name];
                const neededQty = info?.quantities?.[0] || "";
                const isPartial = have && haveQty;
                return (
                  <button
                    key={name}
                    onClick={() => handleIngredientTap(name, neededQty)}
                    className={`flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-paper)] rounded-lg border text-left transition-all ${
                      isPartial ? "border-[var(--app-accent)]/40 bg-[var(--app-weak)]" :
                      have ? "border-[var(--ok)] bg-emerald-50/40" : "border-[var(--border)]"
                    }`}
                  >
                    <Checkbox checked={have} green={!isPartial} amber={isPartial} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${have ? "text-[var(--text-soft)] strike" : "text-[var(--text)]"}`}>{name}</div>
                      {have && haveQty ? (
                        <div className="text-[11px] text-[var(--app-accent)] mt-0.5">have {haveQty} · need {subtractQuantity(neededQty, haveQty) || "none"}</div>
                      ) : neededQty && !have ? (
                        <div className="text-[11px] text-[var(--text-soft)] mt-0.5">{neededQty}</div>
                      ) : null}
                    </div>
                    {info?.count > 1 && <span className="text-[10px] font-semibold text-[var(--app-accent)] bg-[var(--app-soft)] rounded-full px-2 py-0.5 shrink-0">×{info.count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quantity popup */}
      {qtyPopup && (
        <div className="fixed inset-0 z-40" style={{background:"rgba(0,0,0,.55)"}}>
          <div className=" flex items-end sm:items-center justify-center p-4" onClick={() => setQtyPopup(null)}>
          <div className="bg-[var(--bg)] rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-xl mb-1">{qtyPopup.name}</div>
            {qtyPopup.needed && (
              <div className="text-xs text-[var(--text-soft)] mb-4">needed: <span className="font-semibold text-[var(--text)]">{qtyPopup.needed}</span></div>
            )}
            <div className="text-sm font-medium text-[var(--text)] mb-3">How much do you have?</div>

            {/* Partial quantity input */}
            <div className="flex gap-2 mb-4">
              <input
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && qtyInput.trim() && handleHavePartial(qtyPopup.name)}
                placeholder={`e.g. ${qtyPopup.needed ? "half of " + qtyPopup.needed : "1 cup"}`}
                autoFocus
                className="flex-1 px-3 py-2.5 g-input/50 focus:ring-2 focus:"
              />
              <button
                onClick={() => qtyInput.trim() && handleHavePartial(qtyPopup.name)}
                disabled={!qtyInput.trim()}
                className="bg-[var(--app-accent)] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--app-accent)] disabled:opacity-40"
              >
                partial
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleHaveAll(qtyPopup.name)}
                className="flex-1 bg-[var(--ok)] text-white py-2.5 rounded-full text-sm font-medium hover:bg-[var(--ok)]"
              >
                ✓ I have all of it
              </button>
              <button onClick={() => setQtyPopup(null)} className="px-4 py-2.5 text-[var(--text-soft)] text-sm font-medium hover:text-[var(--text)]">
                cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Extras Tab ───────────────────────────────────────────────────────────────

function ExtrasTab({ extras, onToggle, onAdd, onDelete, onUpdateQty }) {
  const [input, setInput] = useState("");
  const [inputQty, setInputQty] = useState("");
  const [isStaple, setIsStaple] = useState(false);

  function handleAdd() {
    if (input.trim()) { onAdd(input, inputQty, isStaple); setInput(""); setInputQty(""); }
  }

  const staples = [...extras.filter((e) => e.is_staple)].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const oneTime = [...extras.filter((e) => !e.is_staple)].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="pt-4">
      <SectionHeader eyebrow="step three" title="extras & staples" subtitle="running low items always appear on your list. one-time extras are for this trip only." />

      {/* Add item row */}
      <div className="space-y-2 mb-6">
        <div className="flex gap-2">
          <input value={inputQty} onChange={(e) => setInputQty(e.target.value)} placeholder="qty" className="w-20 px-3 py-2.5 g-input rounded-full/50 shrink-0" />
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="add an item…" className="flex-1 px-4 py-2.5 g-input rounded-full/50 focus:ring-2 focus:" />
          <button onClick={handleAdd} className="bg-[var(--bg-sunken)] text-white px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-[var(--bg-elevated)] shrink-0"><Plus className="w-4 h-4" />add</button>
        </div>
        {/* Type toggle */}
        <div className="flex gap-2 px-1">
          <button
            onClick={() => setIsStaple(false)}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors border ${!isStaple ? "bg-[var(--app-accent)] text-white border-[var(--app-accent)]" : "bg-[var(--bg-paper)] text-[var(--text-soft)] border-[var(--border)]"}`}
          >
            one-time extra
          </button>
          <button
            onClick={() => setIsStaple(true)}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors border ${isStaple ? "g-btn danger border-red-700" : "bg-[var(--bg-paper)] text-[var(--text-soft)] border-[var(--border)]"}`}
          >
            🔴 running low
          </button>
        </div>
      </div>

      {/* Running Low section */}
      <div className="mb-6">
        <SectionLabel name="Running Low" count={staples.filter((e) => e.active).length + " / " + staples.length} />
        <p className="text-xs text-[var(--text-soft)] mb-3 px-1">These always appear on your shopping list until you remove them.</p>
        {staples.length === 0 ? (
          <div className="text-xs text-[var(--text-soft)] italic px-1">nothing flagged as running low yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {staples.map((item) => (
              <ExtraItem key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} onUpdateQty={onUpdateQty} accentClass="border-[var(--danger)] bg-red-50/30" activeAccentClass="border-red-400/50 bg-red-50/60" />
            ))}
          </div>
        )}
      </div>

      {/* One-time extras section */}
      <div>
        <SectionLabel name="One-Time Extras" count={oneTime.filter((e) => e.active).length + " / " + oneTime.length} />
        <p className="text-xs text-[var(--text-soft)] mb-3 px-1">Tap to add to this trip's list.</p>
        {oneTime.length === 0 ? (
          <div className="text-xs text-[var(--text-soft)] italic px-1">no extras added yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {oneTime.map((item) => (
              <ExtraItem key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} onUpdateQty={onUpdateQty} accentClass="border-[var(--app-accent)] bg-[var(--app-weak)]" activeAccentClass="border-[var(--app-accent)] bg-[var(--app-weak)]" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExtraItem({ item, onToggle, onDelete, onUpdateQty, accentClass, activeAccentClass }) {
  return (
    <div className={`group flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-paper)] rounded-lg border ${item.active ? activeAccentClass : "border-[var(--border)]"}`}>
      <button onClick={() => onToggle(item.id)} className="flex items-center gap-2 flex-1 text-left min-w-0">
        <Checkbox checked={item.active} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate ${item.active ? "text-[var(--text)]" : "text-[var(--text-soft)]"}`}>{item.name}</div>
        </div>
      </button>
      <input
        value={item.quantity || ""}
        onChange={(e) => onUpdateQty(item.id, e.target.value)}
        placeholder="qty"
        className="w-16 text-xs bg-[var(--bg-sunken)] border border-[var(--border)] rounded px-2 py-1 focus:outline-none focus:border-[var(--app-accent)]/50 text-[var(--text-soft)] shrink-0"
      />
      <button onClick={() => onDelete(item.id)} className="text-[var(--text-soft)] hover:text-[var(--danger)] p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── List Tab ─────────────────────────────────────────────────────────────────

function ListTab({ groups, checked, onToggle, total, sections, onSetSection }) {
  const [reassigning, setReassigning] = useState(null);

  function handlePrint() {
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const lines = groups.map((g) => {
      const header = `\n${g.section.toUpperCase()}\n${"─".repeat(g.section.length)}`;
      const items = g.items.map((item) => {
        const qty = sumQuantities(item.quantities);
        return qty ? `  ${item.name} — ${qty}` : `  ${item.name}`;
      }).join("\n");
      return `${header}\n${items}`;
    }).join("\n");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shopping List — ${today}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1c1917; background: #fff; padding: 40px; max-width: 600px; margin: 0 auto; }
          h1 { font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: 700; color: #1c1917; margin-bottom: 4px; }
          .date { font-size: 13px; color: #78716c; margin-bottom: 32px; text-transform: uppercase; letter-spacing: 0.1em; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #92400e; border-bottom: 1px solid #fde68a; padding-bottom: 4px; margin-bottom: 10px; }
          .item { display: flex; align-items: baseline; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f5f5f4; }
          .item:last-child { border-bottom: none; }
          .item-name { font-size: 15px; font-weight: 500; }
          .item-qty { font-size: 13px; color: #78716c; margin-left: 12px; white-space: nowrap; }
          .checkbox { width: 14px; height: 14px; border: 1.5px solid #d6d3d1; border-radius: 3px; display: inline-block; margin-right: 10px; flex-shrink: 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Shopping List</h1>
        <div class="date">${today}</div>
        ${groups.map((g) => `
          <div class="section">
            <div class="section-title">${g.section}</div>
            ${g.items.map((item) => {
              const qty = sumQuantities(item.quantities);
              return `<div class="item"><span><span class="checkbox"></span><span class="item-name">${item.name}</span></span>${qty ? `<span class="item-qty">${qty}</span>` : ""}</div>`;
            }).join("")}
          </div>
        `).join("")}
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  if (total === 0) {
    return (
      <section className="pt-4">
        <SectionHeader eyebrow="the list" title="ready to shop" subtitle="select meals and you'll see a tidy list grouped by store section." />
        <EmptyState icon={<ShoppingCart className="w-8 h-8" />} message="nothing to buy yet." />
      </section>
    );
  }

  const checkedCount = groups.reduce((n, g) => n + g.items.filter((i) => checked.includes(i.name)).length, 0);

  return (
    <section className="pt-4">
      <div className="flex items-end justify-between mb-4">
        <SectionHeader eyebrow="the list" title="ready to shop" subtitle={`${checkedCount} of ${total} grabbed · grouped by store section`} />
        <button
          onClick={handlePrint}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--app-accent)] hover:border-[var(--app-accent)] hover:bg-[var(--app-weak)] transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          print
        </button>
      </div>
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.section}>
            <SectionLabel name={g.section} count={g.items.length} />
            <div className="g-card rounded-xl divide-y divide-[var(--border)]">
              {g.items.map((item) => {
                const isChecked = checked.includes(item.name);
                const qtyDisplay = sumQuantities(item.quantities);
                return (
                  <div key={item.name} className={`flex items-center gap-3 px-4 py-3 transition-colors ${isChecked ? "bg-[var(--bg-sunken)]" : ""}`}>
                    <button onClick={() => onToggle(item.name)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                      <Checkbox checked={isChecked} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isChecked ? "text-[var(--text-soft)] strike" : "text-[var(--text)]"}`}>{item.name}</div>
                        {(qtyDisplay || item.count > 1) && (
                          <div className={`text-xs mt-0.5 ${isChecked ? "text-[var(--text-soft)]" : "text-[var(--text-soft)]"}`}>
                            {qtyDisplay}{item.count > 1 ? ` · needed for ${item.count} recipes` : ""}
                          </div>
                        )}
                      </div>
                    </button>
                    <button onClick={() => setReassigning(reassigning === item.name ? null : item.name)} className="text-[var(--text-soft)] hover:text-[var(--text-soft)] text-base px-1 shrink-0">⋯</button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {reassigning && (
        <div className="fixed inset-0 z-40" style={{background:"rgba(0,0,0,.55)"}}>
          <div className=" flex items-end sm:items-center justify-center p-4" onClick={() => setReassigning(null)}>
          <div className="bg-[var(--bg)] rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-xl mb-1">Move "{reassigning}"</div>
            <div className="text-xs text-[var(--text-soft)] mb-4">currently in {getSection(reassigning, sections)}</div>
            <div className="grid gap-1.5 max-h-80 overflow-y-auto">
              {SECTION_ORDER.map((s) => (
                <button key={s} onClick={() => { onSetSection(reassigning, s); setReassigning(null); }} className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${getSection(reassigning, sections) === s ? "bg-[var(--bg-sunken)] text-white" : "bg-[var(--bg-paper)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]"}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Recipe Editor ────────────────────────────────────────────────────────────

function RecipeEditor({ recipe, onSave, onCancel, onDelete, sections, onSetSection }) {
  const [name, setName] = useState(recipe.name);
  const [url, setUrl] = useState(recipe.url || "");
  const [category, setCategory] = useState(recipe.category || "Other");
  const [notes, setNotes] = useState(recipe.notes || "");
  const [cookTime, setCookTime] = useState(recipe.cook_time || "");
  const [servings, setServings] = useState(recipe.servings || "");
  const [ingredients, setIngredients] = useState(
    (recipe.ingredients || []).map(normIng)
  );
  const [newIngName, setNewIngName] = useState("");
  const [newIngQty, setNewIngQty] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(recipe.pdf_url || "");
  const fileRef = useRef(null);
  const ingredientsRef = useRef(null);

  async function handleUrlImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      applyImportResult(data, importUrl.trim());
      setImportUrl("");
    } catch (e) {
      setImportError(`URL import failed: ${e.message}`);
    } finally {
      setImporting(false);
    }
  }

  async function handlePdfImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setImportError("Please select a PDF file."); return; }
    setImporting(true);
    setImportError("");
    try {
      // Load pdfjs from CDN — runs entirely in the browser, no server needed
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages using position data to reconstruct lines
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Group items into lines by their Y position
        const lineMap = {};
        for (const item of content.items) {
          if (!item.str.trim()) continue;
          // Round Y to nearest 2pts to group items on the same line
          const y = Math.round(item.transform[5] / 2) * 2;
          if (!lineMap[y]) lineMap[y] = [];
          lineMap[y].push({ x: item.transform[4], str: item.str });
        }

        // Sort lines top-to-bottom (higher Y = higher on page in PDF coords)
        const sortedYs = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
        for (const y of sortedYs) {
          const items = lineMap[y].sort((a, b) => a.x - b.x);
          const lineText = items.map((it) => it.str).join(" ").trim();
          if (lineText) fullText += lineText + "\n";
        }
      }

      if (!fullText.trim()) {
        setImportError("PDF appears empty or image-only. Use File → Print → Save as PDF in your browser.");
        return;
      }

      // Parse ingredients from extracted text
      const { name: parsedName, ingredients: parsedIngredients } = parsePdfText(fullText);
      if (!parsedName && parsedIngredients.length === 0) {
        setImportError("Couldn't find ingredients. Make sure it's a recipe PDF saved from a browser (not a scan).");
        return;
      }
      applyImportResult({ name: parsedName, ingredients: parsedIngredients }, importUrl.trim());

      // Upload PDF to Supabase Storage for later viewing
      try {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("recipe-pdfs")
          .upload(fileName, file, { contentType: "application/pdf", upsert: false });
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from("recipe-pdfs").getPublicUrl(fileName);
          if (urlData?.publicUrl) setPdfUrl(urlData.publicUrl);
        }
      } catch (uploadErr) {
        // PDF upload failed silently — ingredients still imported fine
        console.warn("PDF upload failed:", uploadErr);
      }
    } catch (e) {
      setImportError(`PDF import failed: ${e.message}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyImportResult(data, sourceUrl) {
    if (data.name && !name) setName(data.name);
    if (sourceUrl && !url) setUrl(sourceUrl);
    const imported = (data.ingredients || []).map((i) =>
      typeof i === "string" ? { name: i, quantity: "" } : { name: i.name || "", quantity: i.quantity || "" }
    );
    if (imported.length > 0) setIngredients(imported);
    const updates = {};
    (data.ingredients || []).forEach((i) => { if (i.name && i.section) updates[i.name] = i.section; });
    Object.entries(updates).forEach(([ing, sec]) => onSetSection(ing, sec));
    // Scroll to ingredients so user can review and edit
    setTimeout(() => ingredientsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  }

  function parsePdfText(text) {
    const UNICODE_FRACTIONS = { "\u00bc":"1/4","\u00bd":"1/2","\u00be":"3/4","\u2153":"1/3","\u2154":"2/3","\u215b":"1/8","\u215c":"3/8","\u215d":"5/8","\u215e":"7/8" };
    const UNIT_RE = /^(tablespoons?|tbsps?|tbs?|teaspoons?|tsps?|cups?|ounces?|oz\.?|pounds?|lbs?\.?|grams?|g\.?|cloves?|cans?|jars?|bags?|packages?|slices?|pieces?|stalks?|bunches?|sprigs?|pinch(?:es)?|dash(?:es)?|sticks?|fluid ounces?|fl\.? oz\.?|milliliters?|ml\.?|liters?|l\.?|quarts?|qt\.?|pints?|pt\.?)\b/i;

    function parseIngredientLine(raw) {
      let str = raw.trim();
      // Strip leading punctuation artifacts from pdfjs (e.g. ". baby potatoes")
      str = str.replace(/^[.\-–—•*·]\s*/, "");
      for (const uc of Object.keys(UNICODE_FRACTIONS)) str = str.split(uc).join(" " + UNICODE_FRACTIONS[uc]);
      str = str.replace(/\s+/g, " ").trim();
      const qtyMatch = str.match(/^(\d+(?:[\/\-]\d+)?(?:\.\d+)?(?:\s+\d+\/\d+)?)\s*/);
      let quantity = "", rest = str;
      if (qtyMatch) {
        quantity = qtyMatch[1].trim();
        rest = str.slice(qtyMatch[0].length);
        const unitMatch = rest.match(UNIT_RE);
        if (unitMatch) { quantity = quantity + " " + unitMatch[0].trim(); rest = rest.slice(unitMatch[0].length).trim(); }
      }
      let ingName = rest
        .replace(/^,\s*/, "")
        // Remove parentheticals like (optional), (divided), (see notes)
        .replace(/\([^)]*\)/g, "")
        // Remove "EACH:" prefix
        .replace(/^EACH:\s*/i, "")
        // Remove everything after prep instruction keywords
        .replace(/\s*[,;]\s*(divided|drained|rinsed|chopped|minced|diced|sliced|halved|quartered|see notes?|optional|to taste|room temp|softened|melted|packed|sifted|heaping|about|approximately).*/i, "")
        // Remove trailing prep notes after a space (e.g. "Stew meat see notes" → "Stew meat")
        .replace(/\s+see notes?.*$/i, "")
        .replace(/\s+or merlot.*$/i, "")
        .replace(/\s+\*optional\*.*$/i, "")
        // Remove trailing standalone numbers (page artifacts)
        .replace(/\s+\d+$/, "")
        // Remove trailing descriptors like "cut into 1-inch chunks", "halved or quartered"
        .replace(/\s+(cut|halved|quartered|sliced|diced|chopped|minced|peeled|trimmed|divided|thawed|frozen|fresh|dried|ground|whole|large|medium|small)\b.*/i, "")
        .replace(/\s+/g, " ")
        .trim();
      if (ingName.length > 0) ingName = ingName.charAt(0).toUpperCase() + ingName.slice(1);
      return { name: ingName, quantity };
    }

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Find ingredient section
    let inIngredients = false;
    const ingredientLines = [];
    for (const line of lines) {
      if (/^ingredients?$/i.test(line) || /^what you.?ll need$/i.test(line)) { inIngredients = true; continue; }
      if (inIngredients && /^(directions?|instructions?|method|steps?|step 1|preparation|nutrition)$/i.test(line)) break;
      if (inIngredients) ingredientLines.push(line);
    }
    const searchLines = ingredientLines.length > 0 ? ingredientLines : lines;

    const ingredients = [];
    for (const line of searchLines) {
      if (line.length < 3 || line.length > 150) continue;
      if (/^(directions?|instructions?|notes?|step \d|serves|yield|prep|cook|total|nutrition|per serving|submitted|tested|gather|preheat|firefox|https?:|calories|carb|protein|fat|sodium|cholesterol|potassium|vitamin)/i.test(line)) continue;
      const startsWithQty = /^[\d\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e]/.test(line);
      const startsWithBullet = /^[-\u2022*\u00b7]\s/.test(line);
      if (startsWithQty || startsWithBullet) {
        const parsed = parseIngredientLine(line.replace(/^[-\u2022*\u00b7]\s*/, ""));
        if (parsed.name && parsed.name.length > 1 && parsed.name.length < 80) {
          ingredients.push({ name: parsed.name, quantity: parsed.quantity, section: detectSection(parsed.name) });
        }
      }
    }

    // Extract recipe name — first clean non-metadata line
    let recipeName = "";
    for (const line of lines.slice(0, 20)) {
      // Skip lines with trailing numbers (page artifacts), URLs, metadata
      if (/\s+\d+$/.test(line) && line.length < 30) continue;
      if (line.length > 3 && line.length < 100 && !/^https?:/i.test(line) && !/^firefox/i.test(line) && !/^\d/.test(line)) {
        if (/^(print|save|share|jump|by |author|yield|serves|prep|cook|total|submitted|tested|ingredients?|gather|preheat)/i.test(line)) continue;
        recipeName = line.replace(/\s+\d+$/, "").trim();
        break;
      }
    }

    return { name: recipeName, ingredients };
  }

  function addIngredient() {
    if (!newIngName.trim()) return;
    const parts = newIngName.split(",").map((s) => s.trim()).filter(Boolean);
    setIngredients((prev) => [
      ...prev,
      ...parts.map((n, i) => ({ name: n, quantity: i === 0 && parts.length === 1 ? newIngQty : "" })),
    ]);
    setNewIngName("");
    setNewIngQty("");
  }

  function updateIngredient(idx, field, value) {
    setIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  }

  function removeIngredient(idx) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!name.trim()) { alert("Give the recipe a name first."); return; }
    setSaving(true);
    await onSave({ ...recipe, name: name.trim(), url: url.trim(), category, notes, cook_time: cookTime, servings, pdf_url: pdfUrl, ingredients });
    setSaving(false);
  }

  return (
    <div className="g-backdrop flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-[var(--bg)] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-soft)] font-semibold">{String(recipe.id).startsWith("new") ? "new recipe" : "edit recipe"}</div>
            <div className="font-display text-2xl text-[var(--text)] mt-0.5">{name || "untitled"}</div>
          </div>
          <button onClick={onCancel} className="p-2 text-[var(--text-soft)] hover:text-[var(--text)]"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="bg-[var(--app-weak)] border border-[var(--border)]/60 rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--app-accent)] mb-1 flex items-center gap-1.5"><Link className="w-3.5 h-3.5" />import recipe</div>
            <div className="text-xs text-[var(--text-soft)] mb-3">Paste a URL to try auto-import, or print the recipe to PDF and upload it for guaranteed results.</div>

            {/* URL row */}
            <div className="flex gap-2 mb-2">
              <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !importing && handleUrlImport()} placeholder="https://recipe-site.com/recipe" className="flex-1 px-3 py-2 g-input/50" disabled={importing} />
              <button onClick={handleUrlImport} disabled={importing || !importUrl.trim()} className="bg-[var(--app-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-[var(--app-accent)] disabled:opacity-50 whitespace-nowrap">
                {importing ? <Loader2 className="w-4 h-4 spin" /> : <Link className="w-4 h-4" />}
                {importing ? "importing…" : "try url"}
              </button>
            </div>

            {/* PDF row */}
            <div className="flex gap-2 items-center">
              <div className="flex-1 text-xs text-[var(--text-soft)] italic">or upload a PDF (File → Print → Save as PDF in your browser)</div>
              <input ref={fileRef} type="file" accept="application/pdf" onChange={handlePdfImport} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={importing} className="bg-stone-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-[var(--bg-elevated)] disabled:opacity-50 whitespace-nowrap shrink-0">
                {importing ? <Loader2 className="w-4 h-4 spin" /> : <Plus className="w-4 h-4" />}
                upload pdf
              </button>
            </div>

            {importError && <div className="text-xs text-[var(--danger)] mt-2">{importError}</div>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--text-soft)] font-semibold">name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. chicken alfredo" className="mt-1 w-full px-3 py-2.5 bg-[var(--bg-paper)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--app-accent)]/50 focus:ring-2 focus:" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--text-soft)] font-semibold">recipe url <span className="lowercase italic font-normal">(optional)</span></label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="mt-1 w-full px-3 py-2.5 g-input/50 focus:ring-2 focus:" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--text-soft)] font-semibold">notes <span className="lowercase italic font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Serving size, cook time reminders, variations… e.g. 'double the sauce for 6 people'"
              rows={3}
              className="mt-1 w-full px-3 py-2.5 g-input/50 focus:ring-2 focus: resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--text-soft)] font-semibold">cook time</label>
              <input value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder="e.g. 35 mins" className="mt-1 w-full px-3 py-2.5 g-input/50 focus:ring-2 focus:" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--text-soft)] font-semibold">servings</label>
              <input value={servings} onChange={(e) => setServings(e.target.value)} placeholder="e.g. 4–6" className="mt-1 w-full px-3 py-2.5 g-input/50 focus:ring-2 focus:" />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--text-soft)] font-semibold">category</label>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {RECIPE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ background: category === c ? "var(--app-accent)" : "var(--bg-sunken)", color: category === c ? "#fff" : "var(--text-soft)", border: category === c ? "none" : "1px solid var(--border)" }}>{c}</button>
              ))}
            </div>
          </div>

          <div ref={ingredientsRef}>
            <label className="text-xs uppercase tracking-wider text-[var(--text-soft)] font-semibold">ingredients <span className="lowercase italic font-normal">({ingredients.length})</span></label>
            {ingredients.length > 0 && (
              <p className="text-[11px] text-[var(--text-soft)] mt-0.5 mb-1.5">tap any name or qty to edit before saving</p>
            )}
            <div className="flex gap-2 mt-1.5">
              <input value={newIngQty} onChange={(e) => setNewIngQty(e.target.value)} placeholder="qty" className="w-20 px-3 py-2.5 g-input/50 shrink-0" />
              <input value={newIngName} onChange={(e) => setNewIngName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addIngredient()} placeholder="ingredient name" className="flex-1 px-3 py-2.5 g-input/50" />
              <button onClick={addIngredient} className="bg-[var(--bg-sunken)] text-white px-3 rounded-lg hover:bg-[var(--bg-elevated)] shrink-0"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="mt-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: ingredients.length > 5 ? "400px" : "260px" }}>
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-paper)] border border-[var(--border)] rounded-lg">
                  <input value={ing.quantity} onChange={(e) => updateIngredient(idx, "quantity", e.target.value)} placeholder="qty" className="w-20 text-xs bg-[var(--bg-sunken)] border border-[var(--border)] rounded px-2 py-1 focus:outline-none focus:border-[var(--app-accent)]/50 shrink-0 text-[var(--text-soft)]" />
                  <input value={ing.name} onChange={(e) => updateIngredient(idx, "name", e.target.value)} placeholder="ingredient name" className="text-sm text-[var(--text)] flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:bg-[var(--bg-sunken)] rounded px-1 -mx-1" />
                  <select value={getSection(ing.name, sections)} onChange={(e) => onSetSection(ing.name, e.target.value)} className="text-[10px] uppercase tracking-wider bg-[var(--bg-elevated)] px-2 py-1 rounded-md text-[var(--text-soft)] border-0 focus:outline-none shrink-0 max-w-[110px]">
                    {SECTION_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => removeIngredient(idx)} className="text-[var(--text-soft)] hover:text-[var(--danger)] shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {ingredients.length === 0 && <div className="text-xs text-[var(--text-soft)] italic px-1 py-2">no ingredients added yet</div>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-[var(--border)] bg-[#F6EFE2]/50">
          {onDelete ? (
            <button onClick={onDelete} className="text-[var(--danger)]/80 hover:text-red-800 text-sm font-medium flex items-center gap-1.5"><Trash2 className="w-4 h-4" />delete</button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-[var(--text-soft)] hover:text-[var(--text)] text-sm font-medium">cancel</button>
            <button onClick={handleSave} disabled={saving} className="bg-[var(--bg-sunken)] text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-[var(--bg-elevated)] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 spin" /> : <Save className="w-4 h-4" />}save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function Checkbox({ checked, green, amber: amberProp }) {
  const bg = checked
    ? amberProp ? "var(--warn)"
    : green ? "var(--ok)"
    : "var(--accent)"
    : "var(--bg-sunken)";
  const border = checked
    ? amberProp ? "var(--warn)"
    : green ? "var(--ok)"
    : "var(--accent)"
    : "var(--border)";
  return (
    <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors border-2"
      style={{ background: bg, borderColor: border }}>
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
    </span>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-5">
      <div className="g-eyebrow mb-1">{eyebrow}</div>
      <h2 className="font-display leading-tight" style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-title)", color: "var(--text)" }}>{title}</h2>
      {subtitle && <p className="mt-1" style={{ fontSize: "var(--fs-sm)", color: "var(--text-soft)" }}>{subtitle}</p>}
    </div>
  );
}

function SectionLabel({ name, count }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <span className="g-section-label flex-shrink-0">{name}</span>
      {count != null && <span className="text-[10px] font-semibold ml-auto" style={{ color: "var(--text-soft)" }}>{count}</span>}
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="text-center py-16" style={{ color: "var(--text-soft)" }}>
      <div className="inline-flex p-4 rounded-full mb-3" style={{ background: "var(--bg-elevated)" }}>{icon}</div>
      <div style={{ fontSize: "var(--fs-sm)" }}>{message}</div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ tab, setTab, counts }) {
  const items = [
    { key: "meals",   label: "meals",   icon: ChefHat,     badge: counts.meals },
    { key: "recipes", label: "recipes", icon: BookOpen,     badge: 0 },
    { key: "pantry",  label: "pantry",  icon: Package,      badge: counts.pantry },
    { key: "extras",  label: "extras",  icon: PlusCircle,   badge: counts.extras },
    { key: "list",    label: "list",    icon: ShoppingCart, badge: counts.list },
  ];
  return (
    <nav className="g-tabbar">
      <div className="max-w-3xl mx-auto w-full flex">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.key;
          return (
            <button key={it.key} onClick={() => setTab(it.key)} className={`g-tab ${active ? "on" : ""}`}>
              <div className="relative">
                <Icon className="w-5 h-5" />
                {it.badge > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] font-bold rounded-full min-w-[15px] h-[15px] px-1 flex items-center justify-center"
                    style={{ background: active ? "var(--accent)" : "var(--app-accent)", color: "#fff" }}>
                    {it.badge}
                  </span>
                )}
              </div>
              <span className="g-tab-label">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Recipes Tab ──────────────────────────────────────────────────────────────

function RecipesTab({ recipes, selected, lastCooked, onView, onToggleFavorite, onAddRecipe }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [sortBy, setSortBy] = useState("az");

  const filtered = recipes
    .filter((r) => {
      if (filterCat === "Favorites") return r.is_favorite;
      return filterCat === "All" || (r.category || "Other") === filterCat;
    })
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "az") return a.name.localeCompare(b.name);
      if (sortBy === "za") return b.name.localeCompare(a.name);
      if (sortBy === "ingredients") return (b.ingredients?.length || 0) - (a.ingredients?.length || 0);
      if (sortBy === "recent") {
        const ta = lastCooked[a.id] ? new Date(lastCooked[a.id]).getTime() : 0;
        const tb = lastCooked[b.id] ? new Date(lastCooked[b.id]).getTime() : 0;
        return tb - ta;
      }
      return 0;
    });

  return (
    <section className="pt-4">
      <SectionHeader eyebrow="recipe hub" title="all recipes" subtitle={`${recipes.length} recipes · ${recipes.filter((r) => r.is_favorite).length} favorites`} />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search recipes" className="w-full pl-9 pr-3 py-2.5 g-input rounded-full/50 focus:ring-2 focus:" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[var(--bg-paper)] border border-[var(--border)] rounded-full text-xs px-3 py-2.5 text-[var(--text-soft)] focus:outline-none focus:border-[var(--app-accent)]/50">
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="recent">Recently made</option>
          <option value="ingredients">Most ingredients</option>
        </select>
        <button onClick={onAddRecipe} className="bg-[var(--bg-sunken)] text-white px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-[var(--bg-elevated)] shrink-0">
          <Plus className="w-4 h-4" />new
        </button>
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {["All", "Favorites", ...RECIPE_CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCat === c ? (c === "Favorites" ? "g-chip on fav" : "g-chip on") : "g-chip"}`}>
            {c === "Favorites" ? "♥ Favorites" : c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<BookOpen className="w-8 h-8" />} message="no recipes match." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((r) => {
            const ings = (r.ingredients || []).map(normIng);
            const isSelected = selected.includes(r.id);
            const ago = timeAgo(lastCooked[r.id]);
            return (
              <button
                key={r.id}
                onClick={() => onView(r)}
                className={`text-left bg-[var(--bg-paper)] rounded-2xl border p-4 hover:border-[var(--app-accent)] hover:bg-[var(--app-weak)] transition-all ${isSelected ? "border-[var(--app-accent)] bg-[var(--app-weak)]" : "border-[var(--border)]"}`}
              >
                {/* Top row: category/selected badge + favorite heart + link */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      background: isSelected ? "var(--accent)" : "var(--bg-elevated)",
                      color: isSelected ? "#fff" : "var(--text-soft)"
                    }}>
                    {isSelected ? "✓ this week" : (r.category || "Other")}
                  </span>
                  <div className="flex items-center gap-2">
                    {ago && <span className="text-[10px] text-[var(--text-soft)]">{ago}</span>}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(r.id); }}
                      className={`text-base transition-colors ${r.is_favorite ? "text-[var(--danger)]" : "text-[var(--text-soft)] hover:text-red-400"}`}
                    >
                      {r.is_favorite ? "♥" : "♡"}
                    </button>
                    {r.url && <ExternalLink className="w-3.5 h-3.5 text-[var(--text-soft)]" />}
                  </div>
                </div>

                {/* Name */}
                <div className="font-display text-xl leading-tight text-[var(--text)] mb-2">{r.name}</div>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-[var(--text-soft)] mb-2">
                  {r.cook_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.cook_time}</span>}
                  {r.servings && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.servings}</span>}
                  {ings.length > 0 && <span>{ings.length} ingredient{ings.length !== 1 ? "s" : ""}</span>}
                </div>

                {/* Notes preview */}
                {r.notes && <div className="text-xs text-[var(--text-soft)] italic line-clamp-2 mb-2">{r.notes}</div>}

                {/* Ingredient chips */}
                {ings.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ings.slice(0, 4).map((ing, i) => (
                      <span key={i} className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-soft)] rounded-full px-2 py-0.5">{ing.name}</span>
                    ))}
                    {ings.length > 4 && <span className="text-[10px] text-[var(--text-soft)]">+{ings.length - 4} more</span>}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--app-accent)]/60 italic">no ingredients yet</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Recipe View (read-only modal) ────────────────────────────────────────────

function RecipeView({ recipe, isSelected, onToggle, onEdit, onClose, onToggleFavorite, lastCooked }) {
  const ings = (recipe.ingredients || []).map(normIng);
  const grouped = {};
  ings.forEach((ing) => {
    const sec = detectSection(ing.name);
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(ing);
  });

  return (
    <div className="g-backdrop flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-[var(--bg)] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-[var(--bg-elevated)] text-[var(--text-soft)] px-2 py-0.5 rounded-full">{recipe.category || "Other"}</span>
                {recipe.url && (
                  <a href={recipe.url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="text-[var(--text-soft)] hover:text-[var(--app-accent)]" title="view recipe site">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {recipe.pdf_url && (
                  <a href={recipe.pdf_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-accent)] bg-[var(--app-soft)] px-2 py-0.5 rounded-full hover:bg-[var(--app-soft)] transition-colors" title="view saved PDF">
                    PDF
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
                  className={`text-lg transition-colors ${recipe.is_favorite ? "text-[var(--danger)]" : "text-[var(--text-soft)] hover:text-red-400"}`}
                >
                  {recipe.is_favorite ? "♥" : "♡"}
                </button>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-[var(--text)] leading-tight">{recipe.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-soft)]">
                {recipe.cook_time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{recipe.cook_time}</span>}
                {recipe.servings && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{recipe.servings} servings</span>}
                {ings.length > 0 && <span>{ings.length} ingredients</span>}
                {timeAgo(lastCooked[recipe.id]) && <span className="text-[var(--text-soft)] text-xs">{timeAgo(lastCooked[recipe.id])}</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-[var(--text-soft)] hover:text-[var(--text)] shrink-0"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Notes */}
          {recipe.notes && (
            <div className="bg-[var(--app-weak)] border border-[var(--app-accent)] rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--app-accent)] mb-1">Notes</div>
              <p className="text-sm text-[var(--text)] leading-relaxed">{recipe.notes}</p>
            </div>
          )}

          {/* Ingredients */}
          {ings.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-soft)] font-semibold mb-3">Ingredients</div>
              <div className="space-y-1.5">
                {ings.map((ing, idx) => (
                  <div key={idx} className="flex items-baseline justify-between px-3 py-2 bg-[var(--bg-paper)] rounded-lg border border-[var(--border)]">
                    <span className="text-sm text-[var(--text)] font-medium">{ing.name}</span>
                    {ing.quantity && <span className="text-xs text-[var(--text-soft)] ml-2 shrink-0">{ing.quantity}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ings.length === 0 && (
            <div className="text-sm text-[var(--text-soft)] italic text-center py-4">No ingredients added yet.</div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 p-5 border-t border-[var(--border)] bg-[#F6EFE2]/50">
          <button
            onClick={onToggle}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? "g-btn ok"
                : "bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent)]"
            }`}
          >
            {isSelected ? "✓ added to this week" : "+ add to this week"}
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-4 py-2.5 border border-[var(--border)] rounded-full text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-sunken)]">
            <Edit3 className="w-4 h-4" />edit
          </button>
        </div>
      </div>
    </div>
  );
}
