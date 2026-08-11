import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getImageUrl } from "@/utils/imageImports";
import { Link } from "react-router-dom";

interface CartPreviewProps {
  count: number;
}

const CartPreview = ({ count }: CartPreviewProps) => {
  const { items, subtotal } = useCart();

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <Link 
          to="/cart"
          className="relative" 
          aria-label="View shopping cart"
        >
          <ShoppingCart className="h-6 w-6 text-primary" />
          {count > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {count}
            </Badge>
          )}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 z-[100] bg-background" align="end">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Shopping Cart ({count})</h4>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
          ) : (
            <>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {items.slice(0, 3).map((item) => (
                  <Link 
                    key={item.productId} 
                    to={`/product/${item.productId}`}
                    className="flex gap-2 items-center hover:bg-muted/50 p-2 rounded transition-colors"
                  >
                    {item.image && (
                      <img 
                        src={getImageUrl(item.image)} 
                        alt={item.name}
                        className="w-12 h-12 object-contain bg-muted rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-primary">R{(item.price * item.quantity).toFixed(2)}</p>
                  </Link>
                ))}
              </div>
              {items.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{items.length - 3} more items
                </p>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>Subtotal:</span>
                  <span className="text-primary">R{subtotal.toFixed(2)}</span>
                </div>
                <Link 
                  to="/cart"
                  className="block text-xs text-primary hover:underline text-center"
                >
                  View full cart
                </Link>
              </div>
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CartPreview;
