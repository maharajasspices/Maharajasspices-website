// Import all product images
import productsImg from "@/assets/products.jpg";
import marinadesImg from "@/assets/marinades-sauces.jpg";
import heroSpicesImg from "@/assets/hero-spices.jpg";
import grainsImg from "@/assets/grains.jpg";
import logoOfficial from "@/assets/logo-official.webp";
import logo from "@/assets/logo.png";

// Import brand logos - WebP format for better performance
import brandCurryInHurry from "@/assets/brand-curry-in-a-hurry.webp";
import brandGforce from "@/assets/brand-gforce.webp";
import brandMothersHand from "@/assets/brand-mothers-hand.webp";
import brandHomemade from "@/assets/brand-homemade-v2.webp";
import brandMaharajas from "@/assets/brand-maharajas-v2.webp";

// Import payment logo - WebP format for better performance
import payfastLogo from "@/assets/payfast-logo.webp";
import newsletterLogo from "@/assets/newsletter-logo.webp";

// Import recipe images
import recipeChickenCurry from "@/assets/recipe-chicken-curry.jpg";
import recipeBiryani from "@/assets/recipe-biryani.jpg";
import recipeTandooriVeg from "@/assets/recipe-tandoori-vegetables.jpg";
import recipeButterChicken from "@/assets/recipe-butter-chicken.jpg";
import recipeLentilSoup from "@/assets/recipe-lentil-soup.jpg";
import recipeMasalaFish from "@/assets/recipe-masala-fish.jpg";

// Map database image paths to imported images
export const imageMap: Record<string, string> = {
  "/src/assets/products.jpg": productsImg,
  "/src/assets/marinades-sauces.jpg": marinadesImg,
  "/src/assets/hero-spices.jpg": heroSpicesImg,
  "/src/assets/grains.jpg": grainsImg,
  "/src/assets/logo-official.webp": logoOfficial,
  "/src/assets/logo-official.png": logoOfficial,
  "/src/assets/logo.png": logo,
  "recipe-chicken-curry.jpg": recipeChickenCurry,
  "recipe-biryani.jpg": recipeBiryani,
  "recipe-tandoori-vegetables.jpg": recipeTandooriVeg,
  "recipe-butter-chicken.jpg": recipeButterChicken,
  "recipe-lentil-soup.jpg": recipeLentilSoup,
  "recipe-masala-fish.jpg": recipeMasalaFish,
};

// Export recipe images for direct use
export const recipeImages = {
  chickenCurry: recipeChickenCurry,
  biryani: recipeBiryani,
  tandooriVeg: recipeTandooriVeg,
  butterChicken: recipeButterChicken,
  lentilSoup: recipeLentilSoup,
  masalaFish: recipeMasalaFish,
};

// Export brand logos with brand names matching database
export const brandLogos: Record<string, string> = {
  "Curry in a Hurry": brandCurryInHurry,
  "G-Force": brandGforce,
  "Mother's Hand": brandMothersHand,
  "Homemade": brandHomemade,
  "Maharaja's Spices": brandMaharajas,
};

// Export payment logo
export { payfastLogo, newsletterLogo };

// Utility function to get the correct image URL
export const getImageUrl = (path: string | undefined): string => {
  if (!path) return productsImg; // Default fallback
  
  // If it's already a full URL (starts with http), return it directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Otherwise, check the imageMap for legacy paths
  return imageMap[path] || productsImg;
};
