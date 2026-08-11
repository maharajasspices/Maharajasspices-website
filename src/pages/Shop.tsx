import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

import { useSEO } from "@/hooks/useSEO";
import { categories } from "@/data/mockProducts";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid3x3, List, ChevronRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
const toCategorySlug = (category: string) => category.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-");

function resolveCategoryFromParam(
  categoryParam: string | null,
  categoryOptions: string[]
): { name: string; canonicalSlug: string | null; isValid: boolean } {
  if (!categoryParam || categoryParam.trim() === "" || categoryParam === "all") {
    return { name: "All Products", canonicalSlug: null, isValid: true };
  }

  const decoded = decodeURIComponent(categoryParam).toLowerCase();

  const match = categoryOptions.find((cat) => {
    if (cat === "All Products") return decoded === "all";
    const slugCanonical = toCategorySlug(cat);
    const slugSpacesOnly = cat.toLowerCase().replace(/\s+/g, "-");
    const plain = cat.toLowerCase();
    return decoded === slugCanonical || decoded === slugSpacesOnly || decoded === plain;
  });

  if (!match) {
    return { name: "All Products", canonicalSlug: null, isValid: false };
  }

  if (match === "All Products") {
    return { name: "All Products", canonicalSlug: null, isValid: true };
  }

  return { name: match, canonicalSlug: toCategorySlug(match), isValid: true };
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const Shop = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Use React Query for cached product fetching
  const {
    data: products = [],
    isLoading
  } = useProducts();

  // Track if we already applied ?brand=... from the URL (so we don't keep overriding user choices)
  const brandAppliedRef = useRef<string | null>(null);
  const brandCategoryAppliedRef = useRef<string | null>(null);

  const categoryOptions = useMemo(() => {
    const fromProducts = Array.from(
      new Set(products.map((p) => p.category).filter((c): c is string => !!c))
    );
    const merged = new Set<string>(["All Products", ...categories, ...fromProducts]);
    const others = Array.from(merged)
      .filter((c) => c !== "All Products")
      .sort((a, b) => a.localeCompare(b));
    return ["All Products", ...others];
  }, [products]);

  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  const pageParam = searchParams.get("page");

  const resolvedCategory = useMemo(
    () => resolveCategoryFromParam(categoryParam, categoryOptions),
    [categoryParam, categoryOptions]
  );

  const selectedCategory = resolvedCategory.name;
  const currentPage = parsePositiveInt(pageParam, 1);

  const commitSearchParams = useCallback(
    (next: URLSearchParams, opts?: { replace?: boolean }) => {
      const nextStr = next.toString();
      const nextSearch = nextStr ? `?${nextStr}` : "";
      if (location.search === nextSearch) return;
      navigate(
        { pathname: location.pathname, search: nextSearch },
        { replace: opts?.replace ?? false }
      );
    },
    [location.pathname, location.search, navigate]
  );

  // Canonicalize URL params to avoid oscillation (/shop? <-> /shop?page=4) and normalize legacy slugs.
  const searchKey = searchParams.toString();
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;

    // Normalize page
    const rawPage = next.get("page");
    if (rawPage) {
      const parsed = parsePositiveInt(rawPage, 1);
      if (!Number.isFinite(parsed) || parsed <= 1) {
        next.delete("page");
        changed = true;
      } else if (String(parsed) !== rawPage) {
        next.set("page", String(parsed));
        changed = true;
      }
    }

    // Normalize category
    const rawCategory = next.get("category");
    if (rawCategory) {
      const resolved = resolveCategoryFromParam(rawCategory, categoryOptions);
      if (!resolved.isValid || rawCategory === "all") {
        next.delete("category");
        changed = true;
      } else if (resolved.canonicalSlug && rawCategory !== resolved.canonicalSlug) {
        next.set("category", resolved.canonicalSlug);
        changed = true;
      }
    }

    // Remove naked "?" (some navigation APIs can leave location.search as just '?')
    if (!changed && location.search === "?") {
      navigate({ pathname: location.pathname, search: "" }, { replace: true });
      return;
    }

    if (changed) {
      commitSearchParams(next, { replace: true });
    }
  }, [searchKey, location.pathname, location.search, navigate, categoryOptions, commitSearchParams, searchParams]);

  // Apply brand from URL param (only when it first appears, and when products are available)
  useEffect(() => {
    if (!brandParam) {
      brandAppliedRef.current = null;
      brandCategoryAppliedRef.current = null;
      return;
    }
    const decodedBrand = decodeURIComponent(brandParam);
    let nextParams: URLSearchParams | null = null;

    // Only force-select the brand ONCE per URL brand value
    if (brandAppliedRef.current !== decodedBrand) {
      brandAppliedRef.current = decodedBrand;
      brandCategoryAppliedRef.current = null;
      setSelectedBrands([decodedBrand]);

      // Reset pagination when landing with a brand filter
      if (searchParams.get("page")) {
        nextParams = new URLSearchParams(searchParams);
        nextParams.delete("page");
      }
    }

    // If the URL brand is selected, auto-set the brand's primary category (once products are loaded)
    if (products.length > 0 && brandCategoryAppliedRef.current !== decodedBrand && selectedBrands.includes(decodedBrand)) {
      const brandProducts = products.filter(p => p.brand === decodedBrand);
      if (brandProducts.length > 0) {
        const categoryCounts = brandProducts.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const mainCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
        if (mainCategory) {
          brandCategoryAppliedRef.current = decodedBrand;

          const canonical = toCategorySlug(mainCategory);
          if (searchParams.get("category") !== canonical) {
            nextParams = nextParams ?? new URLSearchParams(searchParams);
            nextParams.set("category", canonical);
          }

          // Always reset page when switching category automatically
          if (searchParams.get("page")) {
            nextParams = nextParams ?? new URLSearchParams(searchParams);
            nextParams.delete("page");
          }
        }
      }
    }

    if (nextParams) {
      commitSearchParams(nextParams, { replace: true });
    }
  }, [brandParam, products, selectedBrands, searchKey, commitSearchParams, searchParams]);

  // Extract sizes from products dynamically - only numeric weights
  const availableSizes = Array.from(new Set(products.filter(p => p.weight).map(p => p.weight).filter((w): w is string => w !== null && /^\d/.test(w)))).sort();
  const availableBrands = Array.from(new Set(products.map(p => p.brand))).sort();
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };
  const filteredProducts = products.filter(product => {
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";
    const categoryMatch = selectedCategory === "All Products" || product.category === selectedCategory;
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    const searchMatch = !searchQuery || product.name.toLowerCase().includes(searchQuery) || product.brand.toLowerCase().includes(searchQuery) || product.category.toLowerCase().includes(searchQuery);
    const sizeMatch = selectedSizes.length === 0 || selectedSizes.some(size => product.weight?.toLowerCase() === size.toLowerCase());
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    return categoryMatch && priceMatch && searchMatch && sizeMatch && brandMatch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "latest":
      default:
        return 0;
    }
  });
  const itemsPerPage = 12;
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Reset to page 1 when local (non-URL) filters change - use refs to compare previous values
  const prevFiltersRef = useRef({ sortBy, priceRange, selectedSizes, selectedBrands });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged =
      prev.sortBy !== sortBy ||
      prev.priceRange[0] !== priceRange[0] ||
      prev.priceRange[1] !== priceRange[1] ||
      prev.selectedSizes.join(",") !== selectedSizes.join(",") ||
      prev.selectedBrands.join(",") !== selectedBrands.join(",");

    prevFiltersRef.current = { sortBy, priceRange, selectedSizes, selectedBrands };

    if (!filtersChanged) return;
    
    // Only reset page if we're not already on page 1
    const currentPageNum = parsePositiveInt(searchParams.get("page"), 1);
    if (currentPageNum <= 1) return;

    const next = new URLSearchParams(searchParams);
    next.delete("page");
    commitSearchParams(next, { replace: true });
  }, [sortBy, priceRange, selectedSizes, selectedBrands, commitSearchParams, searchParams]);

  // If the user lands on an out-of-range page (e.g. /shop?page=99), clamp it.
  useEffect(() => {
    if (totalPages <= 0) return;
    if (currentPage <= totalPages) return;

    const next = new URLSearchParams(searchParams);
    if (totalPages <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(totalPages));
    }
    commitSearchParams(next, { replace: true });
  }, [totalPages, currentPage, commitSearchParams, searchParams]);

  // Generate ItemList structured data for category browsing
  useEffect(() => {
    if (paginatedProducts.length === 0) return;
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": selectedCategory !== 'All Products' ? `${selectedCategory} - Maharaja's Spices` : "All Products - Maharaja's Spices",
      "numberOfItems": filteredProducts.length,
      "itemListElement": paginatedProducts.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://maharajasspices.co.za/product/${product.id}`,
        "name": product.name
      }))
    };
    let script = document.querySelector('script[type="application/ld+json"][data-type="item-list"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-type', 'item-list');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
    return () => {
      const el = document.querySelector('script[type="application/ld+json"][data-type="item-list"]');
      if (el) el.remove();
    };
  }, [paginatedProducts, selectedCategory, filteredProducts.length]);

  // Call useSEO before any conditional returns (hooks must be called in the same order)
  useSEO({
    title: selectedCategory !== 'All Products'
      ? `${selectedCategory} - Buy Online | Maharaja's Spices South Africa`
      : "Shop Premium Spices, Sauces & Seasonings Online | Maharaja's Spices",
    description: selectedCategory !== 'All Products'
      ? `Shop ${selectedCategory.toLowerCase()} online at Maharaja's Spices. ${filteredProducts.length} products available. Premium quality, fast delivery across South Africa.`
      : `Browse ${products.length}+ premium spices, sauces, marinades and seasonings. Shop online at Maharaja's Spices with fast delivery across South Africa.`,
    keywords: `buy spices online, ${selectedCategory.toLowerCase()}, wholesale spices, South African spices, spice shop, buy curry powder, garam masala online, ${selectedCategory !== 'All Products' ? selectedCategory.toLowerCase() + ' South Africa' : 'premium spices'}`,
    type: "website",
    url: selectedCategory !== 'All Products'
      ? `https://maharajasspices.co.za/shop?category=${encodeURIComponent(toCategorySlug(selectedCategory))}`
      : "https://maharajasspices.co.za/shop"
  });
  if (isLoading) {
    return <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg">Loading products...</p>
        </main>
        <Footer />
      </div>;
  }
  return <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 animate-fade-in">
          <Link to="/" className="text-primary hover:underline">Home</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Shop</span>
        </nav>

        <h1 className="text-4xl font-bold mb-8 animate-fade-in-up">Shop Our Products</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-8">
                {/* Categories */}
                <div>
                  <h2 className="text-xl font-bold mb-4">CATEGORIES</h2>
                  <ul className="space-y-2">
                    {categoryOptions.map(category => <li key={category}>
                        <button onClick={() => {
                          // Clear search when selecting a category to avoid being "stuck"
                          const newParams = new URLSearchParams(searchParams);
                          newParams.delete('search');
                          if (category !== "All Products") {
                            newParams.set('category', toCategorySlug(category));
                          } else {
                            newParams.delete('category');
                          }
                          newParams.delete('page');
                          commitSearchParams(newParams, { replace: false });
                        }} className={`w-full text-left py-2 px-3 rounded transition-colors ${selectedCategory === category ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}>
                          {category}
                        </button>
                      </li>)}
                  </ul>
                </div>

                {/* By Brands */}
                <div>
                  <h2 className="text-xl font-bold mb-4">BY BRANDS</h2>
                  <div className="mb-4">
                    <Input type="text" placeholder="Search brands..." value={brandSearch} onChange={e => setBrandSearch(e.target.value)} className="w-full" />
                  </div>
                  <div className="space-y-3">
                  {availableBrands.filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase())).map(brand => {
                    const count = products.filter(p => p.brand === brand).length;
                    return <div key={brand} className="flex items-center space-x-2">
        <Checkbox id={brand} checked={selectedBrands.includes(brand)} onCheckedChange={() => toggleBrand(brand)} />
        <label htmlFor={brand} className="text-sm cursor-pointer flex-1">
          {brand} ({count})
        </label>
      </div>;
                  })}
                  </div>
                </div>

                {/* By Price */}
                <div>
                  <h2 className="text-xl font-bold mb-4">BY PRICE</h2>
                  <div className="space-y-4">
                    <div>
                      <Label>Price Range: R{priceRange[0]} - R{priceRange[1]}</Label>
                      <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={5} className="mt-2" />
                    </div>
                  </div>
                </div>

                 {/* By Size */}
                <div>
                  <h2 className="text-xl font-bold mb-4">BY SIZE</h2>
                  <div className="space-y-3">
                  {availableSizes.map(size => {
                    const count = products.filter(p => p.weight?.toLowerCase() === size.toLowerCase()).length;
                    return <div key={size} className="flex items-center space-x-2">
      <Checkbox id={size} checked={selectedSizes.includes(size)} onCheckedChange={() => toggleSize(size)} />
      <label htmlFor={size} className="text-sm cursor-pointer flex-1">
        {size} ({count})
      </label>
    </div>;
                  })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Top bar with count, sort, and view toggle */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-muted-foreground font-semibold">
                {sortedProducts.length} Products found {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
              </p>
              
              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by latest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Sort by latest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">View</span>
                  <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")} className="h-10 w-10 min-w-[44px] min-h-[44px]" aria-label="Grid view" aria-pressed={viewMode === "grid"}>
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")} className="h-10 w-10 min-w-[44px] min-h-[44px]" aria-label="List view" aria-pressed={viewMode === "list"}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {paginatedProducts.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "grid grid-cols-1 gap-4"
                }
              >
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : selectedCategory === "Virtual Spice Bar" ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <p className="text-2xl font-bold text-primary mb-4"> 🔥 Coming Soon!</p>
                  <p className="text-lg text-muted-foreground">
                    Look out for something exciting! Our Virtual Spice Bar is under construction.
                    Stay tuned for a unique spice experience.
                  </p>
                </div>
              </div>
            ) : selectedCategory === "Gifting" ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <p className="text-2xl font-bold text-primary mb-4"> 🎁 Coming Soon!</p>
                  <p className="text-lg text-muted-foreground">
                    Coming Soon! Our gifting collection is being curated.
                  </p>
                </div>
              </div>
            ) : selectedCategory === "Baking" ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <p className="text-2xl font-bold text-primary mb-4"> 🧁 Coming Soon!</p>
                  <p className="text-lg text-muted-foreground">
                    Coming Soon! Our baking essentials collection is being prepared.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">No products found in this price range.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && <div className="mt-8 flex flex-wrap justify-center items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
              const nextPage = Math.max(1, currentPage - 1);
              const next = new URLSearchParams(searchParams);
              if (nextPage <= 1) next.delete("page");else next.set("page", String(nextPage));
              commitSearchParams(next, { replace: false });
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }} disabled={currentPage === 1} aria-label="Previous page" className="min-w-[80px]">
                  Previous
                </Button>
                <div className="flex gap-1 flex-wrap justify-center">
                  {Array.from({
                length: Math.min(5, totalPages)
              }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (pageNum <= 1) next.delete("page");else next.set("page", String(pageNum));
                  commitSearchParams(next, { replace: false });
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }} className="min-w-[2.5rem] min-h-[2.5rem]" aria-label={`Go to page ${pageNum}`} aria-current={currentPage === pageNum ? "page" : undefined}>
                        {pageNum}
                      </Button>;
              })}
                </div>
                <Button variant="outline" size="sm" onClick={() => {
              const nextPage = Math.min(totalPages, currentPage + 1);
              const next = new URLSearchParams(searchParams);
              if (nextPage <= 1) next.delete("page");else next.set("page", String(nextPage));
              commitSearchParams(next, { replace: false });
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }} disabled={currentPage === totalPages} aria-label="Next page" className="min-w-[80px]">
                  Next
                </Button>
              </div>}
          </div>
        </div>
      </main>

      <Footer />
      
    </div>;
};
export default Shop;