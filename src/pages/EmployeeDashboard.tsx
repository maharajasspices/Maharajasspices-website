import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardProtection from "@/components/DashboardProtection";
import { usePortalAccess } from "@/hooks/usePortalAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2, Package, Search, RefreshCw, Eye, FileText,
  Clock, Truck, CheckCircle, AlertCircle, Download, ClipboardList, ExternalLink,
  AlertTriangle, Mail
} from "lucide-react";
import { format } from "date-fns";

interface OrderData {
  id: string;
  created_at: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  courier: string | null;
  courier_waybill: string | null;
  tracking_token: string | null;
  user_id: string | null;
  shipping_address: any;
  items: any[];
  credits_used: number | null;
  shipment_creation_error: string | null;
}

const ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "payment_failed"] as const;

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  paid: { label: "Paid", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Package },
  shipped: { label: "Shipped", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertCircle },
  payment_failed: { label: "Payment Failed", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertCircle },
};

const safeFormatDate = (
  dateValue: string | null | undefined, 
  dateFormat: string = "PPp"
)=> {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);

  if (isNaN(date.getTime())){
    console.warn("Invalid date value:", dateValue);
    return "N/A";
  }
  return format(date, dateFormat);
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeniorEmployee, setIsSeniorEmployee] = useState(false);
  const [showEmergencyWarning, setShowEmergencyWarning] = useState(false);
  const [isBradley, setIsBradley] = useState(false);
  const portalAccess = usePortalAccess();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [productWeights, setProductWeights] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("pending");

  const [confirmDialog, setConfirmDialog] = useState<{ orderId: string; newStatus: string; oldStatus: string } | null>(null);
  const [forcingWaybill, setForcingWaybill] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const [employeeLogs, setEmployeeLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (portalAccess.isLoading) {
      setLoading(true);
      return;
    }

    if (!portalAccess.isLoggedIn) {
      navigate("/auth");
      return;
    }

    if (!portalAccess.isEmployee && !portalAccess.isAdmin) {
      toast.error("Access denied.");
      navigate("/");
      return;
    }

    const normalizedEmail = (portalAccess.user?.email || "").toLowerCase();
    const isAdminEmail = ["bradley@maharajasspices.co.za", "zulaigah.benjamin@maharajasspices.co.za"].includes(normalizedEmail);
    const isBradleyUser = normalizedEmail === "bradley@maharajasspices.co.za";

    setCurrentUser({
      id: portalAccess.user?.id,
      email: normalizedEmail,
      full_name: portalAccess.user?.user_metadata?.full_name ?? null,
    });
    setIsAdmin(portalAccess.isAdmin || isAdminEmail);
    setIsBradley(isBradleyUser);
    setIsSeniorEmployee(portalAccess.isSeniorEmployee);
    setIsAuthorized(true);
    setLoading(false);
  }, [navigate, portalAccess.isAdmin, portalAccess.isEmployee, portalAccess.isLoading, portalAccess.isLoggedIn, portalAccess.isSeniorEmployee, portalAccess.user]);

  

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      // Only fetch orders that have been paid - pending orders should not appear on orders portal
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total, subtotal, tax, shipping_cost, courier, courier_waybill, tracking_token, user_id, shipping_address, items, credits_used, shipment_creation_error")
        .not("status", "in", '("pending","payment_failed")')
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setOrders((data || []) as OrderData[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) fetchOrders();
  }, [isAuthorized, fetchOrders]);

  // Alert admin/marketing about orders with shipment errors
  useEffect(() => {
    if (!isAuthorized || !(isAdmin || isSeniorEmployee)) return;
    const errorOrders = orders.filter(o => o.shipment_creation_error && !o.courier_waybill);
    if (errorOrders.length > 0) {
      toast.warning(
        `${errorOrders.length} order(s) have waybill creation errors. Check the "Processing" tab for details.`,
        { duration: 8000 }
      );
    }
  }, [orders, isAuthorized, isAdmin, isSeniorEmployee]);

  // Fetch product weights when an order is selected so we can show sizes for all items
  useEffect(() => {
    if (!selectedOrder?.items?.length) {
      setProductWeights({});
      return;
    }
    const productIds = selectedOrder.items
      .filter((item: any) => item.productId)
      .map((item: any) => item.productId);
    if (!productIds.length) return;
    
    supabase
      .from("products")
      .select("id, weight")
      .in("id", productIds)
      .then(({ data }) => {
        const weights: Record<string, string> = {};
        (data || []).forEach((p: any) => {
          if (p.weight) weights[p.id] = p.weight;
        });
        setProductWeights(weights);
      });
  }, [selectedOrder]);

  const logEmployeeAction = async (action: string, entityType: string, entityId: string, details: any) => {
    if (!currentUser) return;
    try {
      await supabase.from("employee_logs").insert({
        employee_id: currentUser.id, action, entity_type: entityType, entity_id: entityId,
        details: { ...details, employee_name: currentUser.full_name || currentUser.email || "Unknown", employee_email: currentUser.email || "Unknown", timestamp: new Date().toISOString() },
      });
    } catch (error) { console.error("Error logging action:", error); }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, oldStatus: string) => {
    const statusOrder = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
    const oldIndex = statusOrder.indexOf(oldStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    if (!isAdmin && newIndex < oldIndex) {
      setConfirmDialog({ orderId, newStatus, oldStatus });
      return;
    }
    await executeStatusUpdate(orderId, newStatus, oldStatus);
  };

  const executeStatusUpdate = async (orderId: string, newStatus: string, oldStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      await logEmployeeAction(`Changed order status from "${oldStatus}" to "${newStatus}"`, "order", orderId, { old_status: oldStatus, new_status: newStatus });
      toast.success(`Order status updated to ${statusConfig[newStatus]?.label || newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      setConfirmDialog(null);
      if (['processing', 'shipped', 'pending'].includes(newStatus)) setActiveTab(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleForceWaybill = async (orderId: string) => {
    setForcingWaybill(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("retry-shipment", {
        body: { order_id: orderId },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Waybill created successfully: ${data.waybill || "Processing"}`);
        // Update the order in local state
        setOrders(prev => prev.map(o => o.id === orderId ? {
          ...o,
          courier_waybill: data.waybill || o.courier_waybill,
          shipment_creation_error: null,
        } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            courier_waybill: data.waybill || prev.courier_waybill,
            shipment_creation_error: null,
          } : null);
        }
        await logEmployeeAction("Force created waybill", "order", orderId, { waybill: data.waybill });
      } else {
        const errorMsg = data?.error || "Failed to create waybill";
        toast.error(errorMsg);
        // Update the error in local state
        setOrders(prev => prev.map(o => o.id === orderId ? {
          ...o,
          shipment_creation_error: errorMsg,
        } : o));
      }
    } catch (error: any) {
      console.error("Error forcing waybill:", error);
      toast.error(error.message || "Failed to create waybill");
    } finally {
      setForcingWaybill(null);
    }
  };


  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const { data, error } = await supabase.from("invoices").select("id, invoice_number, invoice_date, customer_name, customer_email, line_items, subtotal_excl_vat, total_vat, total_incl_vat, order_id, payment_reference").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to fetch invoices");
    } finally { setLoadingInvoices(false); }
  };

  const handleDownloadInvoice = async (orderId: string, invoiceNumber: string) => {
    setDownloadingInvoice(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", { body: { orderId } });
      if (error) throw error;
      if (data?.pdf) {
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = `invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Invoice downloaded");
      } else if (typeof data === "string") {
        // Handle HTML response - open in new tab for print/save as PDF
        const blob = new Blob([data], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.onload = () => { setTimeout(() => printWindow.print(), 500); };
        } else {
          const link = document.createElement("a");
          link.href = url; link.download = `invoice-${invoiceNumber}.html`;
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        toast.success("Invoice opened for printing");
      } else {
        toast.error("Invoice not available");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    } finally { setDownloadingInvoice(null); }
  };

  const fetchEmployeeLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data: logs, error } = await supabase.from("employee_logs").select("id, employee_id, action, entity_type, entity_id, details, created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      if (!logs || logs.length === 0) { setEmployeeLogs([]); setLoadingLogs(false); return; }
      const employeeIds = [...new Set(logs.map(l => l.employee_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").in("id", employeeIds);
      setEmployeeLogs(logs.map(log => ({ ...log, profile: profiles?.find(p => p.id === log.employee_id) || null })));
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to fetch logs");
    } finally { setLoadingLogs(false); }
  };

  const getFilteredOrders = (status?: string) => {
    // Hide cancelled/failed orders from non-admin views
    let filtered = orders.filter(o => !["cancelled", "payment_cancelled", "payment_failed"].includes(o.status || ""));
    if (status && status !== "all") {
      if (status === "pending") {
        // "Pending" tab now only shows "paid" orders (awaiting processing)
        filtered = filtered.filter(o => o.status === "paid");
      } else {
        filtered = filtered.filter(o => o.status === status);
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.courier_waybill?.toLowerCase().includes(q) ||
        (o.shipping_address as any)?.email?.toLowerCase().includes(q) ||
        (o.shipping_address as any)?.fullName?.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const statusCounts = {
    all: orders.filter(o => !["cancelled", "payment_cancelled", "payment_failed"].includes(o.status || "")).length,
    pending: orders.filter(o => o.status === "pending" || o.status === "paid").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered" || o.status === "completed").length,
  };

  const getTrackingUrl = (waybill: string) => `https://thecourierguy.co.za/tracking/?waybill=${waybill}`;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!isAuthorized) return null;

  return (
    <DashboardProtection>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">
              Welcome, {currentUser?.full_name || currentUser?.email || "Employee"}
              {isAdmin && <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">Admin</Badge>}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <TabsList className="flex-wrap h-auto">
                {isAdmin && (
                  <TabsTrigger value="all" className="gap-1">
                    All <Badge variant="secondary" className="ml-1 text-xs">{statusCounts.all}</Badge>
                  </TabsTrigger>
                )}
                <TabsTrigger value="pending" className="gap-1">
                  <Clock className="h-3.5 w-3.5" /> Pending
                  <Badge variant="secondary" className="ml-1 text-xs">{statusCounts.pending}</Badge>
                </TabsTrigger>
                <TabsTrigger value="processing" className="gap-1">
                  <Package className="h-3.5 w-3.5" /> Processing
                  <Badge variant="secondary" className="ml-1 text-xs">{statusCounts.processing}</Badge>
                </TabsTrigger>
                <TabsTrigger value="shipped" className="gap-1">
                  <Truck className="h-3.5 w-3.5" /> Shipped
                  <Badge variant="secondary" className="ml-1 text-xs">{statusCounts.shipped}</Badge>
                </TabsTrigger>
                {(isAdmin || isSeniorEmployee) && (
                  <>
                    <TabsTrigger value="delivered" className="gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Delivered
                      <Badge variant="secondary" className="ml-1 text-xs">{statusCounts.delivered}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="invoices" onClick={() => !invoices.length && fetchInvoices()}>
                      <FileText className="h-3.5 w-3.5 mr-1" /> Invoices
                    </TabsTrigger>
                    {isAdmin && (
                      <TabsTrigger value="logs" onClick={() => !employeeLogs.length && fetchEmployeeLogs()}>
                        <ClipboardList className="h-3.5 w-3.5 mr-1" /> Activity Logs
                      </TabsTrigger>
                    )}
                  </>
                )}
              </TabsList>
            </div>

            {activeTab !== "invoices" && activeTab !== "logs" && (
              <div className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by order ID, customer, email, waybill..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Button onClick={fetchOrders} disabled={loadingOrders} variant="outline">
                  {loadingOrders ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {activeTab !== "invoices" && activeTab !== "logs" && !isAdmin && !isSeniorEmployee && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm text-muted-foreground">Need to make an emergency edit to an order?</p>
                <a href="mailto:marketing@maharajasspices.co.za?subject=Emergency Order Edit Request" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline ml-auto shrink-0">
                  <Mail className="h-4 w-4" /> Contact Manager
                </a>
              </div>
            )}

            {((isAdmin || isSeniorEmployee) ? ["all", "pending", "processing", "shipped", "delivered"] : ["pending", "processing", "shipped"]).filter(t => t !== "all" || isAdmin).map(tabValue => (
              <TabsContent key={tabValue} value={tabValue}>
                <OrdersTable
                  orders={getFilteredOrders(tabValue)}
                  loading={loadingOrders}
                  onViewOrder={(isAdmin || isSeniorEmployee) ? (order) => {
                    if (isSeniorEmployee && !isAdmin) {
                      setShowEmergencyWarning(true);
                    }
                    setSelectedOrder(order);
                  } : undefined}
                  onUpdateStatus={handleUpdateStatus}
                  onForceWaybill={(isAdmin || isSeniorEmployee) ? handleForceWaybill : undefined}
                  tabStatus={tabValue}
                  isAdmin={isAdmin}
                  isSeniorEmployee={isSeniorEmployee}
                  getTrackingUrl={getTrackingUrl}
                  forcingWaybill={forcingWaybill}
                />
              </TabsContent>
            ))}

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Tax Invoices</CardTitle>
                    <CardDescription>Download SARS-compliant tax invoices</CardDescription>
                  </div>
                  <Button onClick={fetchInvoices} variant="outline" size="sm" disabled={loadingInvoices}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingInvoices ? "animate-spin" : ""}`} /> Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingInvoices ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : invoices.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No invoices found</p>
                  ) : (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map(inv => (
                            <TableRow key={inv.id}>
                             <TableCell className="font-mono text-sm">
                              {inv.invoice_number}
                            </TableCell>

                            <TableCell className="text-sm">
                              {safeFormatDate(inv.created_at, "PPp")}
                            </TableCell>

                            <TableCell>
                              <p className="text-sm font-medium">{inv.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{inv.customer_email}</p>
                            </TableCell>

                            <TableCell className="text-right font-medium">
                              R{inv.total_incl_vat?.toFixed(2)}
                            </TableCell>

                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedInvoice(inv)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDownloadInvoice(inv.order_id, inv.invoice_number)
                                  }
                                  disabled={downloadingInvoice === inv.order_id}
                                >
                                  {downloadingInvoice === inv.order_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Logs (Admin only) */}
            {isAdmin && (
              <TabsContent value="logs">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Employee Activity Logs</CardTitle>
                      <CardDescription>Track all employee actions on orders</CardDescription>
                    </div>
                    <Button onClick={fetchEmployeeLogs} variant="outline" size="sm" disabled={loadingLogs}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingLogs ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingLogs ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : employeeLogs.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No activity logs yet</p>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Timestamp</TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Entity</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employeeLogs.map(log => (
                              <TableRow key={log.id}>
                                <TableCell className="text-sm whitespace-nowrap">{format(new Date(log.created_at), "PPp")}</TableCell>
                                <TableCell>
                                  <p className="text-sm font-medium">{log.profile?.full_name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{log.profile?.email || log.employee_id.slice(0, 8)}</p>
                                </TableCell>
                                <TableCell className="text-sm max-w-xs">{log.action}</TableCell>
                                <TableCell className="text-sm">
                                  <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                                  {log.entity_id && <p className="text-xs text-muted-foreground font-mono mt-1">{log.entity_id.slice(0, 8).toUpperCase()}</p>}
                                </TableCell>
                                <TableCell className="text-xs max-w-xs">
                                  {log.details && (
                                    <div className="space-y-0.5">
                                      {log.details.old_status && <p>{log.details.old_status} → {log.details.new_status}</p>}
                                      <p className="text-muted-foreground">{log.details.employee_name}</p>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Backward status change confirmation */}
          <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                <AlertDialogDescription>
                  You are moving this order backward from "{confirmDialog?.oldStatus}" to "{confirmDialog?.newStatus}". Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => confirmDialog && executeStatusUpdate(confirmDialog.orderId, confirmDialog.newStatus, confirmDialog.oldStatus)}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>


          {/* Emergency Warning for Senior Employee */}
          <AlertDialog open={showEmergencyWarning} onOpenChange={setShowEmergencyWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Emergency Edits Only
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>Do not edit anything here unless it is an emergency.</strong> All changes you make in this view will be logged and tracked. If this is not an emergency, please close this dialog.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedOrder(null)}>Close &amp; Go Back</AlertDialogCancel>
                <AlertDialogAction className="bg-amber-500 hover:bg-amber-600" onClick={() => {
                  setShowEmergencyWarning(false);
                  logEmployeeAction("Opened order detail view (emergency access)", "order", selectedOrder?.id || "", { access_type: "senior_employee_view" });
                }}>
                  I Understand, Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder && !showEmergencyWarning} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Order {selectedOrder?.id?.slice(0, 8).toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[selectedOrder.status]?.color || "bg-muted"}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{format(new Date(selectedOrder.created_at), "PPp")}</span>
                </div>

                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-sm font-medium mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {ORDER_STATUSES.filter(s => s !== selectedOrder.status).map(status => (
                        <Button key={status} size="sm" variant="outline" className={`text-xs ${statusConfig[status]?.color || ""}`}
                          onClick={() => handleUpdateStatus(selectedOrder.id, status, selectedOrder.status)}>
                          {statusConfig[status]?.label || status}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedOrder.shipping_address?.fullName || "N/A"}</p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_address?.email || "No email"}</p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_address?.phone || ""}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shipping Address</p>
                    <p className="text-sm">
                      {selectedOrder.shipping_address?.address}<br />
                      {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.postalCode}
                    </p>
                  </div>
                </div>

                {selectedOrder.shipping_address?.order_notes && (
                  <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                      <ClipboardList className="h-3 w-3" /> Customer Order Notes
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">{selectedOrder.shipping_address.order_notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Courier</p>
                    <p className="font-medium">{selectedOrder.courier || "Not assigned"}</p>
                    {selectedOrder.courier_waybill ? (
                      <div className="mt-1">
                        <p className="text-xs text-primary font-mono">Waybill: {selectedOrder.courier_waybill}</p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <a
                            href={`/track-parcel?waybill=${encodeURIComponent(selectedOrder.courier_waybill)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Tracking Helper
                          </a>
                          <a
                            href={getTrackingUrl(selectedOrder.courier_waybill)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Courier Site
                          </a>
                        </div>
                      </div>
                    ) : selectedOrder.shipment_creation_error ? (
                      <div className="mt-1 p-2 rounded border border-red-300 bg-red-50">
                        <div className="flex items-center gap-1 text-red-700 text-xs font-semibold mb-1">
                          <AlertTriangle className="h-3 w-3" /> Waybill Creation Failed
                        </div>
                        <p className="text-xs text-red-600">{selectedOrder.shipment_creation_error}</p>
                        {(isAdmin || isSeniorEmployee) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="mt-2 text-xs h-7"
                            disabled={forcingWaybill === selectedOrder.id}
                            onClick={() => handleForceWaybill(selectedOrder.id)}
                          >
                            {forcingWaybill === selectedOrder.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                            Force Create Waybill
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                  {selectedOrder.tracking_token && (
                    <div>
                      <p className="text-muted-foreground">Tracking Token</p>
                      <p className="font-mono text-xs break-all">{selectedOrder.tracking_token}</p>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedOrder.items || []).map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">
                            {item.name}
                            {item.variant ? (
                              <span className="text-xs text-muted-foreground ml-1">({item.variant})</span>
                            ) : productWeights[item.productId] ? (
                              <span className="text-xs text-muted-foreground ml-1">({productWeights[item.productId]})</span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R{item.price?.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">R{(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>R{selectedOrder.subtotal?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>R{selectedOrder.shipping_cost?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>R{selectedOrder.tax?.toFixed(2)}</span></div>
                  {selectedOrder.credits_used && selectedOrder.credits_used > 0 && (
                    <div className="flex justify-between text-green-600"><span>Credits Applied</span><span>-R{selectedOrder.credits_used.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span><span>R{selectedOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice {selectedInvoice?.invoice_number}</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedInvoice.customer_name}</p>
                    <p className="text-muted-foreground">{selectedInvoice.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{format(new Date(selectedInvoice.invoice_date), "PPp")}</p>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Ex VAT</TableHead>
                        <TableHead className="text-right">VAT</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedInvoice.line_items || []).map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">{item.name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R{item.unit_price_excl?.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">R{item.line_vat?.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">R{item.line_total_incl?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal (ex VAT)</span><span>R{selectedInvoice.subtotal_excl_vat?.toFixed(2)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>VAT (15%)</span><span>R{selectedInvoice.total_vat?.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total (incl VAT)</span><span>R{selectedInvoice.total_incl_vat?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </DashboardProtection>
  );
};

// Orders table component
interface OrdersTableProps {
  orders: OrderData[];
  loading: boolean;
  onViewOrder?: (order: OrderData) => void;
  onUpdateStatus: (orderId: string, newStatus: string, oldStatus: string) => void;
  onForceWaybill?: (orderId: string) => void;
  tabStatus: string;
  isAdmin?: boolean;
  isSeniorEmployee?: boolean;
  getTrackingUrl: (waybill: string) => string;
  forcingWaybill?: string | null;
}

const OrdersTable = ({ orders, loading, onViewOrder, onUpdateStatus, onForceWaybill, tabStatus, isAdmin, isSeniorEmployee, getTrackingUrl, forcingWaybill }: OrdersTableProps) => {
  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (orders.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-muted-foreground">{tabStatus === "all" ? "No orders found" : `No ${tabStatus} orders`}</p>
      </CardContent></Card>
    );
  }

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = { pending: "processing", paid: "processing", processing: "shipped", shipped: "delivered" };
    return flow[current] || null;
  };

  const canForceWaybill = isAdmin || isSeniorEmployee;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Courier / Tracking</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 100).map(order => {
                const addr = order.shipping_address as any;
                const nextStatus = getNextStatus(order.status);
                const hasShipmentError = !!order.shipment_creation_error && !order.courier_waybill;
                return (
                  <TableRow key={order.id} className={hasShipmentError ? "bg-red-500/5" : ""}>
                    <TableCell className="font-mono text-xs font-medium">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{format(new Date(order.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{addr?.fullName || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{addr?.email || ""}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[order.status]?.color || "bg-muted"}>
                        {statusConfig[order.status]?.label || order.status}
                      </Badge>
                      {hasShipmentError && (
                        <div className="mt-1">
                          <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] font-semibold">
                            <AlertTriangle className="h-3 w-3 mr-1" /> WAYBILL ERROR
                          </Badge>
                          <p className="text-[10px] text-red-600 mt-0.5 max-w-[160px] truncate" title={order.shipment_creation_error || ""}>
                            {order.shipment_creation_error}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>{order.courier || "-"}</p>
                      {order.courier_waybill && (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs font-mono">{order.courier_waybill}</p>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`/track-parcel?waybill=${encodeURIComponent(order.courier_waybill)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              Helper <ExternalLink className="h-3 w-3" />
                            </a>
                            <a
                              href={getTrackingUrl(order.courier_waybill)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              Courier <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}
                      {hasShipmentError && canForceWaybill && onForceWaybill && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="mt-1 text-xs h-7"
                          disabled={forcingWaybill === order.id}
                          onClick={() => onForceWaybill(order.id)}
                        >
                          {forcingWaybill === order.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                          Force Create Waybill
                        </Button>
                      )}
                      {!order.courier_waybill && !hasShipmentError && order.courier && order.courier.toLowerCase() !== 'pickup' && canForceWaybill && onForceWaybill && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1 text-xs h-7"
                          disabled={forcingWaybill === order.id}
                          onClick={() => onForceWaybill(order.id)}
                        >
                          {forcingWaybill === order.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                          Create Waybill
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">R{order.total?.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {onViewOrder && (
                          <Button size="sm" variant="ghost" onClick={() => onViewOrder(order)} title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {nextStatus && (
                          <Button size="sm" variant="outline" className="text-xs h-8"
                            onClick={() => onUpdateStatus(order.id, nextStatus, order.status)}
                            title={`Move to ${statusConfig[nextStatus]?.label}`}>
                            → {statusConfig[nextStatus]?.label}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDashboard;
