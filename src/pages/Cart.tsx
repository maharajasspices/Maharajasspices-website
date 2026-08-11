import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { getImageUrl } from "@/utils/imageImports";
import { useSEO } from "@/hooks/useSEO";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QuickPickProduct {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  weight: string | null;
}

const Cart = () => {
  const { items, removeItem, updateQuantity, subtotal, addItem } = useCart();
  const [quickPicks, setQuickPicks] = useState<QuickPickProduct[]>([]);

  useEffect(() => {
    const fetchQuickPicks = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, images, weight')
        .eq('in_stock', true)
        .limit(10);
      
      if (data) {
        const shuffled = data.sort(() => 0.5 - Math.random());
        setQuickPicks(shuffled.slice(0, 5));
      }
    };
    fetchQuickPicks();
  }, []);

  const handleAddQuickPick = (product: QuickPickProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      weight: product.weight || undefined,
    });
  };

  useSEO({
    title: "Shopping Cart - Maharaja's Spices | Your Items",
    description: "Review your cart items and proceed to checkout for premium quality spices and seasonings from Maharaja's Spices.",
    keywords: "shopping cart, buy spices online, checkout"
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-16 animate-fade-in flex-1">
        {items.length === 0 ? (
          <div className="max-w-4xl mx-auto text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6 animate-scale-in" />
            <h1 className="text-4xl font-bold mb-4 animate-fade-in-up">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Looks like you haven't added any items to your cart yet.
            </p>
            
            <Card className="mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Cart Features</h2>
                <p className="text-muted-foreground mb-4">
                  Your cart information is securely stored and ready for checkout.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-semibold text-foreground">✓ Save Items</p>
                    <p className="text-muted-foreground">Store your favorites</p>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-semibold text-foreground">✓ Secure Checkout</p>
                    <p className="text-muted-foreground">100% secure payment</p>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-semibold text-foreground">✓ Fast Delivery</p>
                    <p className="text-muted-foreground">Track your order</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link to="/shop">
              <Button size="lg" variant="hero" className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 animate-fade-in-up">Shopping Cart</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => {
                  const itemKey = item.variant ? `${item.productId}-${item.variant}` : item.productId;
                  return (
                    <Card key={itemKey}>
                      <CardContent className="p-3 md:p-4">
                        <div className="flex gap-3 md:gap-4">
                          {item.image && (
                            <img 
                              src={getImageUrl(item.image)} 
                              alt={item.name} 
                              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain rounded flex-shrink-0 bg-muted"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg line-clamp-2">{item.name}</h3>
                            {item.variant && (
                              <p className="text-xs text-muted-foreground">Size: {item.variant}</p>
                            )}
                            <p className="text-primary font-bold mt-1 text-sm md:text-base">R{item.price.toFixed(2)}</p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 md:mt-4">
                              <div className="flex items-center border rounded-md w-fit">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                  className="h-8 w-8 md:h-10 md:w-10"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                                <span className="px-3 md:px-4 font-semibold text-sm md:text-base">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                  className="h-8 w-8 md:h-10 md:w-10"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.productId, item.variant)}
                                className="text-destructive hover:text-destructive min-h-[44px] justify-start sm:justify-center"
                                aria-label="Remove item from cart"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span className="text-sm">Remove</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold">Order Summary</h2>
                    
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">R{subtotal.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Tax and shipping calculated at checkout</p>
                    </div>
                    
                    <Link to="/checkout">
                      <Button size="lg" className="w-full">
                        Proceed to Checkout
                      </Button>
                    </Link>
                    
                    <Link to="/shop">
                      <Button size="lg" variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Picks Section */}
            {quickPicks.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Quick Picks</h2>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-2">
                    {quickPicks.map((product) => (
                      <Card key={product.id} className="overflow-hidden flex-shrink-0 w-[160px] sm:w-[180px]">
                        <CardContent className="p-3">
                          <img 
                            src={getImageUrl(product.images?.[0] || '')} 
                            alt={product.name}
                            className="w-full h-28 sm:h-36 object-contain mb-2 bg-muted rounded"
                          />
                          <p className="text-sm font-medium line-clamp-2 mb-1">{product.name}</p>
                          <p className="text-primary font-bold text-sm mb-2">R{product.price.toFixed(2)}</p>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleAddQuickPick(product)}
                          >
                            Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
