import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChefHat, ShoppingCart, Package, PlusCircle, Search, X, Check,
  Trash2, Edit3, ExternalLink, RefreshCw, Plus, Save, Link, Loader2,
  BookOpen, Clock, Users,
} from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
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
  { s: "Produce", k: ["garlic","onion","tomato","potato","carrot","celery","spinach","broccoli","pepper","lemon","lime","mushroom","ginger","basil","thyme","rosemary","sage","parsley","cilantro","mint","dill","oregano","kale","cabbage","cucumber","zucchini","squash","avocado","corn","green bean","jarlic","minced garlic","scallion","shallot","leek","artichoke","arugula","asparagus","beet","bok choy","fennel","radish","turnip","yam","sweet potato"] },
  { s: "Meat & Seafood", k: ["chicken","beef","steak","pork","turkey","lamb","salmon","shrimp","fish","bacon","sausage","kielbasa","ham","salami","pepperoni","ground beef","ground pork","ribeye","tenderloin","brisket","meatball","chorizo","prosciutto","deli","spicy sausage","ground sausage","ground turkey","cod","tilapia","tuna","crab","lobster","scallop","anchovy"] },
  { s: "Dairy & Eggs", k: ["butter","milk","cream","cheese","egg","yogurt","parmesan","mozzarella","cheddar","ricotta","boursin","queso","oatmilk","keifer","kefir","cold foam","heavy cream","sour cream","cream cheese","buttermilk","ghee","provolone","gouda","brie","feta","swiss","jack cheese","pepper jack","shredded"] },
  { s: "Bakery & Bread", k: ["bread","roll","bun","tortilla","flatbread","pita","naan","bagel","croissant","hawaiian","sourdough","baguette","english muffin","hoagie","ciabatta","focaccia"] },
  { s: "Canned & Jarred", k: ["broth","stock","tomato paste","tomato sauce","fire roasted","diced tomato","coconut milk","bouillon","canned","chickpea","garbanzo","black bean","kidney bean","pinto bean","cannellini","olive","pickle","capers","roasted pepper","salsa verde","tapenade","water chestnut"] },
  { s: "Dry Goods & Pasta", k: ["pasta","rice","noodle","orzo","flour","oat","cereal","cracker","chip","breadcrumb","quinoa","barley","couscous","polenta","cornstarch","corn starch","chicken rice","lasagna","spaghetti","penne","rigatoni","fusilli","linguine","fettuccine","tortellini","gnocchi","ramen","stuffing"] },
  { s: "Spices & Seasonings", k: ["salt","paprika","cumin","oregano","cinnamon","cayenne","garlic powder","onion powder","chili powder","seasoning","bay leaf","bay leaves","italian seasoning","turmeric","nutmeg","allspice","red pepper flake","black pepper","white pepper","smoked paprika","sweet paprika","cardamom","coriander","fennel seed","garam masala","old bay","taco seasoning","cajun"] },
  { s: "Condiments & Sauces", k: ["soy sauce","honey","mustard","ketchup","mayo","vinegar","worcestershire","sriracha","hot sauce","marinara","pasta sauce","pesto","ranch","dijon","balsamic","vinaigrette","teriyaki","hoisin","molasses","maple syrup","jam","jelly","fish sauce","oyster sauce","ponzu","tahini","tamari","bbq"] },
  { s: "Oils & Baking", k: ["avocado oil","olive oil","vegetable oil","canola oil","sesame oil","coconut oil","baking powder","baking soda","brown sugar","chocolate chip","cocoa","vanilla extract","yeast","shortening","cream of tartar","powdered sugar","cooking spray"] },
  { s: "Beverages & Wine", k: ["wine","beer","cabernet","sauvignon blanc","chardonnay","merlot","pinot","prosecco","white wine","red wine","cider","vodka","rum","whiskey","bourbon","tequila","gin","sake","juice","coffee","tea","lemonade","club soda","seltzer","kombucha"] },
  { s: "Frozen", k: ["frozen","nugget","ice cream","popsicle","edamame","tater tot","gelato","sherbet","frozen pea","frozen corn","frozen spinach","frozen broccoli"] },
  { s: "Household", k: ["toilet paper","paper plate","paper towel","trash bag","dish soap","detergent","aluminum foil","plastic wrap","parchment","ziplock","napkin","sponge","tissue","candle","battery","lotion","hand soap"] },
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

// Scale a quantity string by a multiplier, preserving the unit
// e.g. scaleQuantity("1 cup", 2) => "2 cups", scaleQuantity("1/2 cup", 3) => "1 1/2 cups"
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
  const stateTimer = useRef(null);
  const isLocalChange = useRef(false); // prevents remote updates from overwriting local in-flight changes

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

    // ── Real-time subscriptions ──
    // shopping_state — selected meals, pantry, checked, meal plan
    const stateSub = supabase
      .channel("shopping_state_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "shopping_state" }, (payload) => {
        if (isLocalChange.current) return; // skip if we just saved this ourselves
        const st = payload.new;
        if (!st) return;
        setSelectedMeals(st.selected_meals || []);
        setPantryItems(st.pantry_items || []);
        setCheckedItems(st.checked_items || []);
        setMealPlan(st.meal_plan || {});
      })
      .subscribe();

    // recipes — new recipes, edits, deletes
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

    // extras — toggles, adds, deletes
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

    // sections — ingredient category changes
    const sectionsSub = supabase
      .channel("sections_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sections" }, (payload) => {
        if (payload.new && payload.new.ingredient) {
          setSections((prev) => ({ ...prev, [payload.new.ingredient]: payload.new.section }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stateSub);
      supabase.removeChannel(recipesSub);
      supabase.removeChannel(extrasSub);
      supabase.removeChannel(sectionsSub);
    };
  }, []);

  useEffect(() => {
    if (recipes === null) return;
    if (stateTimer.current) clearTimeout(stateTimer.current);
    isLocalChange.current = true;
    stateTimer.current = setTimeout(() => {
      saveState(selectedMeals, pantryItems, checkedItems, mealPlan).finally(() => {
        // Allow remote updates again after a short buffer
        setTimeout(() => { isLocalChange.current = false; }, 1000);
      });
    }, 600);
  }, [selectedMeals, pantryItems, checkedItems, mealPlan]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2000); }

  if (recipes === null) return <LoadingScreen />;

  // Aggregate: name -> { count, quantities[] } — respects per-meal multipliers
  const agg = {};
  selectedMeals.forEach((id) => {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    const mult = mealMultipliers[id] || 1;
    (recipe.ingredients || []).forEach((raw) => {
      const { name, quantity } = normIng(raw);
      if (!name) return;
      if (!agg[name]) agg[name] = { count: 0, quantities: [] };
      agg[name].count += mult;
      if (quantity) {
        // Scale the numeric part of the quantity
        const scaled = scaleQuantity(quantity, mult);
        agg[name].quantities.push(scaled);
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

  async function startNewTrip() {
    if (!confirm("Start a new trip? Clears selected meals, pantry checks, and shopping check-offs.")) return;
    // Log all selected meals as cooked today before resetting
    if (selectedMeals.length > 0) {
      const now = new Date().toISOString();
      await supabase.from("meal_history").insert(
        selectedMeals.map((id) => ({ recipe_id: id, cooked_at: now }))
      );
      const updated = { ...lastCooked };
      selectedMeals.forEach((id) => { updated[id] = now; });
      setLastCooked(updated);
    }
    setSelectedMeals([]);
    setMealMultipliers({});
    setMealPlan({});
    setPantryItems([]);
    setCheckedItems([]);
    await supabase.from("extras").update({ active: false }).eq("is_staple", false);
    setExtras((p) => p.map((e) => e.is_staple ? e : { ...e, active: false }));
    showToast("Fresh trip started");
    setTab("meals");
  }

  return (
    <div className="font-body min-h-screen text-stone-800">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .paper-bg { background-color: #FBF6EC; background-image: radial-gradient(circle at 25% 15%, rgba(160,69,39,0.04) 0%, transparent 40%), radial-gradient(circle at 75% 85%, rgba(92,107,63,0.04) 0%, transparent 40%); }
        .card-shadow { box-shadow: 0 1px 0 rgba(58,42,28,0.04), 0 2px 8px -2px rgba(58,42,28,0.08); }
        .ridge { background-image: repeating-linear-gradient(90deg, transparent 0 7px, rgba(58,42,28,0.05) 7px 8px); }
        @keyframes slidein { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .slidein { animation: slidein 0.25s ease-out both; }
        .strike { text-decoration: line-through; text-decoration-color: rgba(160,69,39,0.5); text-decoration-thickness: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
      <div className="paper-bg min-h-screen pb-28">
        <Header onNewTrip={startNewTrip} />
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
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 slidein pointer-events-none">
            <div className="bg-stone-900 text-amber-50 px-5 py-2.5 rounded-full text-sm font-medium card-shadow">{toast}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FBF6EC" }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-stone-400 spin mx-auto" />
        <div className="mt-3 text-stone-500 text-sm" style={{ fontFamily: "Georgia,serif", fontStyle: "italic" }}>loading your kitchen…</div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onNewTrip }) {
  return (
    <header className="border-b border-stone-200/70 bg-[#FBF6EC]/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500 font-semibold">kitchen + market</div>
          <h1 className="font-display text-3xl sm:text-4xl leading-none mt-1 text-stone-900" style={{ fontWeight: 700 }}>
            Pantry <span className="italic text-amber-800/80" style={{ fontWeight: 400 }}>&</span> List
          </h1>
        </div>
        <button onClick={onNewTrip} className="text-stone-500 hover:text-amber-800 transition-colors flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-stone-300/70 hover:border-amber-700/40 hover:bg-amber-50/40">
          <RefreshCw className="w-3.5 h-3.5" />new trip
        </button>
      </div>
      <div className="ridge h-[3px]" />
    </header>
  );
}

// ─── Meals Tab ────────────────────────────────────────────────────────────────

function MealsTab({ recipes, selected, multipliers, lastCooked, mealPlan, onToggle, onSetMultiplier, onToggleFavorite, onAssignDay, onEdit, onAddRecipe }) {
  const [assigningDay, setAssigningDay] = useState(null);
  const [search, setSearch] = useState("");

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // Meals that are selected but not yet assigned to a day
  const unplanned = selected.filter((id) => !Object.values(mealPlan).includes(id));

  const filteredForPicker = [...recipes]
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="pt-4">
      <SectionHeader eyebrow="step one" title="this week's plan" subtitle="tap a day to assign a meal. use the recipes tab to browse your full collection." />

      {/* 7-day calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {DAYS.map((day, idx) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + idx);
          const isToday = date.toDateString() === today.toDateString();
          const assignedId = mealPlan[String(idx)];
          const assignedRecipe = assignedId ? recipes.find((r) => r.id === assignedId) : null;
          const isPicking = assigningDay === idx;

          return (
            <button
              key={idx}
              onClick={() => setAssigningDay(isPicking ? null : idx)}
              className={"flex flex-col rounded-2xl p-2 text-center transition-all border card-shadow " + (
                isPicking ? "border-amber-700 bg-amber-50 ring-2 ring-amber-700/20"
                : isToday ? "border-amber-700/40 bg-amber-50/30"
                : assignedRecipe ? "border-stone-300 bg-white"
                : "border-stone-200/60 bg-white/50"
              )}
            >
              <div className={"text-[10px] font-bold uppercase tracking-wider " + (isToday ? "text-amber-800" : "text-stone-400")}>{day}</div>
              <div className={"text-sm font-semibold mb-1 " + (isToday ? "text-amber-800" : "text-stone-600")}>{date.getDate()}</div>
              {assignedRecipe ? (
                <div className="text-[9px] leading-tight text-stone-700 font-medium flex-1 flex items-start" style={{display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden",textAlign:"left"}}>{assignedRecipe.name}</div>
              ) : (
                <div className="text-stone-300 text-base flex-1 flex items-center justify-center">+</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Meal picker dropdown */}
      {assigningDay !== null && (
        <div className="bg-white rounded-2xl border border-amber-700/30 p-4 mb-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-lg text-stone-800">
              {DAYS[assigningDay]}, {new Date(startOfWeek.getTime() + assigningDay * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              {mealPlan[String(assigningDay)] && (
                <button onClick={() => { onAssignDay(assigningDay, null); setAssigningDay(null); }} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded-full border border-red-200 hover:bg-red-50">
                  clear
                </button>
              )}
              <button onClick={() => setAssigningDay(null)} className="text-stone-400 hover:text-stone-600 p-1"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search recipes…" className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50" />
          </div>
          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
            {filteredForPicker.map((r) => {
              const isAssigned = mealPlan[String(assigningDay)] === r.id;
              const isSel = selected.includes(r.id);
              return (
                <button key={r.id} onClick={() => { onAssignDay(assigningDay, r.id); setAssigningDay(null); setSearch(""); }}
                  className={"text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 " + (isAssigned ? "bg-amber-800 text-amber-50" : "hover:bg-stone-50 text-stone-700")}>
                  <span className="flex-1">{r.name}</span>
                  {r.category && r.category !== "Other" && (
                    <span className={"text-[10px] uppercase tracking-wider shrink-0 " + (isAssigned ? "text-amber-200" : "text-stone-400")}>{r.category}</span>
                  )}
                  {isSel && !isAssigned && <span className="text-[9px] text-emerald-600 font-semibold shrink-0">✓ added</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected meals not yet assigned to a day */}
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
                <div key={id} className="bg-white rounded-xl border border-amber-700/30 bg-amber-50/30 card-shadow">
                  <div className="flex items-stretch">
                    <button onClick={() => onToggle(r.id)} className="flex-1 flex items-center gap-3 p-3 text-left">
                      <Checkbox checked={true} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-display text-lg leading-tight text-stone-900">{r.name}</span>
                          {r.category && r.category !== "Other" && <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">{r.category}</span>}
                        </div>
                        {ings.length > 0 && (
                          <div className="text-xs text-stone-500 truncate mt-0.5">{ings.slice(0, 4).map((i) => i.name).join(" · ")}{ings.length > 4 && " +" + (ings.length - 4)}</div>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center pr-2 gap-1">
                      <div className="flex items-center gap-0.5 bg-stone-100 rounded-full px-1.5 py-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onSetMultiplier(r.id, mult - 1)} disabled={mult <= 1} className="w-5 h-5 rounded-full flex items-center justify-center text-stone-600 hover:bg-white disabled:opacity-30 font-bold text-sm transition-colors">−</button>
                        <span className="text-xs font-bold text-amber-800 min-w-[22px] text-center">{mult}×</span>
                        <button onClick={() => onSetMultiplier(r.id, mult + 1)} disabled={mult >= 10} className="w-5 h-5 rounded-full flex items-center justify-center text-stone-600 hover:bg-white disabled:opacity-30 font-bold text-sm transition-colors">+</button>
                      </div>
                      <button onClick={() => onEdit(r)} className="p-2 text-stone-400 hover:text-stone-700"><Edit3 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {Object.keys(mealPlan).length === 0 && selected.length === 0 && (
        <EmptyState icon={<ChefHat className="w-8 h-8" />} message="tap a day above to plan your meals, or browse the recipes tab." />
      )}

      {/* Quick add button */}
      <div className="flex justify-center pt-2">
        <button onClick={onAddRecipe} className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-amber-800 px-4 py-2 rounded-full border border-stone-200 hover:border-amber-700/40 transition-colors">
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
                    className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border text-left transition-all card-shadow ${
                      isPartial ? "border-amber-600/40 bg-amber-50/30" :
                      have ? "border-emerald-700/30 bg-emerald-50/40" : "border-stone-200/70"
                    }`}
                  >
                    <Checkbox checked={have} green={!isPartial} amber={isPartial} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${have ? "text-stone-400 strike" : "text-stone-800"}`}>{name}</div>
                      {have && haveQty ? (
                        <div className="text-[11px] text-amber-700 mt-0.5">have {haveQty} · need {subtractQuantity(neededQty, haveQty) || "none"}</div>
                      ) : neededQty && !have ? (
                        <div className="text-[11px] text-stone-400 mt-0.5">{neededQty}</div>
                      ) : null}
                    </div>
                    {info?.count > 1 && <span className="text-[10px] font-semibold text-amber-800/80 bg-amber-100/60 rounded-full px-2 py-0.5 shrink-0">×{info.count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quantity popup */}
      {qtyPopup && (
        <div className="fixed inset-0 bg-stone-900/40 z-40 flex items-end sm:items-center justify-center p-4" onClick={() => setQtyPopup(null)}>
          <div className="bg-[#FBF6EC] rounded-2xl w-full max-w-sm p-5 card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-xl mb-1">{qtyPopup.name}</div>
            {qtyPopup.needed && (
              <div className="text-xs text-stone-500 mb-4">needed: <span className="font-semibold text-stone-700">{qtyPopup.needed}</span></div>
            )}
            <div className="text-sm font-medium text-stone-700 mb-3">How much do you have?</div>

            {/* Partial quantity input */}
            <div className="flex gap-2 mb-4">
              <input
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && qtyInput.trim() && handleHavePartial(qtyPopup.name)}
                placeholder={`e.g. ${qtyPopup.needed ? "half of " + qtyPopup.needed : "1 cup"}`}
                autoFocus
                className="flex-1 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10"
              />
              <button
                onClick={() => qtyInput.trim() && handleHavePartial(qtyPopup.name)}
                disabled={!qtyInput.trim()}
                className="bg-amber-800 text-amber-50 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-900 disabled:opacity-40"
              >
                partial
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleHaveAll(qtyPopup.name)}
                className="flex-1 bg-emerald-700 text-white py-2.5 rounded-full text-sm font-medium hover:bg-emerald-800"
              >
                ✓ I have all of it
              </button>
              <button onClick={() => setQtyPopup(null)} className="px-4 py-2.5 text-stone-500 text-sm font-medium hover:text-stone-700">
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
          <input value={inputQty} onChange={(e) => setInputQty(e.target.value)} placeholder="qty" className="w-20 px-3 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50 shrink-0" />
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="add an item…" className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10" />
          <button onClick={handleAdd} className="bg-stone-900 text-amber-50 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800 shrink-0"><Plus className="w-4 h-4" />add</button>
        </div>
        {/* Type toggle */}
        <div className="flex gap-2 px-1">
          <button
            onClick={() => setIsStaple(false)}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors border ${!isStaple ? "bg-amber-800 text-amber-50 border-amber-800" : "bg-white text-stone-500 border-stone-200"}`}
          >
            one-time extra
          </button>
          <button
            onClick={() => setIsStaple(true)}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors border ${isStaple ? "bg-red-700 text-white border-red-700" : "bg-white text-stone-500 border-stone-200"}`}
          >
            🔴 running low
          </button>
        </div>
      </div>

      {/* Running Low section */}
      <div className="mb-6">
        <SectionLabel name="Running Low" count={staples.filter((e) => e.active).length + " / " + staples.length} />
        <p className="text-xs text-stone-400 mb-3 px-1">These always appear on your shopping list until you remove them.</p>
        {staples.length === 0 ? (
          <div className="text-xs text-stone-400 italic px-1">nothing flagged as running low yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {staples.map((item) => (
              <ExtraItem key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} onUpdateQty={onUpdateQty} accentClass="border-red-200 bg-red-50/30" activeAccentClass="border-red-400/50 bg-red-50/60" />
            ))}
          </div>
        )}
      </div>

      {/* One-time extras section */}
      <div>
        <SectionLabel name="One-Time Extras" count={oneTime.filter((e) => e.active).length + " / " + oneTime.length} />
        <p className="text-xs text-stone-400 mb-3 px-1">Tap to add to this trip's list.</p>
        {oneTime.length === 0 ? (
          <div className="text-xs text-stone-400 italic px-1">no extras added yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {oneTime.map((item) => (
              <ExtraItem key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} onUpdateQty={onUpdateQty} accentClass="border-amber-700/40 bg-amber-50/40" activeAccentClass="border-amber-700/40 bg-amber-50/40" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExtraItem({ item, onToggle, onDelete, onUpdateQty, accentClass, activeAccentClass }) {
  return (
    <div className={`group flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border card-shadow ${item.active ? activeAccentClass : "border-stone-200/70"}`}>
      <button onClick={() => onToggle(item.id)} className="flex items-center gap-2 flex-1 text-left min-w-0">
        <Checkbox checked={item.active} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate ${item.active ? "text-stone-800" : "text-stone-600"}`}>{item.name}</div>
        </div>
      </button>
      <input
        value={item.quantity || ""}
        onChange={(e) => onUpdateQty(item.id, e.target.value)}
        placeholder="qty"
        className="w-16 text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-amber-700/50 text-stone-600 shrink-0"
      />
      <button onClick={() => onDelete(item.id)} className="text-stone-300 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
        const qty = item.quantities && item.quantities.length > 0 ? item.quantities.join(" + ") : "";
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
              const qty = item.quantities && item.quantities.length > 0 ? item.quantities.join(" + ") : "";
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
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-stone-300/70 text-stone-500 hover:text-amber-800 hover:border-amber-700/40 hover:bg-amber-50/40 transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          print
        </button>
      </div>
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.section}>
            <SectionLabel name={g.section} count={g.items.length} />
            <div className="bg-white rounded-xl border border-stone-200/70 card-shadow divide-y divide-stone-100">
              {g.items.map((item) => {
                const isChecked = checked.includes(item.name);
                const qtyDisplay = item.quantities && item.quantities.length > 0 ? item.quantities.join(" + ") : "";
                return (
                  <div key={item.name} className={`flex items-center gap-3 px-4 py-3 transition-colors ${isChecked ? "bg-stone-50" : ""}`}>
                    <button onClick={() => onToggle(item.name)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                      <Checkbox checked={isChecked} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isChecked ? "text-stone-400 strike" : "text-stone-900"}`}>{item.name}</div>
                        {(qtyDisplay || item.count > 1) && (
                          <div className={`text-xs mt-0.5 ${isChecked ? "text-stone-400" : "text-stone-500"}`}>
                            {qtyDisplay}{item.count > 1 ? ` · needed for ${item.count} recipes` : ""}
                          </div>
                        )}
                      </div>
                    </button>
                    <button onClick={() => setReassigning(reassigning === item.name ? null : item.name)} className="text-stone-300 hover:text-stone-600 text-base px-1 shrink-0">⋯</button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {reassigning && (
        <div className="fixed inset-0 bg-stone-900/40 z-40 flex items-end sm:items-center justify-center p-4" onClick={() => setReassigning(null)}>
          <div className="bg-[#FBF6EC] rounded-2xl w-full max-w-sm p-5 card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-xl mb-1">Move "{reassigning}"</div>
            <div className="text-xs text-stone-500 mb-4">currently in {getSection(reassigning, sections)}</div>
            <div className="grid gap-1.5 max-h-80 overflow-y-auto">
              {SECTION_ORDER.map((s) => (
                <button key={s} onClick={() => { onSetSection(reassigning, s); setReassigning(null); }} className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${getSection(reassigning, sections) === s ? "bg-stone-900 text-amber-50" : "bg-white border border-stone-200 hover:bg-stone-50"}`}>{s}</button>
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
    <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-[#FBF6EC] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-5 border-b border-stone-200/70">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500 font-semibold">{String(recipe.id).startsWith("new") ? "new recipe" : "edit recipe"}</div>
            <div className="font-display text-2xl text-stone-900 mt-0.5">{name || "untitled"}</div>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5"><Link className="w-3.5 h-3.5" />import recipe</div>
            <div className="text-xs text-stone-500 mb-3">Paste a URL to try auto-import, or print the recipe to PDF and upload it for guaranteed results.</div>

            {/* URL row */}
            <div className="flex gap-2 mb-2">
              <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !importing && handleUrlImport()} placeholder="https://recipe-site.com/recipe" className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50" disabled={importing} />
              <button onClick={handleUrlImport} disabled={importing || !importUrl.trim()} className="bg-amber-800 text-amber-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-amber-900 disabled:opacity-50 whitespace-nowrap">
                {importing ? <Loader2 className="w-4 h-4 spin" /> : <Link className="w-4 h-4" />}
                {importing ? "importing…" : "try url"}
              </button>
            </div>

            {/* PDF row */}
            <div className="flex gap-2 items-center">
              <div className="flex-1 text-xs text-stone-500 italic">or upload a PDF (File → Print → Save as PDF in your browser)</div>
              <input ref={fileRef} type="file" accept="application/pdf" onChange={handlePdfImport} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={importing} className="bg-stone-700 text-amber-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800 disabled:opacity-50 whitespace-nowrap shrink-0">
                {importing ? <Loader2 className="w-4 h-4 spin" /> : <Plus className="w-4 h-4" />}
                upload pdf
              </button>
            </div>

            {importError && <div className="text-xs text-red-700 mt-2">{importError}</div>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. chicken alfredo" className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">recipe url <span className="lowercase italic font-normal">(optional)</span></label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">notes <span className="lowercase italic font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Serving size, cook time reminders, variations… e.g. 'double the sauce for 6 people'"
              rows={3}
              className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">cook time</label>
              <input value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder="e.g. 35 mins" className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">servings</label>
              <input value={servings} onChange={(e) => setServings(e.target.value)} placeholder="e.g. 4–6" className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10" />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">category</label>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {RECIPE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-xs font-medium ${category === c ? "bg-amber-800 text-amber-50" : "bg-white text-stone-600 border border-stone-200"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div ref={ingredientsRef}>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">ingredients <span className="lowercase italic font-normal">({ingredients.length})</span></label>
            {ingredients.length > 0 && (
              <p className="text-[11px] text-stone-400 mt-0.5 mb-1.5">tap any name or qty to edit before saving</p>
            )}
            <div className="flex gap-2 mt-1.5">
              <input value={newIngQty} onChange={(e) => setNewIngQty(e.target.value)} placeholder="qty" className="w-20 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 shrink-0" />
              <input value={newIngName} onChange={(e) => setNewIngName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addIngredient()} placeholder="ingredient name" className="flex-1 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50" />
              <button onClick={addIngredient} className="bg-stone-900 text-amber-50 px-3 rounded-lg hover:bg-stone-800 shrink-0"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="mt-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: ingredients.length > 5 ? "400px" : "260px" }}>
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg">
                  <input value={ing.quantity} onChange={(e) => updateIngredient(idx, "quantity", e.target.value)} placeholder="qty" className="w-20 text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-amber-700/50 shrink-0 text-stone-600" />
                  <input value={ing.name} onChange={(e) => updateIngredient(idx, "name", e.target.value)} placeholder="ingredient name" className="text-sm text-stone-800 flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:bg-stone-50 rounded px-1 -mx-1" />
                  <select value={getSection(ing.name, sections)} onChange={(e) => onSetSection(ing.name, e.target.value)} className="text-[10px] uppercase tracking-wider bg-stone-100 px-2 py-1 rounded-md text-stone-600 border-0 focus:outline-none shrink-0 max-w-[110px]">
                    {SECTION_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => removeIngredient(idx)} className="text-stone-300 hover:text-red-700 shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {ingredients.length === 0 && <div className="text-xs text-stone-400 italic px-1 py-2">no ingredients added yet</div>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-stone-200/70 bg-[#F6EFE2]/50">
          {onDelete ? (
            <button onClick={onDelete} className="text-red-700/80 hover:text-red-800 text-sm font-medium flex items-center gap-1.5"><Trash2 className="w-4 h-4" />delete</button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-medium">cancel</button>
            <button onClick={handleSave} disabled={saving} className="bg-stone-900 text-amber-50 px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800 disabled:opacity-60">
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
  return (
    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
      checked
        ? amberProp ? "bg-amber-600 border-amber-600"
        : green ? "bg-emerald-700 border-emerald-700"
        : "bg-amber-800 border-amber-800"
        : "bg-white border-stone-300"
    }`}>
      {checked && <Check className="w-3 h-3 text-amber-50" strokeWidth={3.5} />}
    </span>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500 font-semibold">{eyebrow}</div>
      <h2 className="font-display text-2xl sm:text-3xl text-stone-900 leading-tight mt-0.5">{title}</h2>
      {subtitle && <p className="text-sm text-stone-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function SectionLabel({ name, count }) {
  return (
    <div className="flex items-baseline gap-2 mb-2 px-1">
      <span className="font-display text-sm uppercase tracking-[0.18em] text-amber-800/90 font-semibold">{name}</span>
      <span className="flex-1 h-px bg-amber-800/15" />
      {count != null && <span className="text-[10px] text-stone-500 font-semibold">{count}</span>}
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="text-center py-16 text-stone-400">
      <div className="inline-flex p-4 bg-white/60 rounded-full mb-3">{icon}</div>
      <div className="text-sm">{message}</div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ tab, setTab, counts }) {
  const items = [
    { key: "meals", label: "meals", icon: ChefHat, badge: counts.meals },
    { key: "recipes", label: "recipes", icon: BookOpen, badge: 0 },
    { key: "pantry", label: "pantry", icon: Package, badge: counts.pantry },
    { key: "extras", label: "extras", icon: PlusCircle, badge: counts.extras },
    { key: "list", label: "list", icon: ShoppingCart, badge: counts.list },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#FBF6EC]/95 backdrop-blur-md border-t border-stone-200/70">
      <div className="max-w-3xl mx-auto px-2 py-2 flex">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.key;
          return (
            <button key={it.key} onClick={() => setTab(it.key)} className="flex-1 flex flex-col items-center py-2 gap-0.5 relative">
              <div className={`p-2 rounded-full transition-colors relative ${active ? "bg-stone-900 text-amber-50" : "text-stone-500"}`}>
                <Icon className="w-4 h-4" />
                {it.badge > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center ${active ? "bg-amber-50 text-stone-900 border border-stone-900" : "bg-amber-700 text-amber-50"}`}>
                    {it.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] uppercase tracking-wider ${active ? "text-stone-900 font-semibold" : "text-stone-500"}`}>{it.label}</span>
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search recipes" className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-stone-200 rounded-full text-xs px-3 py-2.5 text-stone-600 focus:outline-none focus:border-amber-700/50">
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="recent">Recently made</option>
          <option value="ingredients">Most ingredients</option>
        </select>
        <button onClick={onAddRecipe} className="bg-stone-900 text-amber-50 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800 shrink-0">
          <Plus className="w-4 h-4" />new
        </button>
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {["All", "Favorites", ...RECIPE_CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCat === c ? (c === "Favorites" ? "bg-red-600 text-white" : "bg-amber-800 text-amber-50") : "bg-white text-stone-600 border border-stone-200"}`}>
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
                className={`text-left bg-white rounded-2xl border card-shadow p-4 hover:border-amber-700/30 hover:bg-amber-50/20 transition-all ${isSelected ? "border-amber-700/40 bg-amber-50/30" : "border-stone-200/70"}`}
              >
                {/* Top row: category/selected badge + favorite heart + link */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-amber-800 text-amber-50" : "bg-stone-100 text-stone-500"
                  }`}>
                    {isSelected ? "✓ this week" : (r.category || "Other")}
                  </span>
                  <div className="flex items-center gap-2">
                    {ago && <span className="text-[10px] text-stone-400">{ago}</span>}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(r.id); }}
                      className={`text-base transition-colors ${r.is_favorite ? "text-red-500" : "text-stone-300 hover:text-red-400"}`}
                    >
                      {r.is_favorite ? "♥" : "♡"}
                    </button>
                    {r.url && <ExternalLink className="w-3.5 h-3.5 text-stone-300" />}
                  </div>
                </div>

                {/* Name */}
                <div className="font-display text-xl leading-tight text-stone-900 mb-2">{r.name}</div>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-stone-400 mb-2">
                  {r.cook_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.cook_time}</span>}
                  {r.servings && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.servings}</span>}
                  {ings.length > 0 && <span>{ings.length} ingredient{ings.length !== 1 ? "s" : ""}</span>}
                </div>

                {/* Notes preview */}
                {r.notes && <div className="text-xs text-stone-400 italic line-clamp-2 mb-2">{r.notes}</div>}

                {/* Ingredient chips */}
                {ings.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ings.slice(0, 4).map((ing, i) => (
                      <span key={i} className="text-[10px] bg-stone-100 text-stone-500 rounded-full px-2 py-0.5">{ing.name}</span>
                    ))}
                    {ings.length > 4 && <span className="text-[10px] text-stone-400">+{ings.length - 4} more</span>}
                  </div>
                ) : (
                  <div className="text-xs text-amber-700/60 italic">no ingredients yet</div>
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
    <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-[#FBF6EC] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 border-b border-stone-200/70">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{recipe.category || "Other"}</span>
                {recipe.url && (
                  <a href={recipe.url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="text-stone-400 hover:text-amber-800" title="view recipe site">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {recipe.pdf_url && (
                  <a href={recipe.pdf_url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full hover:bg-amber-200/70 transition-colors" title="view saved PDF">
                    PDF
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
                  className={`text-lg transition-colors ${recipe.is_favorite ? "text-red-500" : "text-stone-300 hover:text-red-400"}`}
                >
                  {recipe.is_favorite ? "♥" : "♡"}
                </button>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-stone-900 leading-tight">{recipe.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                {recipe.cook_time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{recipe.cook_time}</span>}
                {recipe.servings && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{recipe.servings} servings</span>}
                {ings.length > 0 && <span>{ings.length} ingredients</span>}
                {timeAgo(lastCooked[recipe.id]) && <span className="text-stone-400 text-xs">{timeAgo(lastCooked[recipe.id])}</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 shrink-0"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Notes */}
          {recipe.notes && (
            <div className="bg-amber-50/60 border border-amber-200/40 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-800 mb-1">Notes</div>
              <p className="text-sm text-stone-700 leading-relaxed">{recipe.notes}</p>
            </div>
          )}

          {/* Ingredients */}
          {ings.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500 font-semibold mb-3">Ingredients</div>
              <div className="space-y-1.5">
                {ings.map((ing, idx) => (
                  <div key={idx} className="flex items-baseline justify-between px-3 py-2 bg-white rounded-lg border border-stone-200/70">
                    <span className="text-sm text-stone-800 font-medium">{ing.name}</span>
                    {ing.quantity && <span className="text-xs text-stone-400 ml-2 shrink-0">{ing.quantity}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ings.length === 0 && (
            <div className="text-sm text-stone-400 italic text-center py-4">No ingredients added yet.</div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 p-5 border-t border-stone-200/70 bg-[#F6EFE2]/50">
          <button
            onClick={onToggle}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-amber-800 text-amber-50 hover:bg-amber-900"
            }`}
          >
            {isSelected ? "✓ added to this week" : "+ add to this week"}
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-4 py-2.5 border border-stone-300 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50">
            <Edit3 className="w-4 h-4" />edit
          </button>
        </div>
      </div>
    </div>
  );
}
