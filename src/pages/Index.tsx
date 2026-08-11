import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { brands } from "@/data/mockProducts";
import { ArrowRight, Sparkles, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import marinadesBg from "/marinades-background.webp";
import pastesRubsBg from "/pastes-rubs-background.webp";
import grainsImage from "@/assets/grains.jpg";
import productsImage from "@/assets/products.webp";
import spicesDisplayImage from "@/assets/spices-display.webp";
import spiceBarImage from "@/assets/spice-bar.webp";
import logoOfficial from "@/assets/logo-main.webp";
import { brandLogos } from "@/utils/imageImports";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProducts } from "@/hooks/useProducts";
import { generateOrganizationStructuredData } from "@/utils/seo";
const Index = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const {
    recentlyViewed
  } = useRecentlyViewed(userId);
  const {
    data: products = [],
    isLoading
  } = useProducts();
  useEffect(() => {
    // Defer auth check to idle time to improve TTI
    const checkAuth = () => {
      supabase.auth.getSession().then(({
        data: {
          session
        }
      }) => {
        setUserId(session?.user?.id);
      });
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(checkAuth, {
        timeout: 2000
      });
    } else {
      setTimeout(checkAuth, 100);
    }

    // Add organization structured data
    generateOrganizationStructuredData();
  }, []);

  // Memoize featured products to prevent flickering on re-renders
  // Only recalculate when products array changes (not on every render)
  const featuredProducts = useMemo(() => {
    if (products.length === 0) return [];
    
    const brandNames = ['Maharaja\'s Spices', 'G-Force', 'Mother\'s Hand', 'Curry in a Hurry', 'HomeMade'];
    const randomProducts: typeof products = [];
    
    // Use a seeded approach based on products length to keep selection stable
    const seed = products.length;
    const pseudoRandom = (index: number) => ((seed * (index + 1) * 9301 + 49297) % 233280) / 233280;
    
    brandNames.forEach((brandName, i) => {
      const brandProducts = products.filter(p => p.brand === brandName);
      if (brandProducts.length > 0) {
        const randomIndex = Math.floor(pseudoRandom(i) * brandProducts.length);
        randomProducts.push(brandProducts[randomIndex]);
      }
    });

    // Add one more random product to make 6
    if (products.length > randomProducts.length) {
      const remainingProducts = products.filter(p => !randomProducts.includes(p));
      if (remainingProducts.length > 0) {
        const randomIndex = Math.floor(pseudoRandom(5) * remainingProducts.length);
        randomProducts.push(remainingProducts[randomIndex]);
      }
    }
    return randomProducts.slice(0, 6);
  }, [products]);

  const recentProducts = useMemo(() => 
    recentlyViewed.slice(0, 4).map(id => products.find(p => p.id === id)).filter((p): p is NonNullable<typeof p> => p !== undefined),
    [recentlyViewed, products]
  );
  useSEO({
    title: "Maharaja's Spices - Premium Spices, Sauces & Seasonings | Shop Online South Africa",
    description: "Shop premium quality spices, sauces, marinades and seasonings online at Maharaja's Spices. Wholesale and retail since 2012. Fast delivery across South Africa. Curry powder, garam masala, tandoori & more.",
    keywords: "Maharaja's Spices, buy spices online South Africa, premium spices, sauces, marinades, seasonings, wholesale spices, curry powder, garam masala, tandoori masala, spice shop online, G-Force sauces, Mother's Hand pastes",
    type: "website",
    url: "https://maharajasspices.co.za"
  });
  return <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Carousel with auto-scrolling */}
        <HeroCarousel />

      {/* Secondary Hero Sections */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RevealOnScroll direction="left">
            <Card className="relative overflow-hidden min-h-[300px] group">
            <img src={marinadesBg} alt="Marinades & Sauces" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" width="1244" height="829" loading="eager" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
            <CardContent className="relative z-10 p-8 flex flex-col justify-center h-full text-primary-foreground">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-playfair animate-fade-in-up">Marinades<br />& Sauces</h2>
              <p className="text-lg mb-6 animate-fade-in-up" style={{
                  animationDelay: '0.1s'
                }}>Each bottle is bursting with a symphony of flavours, meticulously balanced to tantalize your palate</p>
              <Button variant="hero" size="lg" asChild className="w-fit animate-fade-in-up" style={{
                  animationDelay: '0.2s'
                }}>
                <Link to="/shop?category=marinades">Shop Now</Link>
              </Button>
            </CardContent>
          </Card>
          </RevealOnScroll>

          <RevealOnScroll direction="right" delay={200}>
            <Card className="relative overflow-hidden min-h-[300px] group">
            <img src={spiceBarImage} alt="Become a Stockist" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" width="1920" height="1440" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
            <CardContent className="relative z-10 p-8 flex flex-col justify-center h-full text-primary-foreground">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-playfair animate-fade-in-up">Want To<br />Stock Our<br />Products?</h2>
              <p className="text-lg mb-6 animate-fade-in-up" style={{
                  animationDelay: '0.1s'
                }}>Join our wholesale network</p>
              <Button variant="hero" size="lg" asChild className="w-fit bg-secondary hover:bg-secondary/90 animate-fade-in-up" style={{
                  animationDelay: '0.2s'
                }}>
                <Link to="/become-stockist">Apply Now</Link>
              </Button>
            </CardContent>
          </Card>
          </RevealOnScroll>
        </div>
      </section>

      {/* Brands Section */}
      <section className="bg-secondary py-16">
        <RevealOnScroll>
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-primary animate-fade-in-up font-playfair">Our Brands</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {brands.map((brand, index) => {
                const brandLogo = brandLogos[brand.name] || logoOfficial;
                return <Link key={brand.name} to={`/shop?brand=${encodeURIComponent(brand.name)}`}>
                    <Card className="border-2 border-primary hover:shadow-[var(--shadow-elegant)] transition-all group animate-scale-in cursor-pointer" style={{
                    animationDelay: `${index * 0.3}s`
                  }}>
                      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                        <img src={brandLogo} alt={`${brand.name} logo - Premium spices and seasonings`} className="w-full h-32 object-contain mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" loading="lazy" />
                        <h3 className="text-center font-bold text-primary">{brand.name}</h3>
                      </CardContent>
                    </Card>
                  </Link>;
              })}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Values Section */}
      <section className="bg-black py-16">
        <RevealOnScroll>
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4 text-white animate-fade-in-up font-playfair">Our Values</h2>
            <div className="flex justify-center mb-12 animate-fade-in">
              <div className="flex gap-1">
                {[...Array(30)].map((_, i) => <Sparkles key={i} className="h-3 w-3 text-accent animate-pulse" fill="currentColor" style={{
                  animationDelay: `${i * 0.05}s`
                }} />)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <RevealOnScroll direction="up" delay={100}>
                <div className="text-center group">
                  <div className="mb-4 flex justify-center">
                    <img src={logoOfficial} alt="Maharaja's Spices quality icon" className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white font-playfair">Quality – No Compromise</h3>
                  <p className="text-gray-300">
                    Quality is at the heart of everything we do from the spices we source to the people we hire. We take pride in delivering only the best because we know that every pinch of spice tells a story.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={200}>
                <div className="text-center group">
                  <div className="mb-4 flex justify-center">
                    <img src={logoOfficial} alt="Maharaja's Spices integrity icon" className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white font-playfair">Integrity – Always Do What's Right</h3>
                  <p className="text-gray-300">
                    We believe in doing the right thing, even when it's the hard thing. Whether it's in our sourcing, our workplace culture, or our customer relationships, integrity guides us.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={300}>
                <div className="text-center group">
                  <div className="mb-4 flex justify-center">
                    <img src={logoOfficial} alt="Maharaja's Spices passion icon" className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white font-playfair">Passion – Love in Every Layer</h3>
                  <p className="text-gray-300">
                    We don't just make spices, we bring them to life. Our passion is deeply rooted in our culture, our people, and our purpose. It's in the warmth of our kitchens, the joy in our team, and the unforgettable flavors we share.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={400}>
                <div className="text-center group">
                  <div className="mb-4 flex justify-center">
                    <img src={logoOfficial} alt="Maharaja's Spices innovation icon" className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white font-playfair">Innovation – Tradition with a Twist</h3>
                  <p className="text-gray-300">
                    At Maharaja's Spices, we honor our roots while embracing the future. We're constantly experimenting, improving, and reimagining how we do things.
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <RevealOnScroll direction="left">
              <div className="bg-primary text-primary-foreground p-12 rounded-lg hover:shadow-[var(--shadow-elegant)] transition-all">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-playfair animate-fade-in-up">About Maharajas Spices</h2>
              <p className="text-lg mb-6 animate-fade-in-up" style={{
                  animationDelay: '0.1s'
                }}>​Maharaja's Spices is a wholesale and manufacturing business specializing in the development of premium-quality, authentic spices, seasonings, sauces, batters, coatings, marinades, pastes, and more.</p>
              <p className="text-lg mb-8 animate-fade-in-up" style={{
                  animationDelay: '0.2s'
                }}>
                ​Founded in 2012 by Elaine Pillay, the business has grown from strength to strength by delivering consistent quality, competitive pricing, and exceptional customer service to the retail, food service, and manufacturing sectors.
              </p>
              <Button variant="hero" size="lg" asChild className="bg-secondary hover:bg-secondary/90 animate-fade-in-up" style={{
                  animationDelay: '0.3s'
                }}>
                <Link to="/about">About Us</Link>
              </Button>
              </div>
            </RevealOnScroll>
            <RevealOnScroll direction="right">
            <img src={spicesDisplayImage} alt="Colorful spices display showcasing variety of premium seasonings" className="w-full h-full object-cover rounded-lg shadow-[var(--shadow-strong)] hover:scale-105 transition-transform duration-500" width="1920" height="1280" loading="eager" decoding="async" />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <RevealOnScroll direction="left">
              <Card className="relative overflow-hidden min-h-[250px] group">
              <img src={grainsImage} alt="Grains" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" width="1920" height="1080" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-black/50" />
              <CardContent className="relative z-10 p-8 flex flex-col justify-end h-full text-primary-foreground">
                <h3 className="text-3xl font-bold mb-2 font-playfair animate-fade-in-up">Grains</h3>
                <p className="text-lg mb-4 animate-fade-in-up" style={{
                    animationDelay: '0.1s'
                  }}>Premium Quality Grains</p>
                <p className="mb-4 text-xl font-bold animate-fade-in-up" style={{
                    animationDelay: '0.2s'
                  }}>Starting at R16.99</p>
                <Button variant="hero" size="lg" asChild className="w-fit animate-fade-in-up" style={{
                    animationDelay: '0.3s'
                  }}>
                  <Link to="/shop?category=grains">Shop Now</Link>
                </Button>
              </CardContent>
            </Card>
            </RevealOnScroll>

            <RevealOnScroll direction="right" delay={200}>
              <Card className="relative overflow-hidden min-h-[250px] group">
              <img src={pastesRubsBg} alt="Pastes & Rubs" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" width="1920" height="1080" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-black/50" />
              <CardContent className="relative z-10 p-8 flex flex-col justify-end h-full text-primary-foreground">
                <h3 className="text-3xl font-bold mb-2 font-playfair animate-fade-in-up">Pastes & Rubs</h3>
                <p className="text-lg mb-4 animate-fade-in-up" style={{
                    animationDelay: '0.1s'
                  }}>Rich flavors for authentic cooking</p>
                <p className="mb-4 text-xl font-bold animate-fade-in-up" style={{
                    animationDelay: '0.2s'
                  }}>Starting at R24.99</p>
                <Button variant="hero" size="lg" asChild className="w-fit animate-fade-in-up" style={{
                    animationDelay: '0.3s'
                  }}>
                  <Link to="/shop?category=pastes-rubs">Shop Now</Link>
                </Button>
              </CardContent>
            </Card>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <RevealOnScroll direction="left">
              <Card className="relative overflow-hidden min-h-[400px] group order-2 lg:order-1">
              <img src={productsImage} alt="Our Products" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" width="1244" height="829" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-black/60" />
              <CardContent className="relative z-10 p-12 flex flex-col justify-center h-full text-primary-foreground">
                <h2 className="text-4xl font-bold mb-4 font-playfair animate-fade-in-up">Our Products</h2>
                <p className="text-lg mb-6 animate-fade-in-up" style={{
                    animationDelay: '0.1s'
                  }}>
                  Maharaja's Spices are manufacturers of their products following high-quality industry-standards
                </p>
                <Button variant="hero" size="lg" asChild className="w-fit animate-fade-in-up" style={{
                    animationDelay: '0.2s'
                  }}>
                  <Link to="/shop">Shop Now</Link>
                </Button>
              </CardContent>
            </Card>
            </RevealOnScroll>

            <RevealOnScroll direction="right" delay={200}>
              <Card className="bg-primary text-primary-foreground p-12 order-1 lg:order-2 hover:shadow-[var(--shadow-elegant)] transition-all">
              <h2 className="text-4xl font-bold mb-6 font-playfair animate-fade-in-up">Become A Franchisee</h2>
              <p className="text-lg mb-8 animate-fade-in-up" style={{
                  animationDelay: '0.1s'
                }}>
                Embark on a journey to entrepreneurship by joining our franchise network. We support individuals across South Africa.
              </p>
              <Button variant="hero" size="lg" asChild className="bg-secondary hover:bg-secondary/90 animate-fade-in-up" style={{
                  animationDelay: '0.2s'
                }}>
                <Link to="/become-stockist">
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </Card>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Recently Viewed Products */}
      {recentProducts.length > 0 && <section className="py-16 bg-muted/30">
          <RevealOnScroll>
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <h2 className="text-4xl font-bold font-playfair animate-fade-in-up">Recently Viewed</h2>
                </div>
                <Button variant="link" asChild className="text-primary animate-fade-in-up" style={{
                animationDelay: '0.1s'
              }}>
                  <Link to="/recently-viewed">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentProducts.map((product, index) => <div key={product.id} className="animate-fade-in-up" style={{
                animationDelay: `${index * 0.1}s`
              }}>
                    <ProductCard product={product} />
                  </div>)}
              </div>
            </div>
          </RevealOnScroll>
        </section>}

      {/* Featured Products */}
      <section className="py-16 bg-background">
        <RevealOnScroll>
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-bold font-playfair animate-fade-in-up">Featured Products</h2>
              <Button variant="link" asChild className="text-primary animate-fade-in-up" style={{
                animationDelay: '0.1s'
              }}>
                <Link to="/shop">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => <div key={product.id} className="animate-fade-in-up" style={{
                animationDelay: `${index * 0.1}s`
              }}>
                  <ProductCard product={product} />
                </div>)}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      </main>
      <Footer />
    </div>;
};
export default Index;