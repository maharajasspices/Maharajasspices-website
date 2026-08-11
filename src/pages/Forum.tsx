import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Clock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const Forum = () => {
  useSEO({
    title: "Community Forum - Maharaja's Spices | Coming Soon",
    description: "Our community forum is coming soon! Connect with fellow spice enthusiasts, share recipes, and discover new culinary adventures.",
    keywords: "spice forum, cooking community, recipe sharing, spice enthusiasts"
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-foreground">Community Forum</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow spice enthusiasts, share recipes, and discover new culinary adventures
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 font-playfair">Coming Soon!</h2>
            <p className="text-muted-foreground mb-6 text-lg">
              We're working hard to bring you an amazing community experience. Our forum will feature recipe sharing, cooking tips, and a place to connect with fellow spice lovers.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">Stay tuned for updates!</span>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Forum;
