import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ShoppingCart, RotateCcw, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentCancelled = () => {
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useSEO({
    title: "Payment Cancelled - Maharaja's Spices",
    description: "Your payment was cancelled. Your cart items are still saved - return when you're ready to complete your purchase.",
  });

  useEffect(() => {
    // Check for pending order
    const pendingOrder = sessionStorage.getItem('pendingOrder');
    if (pendingOrder) {
      try {
        const { orderId } = JSON.parse(pendingOrder);
        setPendingOrderId(orderId);
        
        // Update order status to cancelled
        const updateOrderStatus = async () => {
          await supabase
            .from('orders')
            .update({ status: 'payment_cancelled' })
            .eq('id', orderId);
        };
        updateOrderStatus();
      } catch (err) {
        console.error('Error processing pending order:', err);
      }
    }
  }, []);

  const handleRetryPayment = async () => {
    if (pendingOrderId) {
      // Clear the cancelled status and redirect to checkout
      try {
        await supabase
          .from('orders')
          .update({ status: 'pending_payment' })
          .eq('id', pendingOrderId);
        
        toast({
          title: "Retrying payment",
          description: "Redirecting you back to checkout...",
        });
        
        navigate('/checkout');
      } catch (error) {
        console.error('Error retrying payment:', error);
        navigate('/checkout');
      }
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-lg w-full animate-fade-in-up shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-14 w-14 text-orange-600 dark:text-orange-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Payment Cancelled
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Your payment was not completed. Don't worry – your cart items are still saved and ready for checkout.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                <strong>No charges were made.</strong> If you experienced any issues during payment, 
                you can try again or contact our support team for assistance.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleRetryPayment}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/cart">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View Cart
                </Link>
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Common reasons for payment issues:
              </p>
              <ul className="text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
                <li>Insufficient funds</li>
                <li>Card details entered incorrectly</li>
                <li>Bank security checks</li>
                <li>Browser or connection issues</li>
              </ul>
              <div className="mt-4">
                <Button asChild variant="link" size="sm">
                  <Link to="/contact">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Need help? Contact Support
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default PaymentCancelled;
