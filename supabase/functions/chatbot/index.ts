// Rule-based FAQ + product-search chatbot.
// No external AI provider. Runs entirely on the Supabase database.
// Response shape kept compatible with the previous Groq endpoint so
// the existing ChatbotWidget continues to work unchanged.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOTLINE = '068 405 1374';
const WHATSAPP = 'https://wa.me/27684051374';

// Pre-baked FAQ entries. Each entry has trigger keywords and an answer.
const FAQS: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['shipping', 'delivery', 'courier', 'how long', 'ship'],
    answer: `We ship nationwide across South Africa via **The Courier Guy**. Standard delivery is typically 2–5 business days after payment is confirmed. You can see full details on our /shipping-policy page.`,
  },
  {
    keywords: ['return', 'refund', 'exchange'],
    answer: `Our full return and refund terms are on the /refund-policy page. If you received a damaged or incorrect item, message us on WhatsApp (${HOTLINE}) with a photo and your order number and we'll sort it out.`,
  },
  {
    keywords: ['track', 'tracking', 'where is my order', 'waybill'],
    answer: `You can track your parcel on our /track-order page using your waybill number, or on The Courier Guy's site directly.`,
  },
  {
    keywords: ['contact', 'phone', 'call', 'whatsapp', 'number', 'reach'],
    answer: `You can reach us on **${HOTLINE}** (call or WhatsApp: ${WHATSAPP}) or via the /contact page.`,
  },
  {
    keywords: ['store', 'shop', 'address', 'location', 'where are you', 'physical'],
    answer: `Head office: **29 Aberdare Drive, Phoenix Industrial Park, Durban**. For retail partners near you, check our /store-locator page.`,
  },
  {
    keywords: ['stockist', 'wholesale', 'bulk', 'retail partner', 'reseller'],
    answer: `Interested in stocking our products? Apply on the /become-stockist page and our team will get back to you.`,
  },
  {
    keywords: ['recipe', 'cook', 'how to make', 'curry', 'biryani'],
    answer: `We have a full recipe collection on /recipes — curries, biryanis, dhalls and more. Each recipe links directly to the spices you'll need.`,
  },
  {
    keywords: ['about', 'who are you', 'your story', 'family'],
    answer: `Maharaja's Spices is a family-owned South African spice company based in Durban. Full story on /about.`,
  },
  {
    keywords: ['payment', 'pay', 'payfast', 'card', 'eft'],
    answer: `We accept card and EFT payments securely through PayFast at checkout.`,
  },
  {
    keywords: ['account', 'sign up', 'register', 'login', 'log in'],
    answer: `Create an account or sign in from /auth to save addresses, view order history and earn credits.`,
  },
  {
    keywords: ['credit', 'wallet', 'm-wallet', 'voucher'],
    answer: `Your credit balance and any vouchers are on your /account page. Vouchers apply automatically at checkout when the minimum subtotal is met.`,
  },
  {
    keywords: ['hours', 'open', 'business hours', 'trading'],
    answer: `Our online shop is open 24/7. Head office phone lines run Monday–Friday, 8am–4:30pm SAST. Message us anytime on WhatsApp (${HOTLINE}).`,
  },
  {
    keywords: ['halaal', 'halal', 'kosher', 'vegan', 'vegetarian', 'gluten'],
    answer: `Most of our spices are naturally vegetarian and vegan-friendly. For specific certifications or allergen queries, please contact us on ${HOTLINE} so we can point you to the right batch info.`,
  },
];

const GREETINGS = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howzit', 'yo'];
const THANKS = ['thanks', 'thank you', 'thx', 'ty', 'appreciate'];

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length >= 2);
}

const STOP = new Set([
  'the','and','for','with','this','that','from','have','has','are','was','were','you','your',
  'what','which','when','where','how','can','could','would','should','please','want','need',
  'best','top','products','product','get','give','tell','know','any','all','some','about',
  'looking','look','find','show','buy','order','list','recommend','me','my','our','i','a','an','of','to','in','on','is','it','do','does','has'
]);

function extractKeywords(text: string): string[] {
  return Array.from(new Set(tokenize(text).filter(w => !STOP.has(w))));
}

function matchesAny(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some(p => lower.includes(p));
}

function findFaq(text: string): string | null {
  const lower = text.toLowerCase();
  let best: { score: number; answer: string } | null = null;
  for (const faq of FAQS) {
    const score = faq.keywords.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: faq.answer };
    }
  }
  return best?.answer ?? null;
}

async function searchProducts(supabase: any, keywords: string[]) {
  if (keywords.length === 0) return [];
  const orFilter = keywords
    .slice(0, 6)
    .flatMap(k => [
      `name.ilike.%${k}%`,
      `brand.ilike.%${k}%`,
      `category.ilike.%${k}%`,
      `description.ilike.%${k}%`,
    ])
    .join(',');

  const { data } = await supabase
    .from('products')
    .select('id, name, brand, category, price, original_price, in_stock')
    .eq('in_stock', true)
    .or(orFilter)
    .limit(8);

  return data || [];
}

function formatProducts(products: any[]): string {
  if (!products.length) return '';
  const lines = products.map((p: any) => {
    const onSale = p.original_price && p.original_price > p.price;
    const priceStr = onSale
      ? `R${Number(p.price).toFixed(2)} (was R${Number(p.original_price).toFixed(2)})`
      : `R${Number(p.price).toFixed(2)}`;
    return `• ${p.name} — ${p.brand} — ${priceStr}${onSale ? ' 🔥 SALE' : ''}`;
  });
  return `Here's what I found:\n${lines.join('\n')}\n\nBrowse the full range on /shop.`;
}

async function popularProducts(supabase: any): Promise<string> {
  try {
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('items')
      .in('status', ['processing', 'paid', 'shipped', 'delivered', 'completed'])
      .order('created_at', { ascending: false })
      .limit(200);

    if (!recentOrders?.length) return '';

    const counts: Record<string, number> = {};
    for (const o of recentOrders) {
      for (const it of (o.items as any[]) || []) {
        const name = (it?.name || '').toString().trim();
        if (!name) continue;
        counts[name] = (counts[name] || 0) + Number(it?.quantity || 1);
      }
    }
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    if (!top.length) return '';
    return `Our current best-sellers:\n${top.map(([n, q]) => `• ${n} (${q} sold recently)`).join('\n')}\n\nSee all on /shop.`;
  } catch {
    return '';
  }
}

function buildReply(text: string): string | null {
  const lower = text.toLowerCase().trim();

  if (matchesAny(lower, THANKS)) {
    return `You're most welcome! 🌶️ Anything else I can help with?`;
  }

  // Short pure greeting
  if (lower.length <= 20 && matchesAny(lower, GREETINGS)) {
    return `Hi there! 👋 I can help you find products, check shipping info, share recipes or answer questions about Maharaja's Spices. What are you looking for?`;
  }

  return findFaq(text);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? '';
    const userText = (lastUserMessage || '').toString().slice(0, 1000);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const parts: string[] = [];

    // Popularity intent
    if (/(popular|best[- ]?seller|top\s*(selling|10)?|trending|favourite|favorite)/i.test(userText)) {
      const pop = await popularProducts(supabase);
      if (pop) parts.push(pop);
    }

    // FAQ / greetings
    const faq = buildReply(userText);
    if (faq) parts.push(faq);

    // Product search
    const keywords = extractKeywords(userText);
    if (keywords.length) {
      const products = await searchProducts(supabase, keywords);
      const productReply = formatProducts(products);
      if (productReply) parts.push(productReply);
    }

    let content: string;
    if (parts.length) {
      content = parts.join('\n\n');
    } else {
      content = `I'm not sure I caught that. I can help with:\n• Finding products (try "curry powder" or "masala")\n• Shipping & delivery info\n• Recipes\n• Store locations\n• Order tracking\n\nOr call/WhatsApp us directly on ${HOTLINE}.`;
    }

    return new Response(
      JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('chatbot (rule-based) error:', error);
    return new Response(
      JSON.stringify({
        choices: [{
          message: {
            role: 'assistant',
            content: `Sorry, something went wrong on my end. Please try again, or contact us on ${HOTLINE}.`,
          },
        }],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
