import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import ProductCard from "@/components/ProductCard";
import RevealOnScroll from "@/components/RevealOnScroll";
import { Heart } from "lucide-react";
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

const LikedItems = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
      setIsAuthenticated(!!session?.user?.id);
      
      if (session?.user?.id) {
        await fetchLikedProducts(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const fetchLikedProducts = async (uid: string) => {
    try {
      // First get the liked product IDs
      const { data: likesData, error: likesError } = await supabase
        .from('product_likes')
        .select('product_id')
        .eq('user_id', uid);

      if (likesError) throw likesError;

      const productIds = likesData.map(item => item.product_id);

      if (productIds.length === 0) {
        setLikedProducts([]);
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

      setLikedProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching liked products:', error);
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
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-4xl font-bold">My Favorite Items</h1>
          </div>
        </RevealOnScroll>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading your favorites...</p>
          </div>
        ) : likedProducts.length > 0 ? (
          <RevealOnScroll direction="up" delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </RevealOnScroll>
        ) : !isAuthenticated ? (
          <RevealOnScroll direction="up" delay={100}>
            <div className="text-center py-16">
              <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-4">Sign in to save your favorites</h2>
              <p className="text-muted-foreground mb-8">
                Create an account or sign in to save your favorite products across devices
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
              <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-4">No favorites yet</h2>
              <p className="text-muted-foreground mb-8">
                Start adding products to your favorites by clicking the heart icon
              </p>
            </div>
          </RevealOnScroll>
        )}
      </main>

      <Footer />
      
    </div>
  );
};

export default LikedItems;
