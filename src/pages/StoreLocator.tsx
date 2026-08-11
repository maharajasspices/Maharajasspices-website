import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Search, Store, ShoppingBag, Globe } from "lucide-react";
import storeLocationsMap from "@/assets/store-locations-map.webp";
import { useSEO } from "@/hooks/useSEO";
const StoreLocator = () => {
  const [searchQuery, setSearchQuery] = useState("");
  useSEO({
    title: "Store Locator - Find Maharaja's Spices Stores | South Africa",
    description: "Find Maharaja's Spices retail locations across South Africa. Visit our stores in Shallcross, Scottsville, and more for premium quality spices.",
    keywords: "Maharaja spices stores, spice shop locations South Africa, where to buy spices"
  });
  const stores = [{
    name: "Shallcross @ The Ridge",
    address: "The Ridge Shopping Centre, Shallcross, KwaZulu-Natal",
    phone: "031 123 4567",
    hours: "Mon-Fri: 8:00 AM - 5:00 PM, Sat: 8:00 AM - 2:00 PM",
    province: "KZN",
    city: "Shallcross",
    postalCode: "4093",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Ridge+Shopping+Centre+Shallcross"
  }, {
    name: "Scottsville @ The Mall",
    address: "Scottsville Mall, Pietermaritzburg, KwaZulu-Natal",
    phone: "033 345 6789",
    hours: "Mon-Fri: 9:00 AM - 6:00 PM, Sat: 9:00 AM - 3:00 PM",
    province: "KZN",
    city: "Pietermaritzburg",
    postalCode: "3209",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Scottsville+Mall+Pietermaritzburg"
  }];

  // Filter stores based on search query
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const query = searchQuery.toLowerCase().trim();
    return stores.filter(store => store.name.toLowerCase().includes(query) || store.address.toLowerCase().includes(query) || store.province.toLowerCase().includes(query) || store.city.toLowerCase().includes(query) || store.postalCode.includes(query));
  }, [searchQuery]);
  const handleSearch = () => {
    // Search is already reactive via filteredStores
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {/* EASILY REVERTABLE: Hero Section - Remove this RevealOnScroll block to revert */}
        <RevealOnScroll>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Find Us Near You</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Are you looking for authentic spices? Discover Maharaja's Spices at our retail locations or find us at most supermarkets across South Africa. Your culinary adventure starts here!</p>
          </div>
        </RevealOnScroll>

        {/* Locations Map */}
        <RevealOnScroll delay={100}>
          <Card className="mb-8">
            <CardContent className="p-6">
              <img src={storeLocationsMap} alt="Maharaja's Spices Store Locations Map across South Africa" className="w-full h-auto rounded-lg" />
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary rounded-sm flex-shrink-0 mt-0.5">
                    <Store className="h-4 w-4 text-primary-foreground" />
                  </span>
                  <div>
                    <p className="font-bold text-foreground">MAHARAJA'S RETAIL STORE</p>
                    <p className="text-sm text-muted-foreground">The Ridge, Shallcross and Mall at Scottsville, Pietermaritzburg</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-[#FFD700] rounded-sm flex-shrink-0 mt-0.5">
                    <ShoppingBag className="h-4 w-4 text-white" />
                  </span>
                  <div>
                    <p className="font-bold text-foreground">DISTRIBUTION STORES INCLUDE</p>
                    <p className="text-sm text-muted-foreground">Selected SPAR stores, Selected Pick 'n Pay stores, Selected Checkers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-[#FF00FF] rounded-sm flex-shrink-0 mt-0.5">
                    <Globe className="h-4 w-4 text-white" />
                  </span>
                  <div>
                    <p className="font-bold text-foreground">AVAILABLE ONLINE</p>
                    <p className="text-sm text-muted-foreground">Available to shop online</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </RevealOnScroll>

        {/* Search */}
        <RevealOnScroll delay={100}>
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex gap-2">
                <Input type="search" placeholder="Search by city, province, or postal code..." className="flex-1" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <Button variant="hero" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              {searchQuery && <p className="text-sm text-muted-foreground mt-2">
                  {filteredStores.length === 0 ? "No stores found matching your search. Try a different city or province." : `Found ${filteredStores.length} store${filteredStores.length !== 1 ? 's' : ''} matching "${searchQuery}"`}
                </p>}
            </CardContent>
          </Card>
        </RevealOnScroll>

        {/* Store List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store, index) => <RevealOnScroll key={index} direction="up" delay={200 + index * 100}>
              <Card className="hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:scale-105 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{store.name}</h3>
                      <a href={store.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground mb-1 hover:text-primary select-text block">
                        {store.address}
                      </a>
                      <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                        {store.province}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                        {store.phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{store.hours}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4" variant="outline" onClick={() => {
                window.open(store.mapsUrl, '_blank', 'noopener,noreferrer');
              }} aria-label={`Get directions to ${store.name}`}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            </RevealOnScroll>)}
        </div>

        {filteredStores.length === 0 && searchQuery && <RevealOnScroll>
            <div className="text-center py-12">
              <p className="text-muted-foreground">No stores found in that area yet.</p>
              <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                Clear search to see all stores
              </Button>
            </div>
          </RevealOnScroll>}

        <RevealOnScroll delay={500}>
          <div className="mt-8 text-center text-muted-foreground">
            <p>More locations across South Africa coming soon!</p>
          </div>
        </RevealOnScroll>
      </main>

      <Footer />
    </div>;
};
export default StoreLocator;