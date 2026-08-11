import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (pin: string) => void;
  userEmail: string;
}

export function PinVerificationModal({ isOpen, onClose, onVerified, userEmail }: PinVerificationModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your account password.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Use server-side edge function to verify password and reveal PIN
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://dhafduzlhpartlvsgbqx.supabase.co/functions/v1/reveal-credit-pin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.error || "Incorrect password. Please try again.",
        });
        setPassword("");
        return;
      }

      toast({
        title: "PIN Revealed",
        description: "Your M-Wallet PIN is now visible. Keep it secure!",
      });
      onVerified(result.pin);
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerify();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
    >
      {/* Bottom sheet on mobile, centered on desktop */}
      <div 
        className="w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 sm:animate-in sm:fade-in sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 sm:top-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-4 sm:pt-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Verify Your Identity</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your account password to view your M-Wallet PIN
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-password">Account Password</Label>
              <div className="relative">
                <Input
                  id="verify-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your password"
                  className="pr-10 h-12"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12"
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                className="flex-1 h-12"
                disabled={isVerifying}
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
