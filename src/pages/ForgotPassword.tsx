import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";
const emailSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255, "Email must be less than 255 characters")
});
const ForgotPassword = () => {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate email
      const validated = emailSchema.parse({
        email
      });
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      setEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions."
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: error.errors[0]?.message || "Please enter a valid email."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to send reset email. Please try again."
        });
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Forgot Password
            </CardTitle>
            <CardDescription>Enter your email address and we'll send you a link to reset your password. Please wait a few minutes. If the link expires, delete the previous email and send a new rest link to your email</CardDescription>
          </CardHeader>
          <CardContent>
            {!emailSent ? <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <div className="text-center">
                  <Link to="/auth" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </form> : <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    We've sent a password reset link to <strong>{email}</strong>. 
                    Please check your inbox and follow the instructions.
                  </p>
                </div>
                <div className="text-center">
                  <Link to="/auth" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </div>}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>;
};
export default ForgotPassword;