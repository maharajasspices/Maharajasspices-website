import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, CheckCircle2 } from "lucide-react";

export default function NewsletterUnsubscribe() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");
  const [email, setEmail] = useState(emailParam || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const { toast } = useToast();

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "newsletter-unsubscribe",
        {
          body: { email: email.trim().toLowerCase() },
        }
      );

      if (error) throw error;

      setIsUnsubscribed(true);
      toast({
        title: "Successfully Unsubscribed",
        description: "You've been removed from our newsletter list",
      });
    } catch (error) {
      console.error("Unsubscribe error:", error);
      toast({
        title: "Unsubscribe Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              {isUnsubscribed ? (
                <>
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  <CardTitle className="font-playfair">Successfully Unsubscribed</CardTitle>
                  <CardDescription>
                    You've been removed from our newsletter list. We're sorry to see you go!
                  </CardDescription>
                </>
              ) : (
                <>
                  <Mail className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <CardTitle className="font-playfair">Unsubscribe from Newsletter</CardTitle>
                  <CardDescription>
                    Enter your email address to unsubscribe from our newsletter
                  </CardDescription>
                </>
              )}
            </CardHeader>
            {!isUnsubscribed && (
              <CardContent>
                <form onSubmit={handleUnsubscribe} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Unsubscribe"}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
