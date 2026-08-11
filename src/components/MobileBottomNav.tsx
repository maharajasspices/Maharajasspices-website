import { Home, ShoppingBag, Heart, User, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const MobileBottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isMobile) return null;

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/shop", icon: ShoppingBag, label: "Shop" },
    { path: "/liked-items", icon: Heart, label: "Favorites" },
    { path: "/account", icon: User, label: "Account" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-border shadow-[var(--shadow-elegant)] md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? "fill-primary" : ""}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-6">
              <Link to="/about" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                About Us
              </Link>
              <Link to="/contact" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Contact Us
              </Link>
              <Link to="/recipes" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Recipes
              </Link>
              <Link to="/forum" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Forum
              </Link>
              <Link to="/recently-viewed" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Recently Viewed
              </Link>
              <Link to="/cart" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Shopping Cart
              </Link>
              <Link to="/become-stockist" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Become a Stockist
              </Link>
              <Link to="/track-order" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Track Order
              </Link>
              <Link to="/store-locator" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Store Locator
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
