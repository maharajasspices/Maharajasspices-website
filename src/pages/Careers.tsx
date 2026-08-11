import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Briefcase, Users, TrendingUp } from "lucide-react";
import careersHero from "@/assets/careers-hero.jpg";

export default function Careers() {
  useSEO({
    title: "Careers - Maharaja's Spices",
    description: "Join our team at Maharaja's Spices. Explore career opportunities and grow with us.",
    url: `${window.location.origin}/careers`,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
      {/* Hero Section with Image */}
      <section className="relative overflow-hidden h-80 md:h-96">
        <img 
          src={careersHero} 
          alt="Careers at Maharaja's Spices" 
          className="absolute inset-0 w-full h-full object-cover brightness-75"
          loading="eager"
          width={1920}
          height={640}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-red-900/20 to-accent/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-fade-in" />
        <div className="container mx-auto px-4 relative z-10 h-full flex items-center">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-primary-foreground animate-fade-in-up">
              Join Our Team
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Be part of a growing company that's bringing authentic spices to homes across South Africa
            </p>
          </div>
        </div>
      </section>

        {/* Why Join Us */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 animate-fade-in-up">
              Why Work With Us?
            </h2>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              <Card className="animate-fade-in-up hover:shadow-lg transition-all duration-300" style={{ animationDelay: "100ms" }}>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <CardTitle className="text-lg md:text-xl">Growth Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-muted-foreground">
                    We believe in nurturing talent and providing opportunities for career advancement.
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up hover:shadow-lg transition-all duration-300" style={{ animationDelay: "200ms" }}>
                <CardHeader>
                  <Users className="h-10 w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <CardTitle className="text-lg md:text-xl">Collaborative Culture</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Join a diverse, inclusive team that values collaboration and innovation.
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up hover:shadow-lg transition-all duration-300 sm:col-span-2 md:col-span-1" style={{ animationDelay: "300ms" }}>
                <CardHeader>
                  <Briefcase className="h-10 w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <CardTitle className="text-lg md:text-xl">Competitive Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base text-muted-foreground">
                    We offer competitive compensation packages and benefits to our team members.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Current Openings */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Join Our Growing Team</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">We're Always Looking for Great People</CardTitle>
                  <CardDescription className="text-base">
                    At Maharaja's Spices, we believe in bringing fresh talent and passionate individuals into our company. We're always excited to welcome new team members who share our commitment to quality and excellence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div>
                    <p className="text-muted-foreground mb-4">
                      If you're looking for career opportunities, we'll be posting new positions soon. Check out our current openings on Indeed:
                    </p>
                    <Button asChild size="lg" className="mb-6 w-full sm:w-auto">
                      <a 
                        href="https://za.indeed.com/cmp/Maharajas-Spices-1?campaignid=mobvjcmp&from=mobviewjob&tk=1jadjvqqqh84u802&fromjk=9a7f639b7f209afa" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="View job opportunities on Indeed"
                        className="whitespace-normal text-center"
                      >
                        <Briefcase className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span>See Opportunities on Indeed</span>
                      </a>
                    </Button>
                  </div>
                  
                  <div className="pt-6 border-t border-border">
                    <p className="text-muted-foreground mb-4">
                      For information about available opportunities or to send us your CV:
                    </p>
                    <Button asChild variant="outline" size="lg" className="max-w-full">
                      <a href="mailto:elaine@maharajasspices.co.za?subject=Career Opportunity Inquiry" aria-label="Email us about career opportunities" className="truncate">
                        <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">elaine@maharajasspices.co.za</span>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
