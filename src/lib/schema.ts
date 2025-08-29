import { z } from "zod";

export const foodItemSchema = z.object({
  name: z.string(),
  quantity: z.string().optional().default("")
});

export const recipeSchema = z.object({
  title: z.string(),
  ingredients: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
  estimatedTimeMinutes: z.number().optional()
});

export const analyzeResponseSchema = z.object({
  detectedItems: z.array(foodItemSchema).default([]),
  expirationEstimates: z.array(z.object({ item: z.string(), daysUntilExpiry: z.number() })).default([]),
  recipes: z.array(recipeSchema).default([])
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;


