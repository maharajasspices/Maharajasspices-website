import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import productsImage from "@/assets/products.webp";

const slides = [
  {
    image: "/hero-spices.webp",
    title: "Seasoning Spices",
    subtitle: "Elevate your Culinary Creation",
    buttonText: "Shop Now",
    buttonLink: "/shop?category=spices"
  },
  {
    image: "/marinades-background.webp",
    title: "Marinades & Sauces",
    subtitle: "Each bottle is bursting with a symphony of flavours",
    buttonText: "Shop Now",
    buttonLink: "/shop?category=marinades"
  },
  {
    image: productsImage,
    title: "Premium Quality Products",
    subtitle: "Manufacturer of high-quality industry-standard products",
    buttonText: "Shop Now",
    buttonLink: "/shop"
  }
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div 
      role="region"
      className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-neutral-900" 
      aria-label="Hero carousel"
    >
      {slides.map((slide, index) => {
        // Only render first slide immediately, defer others for LCP optimization
        const isFirst = index === 0;
        const shouldRender = isFirst || currentSlide === index || currentSlide === index - 1 || currentSlide === index + 1;
        
        if (!shouldRender && !isFirst) return null;
        
        return (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={index !== currentSlide}
          >
            {/* Note: width/height removed as slides have different aspect ratios and use object-cover */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              loading="eager"
              decoding={isFirst ? "sync" : "async"}
              fetchPriority="high"
              sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1920px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
            <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 text-primary-foreground animate-fade-in-up font-playfair drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl mb-8 text-primary-foreground animate-fade-in-up max-w-2xl" style={{ animationDelay: '0.2s' }}>
                {slide.subtitle}
              </p>
              <Button variant="hero" size="lg" asChild className="w-fit animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <Link to={slide.buttonLink} aria-label={`Shop Now: ${slide.title}`} tabIndex={index === currentSlide ? 0 : -1}>Shop Now</Link>
              </Button>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-4 md:p-3 rounded-full transition-all animate-fade-in min-w-[48px] min-h-[48px] flex items-center justify-center"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-4 md:p-3 rounded-full transition-all animate-fade-in min-w-[48px] min-h-[48px] flex items-center justify-center"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-6" role="navigation" aria-label="Slide navigation">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className="w-12 h-12 flex items-center justify-center"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          >
            <span 
              className={`block rounded-full transition-all ${
                index === currentSlide ? "bg-primary w-10 h-6" : "bg-white/50 hover:bg-white/80 w-6 h-6"
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
