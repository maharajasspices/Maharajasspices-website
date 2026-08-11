import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = (passedChecks / 5) * 100;

  const getStrengthColor = () => {
    if (strength < 40) return "bg-destructive";
    if (strength < 60) return "bg-yellow-500";
    if (strength < 80) return "bg-orange-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength < 40) return "Weak";
    if (strength < 60) return "Fair";
    if (strength < 80) return "Good";
    return "Strong";
  };

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Password Strength:</span>
          <span className="font-semibold">{getStrengthText()}</span>
        </div>
        <Progress value={strength} className={`h-2 ${getStrengthColor()}`} />
      </div>
      
      <div className="space-y-1.5 text-xs">
        <div className={`flex items-center gap-2 ${checks.length ? "text-green-600" : "text-muted-foreground"}`}>
          {checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>At least 8 characters</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.uppercase ? "text-green-600" : "text-muted-foreground"}`}>
          {checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>One uppercase letter</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.lowercase ? "text-green-600" : "text-muted-foreground"}`}>
          {checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>One lowercase letter</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.number ? "text-green-600" : "text-muted-foreground"}`}>
          {checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>One number</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.special ? "text-green-600" : "text-muted-foreground"}`}>
          {checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>One special character</span>
        </div>
      </div>
    </div>
  );
};
