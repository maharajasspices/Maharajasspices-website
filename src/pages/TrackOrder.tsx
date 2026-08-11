import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Package, CheckCircle, Truck, Clock, ExternalLink, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rateLimiter } from "@/utils/rateLimiter";
import { useSEO } from "@/hooks/useSEO";

interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

interface Order {
  id: string;
  status: string;
  created_at: string;
  total: number;
  courier: string;
  courier_waybill?: string;
  shipping_address: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const [trackingToken, setTrackingToken] = useState(searchParams.get("token") || "");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [courierStatus, setCourierStatus] = useState<string>("");
  const [trackingUrl, setTrackingUrl] = useState<string>("");

  useSEO({
    title: "Track Your Order | Maharaja's Spices - Order Tracking",
    description: "Track your Maharaja's Spices order in real-time. Enter your order number or tracking reference to check delivery status across South Africa.",
    keywords: "track order, order tracking, Maharaja's Spices delivery, spice delivery South Africa",
    url: "https://maharajasspices.co.za/track-order",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rateLimitCheck = rateLimiter.checkLimit('track-order', 5, 60000);
    if (!rateLimitCheck.allowed) {
      toast.error(`Too many tracking attempts. Please wait ${rateLimitCheck.retryAfter} seconds.`);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('track-order', {
        body: { tracking_token: trackingToken, email }
      });

      if (error || !data?.order) {
        const errorMsg = data?.error || "Order not found. Please check your tracking token and try again.";
        toast.error(errorMsg);
        setOrder(null);
        return;
      }

      setOrder(data.order as Order);
      toast.success("Order found!");

      // If order has courier waybill, fetch real-time tracking from Courier Guy
      if (data.order.courier_waybill && data.order.courier === 'The Courier Guy') {
        try {
          const { data: trackingData } = await supabase.functions.invoke('courier-guy-track', {
            body: { waybill: data.order.courier_waybill }
          });

          if (trackingData?.success) {
            setTrackingEvents(trackingData.events || []);
            setCourierStatus(trackingData.courier_status || '');
            setTrackingUrl(trackingData.tracking_url || '');
          }
        } catch (trackError) {
          console.error('Error fetching courier tracking:', trackError);
        }
      }
    } catch (error) {
      console.error("Error tracking order:", error);
      toast.error("Failed to track order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "shipped":
        return <Truck className="h-6 w-6 text-blue-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "shipped":
        return "Shipped";
      case "processing":
        return "Processing";
      default:
        return "Pending";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Package className="h-16 w-16 mx-auto text-primary mb-4 animate-scale-in" />
            <h1 className="text-4xl font-bold mb-4 text-foreground animate-fade-in-up">Track Your Order</h1>
            <p className="text-muted-foreground animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Enter your tracking token and email to view your order status
            </p>
          </div>

          <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="trackingToken">Tracking Token *</Label>
                  <Input 
                    id="trackingToken" 
                    required 
                    className="mt-2"
                    placeholder="Enter the tracking token from your email"
                    value={trackingToken}
                    onChange={(e) => setTrackingToken(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    className="mt-2"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" variant="hero" disabled={loading}>
                  {loading ? "Tracking..." : "Track Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {order && (
            <Card className="mt-6 animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  Order Status: {getStatusText(order.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">{order.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Courier</p>
                  <p className="font-medium">{order.courier || "To be assigned"}</p>
                  {order.courier_waybill && (
                    <p className="text-sm text-primary">Waybill: {order.courier_waybill}</p>
                  )}
                </div>

                {/* Courier Guy Real-time Tracking */}
                {order.courier === 'The Courier Guy' && order.courier_waybill && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium">Courier Guy Tracking</p>
                      {trackingUrl && (
                        <a 
                          href={trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center gap-1 hover:underline"
                        >
                          View on Courier Guy <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {courierStatus && (
                      <p className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full inline-block mb-3">
                        {courierStatus}
                      </p>
                    )}
                    {trackingEvents.length > 0 && (
                      <div className="space-y-3">
                        {trackingEvents.slice(0, 5).map((event, index) => (
                          <div key={index} className="flex gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">{event.description}</p>
                              <p className="text-muted-foreground">
                                {event.location} • {new Date(event.date).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Shipping Address</p>
                  <p className="font-medium">
                    {order.shipping_address.fullName}<br />
                    {order.shipping_address.address}<br />
                    {order.shipping_address.city}, {order.shipping_address.postalCode}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <div className="space-y-2 mt-2">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span>R {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>R {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrder;
