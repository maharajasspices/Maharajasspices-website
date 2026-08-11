import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
  overlay?: boolean;
}

const Hero = ({ 
  title, 
  subtitle, 
  buttonText = "Shop Now", 
  buttonLink = "/shop",
  backgroundImage,
  overlay = true 
}: HeroProps) => {
  return (
    <section 
      className="relative min-h-[500px] lg:min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      {backgroundImage && (
        <img 
          src={backgroundImage} 
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          width="1920"
          height="1080"
        />
      )}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
      )}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
            {subtitle}
          </p>
          {buttonText && (
            <Button 
              variant="hero" 
              size="lg" 
              asChild
              className="group"
            >
              <a href={buttonLink}>
                {buttonText}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
