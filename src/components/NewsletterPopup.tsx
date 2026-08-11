import { useState } from "react";
import { X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { newsletterLogo } from "@/utils/imageImports";

const emailSchema = z.string().email("Please enter a valid email address");

interface NewsletterPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsletterPopup({ isOpen, onClose }: NewsletterPopupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToEmails, setAgreedToEmails] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    onClose();
    setEmail("");
    setAgreedToEmails(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToEmails) {
      toast({
        title: "Consent Required",
        description: "Please agree to receive emails to subscribe",
        variant: "destructive",
      });
      return;
    }

    try {
      emailSchema.parse(email);
    } catch (error) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('newsletter-subscribe', {
        body: { email: email.trim().toLowerCase() }
      });

      if (error) throw error;

      toast({
        title: "Successfully Subscribed!",
        description: "You'll receive updates about our latest products and offers",
      });
      handleClose();
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      <div className="bg-background border-2 border-primary rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-300">
        <div className="relative p-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center text-center space-y-4">
            <img
              src={newsletterLogo}
              alt="Maharaja's Spices"
              className="h-20 w-20 object-contain"
              loading="lazy"
            />

            <div>
              <h2 className="text-2xl font-bold mb-2 font-playfair">
                Stay Updated!
              </h2>
              <p className="text-muted-foreground">
                Get the latest updates on new spices, exclusive offers, and recipes delivered to your inbox
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full"
              />
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="email-consent"
                  checked={agreedToEmails}
                  onCheckedChange={(checked) => setAgreedToEmails(checked as boolean)}
                  className="mt-0.5"
                />
                <label htmlFor="email-consent" className="text-xs text-muted-foreground text-left cursor-pointer">
                  I agree to receive promotional emails, product updates, and special offers from Maharaja's Spices.
                </label>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !agreedToEmails}
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-4 py-2">
              <a 
                href="https://www.facebook.com/Maharajasspice/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/maharajasspices/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://www.tiktok.com/@maharajasspices" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="mailto:e-commerce@maharajasspices.co.za" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              We respect your privacy. <a href="/newsletter/unsubscribe" className="underline hover:text-foreground">Unsubscribe anytime</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
