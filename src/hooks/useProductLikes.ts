import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useProductLikes = (userId: string | undefined) => {
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchLikedProducts();
    } else {
      // Load from localStorage for non-authenticated users
      const stored = localStorage.getItem('likedProducts');
      if (stored) {
        setLikedProducts(new Set(JSON.parse(stored)));
      }
      setLoading(false);
    }
  }, [userId]);

  const fetchLikedProducts = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('product_likes')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;

      const productIds = new Set(data.map(item => item.product_id));
      setLikedProducts(productIds);
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (productId: string) => {
    const isLiked = likedProducts.has(productId);

    if (userId) {
      // Authenticated user - use database
      try {
        if (isLiked) {
          const { error } = await supabase
            .from('product_likes')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);

          if (error) throw error;

          const newLikes = new Set(likedProducts);
          newLikes.delete(productId);
          setLikedProducts(newLikes);

          toast({
            title: "Removed from favorites",
            description: "Product removed from your liked items",
          });
        } else {
          const { error } = await supabase
            .from('product_likes')
            .insert({ user_id: userId, product_id: productId });

          if (error) throw error;

          const newLikes = new Set(likedProducts);
          newLikes.add(productId);
          setLikedProducts(newLikes);

          toast({
            title: "Added to favorites",
            description: "Product added to your liked items",
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    } else {
      // Non-authenticated user - use localStorage
      const newLikes = new Set(likedProducts);
      if (isLiked) {
        newLikes.delete(productId);
        toast({
          title: "Removed from favorites",
          description: "Sign in to save across devices",
        });
      } else {
        newLikes.add(productId);
        toast({
          title: "Added to favorites",
          description: "Sign in to save across devices",
        });
      }
      setLikedProducts(newLikes);
      localStorage.setItem('likedProducts', JSON.stringify(Array.from(newLikes)));
    }
  };

  return { likedProducts, toggleLike, loading };
};
