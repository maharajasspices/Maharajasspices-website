import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getImageUrl } from "@/utils/imageImports";

interface LikedPreviewProps {
  count: number;
}

interface LikedItem {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
}

const LikedPreview = ({ count }: LikedPreviewProps) => {
  const [likedItems, setLikedItems] = useState<LikedItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch liked items whenever count changes or hover opens
  useEffect(() => {
    const fetchLikedItems = async () => {
      if (count === 0) {
        setLikedItems([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLikedItems([]);
          return;
        }

        const { data: likes } = await supabase
          .from('product_likes')
          .select('product_id')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (likes && likes.length > 0) {
          const productIds = likes.map(like => like.product_id);
          const { data: products } = await supabase
            .from('products')
            .select('id, name, price, images')
            .in('id', productIds);

          if (products) {
            // Preserve order from likes
            const orderedProducts = productIds
              .map(id => products.find(p => p.id === id))
              .filter((p): p is LikedItem => p !== undefined);
            setLikedItems(orderedProducts);
          }
        } else {
          setLikedItems([]);
        }
      } catch (error) {
        console.error('Error fetching liked items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen || count > 0) {
      fetchLikedItems();
    }
  }, [isOpen, count]);

  return (
    <HoverCard openDelay={200} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <Link to="/liked-items" className="relative" aria-label="View favorites">
          <Heart className="h-6 w-6 text-primary" />
          {count > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {count}
            </Badge>
          )}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 z-[100] bg-background" align="end">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Favorites ({count})</h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : likedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No favorites yet</p>
          ) : (
            <>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {likedItems.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/product/${item.id}`}
                    className="flex gap-2 items-center hover:bg-muted/50 p-2 rounded transition-colors"
                  >
                    {item.images?.[0] && (
                      <img 
                        src={getImageUrl(item.images[0])} 
                        alt={item.name}
                        className="w-12 h-12 object-contain bg-muted rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-primary font-semibold">R{item.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {count > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{count - 3} more items
                </p>
              )}
              <Link 
                to="/liked-items"
                className="block text-xs text-primary hover:underline text-center pt-2 border-t"
              >
                View all favorites
              </Link>
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default LikedPreview;
