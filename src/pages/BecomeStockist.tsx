import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { rateLimiter } from "@/utils/rateLimiter";
import { useSEO } from "@/hooks/useSEO";

// Validation schema
const stockistSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters").max(200, "Business name must be less than 200 characters"),
  contactPerson: z.string().trim().min(2, "Contact person must be at least 2 characters").max(100, "Contact person must be less than 100 characters"),
  email: z.string().trim().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(20, "Phone must be less than 20 characters"),
  address: z.string().trim().min(10, "Address must be at least 10 characters").max(500, "Address must be less than 500 characters"),
  message: z.string().trim().max(2000, "Message must be less than 2000 characters").optional().or(z.literal("")),
});

const BecomeStockist = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });

  useSEO({
    title: 'Become a Stockist - Maharaja\'s Spices',
    description: 'Join the Maharaja\'s Spices family and stock our premium products in your store.',
    keywords: 'stockist, wholesale, partner, distributor, Maharaja\'s Spices',
    url: window.location.href
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting check (2 attempts per day)
    const rateCheck = rateLimiter.checkLimit('stockist-form', 2, 86400000);
    if (!rateCheck.allowed) {
      const hoursLeft = Math.ceil(rateCheck.retryAfter! / 3600);
      toast({
        variant: "destructive",
        title: "Daily Limit Reached",
        description: `You can only submit 2 applications per day. Please try again in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}.`,
      });
      return;
    }

    setLoading(true);

    try {
      // Validate form data
      const validatedData = stockistSchema.parse(formData);

      // Try Supabase edge function first (with Web3Forms)
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase.functions.invoke('send-stockist-application', {
          body: {
            businessName: validatedData.businessName,
            contactPerson: validatedData.contactPerson,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
            message: validatedData.message || '',
          },
        });

        if (error) throw error;
        if (!data?.success) throw new Error('Failed to send via Supabase');

        toast({
          title: "Success!",
          description: "Application submitted successfully! We'll contact you soon.",
        });
        setFormData({
          businessName: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
          message: "",
        });
        return;
      } catch (supabaseError) {
        console.error('Failed to send stockist application:', supabaseError);
        throw new Error('Failed to submit application. Please email us directly at e-commerce@maharajasspices.co.za');
      }

      toast({
        title: "Success!",
        description: "Application submitted successfully! We'll contact you soon.",
      });
      setFormData({
        businessName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        message: "",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0]?.message || "Please check your form data.",
        });
      } else if (error.message?.includes('429') || error.message?.includes('limit') || error.message?.includes('quota')) {
        toast({
          variant: "destructive",
          title: "High Email Traffic",
          description: (
            <div>
              Our email service is experiencing high traffic. Please try again later or email{' '}
              <a href="mailto:e-commerce@maharajasspices.co.za" className="underline font-semibold hover:opacity-80">
                e-commerce@maharajasspices.co.za
              </a>
              {' '}directly with your application and all relevant details. Thank you kindly.
            </div>
          ),
          duration: 10000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to submit application. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-3xl mx-auto">
          {/* EASILY REVERTABLE: Remove this section to revert to simple header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary animate-fade-in-up">Partner With Us</h1>
            <p className="text-lg text-muted-foreground animate-fade-in-up max-w-2xl mx-auto" style={{ animationDelay: "100ms" }}>
              Join the Maharaja's Spices family and bring the authentic taste of premium spices to your customers. 
              We're looking for passionate retailers who share our commitment to quality and excellence.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Competitive wholesale pricing
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Marketing support
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Reliable supply chain
              </div>
            </div>
          </div>
          {/* END REVERTABLE SECTION */}

          <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input 
                      id="businessName" 
                      required 
                      className="mt-2"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input 
                      id="contactPerson" 
                      required 
                      className="mt-2"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      className="mt-2"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      required 
                      className="mt-2"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Business Address *</Label>
                  <Textarea 
                    id="address" 
                    required 
                    className="mt-2" 
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Tell us about your business</Label>
                  <Textarea 
                    id="message" 
                    className="mt-2" 
                    rows={5} 
                    placeholder="Type of business, target market, etc."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <p className="text-sm text-muted-foreground italic">
                  By submitting this application, you agree to our{' '}
                  <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
                  {' '}and{' '}
                  <a href="/terms" className="text-primary hover:underline">Terms & Conditions</a>.
                </p>

                <Button type="submit" size="lg" className="w-full" variant="hero" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeStockist;
