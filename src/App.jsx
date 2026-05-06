import { useState, useEffect, useRef } from "react";
import {
  ChefHat,
  ShoppingCart,
  Package,
  PlusCircle,
  Search,
  X,
  Check,
  Trash2,
  Edit3,
  ExternalLink,
  RefreshCw,
  Plus,
  Save,
} from "lucide-react";

// --------------------------------------------------------------------------
// SEED DATA (from your Google Sheet)
// --------------------------------------------------------------------------
const SEED_RECIPES = [
  { name: "Balsamic Pork Medallions", url: "https://www.nourish-and-fete.com/wprm_print/balsamic-pork-tenderloin-medallions", category: "Other", ingredients: ["Pork Tenderloin","Thyme","Rosemary","Sweet Paprika","Garlic Powder","Butter","Chicken Broth","Balsamic Vinaigrette"] },
  { name: "Beef Stew", url: "https://thecozycook.com/slow-cooker-beef-stew/", category: "Soup", ingredients: ["Beef Broth","Beef Roast","Potatoes","Carrots","Celery","Onion","Cabernet Sauvignon","Beef Bouillon Cubes","Worcestershire Sauce","Tomato Paste","Bay leaves","Corn Starch"] },
  { name: "Birria", url: "", category: "Other", ingredients: [] },
  { name: "Calzones", url: "", category: "Other", ingredients: [] },
  { name: "Chicken Alfredo", url: "", category: "Chicken", ingredients: [] },
  { name: "Chicken Parm", url: "", category: "Chicken", ingredients: ["Chicken","Pasta Sauce","Parmesan","Mozzarella"] },
  { name: "Dutch Oven Chicken", url: "https://biteswithbri.com/wprm_print/dutch-oven-chicken-breast", category: "Chicken", ingredients: ["Butter","Garlic","Thyme","Sage","Rosemary","Lemon","Chicken","Onion","White Wine","Flour","Chicken Broth"] },
  { name: "Flatbread Pizza", url: "", category: "Other", ingredients: ["Flatbread","Marinara","Shredded Cheese","Mozzarella","Pepperoni"] },
  { name: "Garlic Chicken", url: "https://simplehomeedit.com/recipe/creamy-garlic-chicken/", category: "Chicken", ingredients: ["Chicken","Paprika","Onion Powder","Thyme","Flour","Butter","Minced Garlic","Chicken Stock","Heavy Cream","Dijon Mustard","Parmesan","Potatoes"] },
  { name: "Ham & Cheese Sliders", url: "https://www.allrecipes.com/recipe/216756/baked-ham-and-cheese-party-sandwiches/", category: "Sandwich", ingredients: ["Butter","Dijon Mustard","Worcestershire Sauce","Poppy Seeds","Sandwhich Pickles","Hawaiian Rolls","Deli Ham","Cheddar Cheese"] },
  { name: "Kielbasa & Rice", url: "", category: "Other", ingredients: ["Kielbasa","Chicken Rice","Chicken Broth","Fire Roasted Tomatoes","Boursin Cheese"] },
  { name: "Lasagna Soup", url: "", category: "Soup", ingredients: ["Onion","Ricotta","Parmesan","Mozzarella","Thyme","Sage","Rosemary","Ground Sausage","Jarlic","Tomato Paste","Calabrian Chili Peppers","Chicken Bouillon","Tomato Sauce","Heavy Cream","Noodles"] },
  { name: "Pasta & Meatballs", url: "", category: "Other", ingredients: ["Pasta","Meatballs","Ground Sausage"] },
  { name: "Pepper Jack Soup", url: "", category: "Soup", ingredients: ["Onion","Peppers","Pepper Jack Cheese","Butter","Jarlic","Small Potatoes","Flour","White Wine","Chicken Broth","Ground Sausage","Heavy Cream","White Pepper","Cornstarch"] },
  { name: "Quesadillas", url: "", category: "Chicken", ingredients: ["Tortilla Shells","Shredded Cheddar","Butter","Chicken"] },
  { name: "Steak & Potatoes", url: "", category: "Steak", ingredients: [] },
  { name: "Steak Bowls", url: "", category: "Steak", ingredients: ["Ribeye Steak","Rice","Queso Fresco","Balsamic Vinaigrette","Lime Chips"] },
  { name: "Stir Fry - Chicken", url: "https://natashaskitchen.com/chicken-stir-fry-recipe/", category: "Chicken", ingredients: ["Chicken","Green Beans","Broccoli","Carrots","Peppers","Onion","Garlic Cloves","Chicken Broth","Soy Sauce","Honey","Corn Starch"] },
  { name: "Stir Fry - Steak", url: "https://natashaskitchen.com/chicken-stir-fry-recipe/", category: "Steak", ingredients: ["Steak","Green Beans","Broccoli","Carrots","Peppers","Onion","Garlic Cloves","Beef Broth","Soy Sauce","Honey","Corn Starch"] },
  { name: "Tortellini Soup", url: "https://www.smalltownwoman.com/wprm_print/sausage-tortellini-soup-recipe", category: "Soup", ingredients: ["Ground Sausage","Onion","Minced Garlic","Basil","Oregano","Parsley","Thyme","Red Pepper Flakes","Beef Broth","Tomato Paste","Fire Roasted Tomatoes","Chicken Broth","Cheese Tortellini","Spinach"] },
  { name: "Italian Wedding Soup", url: "", category: "Soup", ingredients: ["Ground Beef","Spicy Sausage","Breadcrumbs","Egg","Parmesan","Parsley","Garlic Powder","Onion Powder","Salt","Black Pepper","Paprika","Italian Seasoning","Calabrian Peppers","Avocado Oil","Onion","Celery","Carrots","Garlic Cloves","White Wine","Chicken Broth","Orzo","Spinach"] },
];

const SEED_EXTRAS = [
  "Little Potatoes","Cereal","Breakfast Crackers","Bagels","Chicken Nugs","Oatmilk",
  "Cold Foam","Bread","Ham","Salami","Keifer","Chocolate Chips","Toilet Paper","Paper Plates (Small)"
];

const SEED_SECTIONS = {
  // Produce
  "Basil":"Produce","Broccoli":"Produce","Carrots":"Produce","Celery":"Produce","Garlic":"Produce","Garlic Cloves":"Produce","Green Beans":"Produce","Jarlic":"Produce","Lemon":"Produce","Minced Garlic":"Produce","Onion":"Produce","Oregano":"Produce","Parsley":"Produce","Peppers":"Produce","Potatoes":"Produce","Rosemary":"Produce","Sage":"Produce","Small Potatoes":"Produce","Spinach":"Produce","Thyme":"Produce","Little Potatoes":"Produce",
  // Bakery
  "Flatbread":"Bakery","Hawaiian Rolls":"Bakery","Tortilla Shells":"Bakery","Bagels":"Bakery","Bread":"Bakery",
  // Dairy
  "Boursin Cheese":"Dairy","Butter":"Dairy","Cheddar Cheese":"Dairy","Cheese Tortellini":"Dairy","Egg":"Dairy","Heavy Cream":"Dairy","Mozzarella":"Dairy","Parmesan":"Dairy","Pepper Jack Cheese":"Dairy","Queso Fresco":"Dairy","Ricotta":"Dairy","Shredded Cheddar":"Dairy","Shredded Cheese":"Dairy","Oatmilk":"Dairy","Cold Foam":"Dairy","Keifer":"Dairy",
  // Meat
  "Beef Roast":"Meat","Chicken":"Meat","Deli Ham":"Meat","Ground Beef":"Meat","Ground Sausage":"Meat","Kielbasa":"Meat","Pepperoni":"Meat","Pork Tenderloin":"Meat","Ribeye Steak":"Meat","Spicy Sausage":"Meat","Steak":"Meat","Ham":"Meat","Salami":"Meat",
  // Dry Goods
  "Avocado Oil":"Dry Goods","Balsamic Vinaigrette":"Dry Goods","Bay leaves":"Dry Goods","Beef Bouillon Cubes":"Dry Goods","Beef Broth":"Dry Goods","Black Pepper":"Dry Goods","Breadcrumbs":"Dry Goods","Cabernet Sauvignon":"Dry Goods","Calabrian Chili Peppers":"Dry Goods","Calabrian Peppers":"Dry Goods","Chicken Bouillon":"Dry Goods","Chicken Broth":"Dry Goods","Chicken Rice":"Dry Goods","Chicken Stock":"Dry Goods","Corn Starch":"Dry Goods","Cornstarch":"Dry Goods","Dijon Mustard":"Dry Goods","Fire Roasted Tomatoes":"Dry Goods","Flour":"Dry Goods","Garlic Powder":"Dry Goods","Honey":"Dry Goods","Italian Seasoning":"Dry Goods","Lime Chips":"Dry Goods","Marinara":"Dry Goods","Noodles":"Dry Goods","Onion Powder":"Dry Goods","Orzo":"Dry Goods","Paprika":"Dry Goods","Pasta":"Dry Goods","Pasta Sauce":"Dry Goods","Poppy Seeds":"Dry Goods","Red Pepper Flakes":"Dry Goods","Rice":"Dry Goods","Salt":"Dry Goods","Sandwhich Pickles":"Dry Goods","Soy Sauce":"Dry Goods","Sweet Paprika":"Dry Goods","Tomato Paste":"Dry Goods","Tomato Sauce":"Dry Goods","White Pepper":"Dry Goods","White Wine":"Dry Goods","Worcestershire Sauce":"Dry Goods","Cereal":"Dry Goods","Breakfast Crackers":"Dry Goods","Chocolate Chips":"Dry Goods",
  // Frozen
  "Chicken Nugs":"Frozen","Meatballs":"Frozen",
  // Household
  "Toilet Paper":"Household","Paper Plates (Small)":"Household","Paper Plates (Large)":"Household",
};

const SECTION_ORDER = ["Produce","Bakery","Dairy","Meat","Dry Goods","Frozen","Household","Other"];
const CATEGORIES = ["Soup","Sandwich","Steak","Chicken","Other"];

const STORAGE_KEY = "shopping-app-data-v1";

// --------------------------------------------------------------------------
// PERSISTENCE
// --------------------------------------------------------------------------
async function loadData() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (result && result.value) return JSON.parse(result.value);
  } catch (e) {
    // key doesn't exist yet
  }
  // initialize with seed
  const recipes = SEED_RECIPES.map((r, i) => ({
    id: "r_" + i + "_" + Date.now(),
    ...r,
  }));
  return {
    recipes,
    sections: { ...SEED_SECTIONS },
    selectedMeals: [],
    pantryItems: [],
    extraItems: SEED_EXTRAS.map((name, i) => ({ id: "e_" + i, name, active: false })),
    checkedShoppingItems: [],
  };
}

async function saveData(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("save failed", e);
  }
}

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------
function uid(prefix = "id") {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

function getSection(name, sections) {
  return sections[name] || "Other";
}

function sectionOrder(s) {
  const i = SECTION_ORDER.indexOf(s);
  return i === -1 ? 999 : i;
}

// --------------------------------------------------------------------------
// MAIN APP
// --------------------------------------------------------------------------
export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("meals");
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [toast, setToast] = useState("");
  const saveTimer = useRef(null);

  // Load on mount
  useEffect(() => {
    loadData().then(setData);
  }, []);

  // Save when data changes (debounced)
  useEffect(() => {
    if (!data) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData(data), 400);
  }, [data]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  if (!data) return <LoadingScreen />;

  // Aggregate ingredients from selected meals
  const aggregatedIngredients = (() => {
    const counts = {};
    data.selectedMeals.forEach((id) => {
      const recipe = data.recipes.find((r) => r.id === id);
      if (!recipe) return;
      recipe.ingredients.forEach((ing) => {
        counts[ing] = (counts[ing] || 0) + 1;
      });
    });
    return counts;
  })();

  const allIngredientsList = Object.keys(aggregatedIngredients).sort();

  // Build the final shopping list grouped by section
  const shoppingListBySection = (() => {
    const map = {};
    // Recipe ingredients NOT in pantry
    Object.entries(aggregatedIngredients).forEach(([name, count]) => {
      if (data.pantryItems.includes(name)) return;
      const sec = getSection(name, data.sections);
      if (!map[sec]) map[sec] = [];
      map[sec].push({ name, count, source: "recipe" });
    });
    // Active extras
    data.extraItems.filter((e) => e.active).forEach((e) => {
      const sec = getSection(e.name, data.sections);
      if (!map[sec]) map[sec] = [];
      // merge if already exists
      const existing = map[sec].find((it) => it.name === e.name);
      if (existing) existing.count += 1;
      else map[sec].push({ name: e.name, count: 1, source: "extra" });
    });
    // sort each section alphabetically and sort sections
    const sortedSections = Object.keys(map).sort(
      (a, b) => sectionOrder(a) - sectionOrder(b)
    );
    return sortedSections.map((sec) => ({
      section: sec,
      items: map[sec].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  })();

  const selectedCount = data.selectedMeals.length;
  const pantrySkipCount = data.pantryItems.filter((p) =>
    Object.prototype.hasOwnProperty.call(aggregatedIngredients, p)
  ).length;
  const totalShoppingItems = shoppingListBySection.reduce(
    (sum, s) => sum + s.items.length,
    0
  );

  // ------------------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------------------
  function toggleMeal(id) {
    setData((d) => ({
      ...d,
      selectedMeals: d.selectedMeals.includes(id)
        ? d.selectedMeals.filter((x) => x !== id)
        : [...d.selectedMeals, id],
    }));
  }
  function togglePantry(name) {
    setData((d) => ({
      ...d,
      pantryItems: d.pantryItems.includes(name)
        ? d.pantryItems.filter((x) => x !== name)
        : [...d.pantryItems, name],
    }));
  }
  function toggleExtra(id) {
    setData((d) => ({
      ...d,
      extraItems: d.extraItems.map((e) =>
        e.id === id ? { ...e, active: !e.active } : e
      ),
    }));
  }
  function addExtra(name) {
    if (!name.trim()) return;
    setData((d) => ({
      ...d,
      extraItems: [
        ...d.extraItems,
        { id: uid("e"), name: name.trim(), active: true },
      ],
    }));
  }
  function deleteExtra(id) {
    setData((d) => ({ ...d, extraItems: d.extraItems.filter((e) => e.id !== id) }));
  }
  function toggleShoppingChecked(name) {
    setData((d) => ({
      ...d,
      checkedShoppingItems: d.checkedShoppingItems.includes(name)
        ? d.checkedShoppingItems.filter((x) => x !== name)
        : [...d.checkedShoppingItems, name],
    }));
  }
  function startNewTrip() {
    if (
      !confirm(
        "Start a new shopping trip? This clears selected meals, pantry checks, extras you added, and shopping check-offs. Recipes are kept."
      )
    )
      return;
    setData((d) => ({
      ...d,
      selectedMeals: [],
      pantryItems: [],
      extraItems: d.extraItems.map((e) => ({ ...e, active: false })),
      checkedShoppingItems: [],
    }));
    showToast("Fresh trip started");
    setTab("meals");
  }
  function saveRecipe(recipe) {
    setData((d) => {
      const exists = d.recipes.find((r) => r.id === recipe.id);
      let updated;
      if (exists) {
        updated = d.recipes.map((r) => (r.id === recipe.id ? recipe : r));
      } else {
        updated = [...d.recipes, recipe];
      }
      // also add any new ingredients to sections (default Other)
      const newSections = { ...d.sections };
      recipe.ingredients.forEach((ing) => {
        if (!newSections[ing]) newSections[ing] = "Other";
      });
      return { ...d, recipes: updated, sections: newSections };
    });
    showToast(recipe.id.startsWith("new") ? "Recipe added" : "Recipe saved");
    setEditingRecipe(null);
  }
  function deleteRecipe(id) {
    if (!confirm("Delete this recipe?")) return;
    setData((d) => ({
      ...d,
      recipes: d.recipes.filter((r) => r.id !== id),
      selectedMeals: d.selectedMeals.filter((x) => x !== id),
    }));
    setEditingRecipe(null);
  }
  function setIngredientSection(ing, section) {
    setData((d) => ({
      ...d,
      sections: { ...d.sections, [ing]: section },
    }));
  }

  return (
    <div className="font-body min-h-screen text-stone-800">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .font-body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .paper-bg {
          background-color: #FBF6EC;
          background-image:
            radial-gradient(circle at 25% 15%, rgba(160,69,39,0.04) 0%, transparent 40%),
            radial-gradient(circle at 75% 85%, rgba(92,107,63,0.04) 0%, transparent 40%);
        }
        .card-shadow { box-shadow: 0 1px 0 rgba(58,42,28,0.04), 0 2px 8px -2px rgba(58,42,28,0.08); }
        .ridge { background-image: repeating-linear-gradient(90deg, transparent 0 7px, rgba(58,42,28,0.05) 7px 8px); }
        .checkbox-tick { transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes slidein { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .slidein { animation: slidein 0.25s ease-out both; }
        .strike-through { text-decoration: line-through; text-decoration-color: rgba(160,69,39,0.6); text-decoration-thickness: 2px; }
      `}</style>

      <div className="paper-bg min-h-screen pb-28">
        <Header
          selectedCount={selectedCount}
          totalShoppingItems={totalShoppingItems}
          onNewTrip={startNewTrip}
        />

        <main className="max-w-3xl mx-auto px-4 pt-2">
          {tab === "meals" && (
            <MealsTab
              recipes={data.recipes}
              selected={data.selectedMeals}
              onToggle={toggleMeal}
              onEdit={(r) => setEditingRecipe(r)}
              onAddRecipe={() =>
                setEditingRecipe({
                  id: uid("new"),
                  name: "",
                  url: "",
                  category: "Other",
                  ingredients: [],
                })
              }
            />
          )}

          {tab === "pantry" && (
            <PantryTab
              ingredients={allIngredientsList}
              counts={aggregatedIngredients}
              pantryItems={data.pantryItems}
              onToggle={togglePantry}
              skipCount={pantrySkipCount}
              sections={data.sections}
            />
          )}

          {tab === "extras" && (
            <ExtrasTab
              extras={data.extraItems}
              onToggle={toggleExtra}
              onAdd={addExtra}
              onDelete={deleteExtra}
            />
          )}

          {tab === "list" && (
            <ListTab
              groups={shoppingListBySection}
              checked={data.checkedShoppingItems}
              onToggle={toggleShoppingChecked}
              total={totalShoppingItems}
              sections={data.sections}
              onSetSection={setIngredientSection}
            />
          )}
        </main>

        <BottomNav
          tab={tab}
          setTab={setTab}
          counts={{
            meals: selectedCount,
            pantry: pantrySkipCount,
            extras: data.extraItems.filter((e) => e.active).length,
            list: totalShoppingItems,
          }}
        />

        {editingRecipe && (
          <RecipeEditor
            recipe={editingRecipe}
            sections={data.sections}
            onSave={saveRecipe}
            onCancel={() => setEditingRecipe(null)}
            onDelete={
              !editingRecipe.id.startsWith("new")
                ? () => deleteRecipe(editingRecipe.id)
                : null
            }
            onSetSection={setIngredientSection}
          />
        )}

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 slidein">
            <div className="bg-stone-900 text-amber-50 px-5 py-2.5 rounded-full text-sm font-medium card-shadow">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// LOADING
// --------------------------------------------------------------------------
function LoadingScreen() {
  return (
    <div className="paper-bg min-h-screen flex items-center justify-center">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <div className="text-center">
        <div className="inline-block animate-spin">
          <ChefHat className="w-10 h-10 text-stone-400" />
        </div>
        <div
          className="mt-3 text-stone-500 text-sm"
          style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}
        >
          gathering ingredients…
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// HEADER
// --------------------------------------------------------------------------
function Header({ selectedCount, totalShoppingItems, onNewTrip }) {
  return (
    <header className="border-b border-stone-200/70 bg-[#FBF6EC]/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500 font-semibold">
            kitchen + market
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-700 leading-none mt-1 text-stone-900">
            <span style={{ fontWeight: 700 }}>Pantry</span>
            <span className="italic font-light text-amber-800/80"> & </span>
            <span style={{ fontWeight: 700 }}>List</span>
          </h1>
        </div>
        <button
          onClick={onNewTrip}
          className="text-stone-500 hover:text-amber-800 active:text-amber-900 transition-colors flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-stone-300/70 hover:border-amber-700/40 hover:bg-amber-50/40"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          new trip
        </button>
      </div>
      <div className="ridge h-[3px]"></div>
    </header>
  );
}

// --------------------------------------------------------------------------
// MEALS TAB
// --------------------------------------------------------------------------
function MealsTab({ recipes, selected, onToggle, onEdit, onAddRecipe, onShowAll }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const filtered = recipes
    .filter((r) =>
      filterCat === "All" ? true : (r.category || "Other") === filterCat
    )
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Selected first, then alpha
      const aSel = selected.includes(a.id);
      const bSel = selected.includes(b.id);
      if (aSel !== bSel) return aSel ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <section className="pt-4">
      <SectionHeader
        eyebrow="step one"
        title="this week's meals"
        subtitle="tap to add to your week. selected meals stay pinned at the top."
      />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search recipes"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10"
          />
        </div>
        <button
          onClick={onAddRecipe}
          className="bg-stone-900 text-amber-50 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800"
        >
          <Plus className="w-4 h-4" />
          new
        </button>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterCat === c
                ? "bg-amber-800 text-amber-50"
                : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {filtered.map((r) => {
          const isSelected = selected.includes(r.id);
          return (
            <div
              key={r.id}
              className={`group bg-white rounded-xl border transition-all card-shadow ${
                isSelected
                  ? "border-amber-700/40 bg-amber-50/40"
                  : "border-stone-200/70"
              }`}
            >
              <div className="flex items-stretch">
                <button
                  onClick={() => onToggle(r.id)}
                  className="flex-1 flex items-center gap-3 p-3 text-left"
                >
                  <Checkbox checked={isSelected} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display text-lg leading-tight text-stone-900">
                        {r.name}
                      </span>
                      {r.category && r.category !== "Other" && (
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                          {r.category}
                        </span>
                      )}
                    </div>
                    {r.ingredients.length > 0 && (
                      <div className="text-xs text-stone-500 truncate mt-0.5">
                        {r.ingredients.slice(0, 4).join(" · ")}
                        {r.ingredients.length > 4 && ` +${r.ingredients.length - 4}`}
                      </div>
                    )}
                    {r.ingredients.length === 0 && (
                      <div className="text-xs text-amber-700/70 italic mt-0.5">
                        no ingredients yet
                      </div>
                    )}
                  </div>
                </button>
                <div className="flex items-center pr-2">
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-stone-400 hover:text-amber-800"
                      title="open recipe"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onEdit(r)}
                    className="p-2 text-stone-400 hover:text-stone-700"
                    title="edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-stone-400 text-sm">
            no meals match. try a different search.
          </div>
        )}
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------
// PANTRY TAB
// --------------------------------------------------------------------------
function PantryTab({ ingredients, counts, pantryItems, onToggle, skipCount, sections }) {
  if (ingredients.length === 0) {
    return (
      <section className="pt-4">
        <SectionHeader
          eyebrow="step two"
          title="check your pantry"
          subtitle="select meals first and ingredients will show up here."
        />
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          message="no ingredients yet. pick some meals first."
        />
      </section>
    );
  }
  // group by section
  const grouped = {};
  ingredients.forEach((ing) => {
    const sec = getSection(ing, sections);
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(ing);
  });
  const orderedSections = Object.keys(grouped).sort(
    (a, b) => sectionOrder(a) - sectionOrder(b)
  );

  return (
    <section className="pt-4">
      <SectionHeader
        eyebrow="step two"
        title="check your pantry"
        subtitle={`tap items you already have. ${skipCount} of ${ingredients.length} marked.`}
      />
      <div className="space-y-5">
        {orderedSections.map((sec) => (
          <div key={sec}>
            <SectionLabel name={sec} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {grouped[sec].sort().map((ing) => {
                const have = pantryItems.includes(ing);
                const count = counts[ing];
                return (
                  <button
                    key={ing}
                    onClick={() => onToggle(ing)}
                    className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border text-left transition-all card-shadow ${
                      have
                        ? "border-emerald-700/30 bg-emerald-50/40"
                        : "border-stone-200/70"
                    }`}
                  >
                    <Checkbox checked={have} green />
                    <span
                      className={`flex-1 text-sm ${
                        have ? "text-stone-400 strike-through" : "text-stone-800"
                      }`}
                    >
                      {ing}
                    </span>
                    {count > 1 && (
                      <span className="text-[10px] font-semibold text-amber-800/80 bg-amber-100/60 rounded-full px-2 py-0.5">
                        ×{count}
                      </span>
                    )}
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

// --------------------------------------------------------------------------
// EXTRAS TAB
// --------------------------------------------------------------------------
function ExtrasTab({ extras, onToggle, onAdd, onDelete }) {
  const [input, setInput] = useState("");

  const sorted = [...extras].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  function handleAdd() {
    if (input.trim()) {
      onAdd(input);
      setInput("");
    }
  }

  return (
    <section className="pt-4">
      <SectionHeader
        eyebrow="step three"
        title="extras & staples"
        subtitle="non-recipe items you might need. household goods, snacks, etc."
      />

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="add an item…"
          className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10"
        />
        <button
          onClick={handleAdd}
          className="bg-stone-900 text-amber-50 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800"
        >
          <Plus className="w-4 h-4" />
          add
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {sorted.map((item) => (
          <div
            key={item.id}
            className={`group flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border card-shadow ${
              item.active ? "border-amber-700/40 bg-amber-50/40" : "border-stone-200/70"
            }`}
          >
            <button
              onClick={() => onToggle(item.id)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <Checkbox checked={item.active} />
              <span
                className={`text-sm ${item.active ? "text-stone-800" : "text-stone-600"}`}
              >
                {item.name}
              </span>
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="text-stone-300 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      {sorted.length === 0 && (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          message="no extras yet. add one above."
        />
      )}
    </section>
  );
}

// --------------------------------------------------------------------------
// LIST TAB (final shopping list)
// --------------------------------------------------------------------------
function ListTab({ groups, checked, onToggle, total, sections, onSetSection }) {
  const [reassigning, setReassigning] = useState(null);

  if (total === 0) {
    return (
      <section className="pt-4">
        <SectionHeader
          eyebrow="the list"
          title="ready to shop"
          subtitle="select meals and you'll see a tidy list grouped by store section."
        />
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8" />}
          message="nothing to buy yet."
        />
      </section>
    );
  }

  const checkedCount = groups.reduce(
    (n, g) => n + g.items.filter((i) => checked.includes(i.name)).length,
    0
  );

  return (
    <section className="pt-4">
      <SectionHeader
        eyebrow="the list"
        title="ready to shop"
        subtitle={`${checkedCount} of ${total} grabbed · grouped by store section`}
      />
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.section}>
            <SectionLabel name={g.section} count={g.items.length} />
            <div className="bg-white rounded-xl border border-stone-200/70 card-shadow divide-y divide-stone-100">
              {g.items.map((item) => {
                const isChecked = checked.includes(item.name);
                return (
                  <div
                    key={item.name}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isChecked ? "bg-stone-50" : ""
                    }`}
                  >
                    <button
                      onClick={() => onToggle(item.name)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <Checkbox checked={isChecked} />
                      <span
                        className={`flex-1 ${
                          isChecked
                            ? "text-stone-400 strike-through"
                            : "text-stone-900 font-medium"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.count > 1 && (
                        <span
                          className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                            isChecked
                              ? "text-stone-400 bg-stone-100"
                              : "text-amber-800 bg-amber-100/70"
                          }`}
                        >
                          ×{item.count}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setReassigning(reassigning === item.name ? null : item.name)
                      }
                      className="text-stone-300 hover:text-stone-600 text-xs"
                      title="change section"
                    >
                      ⋯
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {reassigning && (
        <div
          className="fixed inset-0 bg-stone-900/40 z-40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setReassigning(null)}
        >
          <div
            className="bg-[#FBF6EC] rounded-2xl w-full max-w-sm p-5 card-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display text-xl mb-1">Move "{reassigning}"</div>
            <div className="text-xs text-stone-500 mb-4">
              currently in {getSection(reassigning, sections)}
            </div>
            <div className="grid gap-1.5">
              {SECTION_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onSetSection(reassigning, s);
                    setReassigning(null);
                  }}
                  className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    getSection(reassigning, sections) === s
                      ? "bg-stone-900 text-amber-50"
                      : "bg-white border border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// --------------------------------------------------------------------------
// RECIPE EDITOR (modal)
// --------------------------------------------------------------------------
function RecipeEditor({ recipe, onSave, onCancel, onDelete, sections, onSetSection }) {
  const [name, setName] = useState(recipe.name);
  const [url, setUrl] = useState(recipe.url || "");
  const [category, setCategory] = useState(recipe.category || "Other");
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [newIng, setNewIng] = useState("");

  function addIngredient() {
    if (!newIng.trim()) return;
    // allow comma-separated batch add
    const parts = newIng.split(",").map((s) => s.trim()).filter(Boolean);
    setIngredients([...ingredients, ...parts]);
    setNewIng("");
  }
  function removeIngredient(idx) {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  }
  function handleSave() {
    if (!name.trim()) {
      alert("Give the recipe a name first.");
      return;
    }
    onSave({
      ...recipe,
      name: name.trim(),
      url: url.trim(),
      category,
      ingredients,
    });
  }

  return (
    <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-[#FBF6EC] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-5 border-b border-stone-200/70">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500 font-semibold">
              {recipe.id.startsWith("new") ? "new recipe" : "edit recipe"}
            </div>
            <div className="font-display text-2xl text-stone-900 mt-0.5">
              {name || "untitled"}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
              name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. chicken alfredo"
              className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
              recipe url <span className="lowercase italic font-normal">(optional)</span>
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
              category
            </label>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    category === c
                      ? "bg-amber-800 text-amber-50"
                      : "bg-white text-stone-600 border border-stone-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
              ingredients
            </label>
            <div className="flex gap-2 mt-1.5">
              <input
                value={newIng}
                onChange={(e) => setNewIng(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addIngredient()}
                placeholder="add ingredient (or paste comma-separated)"
                className="flex-1 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-700/10"
              />
              <button
                onClick={addIngredient}
                className="bg-stone-900 text-amber-50 px-3 rounded-lg hover:bg-stone-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-1">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg group"
                >
                  <span className="text-sm text-stone-800 flex-1">{ing}</span>
                  <select
                    value={getSection(ing, sections)}
                    onChange={(e) => onSetSection(ing, e.target.value)}
                    className="text-[10px] uppercase tracking-wider bg-stone-100 px-2 py-1 rounded-md text-stone-600 border-0 focus:outline-none"
                  >
                    {SECTION_ORDER.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="text-stone-300 hover:text-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {ingredients.length === 0 && (
                <div className="text-xs text-stone-400 italic px-1 py-2">
                  no ingredients added yet
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-stone-200/70 bg-[#F6EFE2]/50">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="text-red-700/80 hover:text-red-800 text-sm font-medium flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              delete
            </button>
          ) : (
            <span></span>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-medium"
            >
              cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-stone-900 text-amber-50 px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-stone-800"
            >
              <Save className="w-4 h-4" />
              save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SHARED COMPONENTS
// --------------------------------------------------------------------------
function Checkbox({ checked, green }) {
  return (
    <span
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        checked
          ? green
            ? "bg-emerald-700 border-emerald-700"
            : "bg-amber-800 border-amber-800"
          : "bg-white border-stone-300"
      }`}
    >
      {checked && <Check className="w-3 h-3 text-amber-50 checkbox-tick" strokeWidth={3.5} />}
    </span>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500 font-semibold">
        {eyebrow}
      </div>
      <h2 className="font-display text-2xl sm:text-3xl text-stone-900 leading-tight mt-0.5">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-stone-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function SectionLabel({ name, count }) {
  return (
    <div className="flex items-baseline gap-2 mb-2 px-1">
      <span className="font-display text-sm uppercase tracking-[0.18em] text-amber-800/90 font-semibold">
        {name}
      </span>
      <span className="flex-1 h-px bg-amber-800/15"></span>
      {count != null && (
        <span className="text-[10px] text-stone-500 font-semibold">
          {count}
        </span>
      )}
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

// --------------------------------------------------------------------------
// BOTTOM NAV
// --------------------------------------------------------------------------
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
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 relative"
            >
              <div
                className={`p-2 rounded-full transition-colors relative ${
                  active ? "bg-stone-900 text-amber-50" : "text-stone-500"
                }`}
              >
                <Icon className="w-4 h-4" />
                {it.badge > 0 && !active && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-700 text-amber-50 text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {it.badge}
                  </span>
                )}
                {it.badge > 0 && active && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-50 text-stone-900 text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-stone-900">
                    {it.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider ${
                  active ? "text-stone-900 font-semibold" : "text-stone-500"
                }`}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
