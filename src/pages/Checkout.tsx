import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useCart } from "@/contexts/CartContext";
import CheckoutWithPickup from "@/components/CheckoutWithPickup";
import { z } from "zod";
import { getCustomErrorMessage } from "@/utils/errorHandling";
import { rateLimiter } from "@/utils/rateLimiter";
import { trackEvent } from "@/utils/analytics";
import { redirectToPayFast } from "@/utils/payfast";
import { Loader2, ShieldCheck, Truck, CreditCard, Package, AlertCircle, Tag, X, MessageCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSEO } from "@/hooks/useSEO";
import { payfastLogo } from "@/utils/imageImports";
import courierGuyLogo from "@/assets/courier-guy-logo.webp";

const TAX_RATE = 0.15; // 15% VAT

// Zero-rated items (0% VAT per South African regulations)
const ZERO_RATED_KEYWORDS = [
  'sugar beans',
  'white rice',
  'masoor',
  'breyani dhall',
  'raw nuts',
  'nuts',
  'pea dhall',
];

// South African provinces for Courier Guy
const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape"
];

// Input validation schema
const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  address: z.string().trim().min(5, "Address must be at least 5 characters").max(200, "Address must be less than 200 characters"),
  city: z.string().trim().min(2, "City must be at least 2 characters").max(100, "City must be less than 100 characters"),
  province: z.string().trim().min(2, "Province is required"),
  postalCode: z.string().trim().max(10, "Postal code must be less than 10 characters").optional().or(z.literal("")),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(20, "Phone must be less than 20 characters"),
});

interface CourierRate {
  service_level: {
    code: string;
    name: string;
  };
  rate: number;
  original_rate: number;
  markup: number;
  delivery_days: string;
}

// Voucher code input component
const VoucherCodeInput = ({ subtotal, onApply, onRemove, appliedCode, appliedDiscount }: {
  subtotal: number;
  onApply: (code: string, discount: number) => void;
  onRemove: () => void;
  appliedCode: string;
  appliedDiscount: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const MIN_SPEND = 250;

  const handleApply = async () => {
    if (!code.trim()) return;
    if (subtotal < MIN_SPEND) {
      setError(`Minimum cart total of R${MIN_SPEND} required to use vouchers.`);
      return;
    }
    setChecking(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('voucher_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('Invalid or expired voucher code.');
        setChecking(false);
        return;
      }

      if (data.minimum_order_total && subtotal < data.minimum_order_total) {
        setError(`Minimum order of R${data.minimum_order_total} required.`);
        setChecking(false);
        return;
      }

      onApply(data.code, data.amount);
      toast({ title: 'Voucher applied!', description: `R${data.amount.toFixed(2)} discount applied.` });
    } catch (e) {
      setError('Failed to validate voucher.');
    } finally {
      setChecking(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="border-t pt-4">
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {appliedCode} (-R{appliedDiscount.toFixed(2)})
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:underline cursor-pointer w-full">
          <Tag className="h-4 w-4" />
          Have a voucher code?
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="Enter voucher code"
              className="flex-1"
            />
            <Button
              onClick={handleApply}
              disabled={checking || !code.trim() || subtotal < MIN_SPEND}
              variant="outline"
              size="sm"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
          {subtotal < MIN_SPEND && (
            <p className="text-xs text-muted-foreground">
              Vouchers require a minimum cart total of R{MIN_SPEND}. You need R{(MIN_SPEND - subtotal).toFixed(2)} more.
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const Checkout = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<string>('');
  const [credits, setCredits] = useState<number>(0);
  const [creditsToUse, setCreditsToUse] = useState<number>(0);
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinVerified, setPinVerified] = useState(false);
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>("");
  
  // Courier Guy states
  const [courierRates, setCourierRates] = useState<CourierRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CourierRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string>("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, subtotal } = useCart();

  useSEO({
    title: "Secure Checkout - Maharaja's Spices",
    description: "Complete your order securely with PayFast payment processing.",
  });

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    province: "KwaZulu-Natal",
    postalCode: "",
    phone: "",
  });

  useEffect(() => {
    checkAuth();
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
      });
      navigate("/shop");
    }
  }, []);

  const fetchCredits = async (userId: string) => {
    const { data } = await supabase
      .from("user_credits_safe")
      .select("balance")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setCredits(data.balance);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await fetchCredits(session.user.id);
      if (session.user.email) {
        setShippingAddress(prev => ({ ...prev, email: session.user.email || '' }));
      }
    }
  };

  // Parse weight string to kg (e.g., "500g" -> 0.5, "1kg" -> 1, "250ml" -> 0.25)
  const parseWeightToKg = (weightStr: string | undefined): number => {
    if (!weightStr) return 0.3; // Default 300g per item if not specified
    
    const weight = weightStr.toLowerCase().trim();
    
    // Parse kg format (e.g., "1kg", "1.5kg")
    const kgMatch = weight.match(/^([\d.]+)\s*kg$/);
    if (kgMatch) return parseFloat(kgMatch[1]);
    
    // Parse g format (e.g., "500g", "250g")
    const gMatch = weight.match(/^([\d.]+)\s*g$/);
    if (gMatch) return parseFloat(gMatch[1]) / 1000;
    
    // Parse ml format - treat as grams for spices (density ~1)
    const mlMatch = weight.match(/^([\d.]+)\s*ml$/);
    if (mlMatch) return parseFloat(mlMatch[1]) / 1000;
    
    // Parse l format (e.g., "1L", "750ml")
    const lMatch = weight.match(/^([\d.]+)\s*l$/);
    if (lMatch) return parseFloat(lMatch[1]);
    
    return 0.3; // Default if format not recognized
  };

  // Calculate total weight from cart items
  const calculateTotalWeight = () => {
    let totalWeight = 0;
    items.forEach(item => {
      // Use weight from cart item (product weight or selected variant weight)
      const itemWeight = parseWeightToKg(item.weight || item.variant);
      totalWeight += itemWeight * item.quantity;
    });
    return Math.max(totalWeight, 1); // Minimum 1kg for courier
  };

  // Fetch courier rates when address is complete
  const fetchCourierRates = async () => {
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.province || !shippingAddress.postalCode) {
      return;
    }

    setLoadingRates(true);
    setRatesError("");

    try {
      const totalWeight = calculateTotalWeight();
      
      // Calculate parcel dimensions based on number of items
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const parcelsNeeded = Math.ceil(totalItems / 10); // Max 10 items per parcel
      
      const parcels = Array.from({ length: parcelsNeeded }, () => ({
        submitted_length_cm: 30,
        submitted_width_cm: 25,
        submitted_height_cm: 20,
        submitted_weight_kg: totalWeight / parcelsNeeded
      }));

      const { data, error } = await supabase.functions.invoke('courier-guy-rates', {
        body: {
          delivery_address: {
            street_address: shippingAddress.address,
            local_area: shippingAddress.city,
            city: shippingAddress.city,
            zone: shippingAddress.province,
            code: shippingAddress.postalCode,
            country: "ZA",
            type: "residential"
          },
          parcels
        }
      });

      if (error) {
        console.error('Courier rates error:', error);
        setRatesError("Unable to get shipping rates. Please check your address.");
        return;
      }

      if (data?.rates && data.rates.length > 0) {
        setCourierRates(data.rates);
        // Auto-select the cheapest option (ECO)
        const ecoRate = data.rates.find((r: CourierRate) => r.service_level?.code === 'ECO') || data.rates[0];
        setSelectedRate(ecoRate);
      } else {
        setRatesError("No shipping rates available for this address.");
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      setRatesError("Failed to get shipping rates. Please try again.");
    } finally {
      setLoadingRates(false);
    }
  };

  // Fetch rates when address changes
  useEffect(() => {
    if (deliveryMethod === 'delivery' && shippingAddress.address && shippingAddress.city && shippingAddress.province && shippingAddress.postalCode) {
      const timeoutId = setTimeout(() => {
        fetchCourierRates();
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [
    shippingAddress.address,
    shippingAddress.city,
    shippingAddress.province,
    shippingAddress.postalCode,
    deliveryMethod,
    items,
  ]);

  const round2 = (value: number) => Number(value.toFixed(2));

  const calculateSubtotal = () => round2(subtotal);

  const calculateShipping = () => {
    if (deliveryMethod === 'pickup') return 0;
    return round2(selectedRate?.rate || 0);
  };

  // Check if an item is zero-rated (0% VAT)
  const isZeroRated = (itemName: string): boolean => {
    const lowerName = itemName.toLowerCase();
    return ZERO_RATED_KEYWORDS.some(keyword => lowerName.includes(keyword));
  };

  // VAT from item-level rounded line totals (matches invoice and backend)
  const calculateProductTax = () => {
    const productTax = items.reduce((sum, item) => {
      if (isZeroRated(item.name)) return sum;
      const lineTotalExcl = round2(item.price * item.quantity);
      return sum + round2(lineTotalExcl * TAX_RATE);
    }, 0);

    return round2(productTax);
  };

  // Add shipping VAT (pickup has no shipping VAT)
  const calculateShippingTax = () => {
    if (deliveryMethod === 'pickup') return 0;
    return round2(calculateShipping() * TAX_RATE);
  };

  const calculateTax = () => {
    return round2(calculateProductTax() + calculateShippingTax());
  };

  const calculateTotal = () => {
    const total = calculateSubtotal() + calculateShipping() + calculateTax() - voucherDiscount;
    return Math.max(0, round2(total - creditsToUse));
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (deliveryMethod === 'delivery' && !selectedRate) {
      toast({
        variant: "destructive",
        title: "Select shipping option",
        description: "Please select a shipping option.",
      });
      return;
    }

    if (deliveryMethod === 'pickup' && !selectedPickupLocation) {
      toast({
        variant: "destructive",
        title: "Select pickup location",
        description: "Please select a pickup location.",
      });
      return;
    }

    // Verify PIN if using credits
    if (creditsToUse > 0) {
      if (!enteredPin) {
        toast({
          variant: "destructive",
          title: "PIN required",
          description: "Please enter your M-Wallet PIN to use credits.",
        });
        return;
      }
      
      try {
        setProcessingStep("Verifying M-Wallet PIN...");
        const { data: pinResult, error: pinError } = await supabase.functions.invoke('verify-credit-pin', {
          body: { pin: enteredPin }
        });
        
        if (pinError || !pinResult?.valid) {
          toast({
            variant: "destructive",
            title: "Invalid PIN",
            description: pinResult?.error || "Please enter your correct M-Wallet PIN to use credits.",
          });
          setProcessingStep("");
          return;
        }
        setPinVerified(true);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "PIN verification failed",
          description: "Could not verify your PIN. Please try again.",
        });
        setProcessingStep("");
        return;
      }
    }

    // Validate shipping address
    try {
      shippingAddressSchema.parse(shippingAddress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid shipping address",
          description: error.errors[0]?.message || "Please check your shipping address.",
        });
        return;
      }
    }

    setLoading(true);
    setProcessingStep("Preparing your order...");

    try {
      // Rate limit check
      if (!rateLimiter.checkLimit('checkout', 3, 5 * 60 * 1000)) {
        toast({
          variant: "destructive",
          title: "Too many attempts",
          description: "Please wait a few minutes before placing another order.",
        });
        setLoading(false);
        setProcessingStep("");
        return;
      }

      // Calculate all totals
      const orderSubtotal = calculateSubtotal();
      const orderTax = calculateTax();
      const orderShipping = calculateShipping();
      const orderTotal = calculateTotal();

      setProcessingStep("Creating order...");

      // Prepare order items with full product details (include variant for server-side validation)
      const orderItems = items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variant: item.variant,
      }));

      const orderData = {
        user_id: user?.id || null,
        subtotal: orderSubtotal,
        tax: orderTax,
        shipping_cost: orderShipping,
        total: orderTotal,
        credits_used: creditsToUse,
        voucher_code: voucherCode || null,
        voucher_discount: voucherDiscount,
        courier: deliveryMethod === 'pickup' ? 'Pickup' : 'The Courier Guy',
        courier_cost: selectedRate?.original_rate || 0,
        courier_markup: selectedRate?.markup || 0,
        shipping_address: {
          ...shippingAddress,
          service_level: selectedRate?.service_level?.code || null,
          order_notes: orderNotes.trim() || null,
        },
        items: orderItems,
      };

      // Create order via edge function (bypasses RLS using service role)
      const { data: createOrderResponse, error: createOrderError } = await supabase.functions.invoke('create-order', {
        body: orderData,
      });

      if (createOrderError) {
        console.error('Create order error:', createOrderError);
        throw new Error(createOrderError.message || 'Failed to create order');
      }

      if (!createOrderResponse?.success || !createOrderResponse?.order) {
        throw new Error(createOrderResponse?.error || 'Failed to create order');
      }

      const orderResult = createOrderResponse.order;
      const finalSubtotal = Number(orderResult.subtotal ?? orderSubtotal);
      const finalShipping = Number(orderResult.shipping_cost ?? orderShipping);
      const finalTax = Number(orderResult.tax ?? orderTax);
      const finalTotal = Number(orderResult.total ?? orderTotal);

      // If credits were used, record the transaction (will be reversed if payment fails)
      if (creditsToUse > 0 && user) {
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: -creditsToUse,
          transaction_type: "spent",
          description: `Credits reserved for order ${orderResult.id.substring(0, 8)}`,
          order_id: orderResult.id,
        });
      }

      // Track order creation
      trackEvent('order_created', {
        orderId: orderResult.id,
        total: finalTotal,
        items: items.length,
        courier: 'The Courier Guy',
      });

      setProcessingStep("Connecting to secure payment...");

      // Store order info in sessionStorage for recovery
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        orderId: orderResult.id,
        trackingToken: orderResult.tracking_token,
        items: items,
      }));

      // Parse customer name for PayFast
      const nameParts = shippingAddress.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Build descriptive item name (PayFast has 100 char limit for item_name)
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
      const itemName = `Maharaja's Spices Order #${orderResult.id.substring(0, 8)} (${itemCount} items)`;

      // Build detailed description with breakdown (PayFast has 255 char limit for item_description)
      const productList = items
        .map(i => `${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.quantity}`)
        .join(', ');
      const itemDescription = [
        `Products: ${productList.length > 120 ? productList.substring(0, 117) + '...' : productList}`,
        `Subtotal: R${finalSubtotal.toFixed(2)}`,
        `Shipping: R${finalShipping.toFixed(2)}`,
        `VAT (15%): R${finalTax.toFixed(2)}`,
        `Total: R${finalTotal.toFixed(2)}`
      ].join(' | ');

      
      const customerEmail = shippingAddress.email || user?.email || '';

      // Redirect to PayFast for payment
      await redirectToPayFast({
        orderId: orderResult.id,
        amount: finalTotal,
        itemName: itemName,
        itemDescription: itemDescription,
        customerEmail: customerEmail,
        customerFirstName: firstName,
        customerLastName: lastName,
      });

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: getCustomErrorMessage(error, "There was an error processing your order. Please try again."),
      });
    } finally {
      setLoading(false);
      setProcessingStep("");
    }
  };

  const isFormValid = () => {
    const hasValidAddress = shippingAddress.fullName && shippingAddress.email && 
                           shippingAddress.address && shippingAddress.city && 
                           shippingAddress.province && shippingAddress.phone;
    const hasValidDelivery = deliveryMethod === 'pickup' ? selectedPickupLocation : selectedRate;
    return hasValidAddress && hasValidDelivery;
  };

  // Shipping option labels shown to customers.
  // We intentionally avoid showing courier-internal service names; pricing is still quoted live by the courier API.
  const getServiceInfo = (code: string): { name: string; icon: string; timeframe: string; description: string } => {
    const serviceInfo: Record<string, { name: string; icon: string; timeframe: string; description: string }> = {
      // Local options
      LOF: {
        name: 'Economy Delivery (Local)',
        icon: '📦',
        timeframe: '2–5 business days',
        description: 'Cheapest option. No SLA • Best-effort routing.'
      },
      LOX: {
        name: 'Standard Delivery (Local)',
        icon: '🚚',
        timeframe: '2–5 business days',
        description: 'Normal routing with slightly higher reliability than Economy.'
      },
      LSE: {
        name: 'Same Day Delivery (Local)',
        icon: '🚗',
        timeframe: 'Same business day (before cut-off)',
        description: 'Same-day delivery in your local area (cut-off times apply).'
      },
      SDX: {
        name: 'Urgent Same Day Delivery',
        icon: '🚀',
        timeframe: 'Same business day (priority / dedicated)',
        description: 'Priority same-day delivery. After-hours surcharges may apply.'
      },

      // Non-local fallbacks (keep wording generic)
      ECO: {
        name: 'Economy Delivery',
        icon: '📦',
        timeframe: '2–5 business days',
        description: 'Economy delivery option. Final timing depends on the route.'
      },
      OVN: {
        name: 'Standard Delivery',
        icon: '🚚',
        timeframe: '1–5 business days',
        description: 'Standard delivery option. Final timing depends on the route.'
      },
    };

    return serviceInfo[code] || {
      name: 'Delivery Option',
      icon: '📦',
      timeframe: 'Quoted at checkout',
      description: 'Delivery service quoted live at checkout.'
    };
  };

  // Legacy function for backwards compatibility
  const getServiceName = (code: string) => {
    return getServiceInfo(code).name;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span className="text-sm">Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="text-sm">PayFast Protected</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="text-sm">The Courier Guy</span>
          </div>
        </div>

        <RevealOnScroll direction="scale">
          <h1 className="text-4xl font-bold mb-8 text-center">Secure Checkout</h1>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <RevealOnScroll direction="left">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                      placeholder="123 Main Street, Apartment 4B"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City/Suburb *</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        placeholder="Durban"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province *</Label>
                      <select
                        id="province"
                        value={shippingAddress.province}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, province: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        {SA_PROVINCES.map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                        placeholder="4001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number * (min 10 digits)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        placeholder="083 123 4567"
                        required
                        minLength={10}
                      />
                    </div>
                  </div>
                  {/* Order Notes */}
                  <div>
                    <Label htmlFor="orderNotes">Order Notes (optional)</Label>
                    <Textarea
                      id="orderNotes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value.slice(0, 500))}
                      placeholder="Any special instructions for your order (e.g. delivery instructions, gift message)..."
                      className="mt-1"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{orderNotes.length}/500 characters</p>
                  </div>

                  {/* Contact for questions */}
                  <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Have questions about your order?</p>
                      <p className="text-muted-foreground mt-0.5">
                        WhatsApp or call us at{" "}
                        <a
                          href="https://wa.me/27684051374"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-semibold hover:underline"
                        >
                          068 405 1374
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RevealOnScroll>

            <RevealOnScroll direction="left" delay={50}>
              <CheckoutWithPickup
                onDeliveryMethodChange={(method, locationId) => {
                  setDeliveryMethod(method);
                  setSelectedPickupLocation(locationId || '');
                  if (method === 'pickup') {
                    setSelectedRate(null);
                    setCourierRates([]);
                  } else {
                    fetchCourierRates();
                  }
                }}
                selectedMethod={deliveryMethod}
                selectedLocationId={selectedPickupLocation}
              />
            </RevealOnScroll>

            {deliveryMethod === 'delivery' && (
              <RevealOnScroll direction="left" delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Shipping Options
                      </span>
                      <img 
                        src={courierGuyLogo} 
                        alt="The Courier Guy" 
                        className="h-8 object-contain"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingRates && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Calculating shipping rates...</span>
                      </div>
                    )}

                    {ratesError && (
                      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-5 w-5" />
                        <span>{ratesError}</span>
                      </div>
                    )}

                    {!loadingRates && !ratesError && courierRates.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Please complete your shipping address to see available shipping options.
                      </p>
                    )}

                    {courierRates.length > 0 && (
                      <RadioGroup
                        value={selectedRate?.service_level?.code || ''}
                        onValueChange={(code) => {
                          const rate = courierRates.find(r => r.service_level?.code === code);
                          if (rate) setSelectedRate(rate);
                        }}
                        className="space-y-3"
                      >
                        {courierRates.map((rate) => {
                          const serviceInfo = getServiceInfo(rate.service_level?.code || '');
                          const isSelected = selectedRate?.service_level?.code === rate.service_level?.code;
                          
                          return (
                            <div 
                              key={rate.service_level?.code || Math.random()} 
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 shadow-sm' 
                                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                              }`}
                              onClick={() => setSelectedRate(rate)}
                            >
                              <div className="flex items-start gap-3">
                                <RadioGroupItem 
                                  value={rate.service_level?.code || ''} 
                                  id={rate.service_level?.code} 
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <Label 
                                      htmlFor={rate.service_level?.code} 
                                      className="font-semibold text-base cursor-pointer flex items-center gap-2"
                                    >
                                      <span>{serviceInfo.icon}</span>
                                      {serviceInfo.name}
                                    </Label>
                                    <p className="font-bold text-lg text-primary">R{rate.rate.toFixed(2)}</p>
                                  </div>
                                  <p className="text-sm font-semibold text-foreground mt-1">
                                    ⏱️ {serviceInfo.timeframe}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {serviceInfo.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    )}
                  </CardContent>
                </Card>
              </RevealOnScroll>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <RevealOnScroll direction="right">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => {
                      const itemKey = item.variant ? `${item.productId}-${item.variant}` : item.productId;
                      return (
                        <div key={itemKey} className="flex items-center gap-3 py-2 border-b border-border/50">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            {item.variant && (
                              <p className="text-xs text-muted-foreground">Size: {item.variant}</p>
                            )}
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">R{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>R{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{deliveryMethod === 'pickup' ? 'Free (Pickup)' : `R${calculateShipping().toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>VAT (15%){deliveryMethod === 'delivery' && selectedRate ? ' incl. shipping' : ''}</span>
                      <span>R{calculateTax().toFixed(2)}</span>
                    </div>
                    {items.some(item => isZeroRated(item.name)) && (
                      <p className="text-xs text-emerald-600">
                        * Some items are zero-rated (0% VAT)
                      </p>
                    )}
                    {voucherDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Voucher ({voucherCode})</span>
                        <span>-R{voucherDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {creditsToUse > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Credits Applied</span>
                        <span>-R{creditsToUse.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">R{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Voucher Code */}
                  <VoucherCodeInput
                    subtotal={calculateSubtotal()}
                    onApply={(code, discount) => {
                      setVoucherCode(code);
                      setVoucherDiscount(discount);
                    }}
                    onRemove={() => {
                      setVoucherCode('');
                      setVoucherDiscount(0);
                    }}
                    appliedCode={voucherCode}
                    appliedDiscount={voucherDiscount}
                  />

                  {/* M-Wallet Credits */}
                  {user && credits > 0 && (
                    <div className="border-t pt-4">
                      <Label htmlFor="credits" className="text-sm font-medium">
                        Use M-Wallet Credits (Available: R{credits.toFixed(2)})
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="credits"
                          type="number"
                          min={0}
                          max={Math.min(credits, calculateTotal() + creditsToUse)}
                          value={creditsToUse || ''}
                          onChange={(e) => setCreditsToUse(Math.min(Number(e.target.value) || 0, credits))}
                          placeholder="0.00"
                          className="flex-1"
                        />
                      </div>
                      {creditsToUse > 0 && (
                        <div className="mt-2">
                          <Label htmlFor="pin" className="text-sm">M-Wallet PIN</Label>
                          <Input
                            id="pin"
                            type="password"
                            value={enteredPin}
                            onChange={(e) => setEnteredPin(e.target.value)}
                            placeholder="Enter your PIN"
                            maxLength={6}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pay Button */}
                  <Button 
                    className="w-full h-12 text-lg font-semibold"
                    onClick={handlePlaceOrder}
                    disabled={loading || !isFormValid()}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {processingStep || "Processing..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Pay with PayFast
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Your payment is processed securely by PayFast. 
                    Your cart will be saved if you cancel.
                  </p>

                  {/* PayFast Logo */}
                  <div className="flex justify-center pt-4">
                    <div className="bg-card p-3 rounded">
                      <img 
                        src={payfastLogo} 
                        alt="Secured and powered by PayFast - Visa, Mastercard, Zapper, Instant EFT" 
                        className="h-12 md:h-16 lg:h-20 object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RevealOnScroll>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
