import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, X, Maximize2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { RecipeIngredientLink } from "@/components/RecipeIngredientLink";

// Import recipe images for fallback
import beefCurryImg from "@/assets/recipe-beef-curry.webp";
import butterChickenImg from "@/assets/recipe-butter-chicken-new.webp";
import chickenCurryImg from "@/assets/recipe-chicken-curry-new.webp";
import beansCurryImg from "@/assets/recipe-beans-curry.webp";
import breyaniImg from "@/assets/recipe-breyani.webp";
import muttonCurryImg from "@/assets/recipe-mutton-curry.webp";
import liversGizzardsImg from "@/assets/recipe-livers-gizzards.webp";
import roastedVegetablesImg from "@/assets/recipe-roasted-vegetables.webp";
import stewImg from "@/assets/recipe-stew.webp";
import saChickenStewImg from "@/assets/recipe-sa-chicken-stew.webp";
import marryMeChickenImg from "@/assets/recipe-marry-me-chicken.webp";
import crunchCoatChickenImg from "@/assets/recipe-crunch-coat-chicken.webp";
import saChickenStewV2Img from "@/assets/recipe-sa-style-chicken-stew-v2.webp";
import royalChalakaImg from "@/assets/recipe-royal-chakalaka-pot-stew.webp";
import crownJewelBeefImg from "@/assets/recipe-crown-jewel-beef-stew.webp";
import familyChickenStewImg from "@/assets/recipe-family-chicken-stew.webp";
import palaceOxtailImg from "@/assets/recipe-palace-oxtail-stew.webp";
import richRegalBeefImg from "@/assets/recipe-rich-regal-beef-onion-stew.webp";

interface Recipe {
  id?: string;
  title: string;
  description: string;
  image: string;
  category: string;
  time: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
}

// Default recipes as fallback
const defaultRecipesData: Recipe[] = [
  {
    title: "Beef Curry",
    description:
      "Rich and aromatic beef curry with tender meat and flavorful spices, perfect served with rice or roti.",
    image: beefCurryImg,
    category: "Main Course",
    time: 90,
    servings: 6,
    ingredients: [
      "1kg beef pieces",
      "50g Maharaja's Supreme Mix Curry Powder",
      "50ml oil",
      "1 medium onion, finely sliced",
      "1 tomato, finely chopped",
      "1 medium potato, cubed",
      "Salt, to taste",
      "2 whole star anise",
      "1 cinnamon stick",
      "20g Maharaja's crushed ginger & garlic",
      "Fresh coriander, for garnish",
    ],
    instructions: [
      "Heat oil in a pot on medium heat. Add the cinnamon sticks, bay leaves, star anise, and cardamom. Sauté until fragrant.",
      "Add the onion and curry leaves. Cook until the onion is soft and golden brown.",
      "Stir in Maharaja's Supreme Mix Curry Powder, grated tomatoes, and Maharaja's Crushed Ginger & Garlic. Cook for approximately 1–2 minutes, stirring regularly to form a paste.",
      "Add the beef, potatoes, and salt to taste. Mix well to blend in all the flavours.",
      "Add water as needed to create consistent gravy. Cover and simmer on low heat until the beef is cooked and the potatoes are tender.",
      "Garnish with fresh coriander and serve hot.",
    ],
  },
  {
    title: "Mother's Hand Butter Chicken",
    description: "Creamy and indulgent butter chicken with rich, velvety sauce that melts in your mouth.",
    image: butterChickenImg,
    category: "Main Course",
    time: 35,
    servings: 6,
    ingredients: [
      "120ml oil",
      "3 tbsp butter",
      "1 large onion, sliced",
      "300ml Mother's Hand Paste - Creamy Butter Chicken",
      "1.2kg chicken fillet, cubed",
      "500ml fresh cream",
    ],
    instructions: [
      "In a pot, heat 120ml oil and 3 tbsp butter together.",
      "Add 1 sliced large onion and braise.",
      "Add in 300ml of Mother's Hand Paste - Creamy Butter Chicken.",
      "Mix and cook for 5 minutes. Mix in 1.2kg cubed chicken fillet.",
      "Add in 500ml fresh cream and allow to simmer on medium heat until gravy is thick and creamy.",
    ],
  },
  {
    title: "Chicken Curry",
    description: "Classic South African chicken curry with authentic spices and a perfect balance of heat and flavor.",
    image: chickenCurryImg,
    category: "Main Course",
    time: 60,
    servings: 6,
    ingredients: [
      "1kg chicken pieces",
      "50g Maharaja's Hot Curry Powder",
      "50ml oil",
      "1 medium onion, sliced",
      "1 medium tomato, grated",
      "10g Maharaja's Crushed Ginger & Garlic",
      "1 spring curry leaves",
      "1 Maharaja's Cinnamon Stick",
      "2 bay leaves",
      "2 Maharaja's Star Aniseed",
      "1 Maharaja's Whole Elachie",
      "Optional: 2 medium potatoes, cubed",
      "Fresh coriander, for garnish",
    ],
    instructions: [
      "Heat oil in a pot on medium heat. Add cinnamon sticks, bay leaves, star anise, and cardamom. Sauté until fragrant.",
      "Add onion and curry leaves. Cook until the onion is soft and golden brown.",
      "Stir in Maharaja's Hot Curry Powder, grated tomatoes, and Maharaja's Crushed Ginger & Garlic. Cook for approximately 1–2 minutes, stirring regularly to form a paste.",
      "Add the chicken, potatoes, and salt to taste. Mix well to blend in all the flavours.",
      "Add water as needed to create consistent gravy. Cover and simmer on low heat until the chicken is cooked and the potatoes are tender.",
      "Garnish with fresh coriander and serve hot.",
    ],
  },
  {
    title: "Durban Style Beans Curry",
    description: "Hearty and wholesome beans curry with aromatic spices, a Durban classic comfort food.",
    image: beansCurryImg,
    category: "Vegetarian",
    time: 40,
    servings: 4,
    ingredients: [
      "30g Maharaja's Mild Curry Powder (or as desired)",
      "500g Maharaja's Sugar Beans",
      "50ml oil",
      "1 medium onion, finely sliced",
      "1 Maharaja's Cinnamon Stick",
      "2 Maharaja's Bay Leaves",
      "1 Maharaja's Star Aniseed",
      "1 spring curry leaves",
      "1 medium tomato, grated",
      "10g Maharaja's Crushed Ginger & Garlic",
      "Optional: 2 medium potatoes, cubed",
      "Salt to taste",
      "Fresh coriander, for garnish",
    ],
    instructions: [
      "Heat oil in a pot on medium heat. Add the cinnamon stick, bay leaves, and star anise. Sauté for approximately 10 seconds until fragrant.",
      "Add the sliced onion and curry leaves. Sauté until the onion turns soft and golden brown.",
      "Add Maharaja's Mild Curry Powder, grated tomatoes and Maharaja's Crushed Ginger & Garlic allowing it to cook into a paste for approximately 1-2 minutes on low to medium heat.",
      "Add the boiled sugar beans and potatoes. Salt to taste, and pour in 125ml of water. Stir to combine.",
      "Simmer on low heat for approximately 10–15 minutes, stirring occasionally. Add more water if needed for the desired consistency.",
      "Garnish with fresh coriander and serve hot with rice, roti, or bread.",
    ],
  },
  {
    title: "Mother's Hand Durbz Breyani",
    description: "Authentic Durban-style breyani with fragrant rice, tender meat, and layers of flavor.",
    image: breyaniImg,
    category: "Main Course",
    time: 180,
    servings: 8,
    ingredients: [
      "1.2kg lamb/chicken/vegetables",
      "250ml sour milk",
      "5 chillies (optional)",
      "125ml oil",
      "1 large onion",
      "25g Maharaja's Breyani Mix Whole",
      "2 medium tomatoes, chopped",
      "700g Rice",
      "3 medium potatoes, fried",
      "Coriander for garnish",
    ],
    instructions: [
      "Marinate 1.2kg lamb, chicken or mixed vegetables.",
      "Add Mother's Hand Paste - Durbz Breyani masala.",
      "Add 250ml of sour milk and 5 chillies (optional). Allow to stand for 2 hours.",
      "In a pot with 125ml of hot oil, braise 1 large sliced onion, 25g of Maharaja's Breyani Mix whole and 2 medium chopped tomatoes.",
      "Add marinated protein/veg, followed by 500ml of water into pot.",
      "Cook until protein/veg of choice is half cooked.",
      "Add 700g partially boiled rice and 120g lentils, stir, then add in approximately 250ml of water.",
      "Cook until grains and protein/veg of choice is soft/tender.",
      "Add in 3 medium fried potatoes (halved) and allow to steam for 20 minutes.",
      "Garnish with fresh coriander.",
    ],
  },
  {
    title: "Mother's Hand Mutton Curry",
    description: "Slow-cooked mutton curry with deep, rich flavors and melt-in-your-mouth tender meat.",
    image: muttonCurryImg,
    category: "Main Course",
    time: 120,
    servings: 6,
    ingredients: [
      "1 large onion",
      "125ml oil",
      "300ml Mother's Hand - Mutton Curry Paste",
      "2 tomatoes",
      "1.2kg mutton/lamb",
    ],
    instructions: [
      "Braise 1 large sliced onion in 125ml heated oil.",
      "Add in 300ml Mother's Hand Paste - Mutton Curry.",
      "Mix and leave to braise for 5 minutes on medium heat.",
      "Add 2 medium finely chopped tomatoes and allow to cook for 5 minutes.",
      "Add in 1.2kg of mutton/lamb pieces and 3 medium potatoes (halved).",
      "Add in 1 cup of water and mix, if gravy is drying out.",
      "Curry is ready to serve once mutton/lamb and potatoes are cooked through.",
    ],
  },
  {
    title: "Mother's Hand Spicy Livers & Gizzards",
    description: "Bold and spicy livers and gizzards in a rich, creamy sauce - a South African favorite.",
    image: liversGizzardsImg,
    category: "Main Course",
    time: 35,
    servings: 6,
    ingredients: [
      "1.2kg cleaned livers/gizzards",
      "1 large onion",
      "300ml Mother's Hand - Spicy Saucy Livers & Gizzards Paste",
      "500ml fresh cream",
    ],
    instructions: [
      "Steam 1.2kg of cleaned livers/gizzards in ¾ cup of water for 12 minutes.",
      "In a pot, braise 1 large, sliced onion in 125ml heated oil.",
      "Add in 300ml of Mother's Hand Paste - Spicy Saucy Livers & Gizzards.",
      "Add the cleaned livers/gizzards.",
      "Cook for approximately 10 minutes.",
      "Add in 500ml fresh cream and allow to simmer on medium heat until gravy is thick and creamy.",
    ],
  },
  {
    title: "Roasted Vegetables",
    description: "Colorful medley of perfectly seasoned roasted vegetables with herbs and aromatic flavors.",
    image: roastedVegetablesImg,
    category: "Side Dish",
    time: 35,
    servings: 4,
    ingredients: [
      "30g Maharaja's Roasting Vegetable Seasoning",
      "15g garlic butter (melted)",
      "30ml oil",
      "500g roasting vegetables of choice",
      "Fresh Maharaja's Thyme for garnish",  
      "Maharaja's Parsley, for garnish",
    ],
    instructions: [
      "Preheat your oven to 180°C (fan-forced).",
      "Wash and cut the vegetables into even-sized chunks.",
      "In a large bowl, toss the vegetables with oil and Maharaja's Roasting Vegetable Seasoning until evenly coated.",
      "Spread the vegetables in a single layer on a parchment-lined baking tray. Drizzle with garlic butter for extra richness.",
      "Roast for 25–30 minutes, turning regularly to reduce risk of burning, until the vegetables are golden and tender.",
      "Garnish with fresh thyme and parsley before serving.",
    ],
  },
  {
    title: "Stew",
    description: "Hearty and warming stew with tender meat and vegetables in a rich, savory broth.",
    image: stewImg,
    category: "Main Course",
    time: 90,
    servings: 6,
    ingredients: [
      "1kg lamb, chicken, or beef pieces",
      "50g Maharaja's Medium Curry Powder",
      "1 medium onion, finely sliced",
      "20g Maharaja's crushed garlic",
      "2 Maharaja's Bay Leaves",
      "50ml oil",
      "½ tomato, grated",
      "250g mixed vegetables",
      "2 potatoes, cubed",
      "5 sprigs Maharaja's Thyme",
      "750ml veg, lamb or beef liquid stock",
      "Salt and Maharaja's crushed black pepper, to taste",
      "Maharaja's Parsley, for garnish",
    ],
    instructions: [
      "Season the meat with Maharaja's Salt and Maharaja's Black Pepper. Set aside.",
      "In a large pot, heat oil on medium heat.",
      "Sauté seasoned meat until brown and set aside.",
      "In the same pot, sauté the onion, bay leaves, and thyme until the onion is soft and lightly brown. Add Maharaja's Crushed Garlic and tomato allowing to cook for approximately 1 minute.",
      "Stir in the Maharaja's Medium Curry Powder, then add the potatoes. Cook for approximately 5 minutes, then pour in the stock.",
      "Return the meat to the pot and add the mixed vegetables. Simmer until everything is tender.",
      "Garnish with parsley and serve.",
    ],
  },
  {
    title: "Maharaja's Savoury South African-Style Chicken Stew",
    description:
      "A hearty and flavourful South African-style chicken stew made with tender bone-in chicken, vegetables, and a blend of Maharaja's aromatic spices.",
    image: saChickenStewImg,
    category: "Main Course",
    time: 60,
    servings: 6,
    ingredients: [
      "1 kg bone-in chicken pieces",
      "1 teaspoon Maharaja's Supreme Masala Mix",
      "1 teaspoon Maharaja's Breyani Mix Powder",
      "1 teaspoon Maharaja's Steak & Chops Spice",
      "1 teaspoon Maharaja's Mnandi Masala",
      "1 teaspoon Maharaja's 3-Mix Masala",
      "½ teaspoon Maharaja's Paprika",
      "Pinch of Maharaja's Turmeric",
      "2 heaped tablespoons of Maharaja's Isitshulu SeZinongo Ezimnandi",
      "2 small onions, chopped",
      "2 tablespoons of Maharaja's crushed Ginger and Garlic",
      "500g potatoes, chunks",
      "500g carrots, sliced",
      "250g cabbage, sliced",
      "¾ cups tomato paste diluted with water",
      "1 ½ teaspoons Maharaja's Chicken Stock per 1L water",
    ],
    instructions: [
      "Brown chicken in oil until lightly golden. Remove.",
      "Sauté onions until soft and slightly caramelised. Add garlic + ginger.",
      "Stir in all Maharaja's spices and fry for 2 minutes until aromatic.",
      "Add tomatoes and cook for 5 minutes.",
      "Return chicken, add Maharaja's stock and water. Bring to a boil, then simmer for 10 min.",
      "Add potatoes, carrots, cabbage.",
      "Simmer for another 30–40 min until thick and tender.",
      "Taste — adjust salt/stock if needed.",
      "Add in the Maharaja's Isitshulu SeZinongo Ezimnandi (Rich Savoury Stew/Soup Mix) and stir.",
      "Serve hot with pap or bread.",
    ],
  },
  {
    title: "Maharaja's Marry Me Chicken",
    description:
      "Creamy, indulgent chicken breasts in a rich sauce with sun-dried tomatoes, Parmesan, and Maharaja's Mother's Hand Chicken Curry Paste.",
    image: marryMeChickenImg,
    category: "Main Course",
    time: 40,
    servings: 4,
    ingredients: [
      "3 Tbsp extra-virgin olive oil",
      "4 boneless, skinless chicken breasts",
      "Maharaja's Salt",
      "250ml Water",
      "Half an Onion, diced",
      "Maharaja's ground black pepper",
      "2 tsp Maharaja's Crushed Garlic",
      "4 tsp Maharaja's Mother's Hand Chicken Curry Paste",
      "1 Tbsp Maharaja's dried thyme",
      "1 tsp Maharaja's crushed chilli flakes",
      "3/4 cup Maharaja's chicken stock powder",
      "1/2 cup finely chopped sun-dried tomatoes",
      "1/2 cup cream",
      "1/4 cup finely grated Parmesan",
      "Torn fresh basil & coriander, for serving",
    ],
    instructions: [
      "Marinate chicken with Maharaja's Mother's Hand Chicken curry paste. In a large pan over medium-high heat, heat 1 Tbsp oil. Add chicken to the pan and season with salt and black pepper and cook, turning halfway through, until golden brown, about 5 minutes per side. Transfer chicken to a plate.",
      "In the same pan over medium heat, heat the remaining 2 Tbsp oil. Sauté your onions for a few minutes. Stir in garlic, thyme, and chilli flakes. Cook, stirring, until fragrant, about 1 minute.",
      "Mix one tsp of Maharaja's chicken stock with 250ml of boiling water then stir in chicken stock, sun-dried tomatoes, cream, and Parmesan. Bring to a simmer, then return chicken and any accumulated juices to the pan.",
      "Simmer chicken in sauce until cooked through.",
      "Arrange chicken on a platter. Spoon sauce over. Top with basil.",
    ],
  },
  {
    title: "Maharaja's Crunch Coat - Chicken Strips",
    description:
      "Crispy, golden chicken strips coated in Maharaja's Fire Crisp Coating, marinated in buttermilk and G-Force Extra Hot Creamy Peri Peri.",
    image: crunchCoatChickenImg,
    category: "Appetizer",
    time: 150,
    servings: 4,
    ingredients: [
      "500g chicken breasts, cut into strips",
      "1 tsp Maharaja's Cayenne Pepper Powder",
      "1 tsp Maharaja's Garlic Powder",
      "1 tsp Maharaja's Onion Powder",
      "Salt, to taste",
      "1 tsp Maharaja's Cajun Spice",
      "1 tsp Maharaja's Black Pepper Powder",
      "250ml buttermilk",
      "250ml G-Force Extra Hot Creamy Peri Peri",
      "100g Maharaja's Crunch Coat Fire Crisp Coating",
      "Oil, for frying",
    ],
    instructions: [
      "Add the chicken strips to a mixing bowl. Season with all the dry spices and mix well.",
      "Add the buttermilk and 100ml of G-Force Extra Hot Creamy Peri Peri to the seasoned chicken. Place in the fridge for a minimum of 2 hours (overnight recommended).",
      "In another bowl, add 100g of Maharaja's Crunch Coat Fire Crisp Coating.",
      "Remove the marinated chicken from the fridge and coat the strips evenly.",
      "Add oil to a frying pan and heat over medium heat.",
      "Fry the chicken strips until cooked through and golden.",
      "Serve with the remaining G-Force Extra Hot Creamy Peri Peri sauce.",
    ],
  },
  {
    title: "Maharaja's Savoury South African-Style Chicken Stew (V2)",
    description:
      "A heartier version of our iconic South African-style chicken stew, featuring bone-in chicken, aromatic Maharaja's spice blend, and the Isitshulu SeZinongo Ezimnandi stew mix.",
    image: saChickenStewV2Img,
    category: "Main Course",
    time: 60,
    servings: 6,
    ingredients: [
      "1 kg bone-in chicken pieces",
      "1 teaspoon Maharaja's Supreme Masala Mix",
      "1 teaspoon Maharaja's Breyani Mix Powder",
      "1 teaspoon Maharaja's Steak & Chops Spice",
      "1 teaspoon Maharaja's Mnandi Masala",
      "1 teaspoon Maharaja's 3-Mix Masala",
      "½ teaspoon Maharaja's Paprika",
      "Pinch of Maharaja's Turmeric",
      "2 heaped tablespoons Maharaja's Isitshulu SeZinongo Ezimnandi (Rich Savoury Stew/Soup Mix)",
      "2 small onions, chopped",
      "2 tablespoons Maharaja's Ginger and Garlic",
      "500g potatoes, chunks",
      "500g carrots, sliced",
      "250g cabbage, sliced",
      "¾ cups tomato paste diluted with water",
      "1½ teaspoons Maharaja's Chicken Stock per 1L water",
    ],
    instructions: [
      "Brown chicken in oil until lightly golden. Remove.",
      "Sauté onions until soft and slightly caramelised. Add garlic + ginger.",
      "Stir in all Maharaja's spices and fry for 2 minutes until aromatic.",
      "Add tomatoes and cook for 5 minutes.",
      "Return chicken, add Maharaja's stock and water. Bring to a boil, then simmer for 10 min.",
      "Add potatoes, carrots, and cabbage.",
      "Simmer for another 30–40 min until thick and tender.",
      "Taste — adjust salt/stock if needed.",
      "Add in the Maharaja's Isitshulu SeZinongo Ezimnandi (Rich Savoury Stew/Soup Mix) and stir.",
      "Serve hot with pap or bread.",
    ],
  },
  {
    title: "Maharaja's Royal Chakalaka Pot Stew",
    description:
      "A rich, hearty chakalaka-inspired stew with minced beef, baked beans, and Maharaja's Traditional Chakalaka Stew Mix for authentic South African flavour.",
    image: royalChalakaImg,
    category: "Main Course",
    time: 60,
    servings: 6,
    ingredients: [
      "1 kg minced beef",
      "½ cup baked beans",
      "1 teaspoon Maharaja's Supreme Masala Mix",
      "1 teaspoon Maharaja's Breyani Mix Powder",
      "1 teaspoon Maharaja's Steak & Chops Spice",
      "1 teaspoon Maharaja's Mnandi Masala",
      "1 teaspoon Maharaja's 3-Mix Masala",
      "½ teaspoon Maharaja's Paprika",
      "Pinch of Maharaja's Turmeric",
      "2 heaped tablespoons Maharaja's Traditional Chakalaka Stew/Soup Mix (Isitshulu SeChakalaka)",
      "2 tablespoons Maharaja's Ginger and Garlic",
      "1 large onion, chopped",
      "1 green pepper, chopped",
      "1 cup carrots, grated",
      "½ cup cabbage, shredded",
      "¾ cups tomato paste diluted with water",
      "1½ teaspoons Maharaja's Vegetable Stock per 1L water",
    ],
    instructions: [
      "Heat oil in a large pot. Season chicken pieces with salt and pepper, then brown them on all sides. Remove and set aside.",
      "In the same pot, fry the onion until soft. Add the ginger, garlic, green pepper, and curry powder. Cook for 1-2 minutes until fragrant.",
      "Add the grated carrots & shredded cabbage to the pot and cook until they start to soften.",
      "Add water/stock. Return the chicken to the pot. Cover and simmer on low heat for 30-40 minutes until cooked through and tender.",
      "Add in the Maharaja's Traditional Chakalaka Stew/Soup Mix (Isitshulu SeChakalaka) and stir.",
      "Stir in the canned baked beans and let it simmer for another 5 minutes to thicken.",
      "Serve hot with pap, rice, or crusty bread.",
    ],
  },
  {
    title: "Maharaja's Crown Jewel Hearty Beef Stew",
    description:
      "A robust and satisfying beef stew with tender beef chunks, hearty vegetables, and Maharaja's Hearty Beef Stew Mix for deep, rich flavour.",
    image: crownJewelBeefImg,
    category: "Main Course",
    time: 60,
    servings: 6,
    ingredients: [
      "500g beef chunks, cubed",
      "1 teaspoon Maharaja's Supreme Masala Mix",
      "1 teaspoon Maharaja's Breyani Mix Powder",
      "1 teaspoon Maharaja's Steak & Chops Spice",
      "1 teaspoon Maharaja's Mnandi Masala",
      "1 teaspoon Maharaja's 3-Mix Masala",
      "½ teaspoon Maharaja's Paprika",
      "Pinch of Maharaja's Turmeric",
      "2 heaped tablespoons Maharaja's Hearty Beef Stew/Soup Mix (Isitshulu Senkomo)",
      "2 tablespoons Maharaja's Ginger and Garlic",
      "1 medium onion, finely chopped",
      "1 green pepper, chopped",
      "1 tomato, chopped",
      "500g large carrots, peeled and sliced",
      "500g potatoes, peeled and cubed",
      "¾ cups tomato paste diluted with water",
      "1½ teaspoons Maharaja's Beef Stock per 1L water",
    ],
    instructions: [
      "Heat the oil in a large pot and fry the onion and green pepper until soft.",
      "Add the Maharaja's Medium Curry Powder and tomato, and fry for 2 minutes, stirring continuously.",
      "Add the beef chuck and fry until well browned.",
      "Add the carrots, potatoes, Maharaja's Beef Stock and water. Stir well and bring to the boil.",
      "Simmer with the lid on for 40 minutes, stirring occasionally.",
      "Mix in Maharaja's Hearty Beef Stew/Soup Mix (Isitshulu Senkomo). Simmer for 5 minutes to thicken.",
      "Serve with savoury rice and coleslaw.",
    ],
  },
  {
    title: "Maharaja's Fantastical Family Chicken Stew",
    description:
      "A creamy, comforting family chicken stew with mixed vegetables, fresh cream, and Maharaja's Homestyle Chicken Stew Mix.",
    image: familyChickenStewImg,
    category: "Main Course",
    time: 60,
    servings: 6,
    ingredients: [
      "8 chicken pieces",
      "1 teaspoon Maharaja's Supreme Masala Mix",
      "1 teaspoon Maharaja's Breyani Mix Powder",
      "1 teaspoon Maharaja's Chicken Spice",
      "1 teaspoon Maharaja's Mnandi Masala",
      "1 teaspoon Maharaja's 3-Mix Masala",
      "½ teaspoon Maharaja's Paprika",
      "Pinch of Maharaja's Turmeric",
      "2 heaped tablespoons Maharaja's Homestyle Chicken Stew/Soup Mix (Isitshulu SeNkukhu)",
      "2 tablespoons Maharaja's Ginger and Garlic",
      "1 medium onion, finely chopped",
      "500g mixed vegetables",
      "1½ teaspoons Maharaja's Chicken Stock per 1L water",
      "Fresh cream",
    ],
    instructions: [
      "Brown chicken in oil until lightly golden. Remove.",
      "Sauté onions until soft and slightly caramelised. Add garlic + ginger.",
      "Stir in all Maharaja's spices and fry for 2 minutes until aromatic.",
      "Add Maharaja's stock and water. Bring to a boil, then simmer for 10 min.",
      "Add mixed vegetables.",
      "Pour in fresh cream and stir.",
      "Simmer for another 30–40 min until thick and tender.",
      "Taste — adjust salt/stock if needed.",
      "Add in the Maharaja's Homestyle Chicken Stew/Soup Mix (Isitshulu SeNkukhu) and stir.",
      "Serve hot with pap, rice or bread.",
    ],
  },
  {
    title: "Maharaja's Palace-Style Slow Cooked Oxtail Stew",
    description:
      "A luxurious slow-cooked oxtail stew with rich, deep flavours and Maharaja's Slow Cooked Oxtail Stew Mix for an unforgettable meal.",
    image: palaceOxtailImg,
    category: "Main Course",
    time: 120,
    servings: 6,
    ingredients: [
      "1 kg oxtail",
      "1 teaspoon Maharaja's Supreme Masala Mix",
      "1 teaspoon Maharaja's Breyani Mix Powder",
      "1 teaspoon Maharaja's BBQ Spice",
      "1 teaspoon Maharaja's Mnandi Masala",
      "1 teaspoon Maharaja's 3-Mix Masala",
      "½ teaspoon Maharaja's Paprika",
      "Pinch of Maharaja's Turmeric",
      "2 heaped tablespoons Maharaja's Slow Cooked Oxtail Stew/Soup Mix (Isitshulu Somsila Wenkomo)",
      "2 tablespoons Maharaja's Ginger and Garlic",
      "1 large onion, diced",
      "500g potatoes, chopped",
      "¾ cups tomato paste diluted with water",
      "1½ teaspoons Maharaja's Beef Stock per 1L water",
    ],
    instructions: [
      "Brown oxtail in oil well. Remove.",
      "Sauté onions until soft and slightly caramelised. Add garlic + ginger.",
      "Stir in all Maharaja's spices and fry for 2 minutes until aromatic.",
      "Add tomato base and cook for 5 minutes.",
      "Return oxtail, add Maharaja's stock and water. Bring to a boil, then simmer for 10 mins.",
      "Simmer for another 30–40 min until thick and tender.",
      "Taste — adjust salt/stock if needed.",
      "Add in the Maharaja's Slow Cooked Oxtail Stew/Soup Mix (Isitshulu Somsila Wenkomo) and stir.",
      "Serve hot with pap or rice.",
    ],
  },
  {
    title: "Maharaja's Rich & Regal Beef and Onion Stew",
    description:
      "A slow-cooked beef and onion stew with deep, savoury flavours and Maharaja's Beef and Onion Stew Mix for a rich, comforting meal.",
    image: richRegalBeefImg,
    category: "Main Course",
    time: 90,
    servings: 6,
    ingredients: [
      "500g beef chunks",
      "1 teaspoon Maharaja's Supreme Masala Mix",
      "1 teaspoon Maharaja's Breyani Mix Powder",
      "1 teaspoon Maharaja's Steak & Chops Spice",
      "1 teaspoon Maharaja's Mnandi Masala",
      "1 teaspoon Maharaja's 3-Mix Masala",
      "Pinch of Maharaja's Turmeric",
      "2 heaped tablespoons Maharaja's Slow-cooked Beef and Onion Stew/Soup Mix (Isitshulu Senkomo No-Anyanisi)",
      "2 tablespoons Maharaja's Ginger and Garlic",
      "3 large onions, sliced",
      "2 tomatoes, chopped",
      "500g large potatoes, chopped",
      "Spring onion shallot, chopped",
      "1½ teaspoons Maharaja's Beef Stock per 1L water",
    ],
    instructions: [
      "Brown beef in oil well. Remove.",
      "Sauté onions until soft and slightly caramelised. Add garlic + ginger.",
      "Stir in all Maharaja's spices and fry for 2 minutes until aromatic.",
      "Add tomatoes and cook for 5 minutes.",
      "Return beef, add Maharaja's stock and water. Bring to a boil, then simmer for 10 mins.",
      "Add carrots & potatoes.",
      "Simmer for another 30–40 min until thick and tender.",
      "Taste — adjust salt/stock if needed.",
      "Add in the Maharaja's Slow-cooked Beef and Onion Stew/Soup Mix (Isitshulu Senkomo No-Anyanisi) and stir.",
      "Serve hot with pap or rice.",
    ],
  },
];

const Recipes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>(defaultRecipesData);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(defaultRecipesData);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recipes from database
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select(
            "id, title, description, image_url, category, prep_time, cook_time, servings, ingredients, instructions",
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const dbRecipes: Recipe[] = data.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description || "",
            image: r.image_url || defaultRecipesData[0].image,
            category: r.category,
            time: (r.prep_time || 0) + (r.cook_time || 0),
            servings: r.servings || 4,
            ingredients: Array.isArray(r.ingredients) ? (r.ingredients as string[]) : [],
            instructions: Array.isArray(r.instructions) ? (r.instructions as string[]) : [],
          }));
          setRecipes(dbRecipes);
          setFilteredRecipes(dbRecipes);
        }
      } catch (error) {
        console.error("Error fetching recipes:", error);
        // Fall back to default recipes
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(recipes);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.category.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.ingredients.some((ing) => ing.toLowerCase().includes(query)),
    );
    setFilteredRecipes(filtered);
  }, [searchQuery, recipes]);

  useEffect(() => {
    // Add organization structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: recipes.map((recipe, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Recipe",
          name: recipe.title,
          description: recipe.description,
          prepTime: `PT${recipe.time}M`,
          recipeCategory: recipe.category,
          recipeYield: `${recipe.servings} servings`,
          image: recipe.image,
        },
      })),
    };

    let script = document.querySelector('script[type="application/ld+json"][data-type="recipe-list"]');
    if (!script) {
      script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-type", "recipe-list");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [recipes]);

  useSEO({
    title: "South African Recipes - Curry, Breyani, Stews & More | Maharaja's Spices",
    description:
      "Explore authentic South African recipes including beef curry, butter chicken, breyani, mutton curry, and more. Easy step-by-step instructions using Maharaja's premium spices.",
    keywords:
      "South African recipes, curry recipes, breyani recipe, butter chicken recipe, mutton curry, chicken curry recipe, Maharaja's Spices recipes, easy curry recipe, spice recipes South Africa",
    url: "https://maharajasspices.co.za/recipes",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12 md:py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container px-4 mx-auto max-w-7xl">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">Traditional South African Recipes</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover authentic recipes using Maharaja's premium spices
              </p>
            </div>

            <div className="max-w-md mx-auto mb-12">
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-64 bg-muted animate-pulse" />
                    <CardContent className="p-6 space-y-3">
                      <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                      <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No recipes found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRecipes.map((recipe, index) => (
                  <Card
                    key={recipe.id || index}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedRecipe(recipe)}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-2">
                        {recipe.category}
                      </Badge>
                      <h3 className="text-xl font-bold mb-2 font-playfair">{recipe.title}</h3>
                      <p className="text-muted-foreground mb-4 line-clamp-2">{recipe.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{recipe.time} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{recipe.servings} servings</span>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full" onClick={() => setSelectedRecipe(recipe)}>
                        View Full Recipe
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">Have a recipe you'd like to share?</p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Fullscreen Recipe Modal */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedRecipe && (
            <>
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <Badge className="mb-2 bg-primary">{selectedRecipe.category}</Badge>
                  <h2 className="text-3xl font-bold font-playfair">{selectedRecipe.title}</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-muted-foreground text-lg">{selectedRecipe.description}</p>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedRecipe.time} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedRecipe.servings} servings</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-4 font-playfair">Ingredients</h3>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <RecipeIngredientLink ingredient={ingredient} />
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-4 font-playfair">Instructions</h3>
                    <ol className="space-y-4">
                      {selectedRecipe.instructions.map((instruction, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Recipes;
