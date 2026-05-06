import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChefHat, ShoppingCart, Package, PlusCircle, Search, X, Check,
  Trash2, Edit3, ExternalLink, RefreshCw, Plus, Save, Link, Loader2,
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
  const [rr, er, sr, stateR] = await Promise.all([
    supabase.from("recipes").select("*").order("name"),
    supabase.from("extras").select("*").order("sort_order"),
    supabase.from("sections").select("*"),
    supabase.from("shopping_state").select("*").eq("id", "current").single(),
  ]);
  const sections = {};
  (sr.data || []).forEach((r) => { sections[r.ingredient] = r.section; });
  const st = stateR.data || {};
  return {
    recipes: rr.data || [],
    extras: er.data || [],
    sections,
    selectedMeals: st.selected_meals || [],
    pantryItems: st.pantry_items || [],
    checkedItems: st.checked_items || [],
  };
}

async function saveState(sel, pantry, checked) {
  await supabase.from("shopping_state").upsert({ id: "current", selected_meals: sel, pantry_items: pantry, checked_items: checked });
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
  const [pantryItems, setPantryItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [tab, setTab] = useState("meals");
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [toast, setToast] = useState("");
  const stateTimer = useRef(null);

  useEffect(() => {
    seedIfEmpty().then(fetchAll).then((d) => {
      setRecipes(d.recipes);
      setExtras(d.extras);
      setSections(d.sections);
      setSelectedMeals(d.selectedMeals);
      setPantryItems(d.pantryItems);
      setCheckedItems(d.checkedItems);
    });
  }, []);

  useEffect(() => {
    if (recipes === null) return;
    if (stateTimer.current) clearTimeout(stateTimer.current);
    stateTimer.current = setTimeout(() => saveState(selectedMeals, pantryItems, checkedItems), 600);
  }, [selectedMeals, pantryItems, checkedItems]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2000); }

  if (recipes === null) return <LoadingScreen />;

  // Aggregate: name -> { count, quantities[] }
  const agg = {};
  selectedMeals.forEach((id) => {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    (recipe.ingredients || []).forEach((raw) => {
      const { name, quantity } = normIng(raw);
      if (!name) return;
      if (!agg[name]) agg[name] = { count: 0, quantities: [] };
      agg[name].count += 1;
      if (quantity) agg[name].quantities.push(quantity);
    });
  });

  const allIngredients = Object.keys(agg).sort();

  const shoppingGroups = (() => {
    const map = {};
    Object.entries(agg).forEach(([name, info]) => {
      if (pantryItems.includes(name)) return;
      const sec = getSection(name, sections);
      if (!map[sec]) map[sec] = [];
      map[sec].push({ name, count: info.count, quantities: info.quantities });
    });
    extras.filter((e) => e.active).forEach((e) => {
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

  const pantrySkipCount = pantryItems.filter((p) => agg[p]).length;
  const totalItems = shoppingGroups.reduce((s, g) => s + g.items.length, 0);

  function toggleMeal(id) {
    setSelectedMeals((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  function togglePantry(name) {
    setPantryItems((p) => p.includes(name) ? p.filter((x) => x !== name) : [...p, name]);
  }

  async function toggleExtra(id) {
    const e = extras.find((x) => x.id === id);
    if (!e) return;
    await supabase.from("extras").update({ active: !e.active }).eq("id", id);
    setExtras((p) => p.map((x) => x.id === id ? { ...x, active: !x.active } : x));
  }

  async function addExtra(name, quantity = "") {
    if (!name.trim()) return;
    const { data } = await supabase.from("extras").insert({ name: name.trim(), quantity: quantity.trim(), active: true, sort_order: extras.length }).select().single();
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
    const payload = { name: recipe.name, url: recipe.url || null, category: recipe.category, ingredients: recipe.ingredients };
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

  async function startNewTrip() {
    if (!confirm("Start a new trip? Clears selected meals, pantry checks, and shopping check-offs.")) return;
    setSelectedMeals([]); setPantryItems([]); setCheckedItems([]);
    await supabase.from("extras").update({ active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    setExtras((p) => p.map((e) => ({ ...e, active: false })));
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
              onToggle={toggleMeal}
              onEdit={setEditingRecipe}
              onAddRecipe={() => setEditingRecipe({ id: "new", name: "", url: "", category: "Other", ingredients: [] })}
            />
          )}
          {tab === "pantry" && (
            <PantryTab
              ingredients={allIngredients}
              agg={agg}
              pantryItems={pantryItems}
              onToggle={togglePantry}
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
          counts={{ meals: selectedMeals.length, pantry: pantrySkipCount, extras: extras.filter((e) => e.active).length, list: totalItems }}
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

function MealsTab({ recipes, selected, onToggle, onEdit, onAddRecipe }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const filtered = recipes
    .filter((r) => filterCat === "All" || (r.category || "Other") === filterCat)
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const as = selected.includes(a.id), bs = selected.includes(b.id);
      if (as !== bs) return as ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <section className="pt-4">
      <SectionHeader eyebrow="step one" title="this week's meals" subtitle="tap to add to your week. selected meals stay pinned at the top." />
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search recipes" className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10" />
        </div>
        <button onClick={onAddRecipe} className="bg-stone-900 text-amber-50 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800">
          <Plus className="w-4 h-4" />new
        </button>
      </div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {["All", ...RECIPE_CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCat === c ? "bg-amber-800 text-amber-50" : "bg-white text-stone-600 border border-stone-200"}`}>{c}</button>
        ))}
      </div>
      <div className="grid gap-2">
        {filtered.map((r) => {
          const isSel = selected.includes(r.id);
          const ings = (r.ingredients || []).map(normIng);
          return (
            <div key={r.id} className={`group bg-white rounded-xl border transition-all card-shadow ${isSel ? "border-amber-700/40 bg-amber-50/40" : "border-stone-200/70"}`}>
              <div className="flex items-stretch">
                <button onClick={() => onToggle(r.id)} className="flex-1 flex items-center gap-3 p-3 text-left">
                  <Checkbox checked={isSel} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display text-lg leading-tight text-stone-900">{r.name}</span>
                      {r.category && r.category !== "Other" && <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">{r.category}</span>}
                    </div>
                    {ings.length > 0 ? (
                      <div className="text-xs text-stone-500 truncate mt-0.5">
                        {ings.slice(0, 4).map((i) => i.name).join(" · ")}{ings.length > 4 && ` +${ings.length - 4}`}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700/70 italic mt-0.5">no ingredients yet</div>
                    )}
                  </div>
                </button>
                <div className="flex items-center pr-2 gap-1">
                  {r.url && <a href={r.url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="p-2 text-stone-400 hover:text-amber-800"><ExternalLink className="w-4 h-4" /></a>}
                  <button onClick={() => onEdit(r)} className="p-2 text-stone-400 hover:text-stone-700"><Edit3 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-stone-400 text-sm">no meals match.</div>}
      </div>
    </section>
  );
}

// ─── Pantry Tab ───────────────────────────────────────────────────────────────

function PantryTab({ ingredients, agg, pantryItems, onToggle, skipCount, sections }) {
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
                const have = pantryItems.includes(name);
                const info = agg[name];
                const qty = info?.quantities?.[0] || "";
                return (
                  <button key={name} onClick={() => onToggle(name)} className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border text-left transition-all card-shadow ${have ? "border-emerald-700/30 bg-emerald-50/40" : "border-stone-200/70"}`}>
                    <Checkbox checked={have} green />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${have ? "text-stone-400 strike" : "text-stone-800"}`}>{name}</div>
                      {qty && <div className="text-[11px] text-stone-400 mt-0.5">{qty}</div>}
                    </div>
                    {info?.count > 1 && <span className="text-[10px] font-semibold text-amber-800/80 bg-amber-100/60 rounded-full px-2 py-0.5 shrink-0">×{info.count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Extras Tab ───────────────────────────────────────────────────────────────

function ExtrasTab({ extras, onToggle, onAdd, onDelete, onUpdateQty }) {
  const [input, setInput] = useState("");
  const [inputQty, setInputQty] = useState("");
  const sorted = [...extras].sort((a, b) => { if (a.active !== b.active) return a.active ? -1 : 1; return a.name.localeCompare(b.name); });
  function handleAdd() { if (input.trim()) { onAdd(input, inputQty); setInput(""); setInputQty(""); } }
  return (
    <section className="pt-4">
      <SectionHeader eyebrow="step three" title="extras & staples" subtitle="non-recipe items you need." />
      <div className="flex gap-2 mb-4">
        <input value={inputQty} onChange={(e) => setInputQty(e.target.value)} placeholder="qty" className="w-20 px-3 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50 shrink-0" />
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="add an item…" className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10" />
        <button onClick={handleAdd} className="bg-stone-900 text-amber-50 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800"><Plus className="w-4 h-4" />add</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {sorted.map((item) => (
          <div key={item.id} className={`group flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border card-shadow ${item.active ? "border-amber-700/40 bg-amber-50/40" : "border-stone-200/70"}`}>
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
            <button onClick={() => onDelete(item.id)} className="text-stone-300 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── List Tab ─────────────────────────────────────────────────────────────────

function ListTab({ groups, checked, onToggle, total, sections, onSetSection }) {
  const [reassigning, setReassigning] = useState(null);

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
      <SectionHeader eyebrow="the list" title="ready to shop" subtitle={`${checkedCount} of ${total} grabbed · grouped by store section`} />
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
  const [ingredients, setIngredients] = useState(
    (recipe.ingredients || []).map(normIng)
  );
  const [newIngName, setNewIngName] = useState("");
  const [newIngQty, setNewIngQty] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

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
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("url", importUrl.trim());
      const res = await fetch("/api/import-recipe", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      applyImportResult(data, data.url || importUrl.trim());
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
    await onSave({ ...recipe, name: name.trim(), url: url.trim(), category, ingredients });
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
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">category</label>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {RECIPE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-xs font-medium ${category === c ? "bg-amber-800 text-amber-50" : "bg-white text-stone-600 border border-stone-200"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">ingredients <span className="lowercase italic font-normal">({ingredients.length})</span></label>
            <div className="flex gap-2 mt-1.5">
              <input value={newIngQty} onChange={(e) => setNewIngQty(e.target.value)} placeholder="qty" className="w-20 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 shrink-0" />
              <input value={newIngName} onChange={(e) => setNewIngName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addIngredient()} placeholder="ingredient name" className="flex-1 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50" />
              <button onClick={addIngredient} className="bg-stone-900 text-amber-50 px-3 rounded-lg hover:bg-stone-800 shrink-0"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg">
                  <input value={ing.quantity} onChange={(e) => updateIngredient(idx, "quantity", e.target.value)} placeholder="qty" className="w-20 text-xs bg-stone-50 border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-amber-700/50 shrink-0 text-stone-600" />
                  <span className="text-sm text-stone-800 flex-1 min-w-0 truncate">{ing.name}</span>
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

function Checkbox({ checked, green }) {
  return (
    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? (green ? "bg-emerald-700 border-emerald-700" : "bg-amber-800 border-amber-800") : "bg-white border-stone-300"}`}>
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
