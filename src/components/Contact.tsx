import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RevealOnScroll from "@/components/RevealOnScroll";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { rateLimiter } from "@/utils/rateLimiter";
import contactHeroImage from "@/assets/contact-hero.jpg";

// Contact validation schema
const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  subject: z.string().trim().max(200, "Subject must be less than 200 characters").optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit (5 submissions per minute)
    const rateCheck = rateLimiter.checkLimit('contact-form', 5, 60000);
    if (!rateCheck.allowed) {
      toast({
        variant: "destructive",
        title: "Too Many Requests",
        description: `Please wait ${rateCheck.retryAfter} seconds before submitting again.`,
      });
      return;
    }

    setLoading(true);
    
    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);

      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: validatedData
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Thank you for your message! We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0]?.message || "Please check your form data.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again or contact us directly.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const address = "Unit 17, 10 A, Rockwood Business Park, Woodlands Dr, Waterfall, Durban, 3610";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner with Background Image */}
      <section className="relative h-64 overflow-hidden">
        <img 
          src={contactHeroImage} 
          alt="Contact Maharaja's Spices Customer Service" 
          className="absolute inset-0 w-full h-full object-cover brightness-75"
          loading="eager"
          width={1920}
          height={512}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-red-900/20 to-accent/30" />
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <h1 className="text-5xl font-bold text-primary-foreground">Contact Us</h1>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <RevealOnScroll>
            <Card className="h-full hover:shadow-[var(--shadow-elegant)] transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Phone className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Call Us</h3>
                <a href="tel:0684051374" className="text-muted-foreground hover:text-primary transition-colors">
                  068 405 1374
                </a>
              </CardContent>
            </Card>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <Card className="h-full hover:shadow-[var(--shadow-elegant)] transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Mail className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Email Us</h3>
                <a href="mailto:elaine@maharajasspices.co.za" className="text-muted-foreground hover:text-primary transition-colors">
                  elaine@maharajasspices.co.za
                </a>
              </CardContent>
            </Card>
          </RevealOnScroll>

          <RevealOnScroll delay={400}>
            <Card className="h-full hover:shadow-[var(--shadow-elegant)] transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <MapPin className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                <p className="text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')}>
                  {address}
                </p>
              </CardContent>
            </Card>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <RevealOnScroll direction="left">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </RevealOnScroll>

          <RevealOnScroll direction="right" delay={200}>
            <Card>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">Business Hours</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Monday - Friday</p>
                      <p className="text-muted-foreground">8:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Saturday</p>
                      <p className="text-muted-foreground">8:00 AM - 2:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Sunday</p>
                      <p className="text-muted-foreground">Closed</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="text-xl font-bold mb-4">Get Directions</h3>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                      aria-label="Get directions to our location"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Open in Google Maps
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </RevealOnScroll>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
