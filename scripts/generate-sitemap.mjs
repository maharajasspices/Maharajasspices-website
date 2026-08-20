/**
 * Sitemap generation script
 * Run after building the site to generate sitemap.xml with dynamic product URLs
 * 
 * Usage: node scripts/generate-sitemap.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const today = new Date().toISOString().split('T')[0];

// Static pages with priority and changefreq
const staticPages = [
  { loc: 'https://maharajasspices.co.za/', changefreq: 'weekly', priority: 1.0 },
  { loc: 'https://maharajasspices.co.za/shop', changefreq: 'daily', priority: 0.9 },
  { loc: 'https://maharajasspices.co.za/shop?category=spices', changefreq: 'daily', priority: 0.85 },
  { loc: 'https://maharajasspices.co.za/shop?category=condiments', changefreq: 'daily', priority: 0.85 },
  { loc: 'https://maharajasspices.co.za/shop?category=marinades-sauces', changefreq: 'daily', priority: 0.85 },
  { loc: 'https://maharajasspices.co.za/shop?category=pastes-rubs', changefreq: 'daily', priority: 0.85 },
  { loc: 'https://maharajasspices.co.za/shop?category=grains', changefreq: 'daily', priority: 0.85 },
  { loc: 'https://maharajasspices.co.za/shop?category=whole-spices', changefreq: 'daily', priority: 0.85 },
  { loc: 'https://maharajasspices.co.za/shop?category=gifting', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/shop?category=baking', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/shop?brand=Maharaja%27s+Spices', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/shop?brand=G-Force', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/shop?brand=Mother%27s+Hand', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/shop?brand=Curry+in+a+Hurry', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/shop?brand=HomeMade', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/recipes', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/about', changefreq: 'monthly', priority: 0.8 },
  { loc: 'https://maharajasspices.co.za/contact', changefreq: 'monthly', priority: 0.7 },
  { loc: 'https://maharajasspices.co.za/store-locator', changefreq: 'monthly', priority: 0.7 },
  { loc: 'https://maharajasspices.co.za/become-stockist', changefreq: 'monthly', priority: 0.7 },
  { loc: 'https://maharajasspices.co.za/track-order', changefreq: 'monthly', priority: 0.6 },
  { loc: 'https://maharajasspices.co.za/careers', changefreq: 'monthly', priority: 0.6 },
  { loc: 'https://maharajasspices.co.za/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://maharajasspices.co.za/terms', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://maharajasspices.co.za/shipping-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://maharajasspices.co.za/refund-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://maharajasspices.co.za/popia-compliance', changefreq: 'yearly', priority: 0.3 },
];

async function generateSitemap() {
  console.log('Fetching products from Supabase...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, updated_at, category, brand')
    .eq('in_stock', true);

  if (error) {
    console.error('Error fetching products:', error.message);
    process.exit(1);
  }

  console.log(`Found ${products?.length || 0} products`);

  // Generate recipe URLs from the Recipes page data
  // These are the default recipes that exist in the codebase
  const recipePages = [
    'beef-curry',
    'mothers-hand-butter-chicken',
    'chicken-curry',
    'durban-style-beans-curry',
    'mothers-hand-durbz-breyani',
    'mothers-hand-mutton-curry',
    'mothers-hand-spicy-livers-gizzards',
    'roasted-vegetables',
    'stew',
    'maharajas-savoury-south-african-style-chicken-stew',
    'maharajas-marry-me-chicken',
    'maharajas-crunch-coat-chicken-strips',
    'maharajas-royal-chakalaka-pot-stew',
    'maharajas-crown-jewel-hearty-beef-stew',
    'maharajas-fantastical-family-chicken-stew',
    'maharajas-palace-style-slow-cooked-oxtail-stew',
    'maharajas-rich-regal-beef-and-onion-stew',
  ];

  // Build XML content
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `  <url>\n    <loc>${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  });

  // Add recipe pages
  recipePages.forEach(slug => {
    xml += `  <url>\n    <loc>https://maharajasspices.co.za/recipe/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  // Add product pages
  products?.forEach(product => {
    const lastmod = product.updated_at 
      ? new Date(product.updated_at).toISOString().split('T')[0] 
      : today;
    xml += `  <url>\n    <loc>https://maharajasspices.co.za/product/${product.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;

  // Write to public directory
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const outputPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf-8');
  console.log(`✅ Sitemap generated at ${outputPath}`);
  console.log(`   Total URLs: ${staticPages.length + recipePages.length + (products?.length || 0)}`);
}

generateSitemap().catch(err => {
  console.error('Failed to generate sitemap:', err);
  process.exit(1);
});