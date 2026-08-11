import { User, Menu, Info, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import logo from "@/assets/logo-main.webp";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useCart } from "@/contexts/CartContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import CartPreview from "@/components/CartPreview";
import LikedPreview from "@/components/LikedPreview";
import { usePortalAccess } from "@/hooks/usePortalAccess";
const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  // Cart count comes from Cart context
  const { totalCount: cartCount } = useCart();
  const { isLoggedIn, isEmployee, isAdmin, likedCount, isLoading: isPortalAccessLoading } = usePortalAccess();
  useCartDrawer();
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}&category=${searchCategory}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Bar - Hidden on mobile - EASILY REVERTABLE: Change bg-secondary to bg-primary and text-primary to text-primary-foreground */}
      <div className="bg-secondary text-secondary-foreground hidden md:block overflow-x-auto">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm gap-2 lg:gap-4 min-w-fit flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <a href="tel:0684051374" className="flex items-center gap-1 hover:underline whitespace-nowrap text-primary font-semibold text-xs lg:text-sm">
                Hotline: 068 405 1374
              </a>
              <span className="hidden lg:inline text-muted-foreground">|</span>
              <a href="mailto:e-commerce@maharajasspices.co.za" className="hover:underline whitespace-nowrap text-primary text-xs lg:text-sm hidden lg:inline">
                e-commerce@maharajasspices.co.za
              </a>
            </div>
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <Link to="/become-stockist" className="hover:underline whitespace-nowrap text-primary text-xs lg:text-sm">Become a Stockist</Link>
              <span className="hidden lg:inline text-muted-foreground">|</span>
              <Link to="/track-order" className="hover:underline whitespace-nowrap text-primary text-xs lg:text-sm">Track Order</Link>
              <span className="hidden lg:inline text-muted-foreground">|</span>
              <Link to="/store-locator" className="hover:underline whitespace-nowrap text-primary text-xs lg:text-sm">Store Locator</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-secondary text-secondary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo - Even Bigger */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 animate-fade-in">
              <img 
                src={logo} 
                alt="Maharaja's Spices official logo" 
                className="h-16 sm:h-20 md:h-28 lg:h-32 w-auto hover:scale-110 transition-transform duration-300"
                width="1920"
                height="889"
                loading="eager"
                fetchPriority="high"
              />
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-4">
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                category={searchCategory}
                onCategoryChange={setSearchCategory}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              {/* Mobile Info Icon */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-secondary-foreground hover:bg-secondary/80 [&_svg]:!size-6" aria-label="Open info menu">
                      <Info />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[220px] bg-background z-50">
                    <DropdownMenuItem asChild>
                      <a href="mailto:e-commerce@maharajasspices.co.za">Email: e-commerce@maharajasspices.co.za</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="tel:0684051374">Hotline: 068 405 1374</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/become-stockist">Become a Stockist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/track-order">Track Your Order</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/store-locator">Store Locator</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Cart with Preview */}
              <CartPreview count={cartCount} />

              {/* Favorites with Preview */}
              <LikedPreview count={likedCount} />

              {/* Recently Viewed */}
              <Link to="/recently-viewed" className="relative" aria-label="View recently viewed">
                <Clock className="h-6 w-6 text-primary" />
              </Link>

              {/* Login/Account - Icon only on mobile, text on desktop */}
              {!isLoggedIn ? (
                <Link to="/auth" className="flex flex-col items-center justify-center text-primary hover:text-primary/80 min-w-[40px] flex-shrink-0">
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-[8px] md:text-[10px] lg:text-xs mt-0.5 sm:mt-1 text-center leading-tight hidden sm:block whitespace-nowrap" aria-hidden="true">Log in<br/>Register</span>
                  <span className="sr-only">Log in or Register</span>
                </Link>
              ) : (
                <Link to="/account" className="flex flex-col items-center justify-center text-primary hover:text-primary/80 min-w-[40px] flex-shrink-0">
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="sr-only">Account</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              category={searchCategory}
              onCategoryChange={setSearchCategory}
              isMobile={true}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary/80 gap-2">
                  <Menu className="h-5 w-5" />
                  Browse Shop
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-background z-50 min-w-[200px]">
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=baking">Baking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=condiments">Condiments</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=gifting">Gifting</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=grains">Grains</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=marinades">Marinades</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=pastes-rubs">Pastes & Rubs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=sauces">Sauces</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=spices">Spices</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=whole-spices">Whole Spices</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=virtual-spice-bar">Virtual Spice Bar</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden md:flex items-center gap-1 md:gap-2 xl:gap-6 ml-2 md:ml-4 xl:ml-8 overflow-x-auto">
              <Link to="/" className="py-4 hover:bg-primary/80 px-1 md:px-2 xl:px-4 transition-colors text-xs md:text-sm xl:text-base whitespace-nowrap">Home</Link>
              <Link to="/about" className="py-4 hover:bg-primary/80 px-1 md:px-2 xl:px-4 transition-colors text-xs md:text-sm xl:text-base whitespace-nowrap">About Us</Link>
              <Link to="/contact" className="py-4 hover:bg-primary/80 px-1 md:px-2 xl:px-4 transition-colors text-xs md:text-sm xl:text-base whitespace-nowrap">Contact</Link>
              <Link to="/shop" className="py-4 hover:bg-primary/80 px-1 md:px-2 xl:px-4 transition-colors text-xs md:text-sm xl:text-base whitespace-nowrap">Shop</Link>
              <Link to="/recipes" className="py-4 hover:bg-primary/80 px-1 md:px-2 xl:px-4 transition-colors text-xs md:text-sm xl:text-base whitespace-nowrap">Recipes</Link>
              <Link to="/forum" className="py-4 hover:bg-primary/80 px-1 md:px-2 xl:px-4 transition-colors text-xs md:text-sm xl:text-base whitespace-nowrap">Forum</Link>
               {isAdmin && (
                <Link to="/admin-dashboard" className="py-4 hover:bg-primary/80 px-1 md:px-2 xl:px-4 transition-colors text-xs md:text-sm xl:text-base whitespace-nowrap bg-primary/20">Dashboard</Link>
              )}
               {!isPortalAccessLoading && isEmployee && (
                <Link to="/employee-dashboard" className="py-4 hover:bg-primary/80 px-1 md:px-2 xl:px-4 transition-colors text-xs md:text-sm xl:text-base whitespace-nowrap bg-primary/20">Orders Portal</Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;