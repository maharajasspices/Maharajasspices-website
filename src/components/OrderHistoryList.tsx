import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, FileText, ClipboardCopy, ExternalLink, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: OrderItem[] | null;
  courier_waybill?: string;
}

interface OrderHistoryListProps {
  orders: Order[];
}

export function OrderHistoryList({ orders }: OrderHistoryListProps) {
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [productWeights, setProductWeights] = useState<Record<string, string>>({});

  // Collect all unique product IDs from all orders and fetch their weights
  const allProductIds = useMemo(() => {
    const ids = new Set<string>();
    orders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        if (item.productId) ids.add(item.productId);
      });
    });
    return Array.from(ids);
  }, [orders]);

  useEffect(() => {
    if (!allProductIds.length) return;
    supabase
      .from("products")
      .select("id, weight")
      .in("id", allProductIds)
      .then(({ data }) => {
        const weights: Record<string, string> = {};
        (data || []).forEach((p: any) => {
          if (p.weight) weights[p.id] = p.weight;
        });
        setProductWeights(weights);
      });
  }, [allProductIds]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "processing":
      case "shipped":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    // Show screenshot reminder first
    toast.info("Tip: Take a screenshot of your invoice in case the download doesn't save properly.", {
      duration: 6000,
    });

    setDownloadingInvoice(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { orderId },
      });

      if (error) throw error;

      if (data?.pdf) {
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${orderId.substring(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Invoice downloaded successfully");
      } else if (typeof data === "string") {
        const blob = new Blob([data], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 500);
          };
        } else {
          const link = document.createElement("a");
          link.href = url;
          link.download = `invoice-${orderId.substring(0, 8)}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        toast.success("Invoice opened — remember to screenshot or save as PDF");
      } else {
        toast.error("Invoice not available for this order");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), "PPP")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status || "pending")}>
                {order.status || "Pending"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadInvoice(order.id)}
                disabled={downloadingInvoice === order.id}
              >
                {downloadingInvoice === order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-1" />
                    Invoice
                  </>
                )}
              </Button>
            </div>
          </div>

          {order.items && Array.isArray(order.items) && order.items.length > 0 && (
            <div className="text-sm text-muted-foreground mb-2">
              {order.items.slice(0, 3).map((item: any, idx: number) => (
                <span key={idx}>
                  {item.name}
                  {item.variant ? ` (${item.variant})` : productWeights[item.productId] ? ` (${productWeights[item.productId]})` : ''} x{item.quantity}
                  {idx < Math.min(order.items!.length, 3) - 1 && ", "}
                </span>
              ))}
              {order.items.length > 3 && (
                <span> +{order.items.length - 3} more</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-semibold">R{order.total.toFixed(2)}</span>
          </div>

          {order.courier_waybill && (
            <div className="mt-2 pt-2 border-t flex flex-wrap items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-mono font-medium text-foreground">{order.courier_waybill}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={async () => {
                  await navigator.clipboard.writeText(order.courier_waybill!);
                  toast.success("Waybill copied!");
                }}
              >
                <ClipboardCopy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                asChild
              >
                <a
                  href={`/track-parcel?waybill=${encodeURIComponent(order.courier_waybill)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tracking Helper <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                asChild
              >
                <a
                  href={`https://thecourierguy.co.za/tracking/?waybill=${order.courier_waybill}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Courier Site <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
