import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChevronRight, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { generateRecipeStructuredData, generateBreadcrumbStructuredData } from "@/utils/seo";
import { supabase } from "@/integrations/supabase/client";
import { RecipeIngredientLink } from "@/components/RecipeIngredientLink";
import { Recipe } from "@/utils/recipeData";
import { getRecipeIdFromSlug, getSlugFromId, createRecipeSlug } from "@/utils/recipeSlug";

// Import recipe images from Recipes page for lookups
import { defaultRecipesData } from "./Recipes";

const RecipeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Resolve recipe by slug
  const resolveRecipe = (recipes: Recipe[], targetSlug: string): Recipe | undefined => {
    return recipes.find(r => {
      const rSlug = getSlugFromId(r.title, r.id);
      return rSlug === targetSlug || createRecipeSlug(r.title) === targetSlug || r.id === targetSlug;
    });
  };

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchRecipe = async () => {
      setIsLoading(true);
      setNotFound(false);
      try {
        // Try to find in default recipes first (fast)
        const localRecipe = resolveRecipe(defaultRecipesData, slug);
        if (localRecipe) {
          setRecipe(localRecipe);
          setIsLoading(false);
          return;
        }

        // Check if it's a DB-backed recipe by UUID
        const uuidId = getRecipeIdFromSlug(slug);
        if (uuidId) {
          const { data, error } = await supabase
            .from("recipes")
            .select("id, title, description, image_url, category, prep_time, cook_time, servings, ingredients, instructions")
            .eq("id", uuidId)
            .single();

          if (error) {
            setNotFound(true);
          } else if (data) {
            setRecipe({
              id: data.id,
              title: data.title,
              description: data.description || "",
              image: data.image_url || "",
              category: data.category,
              time: (data.prep_time || 0) + (data.cook_time || 0),
              prepTime: data.prep_time,
              cookTime: data.cook_time,
              servings: data.servings || 4,
              ingredients: Array.isArray(data.ingredients) ? (data.ingredients as string[]) : [],
              instructions: Array.isArray(data.instructions) ? (data.instructions as string[]) : [],
            });
          }
        } else {
          // Try to match by title slug across all recipes from DB
          const { data, error } = await supabase
            .from("recipes")
            .select("id, title, description, image_url, category, prep_time, cook_time, servings, ingredients, instructions");

          if (!error && data) {
            const dbRecipes: Recipe[] = data.map(r => ({
              id: r.id,
              title: r.title,
              description: r.description || "",
              image: r.image_url || "",
              category: r.category,
              time: (r.prep_time || 0) + (r.cook_time || 0),
              prepTime: r.prep_time,
              cookTime: r.cook_time,
              servings: r.servings || 4,
              ingredients: Array.isArray(r.ingredients) ? (r.ingredients as string[]) : [],
              instructions: Array.isArray(r.instructions) ? (r.instructions as string[]) : [],
            }));
            const matched = resolveRecipe(dbRecipes, slug);
            if (matched) {
              setRecipe(matched);
            } else {
              setNotFound(true);
            }
          } else {
            setNotFound(true);
          }
        }
      } catch (error) {
        console.error("Error loading recipe:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [slug]);

  // Set SEO meta tags for the recipe
  useSEO({
    title: recipe ? `${recipe.title} Recipe | Maharaja's Spices South Africa` : "Recipe | Maharaja's Spices",
    description: recipe?.description || "Discover delicious recipes from Maharaja's Spices using our premium quality spices and seasonings.",
    keywords: recipe
      ? `${recipe.title}, ${recipe.category}, South African recipe, curry recipe, Maharaja's Spices recipe, easy ${recipe.category.toLowerCase()} recipe, cook with Maharaja's Spices`
      : "Maharaja's Spices recipes, South African recipes, curry recipes",
    type: "article",
    image: recipe?.image,
    url: window.location.href,
  });

  // Generate structured data when recipe is loaded
  useEffect(() => {
    if (!recipe) return;

    generateRecipeStructuredData({
      name: recipe.title,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.time,
      servings: recipe.servings,
      image: recipe.image,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      category: recipe.category,
      cuisine: "South African",
      keywords: `${recipe.title}, ${recipe.category}, South African curry, spice recipe`,
      author: "Maharaja's Spices",
      datePublished: new Date().toISOString().split('T')[0],
    });

    // Generate breadcrumb structured data
    generateBreadcrumbStructuredData([
      { name: "Home", url: "https://maharajasspices.co.za/" },
      { name: "Recipes", url: "https://maharajasspices.co.za/recipes" },
      { name: recipe.title, url: window.location.href },
    ]);
  }, [recipe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg">Loading recipe...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Recipe Not Found</h1>
          <p className="text-lg text-muted-foreground mb-8">Sorry, we couldn't find that recipe. Browse all our delicious recipes below.</p>
          <Button asChild>
            <Link to="/recipes">Browse All Recipes</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const recipeSlug = getSlugFromId(recipe.title, recipe.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-primary hover:underline">Home</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link to="/recipes" className="text-primary hover:underline">Recipes</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{recipe.title}</span>
        </nav>

        <Button variant="ghost" asChild className="mb-4">
          <Link to="/recipes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Recipes
          </Link>
        </Button>

        {/* Recipe Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={recipe.image}
              alt={`${recipe.title} - Maharaja's Spices recipe`}
              className="w-full h-full object-cover aspect-[4/3]"
              loading="eager"
            />
          </div>

          <div>
            <Badge variant="outline" className="mb-3">{recipe.category}</Badge>
            <h1 className="text-4xl font-bold mb-4 font-playfair">{recipe.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{recipe.description}</p>

            <div className="flex items-center gap-6 text-sm mb-8">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">{recipe.time} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">{recipe.servings} servings</span>
              </div>
            </div>

            {/* Ingredients Card */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 font-playfair">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <RecipeIngredientLink ingredient={ingredient} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 font-playfair">Instructions</h2>
          <ol className="space-y-6">
            {recipe.instructions.map((instruction, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-muted-foreground text-lg leading-relaxed">{instruction}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Shop CTA */}
        <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-2 font-playfair">Love This Recipe?</h2>
          <p className="text-lg mb-6">
            Shop our premium quality spices and seasonings to create this dish at home
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" asChild className="bg-secondary hover:bg-secondary/90">
              <Link to="/shop">Shop All Products</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="bg-transparent border-white hover:bg-white/10 text-white">
              <Link to="/recipes">Browse More Recipes</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RecipeDetail;