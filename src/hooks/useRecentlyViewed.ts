import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX_RECENT_ITEMS = 10;

export const useRecentlyViewed = (userId: string | undefined) => {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      fetchRecentlyViewed();
    } else {
      // Load from localStorage for non-authenticated users
      const stored = localStorage.getItem('recentlyViewed');
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    }
  }, [userId]);

  const fetchRecentlyViewed = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('recently_viewed')
        .select('product_id, viewed_at')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(MAX_RECENT_ITEMS);

      if (error) throw error;

      setRecentlyViewed(data.map(item => item.product_id));
    } catch (error) {
      console.error('Error fetching recently viewed:', error);
    }
  };

  const addRecentlyViewed = async (productId: string) => {
    if (userId) {
      // Authenticated user - use database
      try {
        // Try to update existing record first
        const { error: updateError } = await supabase
          .from('recently_viewed')
          .update({ viewed_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('product_id', productId);

        // If no rows updated, insert new record
        if (updateError?.code === 'PGRST116' || !updateError) {
          await supabase
            .from('recently_viewed')
            .upsert(
              { user_id: userId, product_id: productId, viewed_at: new Date().toISOString() },
              { onConflict: 'user_id,product_id' }
            );
        }

        await fetchRecentlyViewed();
      } catch (error) {
        console.error('Error adding to recently viewed:', error);
      }
    } else {
      // Non-authenticated user - use localStorage
      const stored = localStorage.getItem('recentlyViewed');
      const existing = stored ? JSON.parse(stored) : [];
      
      // Remove if exists and add to front
      const filtered = existing.filter((id: string) => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_RECENT_ITEMS);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      setRecentlyViewed(updated);
    }
  };

  return { recentlyViewed, addRecentlyViewed };
};
