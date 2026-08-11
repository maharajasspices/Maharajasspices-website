import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineItem {
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price_incl: number;
  unit_price_excl: number;
  unit_vat: number;
  line_total_incl: number;
  line_total_excl: number;
  line_vat: number;
  is_zero_rated?: boolean;
}

interface Invoice {
  id: string;
  order_id: string;
  user_id: string | null;
  invoice_number: string;
  invoice_date: string;
  seller_name: string;
  seller_address: string;
  seller_vat_number: string;
  seller_phone: string;
  seller_email: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: any;
  line_items: LineItem[];
  subtotal_excl_vat: number;
  total_vat: number;
  total_incl_vat: number;
  vat_rate: number;
  payment_reference: string | null;
}

// Company logo URL (uploaded brand icon)
const COMPANY_LOGO_URL = "https://www.maharajasspices.co.za/invoice-logo.png";

// Format currency for display
function formatCurrency(amount: number): string {
  return `R ${amount.toFixed(2)}`;
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Generate SARS-compliant tax invoice PDF as HTML
function generateInvoiceHtml(invoice: Invoice): string {
  const address = invoice.customer_address || {};
  const customerAddressLines = [
    address.streetAddress || address.address || '',
    address.suburb || '',
    `${address.city || ''} ${address.province || ''}`.trim(),
    address.postalCode || '',
  ].filter(line => line.trim());

  // Calculate totals for zero-rated and standard items
  const hasZeroRatedItems = invoice.line_items.some(item => item.is_zero_rated || item.name.includes('Zero-Rated'));
  
  const lineItemsHtml = invoice.line_items.map((item, index) => {
    const isZeroRated = item.is_zero_rated || item.name.includes('Zero-Rated');
    return `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; text-align: left;">${index + 1}</td>
      <td style="padding: 12px 8px; text-align: left;">
        ${escapeHtml(item.name)}
        ${isZeroRated ? '<span style="font-size: 10px; color: #059669; margin-left: 4px;">(0%)</span>' : ''}
      </td>
      <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right;">${formatCurrency(item.unit_price_excl)}</td>
      <td style="padding: 12px 8px; text-align: right;">${isZeroRated ? 'R 0.00' : formatCurrency(item.line_vat)}</td>
      <td style="padding: 12px 8px; text-align: right; font-weight: 500;">${formatCurrency(item.line_total_incl)}</td>
    </tr>
  `}).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice ${invoice.invoice_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      background: #fff;
      padding: 40px;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #b91c1c;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-section .logo-img {
      width: 52px;
      height: 52px;
      object-fit: contain;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 4px;
      display: block;
    }
    
    .logo-section .company-text h1 {
      font-size: 24px;
      font-weight: 700;
      color: #b91c1c;
      margin-bottom: 2px;
    }
    
    .logo-section .company-text p {
      color: #6b7280;
      font-size: 12px;
    }
    
    .tax-invoice-badge {
      background: #b91c1c;
      color: #fff;
      padding: 8px 24px;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .info-box {
      flex: 1;
    }
    
    .info-box h3 {
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .info-box p {
      margin-bottom: 4px;
    }
    
    .info-box .highlight {
      font-weight: 600;
      color: #111827;
    }
    
    .invoice-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .invoice-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    
    .detail-item label {
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
      display: block;
      margin-bottom: 4px;
    }
    
    .detail-item span {
      font-weight: 600;
      font-size: 16px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    thead {
      background: #f3f4f6;
    }
    
    thead th {
      padding: 12px 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    
    thead th:nth-child(3),
    thead th:nth-child(4),
    thead th:nth-child(5),
    thead th:nth-child(6) {
      text-align: right;
    }
    
    thead th:nth-child(3) {
      text-align: center;
    }
    
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    
    .totals-box {
      width: 300px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .total-row.grand-total {
      background: #b91c1c;
      color: #fff;
      margin-top: 8px;
      padding: 12px 16px;
      font-size: 18px;
      font-weight: 700;
      border: none;
    }
    
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    .footer p {
      margin-bottom: 4px;
    }
    
    .vat-note {
      background: #f0fdf4;
      border: 1px solid #22c55e;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #166534;
    }
    
    .zero-rated-note {
      background: #ecfdf5;
      border: 1px solid #10b981;
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 11px;
      color: #065f46;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .invoice-container {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo-section">
        <img src="${COMPANY_LOGO_URL}" alt="Maharaja's Spices logo" class="logo-img" />
        <div class="company-text">
          <h1>Maharaja's Spices</h1>
          <p>Premium Quality Spices & Seasonings</p>
        </div>
      </div>
      <div class="tax-invoice-badge">TAX INVOICE</div>
    </div>
    
    <div class="info-section">
      <div class="info-box">
        <h3>Seller Details</h3>
        <p class="highlight">${escapeHtml(invoice.seller_name)}</p>
        <p>${escapeHtml(invoice.seller_address)}</p>
        <p>Tel: ${escapeHtml(invoice.seller_phone || '')}</p>
        <p>Email: ${escapeHtml(invoice.seller_email || '')}</p>
        <p style="margin-top: 8px; font-weight: 600;">VAT No: ${escapeHtml(invoice.seller_vat_number)}</p>
      </div>
      <div class="info-box">
        <h3>Bill To</h3>
        <p class="highlight">${escapeHtml(invoice.customer_name)}</p>
        ${customerAddressLines.map(line => `<p>${escapeHtml(line)}</p>`).join('')}
        ${invoice.customer_phone ? `<p>Tel: ${escapeHtml(invoice.customer_phone)}</p>` : ''}
        ${invoice.customer_email ? `<p>Email: ${escapeHtml(invoice.customer_email)}</p>` : ''}
      </div>
    </div>
    
    <div class="invoice-details">
      <div class="invoice-details-grid">
        <div class="detail-item">
          <label>Invoice Number</label>
          <span>${escapeHtml(invoice.invoice_number)}</span>
        </div>
        <div class="detail-item">
          <label>Invoice Date</label>
          <span>${formatDate(invoice.invoice_date)}</span>
        </div>
        <div class="detail-item">
          <label>Payment Reference</label>
          <span>${escapeHtml(invoice.payment_reference || 'N/A')}</span>
        </div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Description</th>
          <th style="width: 60px;">Qty</th>
          <th style="width: 100px;">Unit Price (Excl)</th>
          <th style="width: 80px;">VAT</th>
          <th style="width: 100px;">Total (Incl)</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>
    
    ${hasZeroRatedItems ? `
    <div class="zero-rated-note">
      <strong>Zero-Rated Items:</strong> Items marked with (0%) are zero-rated for VAT purposes per South African Revenue Service (SARS) regulations.
    </div>
    ` : ''}
    
    <div class="vat-note">
      <strong>VAT Note:</strong> Standard VAT rate is ${invoice.vat_rate}%. VAT is calculated per line item and rounded to 2 decimal places. Shipping charges include VAT where applicable.
    </div>
    
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal (Excl. VAT)</span>
          <span>${formatCurrency(invoice.subtotal_excl_vat)}</span>
        </div>
        <div class="total-row">
          <span>VAT @ ${invoice.vat_rate}%</span>
          <span>${formatCurrency(invoice.total_vat)}</span>
        </div>
        <div class="total-row grand-total">
          <span>Total (Incl. VAT)</span>
          <span>${formatCurrency(invoice.total_incl_vat)}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Thank you for your business!</strong></p>
      <p>${escapeHtml(invoice.seller_name)} | VAT Registration: ${escapeHtml(invoice.seller_vat_number)}</p>
      <p>This is a valid tax invoice for VAT purposes.</p>
    </div>
  </div>
</body>
</html>`;
}

// Escape HTML to prevent XSS
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get authorization header to verify user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to check authorization
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { orderId, invoiceId } = await req.json();
    
    if (!orderId && !invoiceId) {
      return new Response(
        JSON.stringify({ error: "Order ID or Invoice ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to fetch invoice (bypasses RLS for admin check)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabaseAdmin.from("invoices").select("*");
    if (invoiceId) {
      query = query.eq("id", invoiceId);
    } else {
      query = query.eq("order_id", orderId);
    }

    const { data: invoice, error: invoiceError } = await query.single();

    if (invoiceError || !invoice) {
      console.error("Invoice fetch error:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security check: User must be order owner or admin/employee
    const isOwner = invoice.user_id === user.id;
    
    // Check if user is admin or employee
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const isAdminOrEmployee = roles?.some(r => r.role === 'admin' || r.role === 'employee');

    if (!isOwner && !isAdminOrEmployee) {
      console.error(`Unauthorized access attempt: user ${user.id} tried to access invoice for user ${invoice.user_id}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized access to invoice" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate HTML invoice
    const htmlContent = generateInvoiceHtml(invoice as Invoice);

    // Return HTML that can be printed/saved as PDF by browser
    return new Response(htmlContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoice_number}.html"`,
      },
    });

  } catch (error: any) {
    console.error("Generate invoice PDF error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate invoice", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
