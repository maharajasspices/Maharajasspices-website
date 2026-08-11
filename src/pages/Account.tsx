import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift, Calendar, Phone, Mail, User, CreditCard, Package, LogOut, Eye, EyeOff, Lock, Shield, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { PinVerificationModal } from "@/components/PinVerificationModal";
import { useInvoiceDownload } from "@/hooks/useInvoiceDownload";
import { OrderHistoryList } from "@/components/OrderHistoryList";
interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  birthday: string | null;
  phone: string | null;
  birthday_opt_in: boolean;
}

interface Credits {
  balance: number;
  // PIN is never sent to client until revealed via server-side verification
}

interface CreditTransaction {
  id: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string | null;
  items: any;
}

export default function Account() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [credits, setCredits] = useState<Credits>({ balance: 0 });
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false);
  const [pendingCreditNotification, setPendingCreditNotification] = useState<CreditTransaction | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [showPinVerificationModal, setShowPinVerificationModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    birthday: "",
    phone: "",
    birthday_opt_in: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      await Promise.all([
        fetchProfile(session.user.id),
        fetchCredits(session.user.id),
        fetchOrders(session.user.id),
        checkForNewCredits(session.user.id),
      ]);

      setLoading(false);
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/auth");
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, birthday, phone, birthday_opt_in, email")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
    setFormData({
      full_name: data.full_name || "",
      birthday: data.birthday || "",
      phone: data.phone || "",
      birthday_opt_in: data.birthday_opt_in || false,
    });

    // Show birthday popup if it's user's birthday today
    if (data.birthday) {
      const today = new Date();
      const birthday = new Date(data.birthday);
      const isBirthday = 
        today.getMonth() === birthday.getMonth() && 
        today.getDate() === birthday.getDate();
      
      const hasSeenToday = sessionStorage.getItem('birthdayPopupShown') === today.toDateString();
      
      if (isBirthday && !hasSeenToday) {
        setShowBirthdayPopup(true);
        sessionStorage.setItem('birthdayPopupShown', today.toDateString());
      }
    }
    
    // Show birthday input prompt if birthday not set and not opted out
    if (!data.birthday && !data.birthday_opt_in) {
      setShowBirthdayPopup(true);
    }

    // Check if it's their birthday
    if (data.birthday && data.birthday_opt_in) {
      const today = new Date();
      const birthday = new Date(data.birthday);
      if (today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()) {
        checkBirthdayCredits(userId);
      }
    }
  };

  const checkBirthdayCredits = async (userId: string) => {
    try {
      // Call secure server-side edge function to claim birthday reward
      // This prevents client-side manipulation of birthday checks and credit insertion
      const { data, error } = await supabase.functions.invoke('claim-birthday-reward');

      if (error) {
        console.error('Error claiming birthday reward:', error);
        return;
      }

      if (data?.success) {
        toast({
          title: "🎉 Happy Birthday!",
          description: `You've been awarded R${data.amount} credits to celebrate your special day!`,
          duration: 10000,
        });
        fetchCredits(userId);
      } else if (data?.alreadyClaimed) {
        // Silently handle already claimed - no need to show error
        console.log('Birthday reward already claimed this year');
      }
    } catch (err) {
      console.error('Failed to check birthday credits:', err);
    }
  };

  const fetchCredits = async (userId: string) => {
    // Only fetch balance - PIN is never sent to client for security
    const { data, error } = await supabase
      .from("user_credits_safe")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
      return;
    }

    setCredits({ balance: data.balance });
  };

  const generatePin = () => {
    // Generate a 6-digit PIN
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const verifyAndShowPin = () => {
    setShowPinVerificationModal(true);
  };

  const handlePinVerified = (pin: string) => {
    setRevealedPin(pin);
    setPinVerified(true);
    setShowPin(true);
  };

  const hidePin = () => {
    setShowPin(false);
    setPinVerified(false);
    setRevealedPin(null); // Clear PIN from memory when hidden
  };

  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, total, status, items, shipping_address, tracking_token, courier_waybill")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching orders:", error);
      return;
    }

    setOrders(data || []);
  };

  const checkForNewCredits = async (userId: string) => {
    // Get the last time user was notified about credits
    const lastNotificationKey = `lastCreditNotification_${userId}`;
    const lastNotification = localStorage.getItem(lastNotificationKey);
    const lastNotificationDate = lastNotification ? new Date(lastNotification) : new Date(0);

    // Fetch admin adjustments since last notification
    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("id, amount, description, created_at")
      .eq("user_id", userId)
      .eq("transaction_type", "admin_adjustment")
      .gt("created_at", lastNotificationDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (transactions && transactions.length > 0) {
      const latestTransaction = transactions[0];
      setPendingCreditNotification(latestTransaction);
      
      // Update last notification timestamp
      localStorage.setItem(lastNotificationKey, new Date().toISOString());
      
      // Show toast notification
      toast({
        title: latestTransaction.amount > 0 ? "🎁 Credits Added!" : "Credits Adjusted",
        description: `${latestTransaction.amount > 0 ? '+' : ''}R${Math.abs(latestTransaction.amount)} - ${latestTransaction.description || 'Account adjustment'}`,
        duration: 8000,
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          birthday: formData.birthday || null,
          phone: formData.phone || null,
          birthday_opt_in: formData.birthday_opt_in,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setShowBirthdayPopup(false);
      await fetchProfile(profile.id);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent. Check your inbox.",
      });
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PinVerificationModal
        isOpen={showPinVerificationModal}
        onClose={() => setShowPinVerificationModal(false)}
        onVerified={handlePinVerified}
        userEmail={profile?.email || ""}
      />
      <div className="min-h-screen flex flex-col">
        <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">My Account</h1>
              <p className="text-muted-foreground">Manage your profile and orders</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Birthday Popup */}
          {showBirthdayPopup && (
            <Card className="mb-6 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Get Birthday Rewards!
                </CardTitle>
                <CardDescription>
                  Enter your birthday and receive R50 credits every year on your special day!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="popup-birthday">Birthday</Label>
                    <Input
                      id="popup-birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="popup-opt-in"
                      checked={formData.birthday_opt_in}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, birthday_opt_in: checked as boolean })
                      }
                    />
                    <Label htmlFor="popup-opt-in" className="text-sm">
                      Yes, I want to receive birthday rewards!
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Birthday
                    </Button>
                    <Button variant="ghost" onClick={() => setShowBirthdayPopup(false)}>
                      Maybe Later
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credits Display */}
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">M-Wallet Credits</p>
                    <p className="text-3xl font-bold">R{credits.balance.toFixed(2)}</p>
                  </div>
                </div>
                {credits.balance > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Shield className="h-3 w-3" /> Security PIN
                      </p>
                      <div className="flex items-center gap-2">
                        {showPin && pinVerified && revealedPin ? (
                          <>
                            <p className="text-xl font-mono font-bold tracking-widest">{revealedPin}</p>
                            <Button variant="ghost" size="icon" onClick={hidePin}>
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-xl font-mono tracking-widest">••••••</p>
                            <Button variant="ghost" size="icon" onClick={verifyAndShowPin}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {credits.balance > 0 && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  You'll need this PIN to use credits at checkout
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">
                      <Mail className="inline mr-2 h-4 w-4" />
                      Email
                    </Label>
                    <Input id="email" value={profile?.email || ""} disabled />
                  </div>

                  <div>
                    <Label htmlFor="full_name">
                      <User className="inline mr-2 h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      <Phone className="inline mr-2 h-4 w-4" />
                      Phone (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+27 XX XXX XXXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthday">
                      <Calendar className="inline mr-2 h-4 w-4" />
                      Birthday
                    </Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="birthday-opt-in"
                      checked={formData.birthday_opt_in}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, birthday_opt_in: checked as boolean })
                      }
                    />
                    <Label htmlFor="birthday-opt-in" className="text-sm">
                      Receive birthday rewards (R50 credits annually)
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handlePasswordReset}>
                      Reset Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View your past orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders yet</p>
                    </div>
                  ) : (
                    <OrderHistoryList orders={orders} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      </div>
    </>
  );
}
