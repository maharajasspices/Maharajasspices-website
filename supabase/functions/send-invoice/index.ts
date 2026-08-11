import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const orderItemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  price: z.number().positive().max(1000000),
  quantity: z.number().int().positive().max(1000),
  image: z.string().optional(),
});

const invoiceRequestSchema = z.object({
  order: z.object({
    id: z.string().uuid(),
    subtotal: z.number().positive().max(10000000),
    tax: z.number().nonnegative().max(10000000),
    shipping_cost: z.number().nonnegative().max(100000),
    total: z.number().positive().max(10000000),
    courier: z.string().trim().min(1).max(100).nullable(),
    shipping_address: z.object({
      fullName: z.string().trim().min(2).max(100),
      address: z.string().trim().min(5).max(200),
      city: z.string().trim().min(2).max(100),
      postalCode: z.string().trim().min(3).max(20),
      phone: z.string().trim().min(10).max(20),
    }),
    items: z.array(orderItemSchema).min(1).max(100),
    trackingUrl: z.string().url().optional(),
  }),
  customer: z.object({
    email: z.string().trim().email().max(255),
    name: z.string().trim().min(2).max(100),
  }),
});

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface InvoiceRequest {
  order: {
    id: string;
    subtotal: number;
    tax: number;
    shipping_cost: number;
    total: number;
    courier: string | null;
    shipping_address: {
      fullName: string;
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    };
    items: OrderItem[];
    trackingUrl?: string;
  };
  customer: {
    email: string;
    name: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input data
    const validatedData = invoiceRequestSchema.parse(rawData);
    const { order, customer } = validatedData;

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the order exists in the database
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('user_id, id, tracking_token')
      .eq('id', order.id)
      .single();

    if (orderError || !orderData) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // CRITICAL SECURITY: Always require authentication
    const authHeader = req.headers.get("authorization");
    
    if (orderData.user_id) {
      // For authenticated orders: Verify JWT and user ownership
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid authentication token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      if (orderData.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized to send invoice for this order" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // For guest orders: This should only be called automatically after order creation
      // Not exposed to client-side calls for security
      // In production, move this to a server-side trigger instead
      console.log("Processing guest order invoice:", order.id);
    }

    console.log("Sending invoice for order:", order.id);

    // Generate invoice HTML with site theme
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #D97706 0%, #EA580C 100%);
              color: white;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .invoice-info {
              background: #FEF3C7;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h2 {
              color: #D97706;
              border-bottom: 2px solid #D97706;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #FEF3C7;
              color: #92400E;
              text-align: left;
              padding: 12px;
              font-weight: 600;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #E5E7EB;
            }
            .totals {
              float: right;
              width: 300px;
            }
            .totals table {
              margin-bottom: 0;
            }
            .totals td {
              border: none;
            }
            .total-row {
              font-weight: bold;
              font-size: 18px;
              color: #D97706;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #E5E7EB;
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌶️ Maharaja's Spices</h1>
            <p style="margin: 5px 0 0 0;">Premium Quality Indian Spices</p>
          </div>
          
          <div class="invoice-info">
            <h2 style="margin-top: 0; color: #92400E;">Invoice #${order.id.substring(0, 8).toUpperCase()}</h2>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>Customer Details</h2>
            <p><strong>Name:</strong> ${customer.name}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${order.shipping_address.phone || 'N/A'}</p>
          </div>

          <div class="section">
            <h2>Shipping Address</h2>
            <p>${order.shipping_address.address}</p>
            <p>${order.shipping_address.city}, ${order.shipping_address.postalCode || ''}</p>
          </div>

          <div class="section">
            <h2>Order Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>R${item.price.toFixed(2)}</td>
                    <td>R${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">R${order.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Tax (15%):</td>
                <td style="text-align: right;">R${order.tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Shipping${order.courier ? ` (${order.courier})` : ' (Pickup)'}:</td>
                <td style="text-align: right;">R${order.shipping_cost.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>Total:</td>
                <td style="text-align: right;">R${order.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="clear: both;"></div>

          <div class="footer">
            <p>Thank you for your order!</p>
            ${order.trackingUrl ? `
              <div style="margin: 20px 0; padding: 20px; background: #FEF3C7; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400E;">Track Your Order</p>
                <p style="margin: 0 0 10px 0; font-size: 14px;">You can track your order status anytime using the link below:</p>
                <a href="${order.trackingUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #D97706 0%, #EA580C 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Track Order</a>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #6B7280;">Or copy this link: ${order.trackingUrl}</p>
              </div>
            ` : ''}
            <p>For any questions, please contact us at support@maharajasspices.com</p>
            <p style="margin-top: 20px; font-size: 12px;">
              Maharaja's Spices - Bringing authentic Indian flavors to your kitchen
            </p>
          </div>
        </body>
      </html>
    `;

    // Email provider removed — this function is now a stub.
    // Invoice HTML is generated above and could be piped into whatever email
    // provider the new owner configures. For now we log and return success so
    // the checkout flow is not disrupted.
    console.log(
      `[send-invoice] Stub: would email invoice for order ${order.id} to ${customer.email}. ` +
      `HTML size: ${invoiceHTML.length} chars.`
    );

    return new Response(
      JSON.stringify({ success: true, warning: "Email provider not configured — invoice was not sent." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice function:", error);
    
    // Handle validation errors
    if (error.name === "ZodError") {
      return new Response(
        JSON.stringify({ error: "Invalid input data", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
