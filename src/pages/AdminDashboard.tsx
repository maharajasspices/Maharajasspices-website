import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BulkProductImport from "@/components/BulkProductImport";
import SalesAnalytics from "@/components/SalesAnalytics";
import DashboardProtection from "@/components/DashboardProtection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/data/mockProducts";
import { Loader2, Pencil, Trash2, Plus, Search, Truck, TrendingUp, DollarSign, ChefHat, MapPin, Edit, X, UserX, FileText, RefreshCw, Package, Eye, RotateCcw, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { z } from "zod";
import { getSecureErrorMessage } from "@/utils/errorHandling";

// Product validation schema
const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(200, "Product name must be less than 200 characters"),
  brand: z.string().trim().min(2, "Brand must be at least 2 characters").max(100, "Brand must be less than 100 characters"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters").optional().or(z.literal("")),
  price: z.string().trim().optional().or(z.literal("")),
  original_price: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().min(1, "Category is required"),
  weight: z.string().trim().max(50, "Weight must be less than 50 characters").optional().or(z.literal("")),
  in_stock: z.boolean(),
});

interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  image_url: string | null;
  ingredients: string[];
  instructions: string[];
  created_at: string;
}

interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  active: boolean;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_name: string;
  customer_email: string | null;
  invoice_date: string;
  subtotal_excl_vat: number;
  total_vat: number;
  total_incl_vat: number;
  line_items: any[];
  created_at: string;
}

interface EmployeeLog {
  id: string;
  employee_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  profiles?: { email?: string; full_name?: string } | null;
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<Array<{size: string, price: string}>>([]);
  const [variantSize, setVariantSize] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter state
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Credit management state
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Courier analytics state
  const [courierStats, setCourierStats] = useState<{
    totalOrders: number;
    totalCourierCost: number;
    totalMarkup: number;
    totalRevenue: number;
    orders: any[];
  }>({
    totalOrders: 0,
    totalCourierCost: 0,
    totalMarkup: 0,
    totalRevenue: 0,
    orders: [],
  });
  const [loadingCourierStats, setLoadingCourierStats] = useState(false);

  // Recipe management state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    title: "",
    description: "",
    category: "Main Course",
    prep_time: "",
    cook_time: "",
    servings: "",
    image_url: "",
    ingredients: [""],
    instructions: [""]
  });

  // Location management state
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StoreLocation | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    active: true
  });

  // Invoice management state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Employee logs state
  const [employeeLogs, setEmployeeLogs] = useState<EmployeeLog[]>([]);

  // User management state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Order tracking management state
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  // Force waybill state
  const [forcingWaybill, setForcingWaybill] = useState<string | null>(null);
  const [waybillConfirmDialog, setWaybillConfirmDialog] = useState<{ order: any; existingWaybill: string } | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    original_price: "",
    category: "",
    weight: "",
    in_stock: true,
  });

  useEffect(() => {
    checkUserRole();
    fetchProducts();
  }, []);

  const fetchCourierStats = async () => {
    setLoadingCourierStats(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, created_at, courier, courier_cost, courier_markup, courier_waybill, shipping_cost, total, status")
        .eq("courier", "The Courier Guy")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const stats = {
        totalOrders: orders?.length || 0,
        totalCourierCost: orders?.reduce((sum, o) => sum + (o.courier_cost || 0), 0) || 0,
        totalMarkup: orders?.reduce((sum, o) => sum + (o.courier_markup || 0), 0) || 0,
        totalRevenue: orders?.reduce((sum, o) => sum + (o.shipping_cost || 0), 0) || 0,
        orders: orders || [],
      };

      setCourierStats(stats);
    } catch (error) {
      console.error("Error fetching courier stats:", error);
    } finally {
      setLoadingCourierStats(false);
    }
  };

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

    const hasAdminRole = roles?.some(r => r.role === "admin");
    const hasEmployeeRole = roles?.some(r => r.role === "employee");

    if (!hasAdminRole && !hasEmployeeRole) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You need admin or employee privileges to access this page.",
      });
      navigate("/");
      return;
    }

    setIsAuthorized(true);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, brand, price, original_price, images, category, in_stock, weight, variants, description")
      .order("created_at", { ascending: false });
    
    if (data) {
      setProducts(data);
      setFilteredProducts(data);
    }
  };

  // Filter products based on brand and search query
  useEffect(() => {
    let filtered = products;
    
    if (selectedBrand !== "all") {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [selectedBrand, searchQuery, products]);

  const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).sort();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      productSchema.parse(formData);
      
      if (!formData.price && variants.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid product data",
          description: "Please provide either a base price or product variants.",
        });
        return;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid product data",
          description: error.errors[0]?.message || "Please check your product data.",
        });
        return;
      }
    }

    try {
      setUploading(true);
      const uploadedImageUrls: string[] = [];
      
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `basic-products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('Maharajas-Basic-Products')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('Maharajas-Basic-Products')
            .getPublicUrl(filePath);

          uploadedImageUrls.push(publicUrl);
        }
      }

      const productData = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        description: formData.description.trim() || null,
        price: formData.price
          ? parseFloat(formData.price)
          : variants.length > 0
            ? parseFloat(variants[0].price) || 0
            : 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category: formData.category,
        weight: formData.weight.trim() || null,
        in_stock: formData.in_stock,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : (editingProduct?.images || null),
        variants:
          variants.length > 0
            ? variants
                .map((v) => ({
                  weight: String(v.size).trim(),
                  price: parseFloat(v.price) || 0,
                }))
                .filter((v) => v.weight && v.price > 0)
            : null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast({ title: "Product updated successfully!" });
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);

        if (error) throw error;
        toast({ title: "Product created successfully!" });
      }

      setFormData({
        name: "",
        brand: "",
        description: "",
        price: "",
        original_price: "",
        category: "",
        weight: "",
        in_stock: true,
      });
      setImageFiles([]);
      setVariants([]);
      setEditingProduct(null);
      setDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    } else {
      toast({ title: "Product deleted successfully!" });
      fetchProducts();
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      description: product.description || "",
      price: product.price?.toString() || "",
      original_price: product.original_price?.toString() || "",
      category: product.category,
      weight: product.weight || "",
      in_stock: product.in_stock ?? true,
    });
    const normalizedVariants = (product.variants || []).map((v: any) => ({
      size: String(v.size || v.weight || ''),
      price: String(v.price || '')
    })).filter((v: any) => v.size && v.price);
    setVariants(normalizedVariants);
    setDialogOpen(true);
  };

  const handleAddVariant = () => {
    if (variantSize && variantPrice) {
      setVariants([...variants, { size: variantSize, price: variantPrice }]);
      setVariantSize("");
      setVariantPrice("");
    }
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Credit management
  const handleSearchUsers = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email to search",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", `%${searchEmail}%`);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "No users found",
          description: "No users match your search",
        });
        setSearchResults([]);
        return;
      }

      const userIds = profiles.map((p) => p.id);
      const { data: credits, error: creditsError } = await supabase
        .from("user_credits_safe")
        .select("user_id, balance")
        .in("user_id", userIds);

      if (creditsError) throw creditsError;

      const results = profiles.map((profile) => ({
        ...profile,
        balance: credits?.find((c) => c.user_id === profile.id)?.balance || 0,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !creditAmount) {
      toast({
        title: "Error",
        description: "Please select a user and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(creditAmount);
    if (isNaN(amount)) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from("credit_transactions").insert({
        user_id: selectedUser.id,
        amount: amount,
        transaction_type: "admin_added",
        description: creditDescription || "Admin adjustment",
        created_by: session.user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${amount > 0 ? "Added" : "Removed"} R${Math.abs(amount)} credits`,
      });

      setCreditAmount("");
      setCreditDescription("");
      setSelectedUser(null);
      handleSearchUsers();
    } catch (error) {
      console.error("Error adjusting credits:", error);
      toast({
        title: "Error",
        description: "Failed to adjust credits",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('delete-user', {
        body: { userId: deleteUserId }
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setDeleteUserId(null);
      handleSearchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Recipe management
  const fetchRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("id, title, slug, description, category, prep_time, cook_time, servings, image_url, ingredients, instructions, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const recipesData = (data || []).map(r => ({
        ...r,
        ingredients: Array.isArray(r.ingredients) ? r.ingredients as string[] : [],
        instructions: Array.isArray(r.instructions) ? r.instructions as string[] : []
      }));
      
      setRecipes(recipesData);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch recipes",
        variant: "destructive",
      });
    } finally {
      setLoadingRecipes(false);
    }
  };

  const resetRecipeForm = () => {
    setRecipeForm({
      title: "",
      description: "",
      category: "Main Course",
      prep_time: "",
      cook_time: "",
      servings: "",
      image_url: "",
      ingredients: [""],
      instructions: [""]
    });
    setEditingRecipe(null);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      title: recipe.title,
      description: recipe.description || "",
      category: recipe.category,
      prep_time: recipe.prep_time?.toString() || "",
      cook_time: recipe.cook_time?.toString() || "",
      servings: recipe.servings?.toString() || "",
      image_url: recipe.image_url || "",
      ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [""],
      instructions: recipe.instructions.length > 0 ? recipe.instructions : [""]
    });
  };

  const handleSaveRecipe = async () => {
    if (!recipeForm.title.trim()) {
      toast({
        title: "Error",
        description: "Recipe title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const slug = recipeForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const ingredients = recipeForm.ingredients.filter(i => i.trim());
      const instructions = recipeForm.instructions.filter(i => i.trim());

      const recipeData = {
        title: recipeForm.title,
        slug,
        description: recipeForm.description || null,
        category: recipeForm.category,
        prep_time: recipeForm.prep_time ? parseInt(recipeForm.prep_time) : null,
        cook_time: recipeForm.cook_time ? parseInt(recipeForm.cook_time) : null,
        servings: recipeForm.servings ? parseInt(recipeForm.servings) : null,
        image_url: recipeForm.image_url || null,
        ingredients,
        instructions,
        created_by: session.user.id
      };

      if (editingRecipe) {
        const { error } = await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", editingRecipe.id);

        if (error) throw error;
        toast({ title: "Success", description: "Recipe updated successfully" });
      } else {
        const { error } = await supabase
          .from("recipes")
          .insert(recipeData);

        if (error) throw error;
        toast({ title: "Success", description: "Recipe added successfully" });
      }

      resetRecipeForm();
      fetchRecipes();
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({
        title: "Error",
        description: "Failed to save recipe",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    try {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Recipe deleted" });
      fetchRecipes();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive",
      });
    }
  };

  const addIngredient = () => setRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, ""] }));
  const removeIngredient = (index: number) => setRecipeForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
  const updateIngredient = (index: number, value: string) => setRecipeForm(prev => ({
    ...prev,
    ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
  }));

  const addInstruction = () => setRecipeForm(prev => ({ ...prev, instructions: [...prev.instructions, ""] }));
  const removeInstruction = (index: number) => setRecipeForm(prev => ({ ...prev, instructions: prev.instructions.filter((_, i) => i !== index) }));
  const updateInstruction = (index: number, value: string) => setRecipeForm(prev => ({
    ...prev,
    instructions: prev.instructions.map((ins, i) => i === index ? value : ins)
  }));

  // Location management
  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const { data, error } = await supabase
        .from("pickup_locations")
        .select("id, name, address, city, phone, active, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive",
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  const resetLocationForm = () => {
    setLocationForm({
      name: "",
      address: "",
      city: "",
      phone: "",
      active: true
    });
    setEditingLocation(null);
  };

  const handleEditLocation = (location: StoreLocation) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      address: location.address,
      city: location.city,
      phone: location.phone || "",
      active: location.active
    });
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name.trim() || !locationForm.address.trim() || !locationForm.city.trim()) {
      toast({
        title: "Error",
        description: "Name, address, and city are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const locationData = {
        name: locationForm.name,
        address: locationForm.address,
        city: locationForm.city,
        phone: locationForm.phone || null,
        active: locationForm.active
      };

      if (editingLocation) {
        const { error } = await supabase
          .from("pickup_locations")
          .update(locationData)
          .eq("id", editingLocation.id);

        if (error) throw error;
        toast({ title: "Success", description: "Location updated successfully" });
      } else {
        const { error } = await supabase
          .from("pickup_locations")
          .insert(locationData);

        if (error) throw error;
        toast({ title: "Success", description: "Location added successfully" });
      }

      resetLocationForm();
      fetchLocations();
    } catch (error) {
      console.error("Error saving location:", error);
      toast({
        title: "Error",
        description: "Failed to save location",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      const { error } = await supabase.from("pickup_locations").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Location deleted" });
      fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    }
  };

  const toggleLocationActive = async (location: StoreLocation) => {
    try {
      const { error } = await supabase
        .from("pickup_locations")
        .update({ active: !location.active })
        .eq("id", location.id);

      if (error) throw error;
      fetchLocations();
    } catch (error) {
      console.error("Error toggling location:", error);
    }
  };

  // Invoice management
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, customer_name, customer_email, line_items, subtotal_excl_vat, total_vat, total_incl_vat, order_id, payment_reference, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setInvoices((data as Invoice[]) || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Invoice export functions
  const formatInvoiceForExport = (invoice: Invoice) => {
    const lineItems = invoice.line_items || [];
    const productItems = lineItems.filter((item: any) => !item.name?.toLowerCase().includes('shipping'));
    const shippingItem = lineItems.find((item: any) => item.name?.toLowerCase().includes('shipping'));
    
    return {
      invoice_number: invoice.invoice_number,
      invoice_date: new Date(invoice.invoice_date).toLocaleDateString('en-ZA'),
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email || '',
      products: productItems.map((item: any) => 
        `${item.name} x${item.quantity} @ R${item.unit_price_incl?.toFixed(2)}${item.is_zero_rated ? ' (0% VAT)' : ''}`
      ).join('; '),
      products_excl_vat: productItems.reduce((sum: number, item: any) => sum + (item.line_total_excl || 0), 0).toFixed(2),
      shipping_incl_vat: shippingItem ? shippingItem.line_total_incl?.toFixed(2) : '0.00',
      subtotal_excl_vat: invoice.subtotal_excl_vat.toFixed(2),
      total_vat: invoice.total_vat.toFixed(2),
      total_incl_vat: invoice.total_incl_vat.toFixed(2),
    };
  };

  const handleBulkInvoiceExport = () => {
    if (invoices.length === 0) return;
    
    const exportData = invoices.map(formatInvoiceForExport);
    const headers = ['Invoice #', 'Date', 'Customer', 'Email', 'Products', 'Products (ex VAT)', 'Shipping (incl VAT)', 'Subtotal (ex VAT)', 'VAT', 'Total (incl VAT)'];
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => [
        `"${row.invoice_number}"`,
        `"${row.invoice_date}"`,
        `"${row.customer_name}"`,
        `"${row.customer_email}"`,
        `"${row.products}"`,
        row.products_excl_vat,
        row.shipping_incl_vat,
        row.subtotal_excl_vat,
        row.total_vat,
        row.total_incl_vat,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Invoices exported", description: `${invoices.length} invoices exported to CSV` });
  };

  const handleSingleInvoiceExport = (invoice: Invoice) => {
    const data = formatInvoiceForExport(invoice);
    const headers = ['Invoice #', 'Date', 'Customer', 'Email', 'Products', 'Products (ex VAT)', 'Shipping (incl VAT)', 'Subtotal (ex VAT)', 'VAT', 'Total (incl VAT)'];
    const csvContent = [
      headers.join(','),
      [
        `"${data.invoice_number}"`,
        `"${data.invoice_date}"`,
        `"${data.customer_name}"`,
        `"${data.customer_email}"`,
        `"${data.products}"`,
        data.products_excl_vat,
        data.shipping_incl_vat,
        data.subtotal_excl_vat,
        data.total_vat,
        data.total_incl_vat,
      ].join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoice_number}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Invoice exported", description: `Invoice ${invoice.invoice_number} exported` });
  };

  // Employee logs
  const fetchEmployeeLogs = async () => {
    const { data: logs, error } = await supabase
      .from("employee_logs")
      .select("id, employee_id, action, entity_type, entity_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching logs:", error);
      return;
    }

    if (!logs) {
      setEmployeeLogs([]);
      return;
    }

    const employeeIds = [...new Set(logs.map(log => log.employee_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", employeeIds);

    const logsWithProfiles = logs.map(log => ({
      ...log,
      profiles: profiles?.find(p => p.id === log.employee_id) || null
    }));

    setEmployeeLogs(logsWithProfiles as any);
  };

  // Order tracking management
  const fetchAllOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total, shipping_cost, courier, courier_waybill, tracking_token, user_id, shipping_address, items")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setAllOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      
      toast({ title: "Success", description: `Order status updated to ${newStatus}` });
      fetchAllOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleResetTracking = async (orderId: string) => {
    if (!confirm("Are you sure you want to reset the tracking for this order? This will clear the waybill number.")) return;
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          courier_waybill: null,
          status: "processing"
        })
        .eq("id", orderId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Order tracking has been reset" });
      fetchAllOrders();
    } catch (error) {
      console.error("Error resetting tracking:", error);
      toast({
        title: "Error",
        description: "Failed to reset order tracking",
        variant: "destructive",
      });
    }
  };

  // Force waybill creation
  const handleForceWaybill = async (order: any) => {
    if (!order.courier || order.courier.toLowerCase() === "pickup") {
      toast({ title: "Error", description: "This is not a courier delivery order.", variant: "destructive" });
      return;
    }
    if (order.courier_waybill) {
      setWaybillConfirmDialog({ order, existingWaybill: order.courier_waybill });
      return;
    }
    await executeForceWaybill(order);
  };

  const executeForceWaybill = async (order: any, replacingWaybill?: string) => {
    setForcingWaybill(order.id);
    try {
      if (replacingWaybill) {
        const { error: clearError } = await supabase
          .from("orders")
          .update({ courier_waybill: null })
          .eq("id", order.id);
        if (clearError) throw clearError;
      }

      const { data, error } = await supabase.functions.invoke("retry-shipment", {
        body: { order_id: order.id },
      });
      if (error) throw error;

      if (data?.success) {
        const label = replacingWaybill
          ? `Replacement waybill created: ${data.waybill || "Success"} (replaced ${replacingWaybill})`
          : `Waybill created: ${data.waybill || "Success"}`;
        toast({ title: "Success", description: label });
        fetchAllOrders();
        setSelectedOrder(null);
      } else if (data?.waybill && data?.message === "Shipment already exists") {
        toast({ title: "Info", description: `Waybill already exists: ${data.waybill}` });
      } else {
        toast({ title: "Error", description: data?.error || "Failed to create waybill", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Force waybill error:", error);
      toast({ title: "Error", description: error.message || "Failed to create waybill", variant: "destructive" });
    } finally {
      setForcingWaybill(null);
      setWaybillConfirmDialog(null);
    }
  };

  // Generate missing invoice for an order
  const handleGenerateInvoice = async (orderId: string) => {
    // Find the order and block invoice generation for cancelled/pending orders
    const order = allOrders.find(o => o.id === orderId);
    if (order && ["cancelled", "payment_cancelled", "payment_failed", "pending"].includes(order.status || "")) {
      toast({ title: "Cannot generate invoice", description: `Invoices cannot be created for ${order.status} orders. Only paid/processing/shipped/delivered orders get invoices.`, variant: "destructive" });
      return;
    }

    setGeneratingInvoice(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("fix-order", {
        body: { order_id: orderId, rebuild_invoice: true },
      });
      if (error) throw error;
      if (data?.invoice_rebuilt) {
        toast({ title: "Success", description: `Invoice ${data.invoice_number} generated successfully` });
        fetchInvoices();
      } else if (data?.invoice_exists) {
        toast({ title: "Info", description: `Invoice already exists: ${data.invoice_number}` });
      } else {
        toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Generate invoice error:", error);
      toast({ title: "Error", description: error.message || "Failed to generate invoice", variant: "destructive" });
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const filteredOrders = allOrders.filter(order => {
    const isCancelledGroup = ["cancelled", "payment_cancelled", "payment_failed"].includes(order.status || "");
    const matchesStatus = orderStatusFilter === "all" || 
      (orderStatusFilter === "cancelled" ? isCancelledGroup : order.status === orderStatusFilter);
    const matchesSearch = !orderSearchQuery || 
      order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.courier_waybill?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (order.shipping_address as any)?.email?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (order.shipping_address as any)?.fullName?.toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const calculateProductCost = (lineItems: any[]) => {
    return lineItems
      .filter((item: any) => !item.name?.toLowerCase().includes('shipping'))
      .reduce((sum: number, item: any) => sum + (item.line_total_incl || 0), 0);
  };

  const calculateShippingCost = (lineItems: any[]) => {
    const shippingItem = lineItems.find((item: any) => item.name?.toLowerCase().includes('shipping'));
    return shippingItem?.line_total_incl || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <DashboardProtection>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage products, recipes, locations, and analytics</p>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="import">Bulk Import</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="courier">Courier</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="recipes" onClick={() => !recipes.length && fetchRecipes()}>
              <ChefHat className="h-4 w-4 mr-2" />
              Recipes
            </TabsTrigger>
            <TabsTrigger value="locations" onClick={() => !locations.length && fetchLocations()}>
              <MapPin className="h-4 w-4 mr-2" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="orders" onClick={() => !allOrders.length && fetchAllOrders()}>
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="brand">Brand</Label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger id="brand">
                      <SelectValue placeholder="All brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {uniqueBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Add/Edit Product Form */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Management</CardTitle>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </CardHeader>
            </Card>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingProduct(null);
                setFormData({
                  name: "",
                  brand: "",
                  description: "",
                  price: "",
                  original_price: "",
                  category: "",
                  weight: "",
                  in_stock: true,
                });
                setImageFiles([]);
                setVariants([]);
                setVariantSize("");
                setVariantPrice("");
              }
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">Brand *</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="original_price">Original Price</Label>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="e.g., 500g"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="images">Product Images</Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                    />
                    {imageFiles.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {imageFiles.length} file(s) selected
                      </p>
                    )}
                  </div>

                  {/* Product Variants */}
                  <div className="space-y-3">
                    <Label>Product Variants (Optional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Size (e.g., 100g)"
                        value={variantSize}
                        onChange={(e) => setVariantSize(e.target.value)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={variantPrice}
                        onChange={(e) => setVariantPrice(e.target.value)}
                      />
                      <Button type="button" onClick={handleAddVariant} size="sm">
                        Add Variant
                      </Button>
                    </div>
                    {variants.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Current Variants:</p>
                        {variants.map((variant, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{variant.size} - R{variant.price}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveVariant(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="in_stock"
                      checked={formData.in_stock}
                      onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="in_stock">In Stock</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingProduct ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>{editingProduct ? "Update Product" : "Create Product"}</>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Products ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.brand} • {product.category}
                          </p>
                          <p className="text-sm font-medium">R{product.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <BulkProductImport />
          </TabsContent>

          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Credit Management</CardTitle>
                <CardDescription>Search for users and manage their credits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchUsers}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Search Results:</p>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedUser?.id === user.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{user.full_name || "No name"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">R{user.balance?.toFixed(2) || "0.00"}</p>
                            <p className="text-xs text-muted-foreground">Current Balance</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Adjust Credits for {selectedUser.full_name || selectedUser.email}</CardTitle>
                  <CardDescription>
                    Current balance: R{selectedUser.balance?.toFixed(2) || "0.00"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="creditAmount">Amount (positive to add, negative to deduct)</Label>
                      <Input
                        id="creditAmount"
                        type="number"
                        step="0.01"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="e.g., 50 or -20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="creditDescription">Description</Label>
                      <Input
                        id="creditDescription"
                        value={creditDescription}
                        onChange={(e) => setCreditDescription(e.target.value)}
                        placeholder="Reason for adjustment"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAdjustCredits}>
                      Adjust Credits
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null);
                        setCreditAmount("");
                        setCreditDescription("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>


          {/* Courier Analytics Tab */}
          <TabsContent value="courier" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Courier Guy Analytics
                </CardTitle>
                <CardDescription>
                  Compare courier costs vs. markup revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={fetchCourierStats} disabled={loadingCourierStats} className="mb-6">
                  {loadingCourierStats ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Refresh Stats"
                  )}
                </Button>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Truck className="h-4 w-4" />
                        <span className="text-sm">Total Orders</span>
                      </div>
                      <p className="text-2xl font-bold">{courierStats.totalOrders}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Courier Cost</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        R{courierStats.totalCourierCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">What we pay</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">25% Markup</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        R{courierStats.totalMarkup.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Profit from markup</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Customer Charged</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        R{courierStats.totalRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total shipping revenue</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Orders Table */}
                {courierStats.orders.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Waybill</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Courier Cost</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Markup</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Customer Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {courierStats.orders.slice(0, 20).map((order) => (
                          <tr key={order.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-mono">
                              {order.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.status === 'completed' || order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                              {order.courier_waybill || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-red-600">
                              R{(order.courier_cost || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-green-600">
                              R{(order.courier_markup || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              R{(order.shipping_cost || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {courierStats.orders.length === 0 && !loadingCourierStats && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No courier orders yet. Click "Refresh Stats" to load data.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recipe Management Tab (view only) */}
          <TabsContent value="recipes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Existing Recipes</CardTitle>
                  <CardDescription>{recipes.length} recipes</CardDescription>
                </div>
                <Button onClick={fetchRecipes} variant="outline" size="sm" disabled={loadingRecipes}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingRecipes ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingRecipes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : recipes.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No recipes yet</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {recipes.map((recipe) => (
                      <div key={recipe.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{recipe.title}</p>
                          <p className="text-sm text-muted-foreground">{recipe.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Location Management Tab (view only) */}
          <TabsContent value="locations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Store Locations</CardTitle>
                  <CardDescription>{locations.length} locations</CardDescription>
                </div>
                <Button onClick={fetchLocations} variant="outline" size="sm" disabled={loadingLocations}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingLocations ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingLocations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : locations.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No locations yet</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{location.name}</p>
                            {!location.active && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded">Inactive</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{location.address}, {location.city}</p>
                          {location.phone && (
                            <p className="text-xs text-muted-foreground">{location.phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Order Tracking Management Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Tracking Management
                </CardTitle>
                <CardDescription>
                  View all orders, track shipments, and manage order status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by order ID, waybill, email, or name..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchAllOrders} disabled={loadingOrders}>
                    {loadingOrders ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${orderStatusFilter === "all" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setOrderStatusFilter("all")}
                  >
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                      <p className="text-xl font-bold">{allOrders.length}</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${orderStatusFilter === "pending" ? "ring-2 ring-yellow-500" : ""}`}
                    onClick={() => setOrderStatusFilter("pending")}
                  >
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">Pending (Unpaid)</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {allOrders.filter(o => o.status === "pending").length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${orderStatusFilter === "processing" ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => setOrderStatusFilter("processing")}
                  >
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">Processing (Paid)</p>
                      <p className="text-xl font-bold text-blue-600">
                        {allOrders.filter(o => o.status === "processing").length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${orderStatusFilter === "shipped" ? "ring-2 ring-purple-500" : ""}`}
                    onClick={() => setOrderStatusFilter("shipped")}
                  >
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">Shipped</p>
                      <p className="text-xl font-bold text-purple-600">
                        {allOrders.filter(o => o.status === "shipped").length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${orderStatusFilter === "delivered" ? "ring-2 ring-green-500" : ""}`}
                    onClick={() => setOrderStatusFilter("delivered")}
                  >
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">Delivered</p>
                      <p className="text-xl font-bold text-green-600">
                        {allOrders.filter(o => o.status === "delivered" || o.status === "completed").length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${orderStatusFilter === "cancelled" ? "ring-2 ring-red-500" : ""}`}
                    onClick={() => setOrderStatusFilter("cancelled")}
                  >
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground">Cancelled</p>
                      <p className="text-xl font-bold text-red-600">
                        {allOrders.filter(o => o.status === "cancelled" || o.status === "payment_cancelled" || o.status === "payment_failed").length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Orders Table */}
                {filteredOrders.length > 0 ? (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Courier</TableHead>
                          <TableHead>Waybill</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.slice(0, 50).map((order) => {
                          const shippingAddress = order.shipping_address as any;
                          const isCancelled = ["cancelled", "payment_cancelled", "payment_failed"].includes(order.status || "");
                          const isPending = order.status === "pending";
                          const canGenerateInvoice = !isCancelled && !isPending;
                          return (
                            <TableRow key={order.id} className={isCancelled ? "opacity-60" : ""}>
                              <TableCell className="font-mono text-xs">
                                {order.id.slice(0, 8).toUpperCase()}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(order.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">{shippingAddress?.fullName || "N/A"}</p>
                                  <p className="text-xs text-muted-foreground">{shippingAddress?.email || "No email"}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {isCancelled ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                    <X className="h-3 w-3" /> Cancelled
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    {isPending && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-semibold w-fit">
                                        UNPAID
                                      </span>
                                    )}
                                    <Select
                                      value={order.status || "pending"}
                                      onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                                    >
                                      <SelectTrigger className="w-[120px] h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending (Unpaid)</SelectItem>
                                        <SelectItem value="processing">Processing (Paid)</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {order.courier || "-"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {order.courier_waybill || "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                R{order.total?.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedOrder(order)}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {!isCancelled && order.courier && order.courier.toLowerCase() !== "pickup" && !order.courier_waybill && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleForceWaybill(order)}
                                      disabled={forcingWaybill === order.id}
                                      title="Force Create Waybill"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      {forcingWaybill === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                                    </Button>
                                  )}
                                  {canGenerateInvoice && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleGenerateInvoice(order.id)}
                                      disabled={generatingInvoice === order.id}
                                      title="Generate Invoice"
                                    >
                                      {generatingInvoice === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders found. Click "Refresh" to load data.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Invoice Detail Dialog */}
      <AlertDialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Invoice {selectedInvoice?.invoice_number}</AlertDialogTitle>
            <AlertDialogDescription>
              Created: {selectedInvoice && new Date(selectedInvoice.created_at).toLocaleString()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedInvoice.customer_name}</p>
                  <p className="text-muted-foreground">{selectedInvoice.customer_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono text-xs">{selectedInvoice.order_id}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit (ex VAT)</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedInvoice.line_items || []).map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">R{item.unit_price_excl?.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">R{item.line_vat?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">R{item.line_total_incl?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (ex VAT)</span>
                  <span>R{selectedInvoice.subtotal_excl_vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (15%)</span>
                  <span>R{selectedInvoice.total_vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total (incl VAT)</span>
                  <span>R{selectedInvoice.total_incl_vat.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Detail Dialog */}
      <AlertDialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order {selectedOrder?.id?.slice(0, 8).toUpperCase()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Created: {selectedOrder && new Date(selectedOrder.created_at).toLocaleString()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{(selectedOrder.shipping_address as any)?.fullName || "N/A"}</p>
                  <p className="text-muted-foreground">{(selectedOrder.shipping_address as any)?.email || "No email"}</p>
                  <p className="text-muted-foreground">{(selectedOrder.shipping_address as any)?.phone || ""}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shipping Address</p>
                  <p className="text-sm">
                    {(selectedOrder.shipping_address as any)?.address}<br />
                    {(selectedOrder.shipping_address as any)?.city}, {(selectedOrder.shipping_address as any)?.postalCode}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedOrder.status || "pending"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Courier</p>
                  <p className="font-medium">{selectedOrder.courier || "Not assigned"}</p>
                  {selectedOrder.courier_waybill && (
                    <p className="text-xs text-primary font-mono">Waybill: {selectedOrder.courier_waybill}</p>
                  )}
                </div>
              </div>

              {selectedOrder.tracking_token && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Tracking Token (for guest orders)</p>
                  <p className="font-mono text-xs break-all">{selectedOrder.tracking_token}</p>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedOrder.items as any[] || []).map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">
                          {item.name}
                          {item.variant && <span className="text-xs text-muted-foreground ml-1">({item.variant})</span>}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">R{item.price?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">R{(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>R{selectedOrder.shipping_cost?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>R{selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {/* Force Create / Replace Waybill */}
                {selectedOrder.courier && selectedOrder.courier.toLowerCase() !== "pickup" && (
                  selectedOrder.courier_waybill ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleForceWaybill(selectedOrder)}
                      disabled={forcingWaybill === selectedOrder.id}
                      className="text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      {forcingWaybill === selectedOrder.id ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Creating...</>
                      ) : (
                        <><RefreshCw className="h-3 w-3 mr-1" /> Replace Waybill</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleForceWaybill(selectedOrder)}
                      disabled={forcingWaybill === selectedOrder.id}
                      className="text-xs"
                    >
                      {forcingWaybill === selectedOrder.id ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Creating...</>
                      ) : (
                        <><Truck className="h-3 w-3 mr-1" /> Force Create Waybill</>
                      )}
                    </Button>
                  )
                )}

                {/* Generate Invoice */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateInvoice(selectedOrder.id)}
                  disabled={generatingInvoice === selectedOrder.id}
                  className="text-xs"
                >
                  {generatingInvoice === selectedOrder.id ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating...</>
                  ) : (
                    <><FileText className="h-3 w-3 mr-1" /> Generate Invoice</>
                  )}
                </Button>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Waybill Replacement Confirmation */}
      <AlertDialog open={!!waybillConfirmDialog} onOpenChange={() => setWaybillConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Waybill Already Exists
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This order already has waybill <strong className="font-mono text-foreground">{waybillConfirmDialog?.existingWaybill}</strong>.
                </p>
                <p>
                  Creating a new waybill will <strong>remove the existing one</strong> from this order. Make sure you have already cancelled/deleted the old waybill on The Courier Guy's system before proceeding.
                </p>
                <p className="text-destructive font-medium">
                  Only proceed if the existing waybill has been deleted from Courier Guy.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => waybillConfirmDialog && executeForceWaybill(waybillConfirmDialog.order, waybillConfirmDialog.existingWaybill)}
            >
              I Confirm — Replace Waybill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
    </DashboardProtection>
  );
};

export default AdminDashboard;