import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { getImageUrl } from "@/utils/imageImports";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";


interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  weight: string | null;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, subtotal, addItem } = useCart();
  const [quickPicks, setQuickPicks] = useState<Product[]>([]);

  useEffect(() => {
    const fetchQuickPicks = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, images, weight')
        .eq('in_stock', true)
        .limit(10);
      
      if (data) {
        // Shuffle and pick 5 random items
        const shuffled = data.sort(() => 0.5 - Math.random());
        setQuickPicks(shuffled.slice(0, 5));
      }
    };

    if (open) {
      fetchQuickPicks();
    }
  }, [open]);

  const handleAddQuickPick = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      weight: product.weight || undefined,
    });
  };

  // Generate unique key for cart item (for React)
  const getItemKey = (item: typeof items[0]) => {
    return item.variant ? `${item.productId}-${item.variant}` : item.productId;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto p-0"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 py-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl sm:text-2xl">Shopping Cart ({items.length})</SheetTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Button variant="outline" onClick={() => onOpenChange(false)} asChild>
                  <Link to="/shop">Continue Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={getItemKey(item)}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        {item.image && (
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded flex-shrink-0 bg-muted"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base line-clamp-2">{item.name}</h4>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground">Size: {item.variant}</p>
                          )}
                          <p className="text-primary font-bold mt-1 text-sm sm:text-base">R{item.price.toFixed(2)}</p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                className="h-8 w-8"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="px-3 font-semibold text-sm">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                className="h-8 w-8"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.productId, item.variant)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quick Picks Section */}
            {items.length > 0 && quickPicks.length > 0 && (
              <div className="mt-8 pb-4">
                <h3 className="text-lg font-semibold mb-4">Quick Picks</h3>
              <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {quickPicks.map((product) => (
                      <Card key={product.id} className="overflow-hidden flex-shrink-0 w-[140px] sm:w-[160px]">
                        <CardContent className="p-2 sm:p-3">
                          <img 
                            src={getImageUrl(product.images?.[0] || '')} 
                            alt={product.name}
                            className="w-full h-24 sm:h-32 object-contain mb-2 bg-muted rounded"
                          />
                          <p className="text-xs sm:text-sm font-medium line-clamp-2 mb-1">{product.name}</p>
                          <p className="text-primary font-bold text-xs sm:text-sm mb-2">R{product.price.toFixed(2)}</p>
                          <Button 
                            size="sm" 
                            className="w-full text-xs h-8"
                            onClick={() => handleAddQuickPick(product)}
                          >
                            Add
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t bg-background px-4 sm:px-6 py-4 space-y-3">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Subtotal:</span>
                <span className="text-primary">R{subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tax and shipping calculated at checkout</p>
              
              <Link to="/checkout" onClick={() => onOpenChange(false)}>
                <Button size="lg" className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full"
                onClick={() => onOpenChange(false)}
                asChild
              >
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
