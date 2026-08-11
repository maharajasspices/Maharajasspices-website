import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();

  useSEO({
    title: "404 - Page Not Found | Maharaja's Spices",
    description: "The page you're looking for doesn't exist. Return to Maharaja's Spices homepage to explore our premium spices.",
    keywords: "404 error, page not found"
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 animate-fade-in">
        <div className="text-center max-w-2xl">
          <h1 className="mb-4 text-9xl font-bold text-primary animate-scale-in">404</h1>
          <p className="mb-4 text-3xl font-semibold text-foreground animate-fade-in-up">Oops! Page not found</p>
          <p className="mb-8 text-muted-foreground animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button size="lg" variant="hero" className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
