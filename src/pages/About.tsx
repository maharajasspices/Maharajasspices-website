import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent } from "@/components/ui/card";
import aboutHeroImage from "@/assets/hero-spices.jpg";
import founderElaine from "@/assets/founder-elaine.webp";

const About = () => {
  useSEO({
    title: "About Us - Maharaja's Spices | Premium Spice Manufacturers Since 2012",
    description: "Learn about Maharaja's Spices, a leading wholesale and manufacturing business specializing in premium quality spices and sauces. Founded in 2012, serving South Africa with authentic flavors.",
    keywords: "about Maharaja's Spices, spice manufacturer, wholesale spices, South African spices, company history, spice business",
    type: "website",
    url: window.location.href
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner with Background Image */}
      <section className="relative h-64 overflow-hidden">
        <img 
          src={aboutHeroImage} 
          alt="Maharaja's Spices Manufacturing Facility" 
          className="absolute inset-0 w-full h-full object-cover brightness-75"
          loading="eager"
          width={1920}
          height={512}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-red-900/20 to-accent/30" />
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">About Maharaja's Spices</h1>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16">
        {/* Main Content */}
        <RevealOnScroll>
          <Card className="mb-16">
            <CardContent className="p-12">
              <h2 className="text-primary text-3xl font-bold mb-6">About Maharaja's Spices</h2>
              <h3 className="text-4xl font-bold mb-8">
                Crafting Authentic Flavor Solutions
              </h3>
              
              <div className="space-y-6 text-lg text-muted-foreground">
                <p>
                  Maharaja's Spices is a wholesale and manufacturing business specializing in the development of premium-quality, authentic spices, seasonings, sauces, batters, coatings, marinades, pastes, and more.
                </p>
                
                <p>
                  Founded in 2012 by Elaine Pillay, the business has grown from strength to strength by delivering consistent quality, competitive pricing, and exceptional customer service to the retail, food service, and manufacturing sectors.
                </p>
                
                <p>
                  Driven by innovation and grounded in strong core values, Maharaja's Spices continues to push boundaries while staying true to the authentic flavors our customer's trust.
                </p>
              </div>
              
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-2xl font-bold mb-6">Custom Development – Let's Create Something Exceptional</h3>
                <div className="space-y-6 text-lg text-muted-foreground">
                  <p>
                    If nothing in our developed range meets your expectations, that's fantastic. It means there's an opportunity to innovate.
                  </p>
                  <p>
                    Our experienced in-house product developers work closely with customers to create customized flavor solutions aligned to your brand, market, and operational requirements. From concept to final product, we collaborate with you every step of the way.
                  </p>
                  <p>
                    Set up time with our team and let's explore developing a product tailored specifically for you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </RevealOnScroll>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RevealOnScroll direction="left">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-lg">
                  To deliver exceptional quality spices and sauces that elevate culinary experiences while maintaining our commitment to excellence, integrity, and innovation.
                </p>
              </CardContent>
            </Card>
          </RevealOnScroll>

          <RevealOnScroll direction="right" delay={200}>
            <Card className="bg-accent text-accent-foreground">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-lg">
                  To be the leading spice and sauce manufacturer in South Africa, recognized for our quality, innovation, and dedication to bringing authentic flavors to every kitchen.
                </p>
              </CardContent>
            </Card>
          </RevealOnScroll>
        </div>

        {/* Founder Section */}
        <section className="mt-16">
          <RevealOnScroll>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <RevealOnScroll direction="left">
                <div>
                  <img 
                    src={founderElaine} 
                    alt="Founder - Elaine Pillay" 
                    className="w-full h-auto rounded-lg shadow-[var(--shadow-strong)]"
                  />
                </div>
              </RevealOnScroll>
              <RevealOnScroll direction="right" delay={200}>
                <div>
                  <h2 className="text-3xl font-bold mb-6">Our Founder</h2>
                  <p className="text-lg text-muted-foreground mb-4">
                    Maharaja's Spices was founded in 2012 by <strong>Elaine Pillay</strong>, inspired by a lifelong connection to authentic flavors, family recipes, and culinary tradition.
                  </p>
                  <p className="text-lg text-muted-foreground mb-4">
                    What began as a passion for quality and authenticity quickly grew into a vision: to create products that honor tradition while meeting the demands of a modern, evolving market.
                  </p>
                  <p className="text-lg text-muted-foreground mb-4">
                    Elaine's hands-on approach, commitment to excellence, and deep respect for ingredients have shaped every part of the business—from sourcing and formulation to manufacturing and customer relationships. Her belief that flavor should never be compromised has earned Maharaja's Spices the trust of households, retailers, and food businesses across South Africa.
                  </p>
                  <p className="text-lg text-muted-foreground mb-6">
                    Today, under her leadership, Maharaja's Spices continues to grow with purpose—expanding its range, innovating responsibly, and staying true to the values on which the company was built.
                  </p>
                  <blockquote className="border-l-4 border-primary pl-4 mt-6">
                    <p className="text-lg italic text-muted-foreground">
                      "Honouring tradition while innovating for the future is what defines Maharaja's Spices."
                    </p>
                    <footer className="text-lg italic text-muted-foreground mt-2">
                      — Elaine Pillay
                    </footer>
                  </blockquote>
                </div>
              </RevealOnScroll>
            </div>
          </RevealOnScroll>
        </section>

        {/* Call to Action */}
        <RevealOnScroll>
          <section className="mt-16 bg-primary text-primary-foreground rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-lg mb-8">
            Whether you're a retailer looking to stock quality products or a customer seeking authentic flavors, we invite you to be part of the Maharaja's Spices family.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a 
              href="/become-stockist" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-md font-bold transition-all hover:scale-105"
            >
              Become a Stockist
            </a>
            <a 
              href="/contact" 
              className="bg-card text-card-foreground hover:bg-card/90 px-8 py-3 rounded-md font-bold transition-all hover:scale-105"
            >
              Contact Us
            </a>
          </div>
          </section>
        </RevealOnScroll>
      </main>

      <Footer />
    </div>
  );
};

export default About;
