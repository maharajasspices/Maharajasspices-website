import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/components/ProductCard";
import { createProductSlug } from "@/utils/productSlug";

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

      // First, preserve support for existing UUID product URLs.
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const selectFields =
        "id, name, brand, price, original_price, images, category, in_stock, weight, variants, description";

      if (isUUID) {
        const { data, error } = await supabase
          .from("products")
          .select(selectFields)
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (data) return data;
      }

      // Otherwise, find the product using its SEO-friendly slug.
      const { data, error } = await supabase
        .from("products")
        .select(selectFields);

      if (error) throw error;

      return data.find(
        (product) =>
          createProductSlug(product.name, product.weight) === id,
      ) ?? null;
    },
    enabled: !!id,
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2,
  });
};

