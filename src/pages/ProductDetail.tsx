import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useProductLikes } from "@/hooks/useProductLikes";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useCart } from "@/contexts/CartContext";
import { useProduct } from "@/hooks/useProducts";
import { generateProductStructuredData } from "@/utils/seo";
import { trackViewItem } from "@/components/GoogleAnalytics";
import ProductReviews from "@/components/ProductReviews";
import { useCurrency } from "@/hooks/useCurrency";
import { cleanProductName } from "@/utils/productName";
import { normalizeProductVariants } from "@/utils/productVariants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ProductVariant {
  weight: string;
  price: number;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [userId, setUserId] = useState<string | undefined>();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { likedProducts, toggleLike } = useProductLikes(userId);
  const { addRecentlyViewed } = useRecentlyViewed(userId);
  const { format, currency } = useCurrency();

  // Use React Query for cached product fetching
  const { data: product, isLoading, isError } = useProduct(id);

  const displayName = useMemo(() => cleanProductName(product?.name ?? ""), [product?.name]);

  // Parse variants from product data (backward compatible: supports legacy { size, price })
  const variants = useMemo(() => normalizeProductVariants(product?.variants), [product?.variants]);

  const hasVariants = variants.length > 0;

  // Set default variant when product loads
  useEffect(() => {
    if (hasVariants && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [hasVariants, variants, selectedVariant]);

  // Get current price and weight based on selection
  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentWeight = selectedVariant?.weight ?? product?.weight ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  useEffect(() => {
    if (id && product) {
      addRecentlyViewed(id);
      generateProductStructuredData({
        id: product.id,
        name: displayName || product.name,
        description: product.description || `Premium ${displayName || product.name} from Maharaja's Spices`,
        price: currentPrice,
        brand: product.brand,
        image: product.images?.[0] || "/placeholder.svg",
        in_stock: product.in_stock,
        category: product.category,
      });

      // Track product view for analytics
      trackViewItem({
        item_id: product.id,
        item_name: displayName || product.name,
        item_brand: product.brand,
        item_category: product.category,
        price: currentPrice,
        quantity: 1,
      });
    }
  }, [id, product, addRecentlyViewed, currentPrice, displayName]);

  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Product not found",
      });
      navigate("/shop");
    }
  }, [isError, navigate, toast]);

  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!product) return;

    addItem(
      {
        productId: product.id,
        name: displayName || product.name,
        price: currentPrice,
        image: product.images?.[0],
        variant: currentWeight || undefined,
        weight: currentWeight || product.weight || undefined,
      },
      quantity,
    );

    const cartName = displayName || product.name;
    const displayLine = currentWeight ? `${cartName} (${currentWeight})` : cartName;

    toast({
      title: "Added to cart!",
      description: `${quantity} x ${displayLine} added to your cart.`,
    });
  };

  const handleVariantChange = (value: string) => {
    const variant = variants.find((v) => v.weight === value);
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  // Call useSEO hook before any conditional returns
  useSEO({
    title: product
      ? `${displayName || product.name} - ${product.brand} | Maharaja's Spices`
      : "Product Details | Maharaja's Spices",
    description: product?.description || "Premium quality spices and seasonings at Maharaja's Spices",
    keywords: product
      ? `${displayName || product.name}, ${product.brand}, ${product.category}, spices, buy online, South Africa`
      : "spices, South Africa",
    type: "product",
    price: currentPrice,
    currency: "ZAR",
    availability: product?.in_stock ? "in stock" : "out of stock",
    brand: product?.brand,
    image: product?.images?.[0] || "/placeholder.svg",
    url: window.location.href,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg">Loading product...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const discount = product.original_price
    ? Math.round(((product.original_price - currentPrice) / product.original_price) * 100)
    : 0;

  const isLiked = likedProducts.has(id || '');

  const handleLikeClick = () => {
    if (id) {
      toggleLike(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <RevealOnScroll direction="up">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            ← Back to Shop
          </Button>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RevealOnScroll direction="left">
            <Card className="bg-background">
              <CardContent className="p-4 flex items-center justify-center" style={{ minHeight: '400px', maxHeight: '600px' }}>
                <img
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={displayName || product.name}
                  className="w-full h-full object-contain rounded-lg"
                  style={{ maxHeight: '500px' }}
                />
              </CardContent>
            </Card>
          </RevealOnScroll>

          <RevealOnScroll direction="right">
            <div className="space-y-6">
              <div>
                <p className="text-muted-foreground text-sm mb-2">{product.brand}</p>
                <h1 className="text-3xl font-bold mb-4">{displayName || product.name}</h1>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold text-primary">
                    {format(currentPrice)}
                  </span>
                  {currency !== 'ZAR' && (
                    <span className="text-sm text-muted-foreground">
                      (R{currentPrice.toFixed(2)} ZAR)
                    </span>
                  )}
                  {product.original_price && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        {format(product.original_price)}
                      </span>
                      <Badge variant="destructive">{discount}% OFF</Badge>
                    </>
                  )}
                </div>

                {!product.in_stock && (
                  <Badge variant="secondary" className="mb-4">
                    Out of Stock
                  </Badge>
                )}

                {/* Variant Selector */}
                {hasVariants ? (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="variant-select" className="text-sm font-medium">
                      Select Size
                    </Label>
                    <Select 
                      value={selectedVariant?.weight || ''} 
                      onValueChange={handleVariantChange}
                    >
                      <SelectTrigger id="variant-select" className="w-full max-w-xs">
                        <SelectValue placeholder="Choose a size" />
                      </SelectTrigger>
                      <SelectContent>
                        {variants.map((variant) => (
                          <SelectItem key={variant.weight} value={variant.weight}>
                            <span className="flex items-center justify-between gap-4 w-full">
                              <span className="font-medium">{variant.weight}</span>
                              <span className="text-primary font-semibold">{format(variant.price)}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {variants.length} size options available
                    </p>
                  </div>
                ) : (
                  currentWeight && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Weight: {currentWeight}
                    </p>
                  )
                )}
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold mb-3">Product Benefits</h2>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-muted-foreground">Premium quality ingredients</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-muted-foreground">Secure payment methods</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-muted-foreground">Easy returns within 30 days</span>
                  </div>
                </div>
              </div>

              {product.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>

                <Button 
                  variant={isLiked ? "default" : "outline"} 
                  size="icon"
                  onClick={handleLikeClick}
                  aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </RevealOnScroll>
        </div>

       
{product?.id && (
  <div className="mt-12">
    <RevealOnScroll direction="up">
      <ProductReviews productId={product.id} />
    </RevealOnScroll>
  </div>
)}

      </main>

      <Footer />
      
    </div>
  );
};

export default ProductDetail;