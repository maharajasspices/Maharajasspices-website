import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { useProductLikes } from "@/hooks/useProductLikes";
import { useCart } from "@/contexts/CartContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { useCurrency } from "@/hooks/useCurrency";
import { cleanProductName } from "@/utils/productName";
import { normalizeProductVariants } from "@/utils/productVariants";
import { createProductSlug } from "@/utils/productSlug";

interface ProductVariant {
  weight: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock?: boolean;
  weight?: string | null;
  variants?: ProductVariant[] | string | null;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);
  const { likedProducts, toggleLike } = useProductLikes(userId);
  const { addItem } = useCart();
  const { openDrawer } = useCartDrawer();
  const { format, currency } = useCurrency();

  const displayName = useMemo(() => cleanProductName(product.name), [product.name]);
  
  const productSlug = useMemo(
    () => createProductSlug(product.name, product.weight),
    [product.name, product.weight],
  );

  // Parse variants (backward compatible: supports legacy { size, price })
  const variants = useMemo(() => normalizeProductVariants(product.variants), [product.variants]);

  const hasVariants = variants.length > 0;

  // Get price range for variant products
  const priceRange = useMemo(() => {
    if (!hasVariants) return null;
    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  }, [variants, hasVariants]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isLiked = likedProducts.has(product.id);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        productId: product.id,
        name: displayName,
        price: product.price,
        image: product.image,
        weight: product.weight || undefined,
      },
      quantity,
    );
    openDrawer();
    setQuantity(1);
    setShowQuantity(false);
  };

  // For variant products: navigate to product page to select size
  const handleVariantClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${productSlug}`);
  };

  const toggleQuantitySelector = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuantity(!showQuantity);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all duration-300 animate-fade-in cursor-pointer">
      <Link
  to={`/product/${productSlug}`}
  className="block"
  onClick={() => console.log("PRODUCT LINK CLICKED:", productSlug)}
>
        <div className="relative overflow-hidden aspect-square bg-background">
          <img 
            src={product.image} 
            alt={displayName}
            className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            width="300"
            height="300"
            decoding="async"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          />
          {discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-primary">
              -{discount}%
            </Badge>
          )}
          {!product.inStock && (
            <Badge className="absolute top-2 left-2 bg-destructive">
              Out of Stock
            </Badge>
          )}
          <button 
            onClick={handleLikeClick}
            className={`absolute top-2 ${!product.inStock ? 'right-2' : 'left-2'} p-2.5 bg-background/80 hover:bg-background rounded-full transition-all z-10 min-w-[44px] min-h-[44px] flex items-center justify-center ${isLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isLiked}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : 'text-foreground'}`} />
          </button>
        </div>
      
      <CardContent className="p-3 md:p-4">
        <p className="text-xs md:text-sm text-muted-foreground mb-1 truncate">Brand: {product.brand}</p>
        <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-2 min-h-[2.5rem] transition-colors duration-300 group-hover:text-primary">{displayName}</h3>
        
        <div className="flex items-center gap-2 mb-2">
          {product.originalPrice && !hasVariants && (
            <span className="text-xs md:text-sm text-muted-foreground line-through">
              {format(product.originalPrice)}
            </span>
          )}
          <span className="text-base md:text-lg font-bold text-primary">
            {hasVariants && priceRange ? (
              priceRange.min === priceRange.max ? (
                format(priceRange.min)
              ) : (
                <>{format(priceRange.min)} - {format(priceRange.max)}</>
              )
            ) : (
              format(product.price)
            )}
          </span>
          {currency !== 'ZAR' && (
            <span className="text-xs text-muted-foreground">
              ({currency})
            </span>
          )}
        </div>
        {hasVariants && (
          <p className="text-xs text-muted-foreground">
            {variants.length} size{variants.length > 1 ? 's' : ''} available
          </p>
        )}
      </CardContent>
      </Link>
      
      <CardFooter className="p-4 pt-0 flex items-center gap-2">
        {/* For variant products: go to product page to select size */}
        {hasVariants ? (
          <Button 
            className="flex-1 min-h-[44px]" 
            disabled={!product.inStock}
            onClick={handleVariantClick}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Select Size</span>
            <span className="sr-only"> - {displayName}</span>
          </Button>
        ) : (
          <>
            {showQuantity && (
              <div className="flex items-center border rounded-md" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 min-w-[44px] min-h-[44px]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuantity(Math.max(1, quantity - 1));
                  }}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="px-3 font-semibold text-sm min-w-[32px] text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 min-w-[44px] min-h-[44px]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuantity(quantity + 1);
                  }}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Button 
              className="flex-1 min-h-[44px]" 
              disabled={!product.inStock}
              onClick={showQuantity ? handleAddToCart : toggleQuantitySelector}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span>{showQuantity ? "Confirm" : "Add to Cart"}</span>
              <span className="sr-only"> - {product.name}</span>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
