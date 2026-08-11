import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Cache time: 15 minutes
const CACHE_TIME = 15 * 60 * 1000;

/**
 * Optimized hook for fetching user's liked products
 * Caches results to reduce database queries
 */
export const useLikedProductIds = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["liked-products", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("product_likes")
        .select("product_id")
        .eq("user_id", userId);

      if (error) throw error;
      return data.map(item => item.product_id);
    },
    enabled: !!userId,
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2,
  });
};

/**
 * Optimized hook for fetching user's recently viewed products
 * Caches results to reduce database queries
 */
export const useRecentlyViewedIds = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["recently-viewed", userId],
    queryFn: async () => {
      if (!userId) {
        const stored = localStorage.getItem('recentlyViewed');
        return stored ? JSON.parse(stored) : [];
      }

      const { data, error } = await supabase
        .from("recently_viewed")
        .select("product_id")
        .eq("user_id", userId)
        .order("viewed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data.map(item => item.product_id);
    },
    enabled: true,
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2,
  });
};

/**
 * Optimized hook for fetching user's orders
 * Caches results to reduce database queries
 */
export const useUserOrders = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-orders", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          total,
          status,
          order_items (
            product_id,
            quantity,
            price
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2,
  });
};
