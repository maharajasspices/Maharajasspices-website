import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RevealOnScroll from "@/components/RevealOnScroll";
import { z } from "zod";
import { rateLimiter } from "@/utils/rateLimiter";
import contactHero from "@/assets/contact-hero.jpg";
import { useSEO } from "@/hooks/useSEO";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Contact validation schema
const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  subject: z.string().trim().max(200, "Subject must be less than 200 characters").optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters")
});
const Contact = () => {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  useSEO({
    title: "Contact Us - Maharaja's Spices | Get in Touch",
    description: "Contact Maharaja's Spices for inquiries about our premium spices, wholesale orders, or business partnerships. Phone: 068 405 1374 | Email: e-commerce@maharajasspices.co.za",
    keywords: "contact Maharaja spices, spice supplier contact, wholesale spices South Africa"
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit (2 submissions per day)
    const rateCheck = rateLimiter.checkLimit('contact-form', 2, 86400000);
    if (!rateCheck.allowed) {
      const hoursLeft = Math.ceil(rateCheck.retryAfter! / 3600);
      toast({
        variant: "destructive",
        title: "Daily Limit Reached",
        description: `You can only submit 2 messages per day. Please try again in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}.`
      });
      return;
    }
    setLoading(true);
    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);

      // Try Supabase edge function first (with Web3Forms)
      try {
        const {
          supabase
        } = await import("@/integrations/supabase/client");
        const {
          data,
          error
        } = await supabase.functions.invoke('send-contact-email', {
          body: {
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone || '',
            subject: validatedData.subject || 'Contact Form Submission',
            message: validatedData.message
          }
        });
        if (error) throw error;
        if (!data?.success) throw new Error('Failed to send via Supabase');
        toast({
          title: "Message sent!",
          description: "Thank you for your message! We'll get back to you soon."
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: ""
        });
        return;
      } catch (supabaseError) {
        console.error('Failed to send contact message:', supabaseError);
        throw new Error('Failed to send message. Please email us directly at e-commerce@maharajasspices.co.za');
      }
      toast({
        title: "Message sent!",
        description: "Thank you for your message! We'll get back to you soon."
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0]?.message || "Please check your form data."
        });
      } else if (error.message?.includes('429') || error.message?.includes('limit') || error.message?.includes('quota')) {
        toast({
          variant: "destructive",
          title: "High Email Traffic",
          description: <div>
              Our email service is experiencing high traffic. Please try again later or email{' '}
              <a href="mailto:e-commerce@maharajasspices.co.za" className="underline font-semibold hover:opacity-80">
                e-commerce@maharajasspices.co.za
              </a>
              {' '}directly with your request and all relevant details. Thank you kindly.
            </div>,
          duration: 10000
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again or contact us directly.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const address = "Unit 17, 10 A, Rockwood Business Park, Woodlands Dr, Waterfall, Durban, 3610";
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner with Background Image */}
      <section className="relative h-64 overflow-hidden">
        <img src={contactHero} alt="Contact Maharaja's Spices - Premium Spice Suppliers" className="absolute inset-0 w-full h-full object-cover" loading="eager" width={1920} height={512} />
        <div className="absolute inset-0 bg-primary/40" />
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <h1 className="text-5xl font-bold text-primary-foreground">Contact Us</h1>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Info Cards */}
          <RevealOnScroll direction="up">
            <Card className="hover:shadow-[var(--shadow-elegant)] transition-all">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Address</h3>
              <p className="text-muted-foreground cursor-pointer hover:text-primary select-text" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')}>
                Unit 17, 10 A, Rockwood Business Park,<br />
                Woodlands Dr, Waterfall,<br />
                Durban, 3610
              </p>
            </CardContent>
          </Card>
          </RevealOnScroll>

          <RevealOnScroll direction="up" delay={100}>
            <Card className="hover:shadow-[var(--shadow-elegant)] transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Phone Numbers</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Head Office:</span>{' '}
                  <a href="tel:0684051374" className="hover:text-primary">068 405 1374</a>
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Emergency:</span>{' '}
                  <a href="tel:0845685734" className="hover:text-primary">084 568 5734</a>
                </p>
                
                {/* Sales Dropdown */}
                <Collapsible open={salesOpen} onOpenChange={setSalesOpen} className="mt-3">
                  <CollapsibleTrigger className="flex items-center justify-center gap-1 w-full font-semibold text-foreground hover:text-primary transition-colors">
                    Sales Contacts
                    <ChevronDown className={`h-4 w-4 transition-transform ${salesOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <p className="text-muted-foreground font-semibold text-foreground">KZN Sales:</p>
                    <p className="text-muted-foreground">
                      Pam: <a href="tel:0611217102" className="hover:text-primary">061 121 7102</a>
                    </p>
                    <p className="text-muted-foreground">
                      Collin: <a href="tel:0638443575" className="hover:text-primary">063 844 3575</a>
                    </p>
                    <p className="text-muted-foreground font-semibold text-foreground mt-2">JHB Sales:</p>
                    <p className="text-muted-foreground">
                      Dean: <a href="tel:0817681905" className="hover:text-primary">081 768 1905</a>
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
          </RevealOnScroll>

          <RevealOnScroll direction="up" delay={200}>
            <Card className="hover:shadow-[var(--shadow-elegant)] transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Email</h3>
              <div className="space-y-2 text-sm">
                <a href="mailto:e-commerce@maharajasspices.co.za" className="text-muted-foreground hover:text-primary block break-all">
                  e-commerce@maharajasspices.co.za
                </a>
                
                {/* Sales Emails Dropdown */}
                <Collapsible open={emailsOpen} onOpenChange={setEmailsOpen} className="mt-3">
                  <CollapsibleTrigger className="flex items-center justify-center gap-1 w-full font-semibold text-foreground hover:text-primary transition-colors">
                    Sales Emails
                    <ChevronDown className={`h-4 w-4 transition-transform ${emailsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <a href="mailto:sales1@maharajasspices.co.za" className="text-muted-foreground hover:text-primary block break-all">
                      <span className="font-semibold text-foreground">Pam:</span> sales1@maharajasspices.co.za
                    </a>
                    <a href="mailto:sales2@maharajasspices.co.za" className="text-muted-foreground hover:text-primary block break-all">
                      <span className="font-semibold text-foreground">Collin:</span> sales2@maharajasspices.co.za
                    </a>
                    <a href="mailto:dean.reddy@maharajasspices.co.za" className="text-muted-foreground hover:text-primary block break-all">
                      <span className="font-semibold text-foreground">Dean:</span> dean.reddy@maharajasspices.co.za
                    </a>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <RevealOnScroll direction="left">
            <Card>
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Your name" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="your.email@example.com" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Your phone number" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} required placeholder="What is this regarding?" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" name="message" value={formData.message} onChange={handleChange} required placeholder="Tell us more..." rows={6} className="mt-2" />
                </div>

                <p className="text-sm text-muted-foreground italic">
                  By submitting this form, you agree to our{' '}
                  <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
                  {' '}and{' '}
                  <a href="/terms" className="text-primary hover:underline">Terms & Conditions</a>.
                </p>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </RevealOnScroll>

          {/* Business Hours & Map */}
          <div className="space-y-8">
            <RevealOnScroll direction="right">
              <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold">Business Hours</h2>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span className="font-semibold">7:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span className="font-semibold">Closed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span className="font-semibold">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </RevealOnScroll>

            <RevealOnScroll direction="right" delay={100}>
              <Card className="h-full flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <iframe src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}`} width="100%" height="300" style={{
                  border: 0
                }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Maharajas Spices Location" className="rounded-t-lg" />
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-foreground mb-3">🌶️ Wondering Where to Find Us?</h3>
                    <p className="text-muted-foreground mb-3">
                       Our head office is in the heart of Waterfall, Durban – where the aroma of authentic spices fills the air! Whether you're a seasoned chef or a curious home cook, our doors are always open for you.
                    </p>
                    <p className="text-muted-foreground mb-3">Explore our range of premium spices, and let us help you bring the magic of authentic Indian flavours to you!</p>
                    <p className="text-sm text-primary font-medium">
                      📍 Easy parking available • Just off Woodlands Drive
                    </p>
                  </div>
                </CardContent>
              </Card>
            </RevealOnScroll>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Contact;