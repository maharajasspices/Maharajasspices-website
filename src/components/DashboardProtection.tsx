import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardProtectionProps {
  children: React.ReactNode;
}

const DashboardProtection = ({ children }: DashboardProtectionProps) => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Please log in first");
        setPassword("");
        setIsLoading(false);
        return;
      }

      const response = await supabase.functions.invoke("verify-dashboard-access", {
        body: { password },
      });

      // supabase.functions.invoke returns { data, error }
      // On non-2xx responses, error is set but data may still contain the body
      const result = response.data || {};
      
      if (result?.success) {
        setIsAuthenticated(true);
        setError("");
      } else {
        const errorMsg = result?.error || response.error?.message || "Incorrect password";
        setError(errorMsg);
        setPassword("");
      }
    } catch (err) {
      console.error("Dashboard verification error:", err);
      setError("Verification failed. Please try again.");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Dashboard Access
          </CardTitle>
          <CardDescription>
            Enter the dashboard password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardProtection;
