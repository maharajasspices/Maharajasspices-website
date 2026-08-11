import { Product } from "@/components/ProductCard";

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Lemon & Herb Seasoning Condiment 50g",
    brand: "Maharajas Spices",
    price: 29.99,
    originalPrice: 35.99,
    image: "/src/assets/products.jpg",
    category: "Condiments",
    inStock: true,
  },
  {
    id: "2",
    name: "Ginger Powder Condiment 50g",
    brand: "Maharajas Spices",
    price: 29.99,
    image: "/src/assets/marinades-sauces.jpg",
    category: "Condiments",
    inStock: true,
  },
  {
    id: "3",
    name: "Turmeric Powder 100g",
    brand: "Maharajas Spices",
    price: 45.99,
    originalPrice: 52.99,
    image: "/src/assets/hero-spices.jpg",
    category: "Spices",
    inStock: true,
  },
  {
    id: "4",
    name: "Curry Powder Blend 200g",
    brand: "Maharajas Spices",
    price: 79.99,
    image: "/src/assets/hero-spices.jpg",
    category: "Condiments",
    inStock: true,
  },
  {
    id: "5",
    name: "BBQ Marinade Sauce 500ml",
    brand: "Maharajas Spices",
    price: 89.99,
    originalPrice: 99.99,
    image: "/src/assets/marinades-sauces.jpg",
    category: "Marinades",
    inStock: true,
  },
  {
    id: "6",
    name: "Basmati Rice 1kg",
    brand: "Maharajas Spices",
    price: 149.99,
    image: "/src/assets/grains.jpg",
    category: "Grains",
    inStock: true,
  },
  {
    id: "7",
    name: "Chilli Paste 250g",
    brand: "Mother's Hand",
    price: 65.99,
    image: "/src/assets/products.jpg",
    category: "Pastes & Rubs",
    inStock: true,
  },
  {
    id: "8",
    name: "Garlic & Herb Sauce 350ml",
    brand: "Homemade",
    price: 75.99,
    originalPrice: 85.99,
    image: "/src/assets/marinades-sauces.jpg",
    category: "Sauces",
    inStock: true,
  },
];

export const categories = [
  "All Products",
  "Baking",
  "Condiments",
  "Cooking Sauce",
  "Gifting",
  "Grains",
  "Marinades",
  "Pastes & Rubs",
  "Sauces",
  "Spices",
  "Whole Spices",
  "Virtual Spice Bar",
];

// Map brands to their primary categories
export const brandCategories: Record<string, string> = {
  "G-Force": "Sauces",
  "Maharaja's Spices": "Spices",
  "Mother's Hand": "Pastes & Rubs",
  "Curry in a Hurry": "Spices",
  "Homemade": "Spices",
};

export const brands = [
  { name: "Maharaja's Spices", logo: "/placeholder.svg" },
  { name: "G-Force", logo: "/placeholder.svg" },
  { name: "Curry in a Hurry", logo: "/placeholder.svg" },
  { name: "Mother's Hand", logo: "/placeholder.svg" },
  { name: "Homemade", logo: "/placeholder.svg" },
];
