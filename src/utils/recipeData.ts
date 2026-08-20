/**
 * Shared recipe types and utilities
 */

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  image: string;
  category: string;
  time: number;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  cuisine?: string;
  keywords?: string;
}