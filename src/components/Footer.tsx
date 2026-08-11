import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Facebook, Instagram, Rocket, RotateCcw, CreditCard, MessageCircle, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { payfastLogo } from "@/utils/imageImports";
import { useNewsletter } from "@/contexts/NewsletterContext";

const Footer = () => {
  const { openNewsletter } = useNewsletter();
  const [footerQuery, setFooterQuery] = useState("");
  const navigate = useNavigate();
  
  const handleFooterSearch = () => {
    if (footerQuery.trim()) {
      // Auto-detect: if there's a space, use full search term, otherwise auto-complete
      const searchTerm = footerQuery.includes(' ') ? footerQuery : footerQuery;
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}&category=all`);
    }
  };
  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Features Bar */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <Rocket className="h-12 w-12 text-primary" />
              <div>
                <h3 className="font-bold">Affordable Delivery</h3>
                <p className="text-sm text-muted-foreground">For all orders</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <RotateCcw className="h-12 w-12 text-primary" />
              <div>
                <h3 className="font-bold">Return Policy</h3>
                <p className="text-sm text-muted-foreground">If goods have problems</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CreditCard className="h-12 w-12 text-primary" />
              <div>
                <h3 className="font-bold">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">100% secure payment</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MessageCircle className="h-12 w-12 text-primary" />
              <div>
                <h3 className="font-bold">Dedicated Support</h3>
                <p className="text-sm text-muted-foreground">Customer support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Address */}
          <div>
            <h3 className="text-lg font-bold mb-4">Address</h3>
            <address className="not-italic text-muted-foreground">
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Unit+17,+10+A,+Rockwood+Business+Park,+Woodlands+Dr,+Waterfall,+Durban,+3610" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Unit 17, 10 A, Rockwood Business Park, Woodlands Dr,<br />
                Waterfall, Durban, 3610
              </a>
            </address>
            <div className="flex gap-4 mt-4">
              <a 
                href="https://www.facebook.com/Maharajasspice/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:text-primary/80"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="https://www.instagram.com/maharajasspices/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:text-primary/80"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="https://www.tiktok.com/@maharajasspices" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:text-primary/80"
                aria-label="Follow us on TikTok"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
            <Button
              onClick={openNewsletter}
              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Subscribe to Our Newsletter
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/terms" className="hover:text-[hsl(var(--primary))] transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-[hsl(var(--primary))] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/popia-compliance" className="hover:text-[hsl(var(--primary))] transition-colors">POPIA Compliance</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-[hsl(var(--primary))] transition-colors">Shipping Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-[hsl(var(--primary))] transition-colors">Refund Policy</Link></li>
              <li><Link to="/careers" className="hover:text-[hsl(var(--primary))] transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Search */}
          <div>
            <h3 className="text-lg font-bold mb-4">SEARCH</h3>
            <div className="flex gap-2">
              <Input 
                placeholder="Search products..." 
                className="bg-background text-foreground placeholder:text-muted-foreground"
                value={footerQuery}
                onChange={(e) => setFooterQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFooterSearch()}
              />
              <Button onClick={handleFooterSearch} className="bg-primary text-primary-foreground hover:bg-primary/90">Go</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Maharaja's Spices | All Rights Reserved
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Secured by:</span>
              <div className="bg-card p-2 rounded">
                <img src={payfastLogo} alt="Secured and powered by PayFast - Visa, Mastercard, Zapper, Instant EFT" className="h-16 object-contain" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
