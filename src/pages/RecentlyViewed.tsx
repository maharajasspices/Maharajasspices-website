import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import ProductCard from "@/components/ProductCard";
import RevealOnScroll from "@/components/RevealOnScroll";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  images: string[];
  category: string;
  in_stock: boolean;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
}

const RecentlyViewed = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
      setIsAuthenticated(!!session?.user?.id);
      
      if (session?.user?.id) {
        await fetchRecentlyViewed(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const fetchRecentlyViewed = async (uid: string) => {
    try {
      // First get the recently viewed product IDs
      const { data: viewsData, error: viewsError } = await supabase
        .from('recently_viewed')
        .select('product_id, viewed_at')
        .eq('user_id', uid)
        .order('viewed_at', { ascending: false })
        .limit(10);

      if (viewsError) throw viewsError;

      const productIds = viewsData.map(item => item.product_id);

      if (productIds.length === 0) {
        setRecentProducts([]);
        return;
      }

      // Then fetch the actual products from the database
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, brand, price, original_price, images, category, in_stock')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Transform DB format to match ProductCard interface
      const transformedProducts: Product[] = (productsData || []).map((p: DBProduct) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        originalPrice: p.original_price ?? undefined,
        image: p.images[0] || '/placeholder.png',
        category: p.category,
        inStock: p.in_stock,
      }));

      // Maintain the order from recently_viewed
      const orderedProducts = productIds
        .map(id => transformedProducts.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);

      setRecentProducts(orderedProducts);
    } catch (error) {
      console.error('Error fetching recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <RevealOnScroll direction="up">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Recently Viewed</h1>
          </div>
        </RevealOnScroll>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading your history...</p>
          </div>
        ) : recentProducts.length > 0 ? (
          <RevealOnScroll direction="up" delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </RevealOnScroll>
        ) : !isAuthenticated ? (
          <RevealOnScroll direction="up" delay={100}>
            <div className="text-center py-16">
              <Clock className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-4">Sign in to track your history</h2>
              <p className="text-muted-foreground mb-8">
                Create an account or sign in to save your viewing history across devices
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/auth')} size="lg">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/shop')} variant="outline" size="lg">
                  Browse Shop
                </Button>
              </div>
            </div>
          </RevealOnScroll>
        ) : (
          <RevealOnScroll direction="up" delay={100}>
            <div className="text-center py-16">
              <Clock className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-4">No viewing history</h2>
              <p className="text-muted-foreground mb-8">
                Products you view will appear here
              </p>
            </div>
          </RevealOnScroll>
        )}
      </main>

      <Footer />
      
    </div>
  );
};

export default RecentlyViewed;
