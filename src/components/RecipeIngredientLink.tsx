import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";

// Build a mapping of search terms to product IDs
function buildProductMap(products: { id: string; name: string }[]) {
  const map: { term: string; id: string; name: string }[] = [];

  for (const p of products) {
    const name = p.name.toLowerCase();
    // Add full product name
    map.push({ term: name, id: p.id, name: p.name });
  }

  // Sort by term length descending so longer matches are preferred
  map.sort((a, b) => b.term.length - a.term.length);
  return map;
}

// Known ingredient-to-product keyword mappings for Maharaja's products
const INGREDIENT_KEYWORDS: Record<string, string[]> = {
  "supreme mix curry powder": ["supreme mix curry powder", "curry powder"],
  "hot curry powder": ["hot curry powder", "curry powder"],
  "mild curry powder": ["mild curry powder", "curry powder"],
  "medium curry powder": ["medium curry powder", "curry powder"],
  "crushed ginger & garlic": ["crushed ginger & garlic", "ginger & garlic"],
  "crushed garlic": ["crushed garlic"],
  "breyani mix whole": ["breyani mix whole"],
  "breyani mix powder": ["breyani mix powder", "breyani masala"],
  "roasting vegetable seasoning": ["roasting vegetable seasoning"],
  "supreme masala mix": ["supreme masala mix", "3 in 1 masala", "all mix masala"],
  "steak & chops spice": ["steak & chops spice", "steak & chops"],
  "mnandi masala": ["mnandi masala"],
  "3-mix masala": ["3 mix masala", "3-mix masala"],
  "paprika": ["paprika"],
  "turmeric": ["turmeric"],


  "cinnamon": ["cinnamon sticks", "cinnamon stick"],
  "star aniseed": ["star aniseed"],
  "whole elachie": ["whole elachie"],

  "sugar beans": ["sugar beans"],
  "bay leaves": ["bay leaves"],
  "thyme": ["thyme"],
  "parsley": ["parsley"],

  "chicken stock": ["chicken stock"],
  "beef stock": ["beef stock"],
  "vegetable stock": ["vegetable stock"],
  "cayenne pepper": ["cayenne pepper"],
  "garlic powder": ["garlic powder"],
  "onion powder": ["onion powder"],
  "cajun spice": ["cajun spice"],
  "black pepper powder": ["black pepper powder", "black pepper"],
  "crushed chilli flakes": ["crushed chillies"],
  "dried thyme": ["thyme"],
  "chicken spice": ["chicken spice"],
  "bbq spice": ["bbq spice"],
  "salt": ["salt"],
  "garlic salt": ["garlic salt"],
  "chilli powder": ["chilli powder"],


   // Mother's Hand paste
  "mother's hand paste - creamy butter chicken": ["mother's hand - creamy butter chicken"],
  "mother's hand paste - mutton curry": ["mother's hand - mutton curry"],
  "mother's hand paste - durbz breyani": ["mother's hand - durbz breyani"],
  "mother's hand - spicy saucy livers & gizzards": ["mother's hand - spicy livers"],
  "mother's hand chicken curry paste": ["mother's hand - chicken curry"],
  // Crunch Coat
  "crunch coat fire crisp coating": ["crunch coat - fire crisp coating"],
  // G-Force
  "g-force extra hot creamy peri peri": ["g-force extra creamy peri peri", "g-force creamy peri peri"],
  // Stew mixes
  "isitshulu sezinongo ezimnandi": ["isitshulu sezinongo", "rich savoury stew"],
  "isitshulu sechakalaka": ["isitshulu sechakalaka", "chakalaka stew"],
  "isitshulu senkomo": ["isitshulu senkomo", "hearty beef stew", "beef stew/soup mix"],
  "isitshulu senkukhu": ["isitshulu senkukhu", "homestyle chicken stew"],
  "isitshulu somsila wenkomo": ["isitshulu somsila", "slow cooked oxtail"],
  "isitshulu senkomo no-anyanisi": ["isitshulu senkomo no-anyanisi", "beef and onion stew"],
  "Isitshulu SeZinongo Ezimnandi": [ "Isitshulu SeZinongo Ezimnandi"]
};

interface RecipeIngredientLinkProps {
  ingredient: string;
}

export const RecipeIngredientLink = ({ ingredient }: RecipeIngredientLinkProps) => {
  const { data: products } = useProducts();

  const linkedIngredient = useMemo(() => {
    if (!products || products.length === 0) return null;

    const lowerIng = ingredient.toLowerCase();

    // Only link Maharaja's / Mother's Hand / G-Force / Crunch Coat products
    const isBrandProduct =
      lowerIng.includes("maharaja") ||
      lowerIng.includes("mother's hand") ||
      lowerIng.includes("g-force");

    if (!isBrandProduct) return null;

    const productMap = buildProductMap(products);

    // Try to find a matching product
    for (const entry of productMap) {
      if (lowerIng.includes(entry.term)) {
        return {
          productId: entry.id,
          productName: entry.name,
        };
      }
    }

    // Try keyword mapping
    for (const [keyword, searchTerms] of Object.entries(INGREDIENT_KEYWORDS)) {
      if (lowerIng.includes(keyword)) {
        for (const searchTerm of searchTerms) {
          const found = productMap.find((p) => p.term.includes(searchTerm));
          if (found) {
            return {
              productId: found.id,
              productName: found.name,
            };
          }
        }
      }
    }

    return null;
  }, [ingredient, products]);

  if (!linkedIngredient) {
    return <span>{ingredient}</span>;
  }

  return (
    <span>
      {ingredient}{" "}
      <Link
        to={`/product/${linkedIngredient.productId}`}
        className="inline-flex items-center text-primary hover:text-primary/80 underline underline-offset-2 text-sm font-medium transition-colors"
      >
        Shop →
      </Link>
    </span>
  );
};
