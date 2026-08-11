import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, Home, Package, Loader2, FileText } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useInvoiceDownload } from "@/hooks/useInvoiceDownload";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const trackingTokenFromUrl = searchParams.get('tracking_token');
  const { clear } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { downloadInvoice, isLoading: isDownloading } = useInvoiceDownload();

  useSEO({
    title: "Payment Successful - Maharaja's Spices",
    description: "Your payment has been processed successfully. Thank you for shopping with Maharaja's Spices.",
  });

  useEffect(() => {
    // Clear cart on successful payment
    clear();

    // Check authentication and fetch order details
    const fetchData = async () => {
      const pendingOrderRaw = sessionStorage.getItem('pendingOrder');
      let pendingOrder: { orderId?: string; trackingToken?: string } | null = null;

      if (pendingOrderRaw) {
        try {
          pendingOrder = JSON.parse(pendingOrderRaw);
        } catch (error) {
          console.error('Failed to parse pending order from session storage:', error);
        }
      }

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      if (orderId) {
        try {
          const recoveryTrackingToken =
            trackingTokenFromUrl ||
            (pendingOrder?.orderId === orderId ? pendingOrder?.trackingToken : null);

          const canReconcile = Boolean(orderId && recoveryTrackingToken);

          if (canReconcile) {
            const { data: reconcileResult, error: reconcileError } = await supabase.functions.invoke('confirm-payfast-return', {
              body: {
                order_id: orderId,
                tracking_token: recoveryTrackingToken,
              },
            });

            if (reconcileError) {
              console.error('Error reconciling successful payment:', reconcileError);
            } else if (reconcileResult?.order) {
              setOrderDetails(reconcileResult.order);
            }
          }

          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
          
          if (!error && data) {
            setOrderDetails(data);
          }
        } catch (err) {
          console.error('Error fetching order:', err);
        } finally {
          if (pendingOrder?.orderId === orderId) {
            sessionStorage.removeItem('pendingOrder');
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [orderId, trackingTokenFromUrl, clear]);

  const handleDownloadInvoice = () => {
    if (orderId) {
      downloadInvoice(orderId);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-lg w-full animate-fade-in-up shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once">
              <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Payment Successful!
            </h1>
            
            <p className="text-muted-foreground mb-2">
              Thank you for your order. Your payment has been processed successfully.
            </p>
            
            {loading ? (
              <div className="flex items-center justify-center gap-2 my-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading order details...</span>
              </div>
            ) : orderId && (
              <div className="bg-muted/50 rounded-lg p-4 my-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Order Reference</span>
                </div>
                <p className="text-lg font-mono text-primary">{orderId.substring(0, 8).toUpperCase()}</p>
                {orderDetails && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Total: R{orderDetails.total?.toFixed(2)}
                  </p>
                )}
              </div>
            )}
            
            <p className="text-muted-foreground mb-6">
              A confirmation email has been sent to your email address.
            </p>

            {/* Invoice notification */}
            {orderId && orderDetails?.status === 'paid' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Tax Invoice Available</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  Your SARS-compliant tax invoice is ready for download below. You can also access it anytime from your order history.
                </p>
              </div>
            )}

            {/* Download Invoice Button - Show for all users with paid orders */}
            {orderId && orderDetails?.status === 'paid' && (
              <div className="mb-6">
                <Button
                  onClick={handleDownloadInvoice}
                  disabled={isDownloading}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Invoice...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Download Tax Invoice
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  SARS-compliant VAT invoice
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" size="lg">
                <Link to="/track-order">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Track Order
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/shop">
                  <Home className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Questions about your order?{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  Contact our support team
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
