import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/components/ProductCard";

// Cache products for 15 minutes to reduce database queries
const CACHE_TIME = 15 * 60 * 1000;

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, price, original_price, images, category, in_stock, weight, variants")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((p): Product => ({
        id: p.id as string,
        name: p.name as string,
        brand: p.brand as string,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        image: Array.isArray(p.images) && p.images.length > 0 
          ? (p.images[0] as string) 
          : "/placeholder.svg",
        category: p.category as string,
        inStock: p.in_stock ?? true,
        weight: p.weight as string | null,
        variants: (p as any).variants ?? null,
      }));
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2,
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, price, original_price, images, category, in_stock, weight, variants, description")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2,
  });
};
