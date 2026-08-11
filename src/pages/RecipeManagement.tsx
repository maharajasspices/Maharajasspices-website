import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { getSecureErrorMessage } from "@/utils/errorHandling";

const RecipeManagement = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isEmployee, setIsEmployee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    prep_time: "",
    cook_time: "",
    servings: "",
    image_url: "",
    ingredients: [""],
    instructions: [""],
  });

  useEffect(() => {
    checkUserRole();
    fetchRecipes();
  }, []);

  // Client-side role check for UX only - actual security enforced by RLS policies
  // This check prevents UI rendering but does NOT provide security on its own
  // All database operations are protected by server-side Row Level Security
  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const hasEmployeeRole = roles?.some(r => r.role === "employee" || r.role === "admin");
    
    if (!hasEmployeeRole) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You need employee privileges to access this page.",
      });
      navigate("/");
      return;
    }

    setIsEmployee(true);
    setLoading(false);
  };

  const fetchRecipes = async () => {
    const { data } = await supabase
      .from("recipes")
      .select("id, title, slug, description, category, prep_time, cook_time, servings, image_url, ingredients, instructions, created_at, difficulty")
      .order("created_at", { ascending: false });
    
    if (data) setRecipes(data);
  };

  const handleAddIngredient = () => {
    setFormData({ ...formData, ingredients: [...formData.ingredients, ""] });
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleAddInstruction = () => {
    setFormData({ ...formData, instructions: [...formData.instructions, ""] });
  };

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const recipeData = {
      ...formData,
      slug,
      prep_time: parseInt(formData.prep_time) || null,
      cook_time: parseInt(formData.cook_time) || null,
      servings: parseInt(formData.servings) || null,
      ingredients: formData.ingredients.filter(i => i.trim()),
      instructions: formData.instructions.filter(i => i.trim()),
    };

    try {
      if (editingRecipe) {
        const { error } = await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", editingRecipe.id);

        if (error) throw error;
        toast({ title: "Recipe updated successfully!" });
      } else {
        const { error } = await supabase
          .from("recipes")
          .insert([recipeData]);

        if (error) throw error;
        toast({ title: "Recipe created successfully!" });
      }

      setFormData({
        title: "",
        description: "",
        category: "",
        difficulty: "",
        prep_time: "",
        cook_time: "",
        servings: "",
        image_url: "",
        ingredients: [""],
        instructions: [""],
      });
      setEditingRecipe(null);
      fetchRecipes();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({ title: "Recipe deleted successfully!" });
      fetchRecipes();
    }
  };

  const handleEdit = (recipe: any) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title,
      description: recipe.description || "",
      category: recipe.category,
      difficulty: recipe.difficulty || "",
      prep_time: recipe.prep_time?.toString() || "",
      cook_time: recipe.cook_time?.toString() || "",
      servings: recipe.servings?.toString() || "",
      image_url: recipe.image_url || "",
      ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [""],
      instructions: recipe.instructions.length > 0 ? recipe.instructions : [""],
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isEmployee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Recipe Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>{editingRecipe ? "Edit Recipe" : "Add New Recipe"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label htmlFor="title">Recipe Title*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category*</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Course">Main Course</SelectItem>
                      <SelectItem value="Side Dish">Side Dish</SelectItem>
                      <SelectItem value="Appetizer">Appetizer</SelectItem>
                      <SelectItem value="Dessert">Dessert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="prep_time">Prep (min)</Label>
                    <Input
                      id="prep_time"
                      type="number"
                      value={formData.prep_time}
                      onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cook_time">Cook (min)</Label>
                    <Input
                      id="cook_time"
                      type="number"
                      value={formData.cook_time}
                      onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      id="servings"
                      type="number"
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Ingredients*</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddIngredient}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  {formData.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input
                        value={ing}
                        onChange={(e) => handleIngredientChange(idx, e.target.value)}
                        placeholder="e.g., 2 cups flour"
                      />
                      {formData.ingredients.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveIngredient(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Instructions*</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddInstruction}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  {formData.instructions.map((inst, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Textarea
                        value={inst}
                        onChange={(e) => handleInstructionChange(idx, e.target.value)}
                        placeholder={`Step ${idx + 1}`}
                        rows={2}
                      />
                      {formData.instructions.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveInstruction(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="submit" className="w-full">
                  {editingRecipe ? "Update Recipe" : "Add Recipe"}
                </Button>
                {editingRecipe && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingRecipe(null);
                      setFormData({
                        title: "",
                        description: "",
                        category: "",
                        difficulty: "",
                        prep_time: "",
                        cook_time: "",
                        servings: "",
                        image_url: "",
                        ingredients: [""],
                        instructions: [""],
                      });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">All Recipes ({recipes.length})</h2>
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <Card key={recipe.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{recipe.title}</h3>
                      <p className="text-sm text-muted-foreground">{recipe.category} - {recipe.difficulty}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => handleEdit(recipe)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(recipe.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RecipeManagement;