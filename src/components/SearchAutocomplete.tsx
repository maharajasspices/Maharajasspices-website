import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { categories } from "@/data/mockProducts";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  category: string;
  onCategoryChange: (category: string) => void;
  className?: string;
  isMobile?: boolean;
}

const SearchAutocomplete = ({
  value,
  onChange,
  onSearch,
  category,
  onCategoryChange,
  className = "",
  isMobile = false
}: SearchAutocompleteProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();

  useEffect(() => {
    if (value.length >= 1) {
      const needle = value.toLowerCase();
      const filtered = products
        .filter(product => {
          const searchMatch = product.name.toLowerCase().includes(needle) ||
            product.brand.toLowerCase().includes(needle) ||
            product.category.toLowerCase().includes(needle);
          
          // Filter by selected category if not "all"
          if (category !== 'all') {
            const categorySlug = product.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
            const selectedCategorySlug = category.toLowerCase();
            return searchMatch && categorySlug === selectedCategorySlug;
          }
          
          return searchMatch;
        })
        .map(product => product.name)
        .slice(0, 8);
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, products, category]);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    // Navigate with search param - will be cleared when user clicks a category
    const categoryParam = category === 'all' ? '' : `&category=${category}`;
    navigate(`/shop?search=${encodeURIComponent(suggestion)}${categoryParam}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
      setShowSuggestions(false);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Clear search when navigating away from search results
  const handleClear = () => {
    onChange("");
    setShowSuggestions(false);
  };

  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex gap-2 items-stretch">
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-28 bg-background text-foreground h-auto" aria-label="Select product category">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All</SelectItem>
              {categories.filter(cat => cat !== "All Products").map(cat => (
                <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="I'm shopping for..."
              className="bg-background text-foreground placeholder:text-muted-foreground min-h-[44px]"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => value.length >= 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-[100] mt-1 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-muted text-foreground"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button size="icon" onClick={onSearch} aria-label="Search products">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex w-full items-stretch">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-32 rounded-r-none bg-background border-r-0 text-foreground h-auto" aria-label="Select product category">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All</SelectItem>
            {categories.filter(cat => cat !== "All Products").map(cat => (
              <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="search"
            placeholder="I'm shopping for..."
            className="rounded-none border-x-0 bg-background text-foreground placeholder:text-muted-foreground min-h-[44px]"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
              onFocus={() => value.length >= 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-[100] mt-1 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 hover:bg-muted text-foreground"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button className="rounded-l-none h-auto" size="lg" onClick={onSearch} aria-label="Search products">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};

export default SearchAutocomplete;