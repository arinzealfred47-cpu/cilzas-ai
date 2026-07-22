import { z } from "zod";

export const IngredientInputSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});
export type IngredientInput = z.infer<typeof IngredientInputSchema>;

export const CustomModeInputSchema = z.object({
  mode: z.literal("custom"),
  ingredients: z.array(IngredientInputSchema).min(1),
  servings: z.number().int().positive(),
});
export type CustomModeInput = z.infer<typeof CustomModeInputSchema>;

export const QuestionnaireModeInputSchema = z.object({
  mode: z.literal("questionnaire"),
  timeOfDay: z.string().min(1),
  needsHealthy: z.boolean(),
  eatingAlone: z.boolean(),
  partySize: z.number().int().positive().optional(),
  allergies: z.string(),
  dietType: z.enum(["none", "vegan", "vegetarian"]),
  dietaryRestrictions: z.string(),
});
export type QuestionnaireModeInput = z.infer<
  typeof QuestionnaireModeInputSchema
>;

// discriminatedUnion needs plain object schemas as members, so the
// "partySize required unless eating alone" rule is enforced here instead of
// on QuestionnaireModeInputSchema itself.
export const RecipeRequestSchema = z
  .discriminatedUnion("mode", [
    CustomModeInputSchema,
    QuestionnaireModeInputSchema,
  ])
  .superRefine((data, ctx) => {
    if (
      data.mode === "questionnaire" &&
      !data.eatingAlone &&
      typeof data.partySize !== "number"
    ) {
      ctx.addIssue({
        code: "custom",
        message: "partySize is required when eatingAlone is false",
        path: ["partySize"],
      });
    }
  });
export type RecipeRequest = z.infer<typeof RecipeRequestSchema>;

export const RecipeIngredientOutputSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
});
export type RecipeIngredientOutput = z.infer<
  typeof RecipeIngredientOutputSchema
>;

export const RecipeOutputSchema = z.object({
  title: z.string(),
  servings: z.number().int().positive(),
  ingredients: z.array(RecipeIngredientOutputSchema),
  steps: z.array(z.string()),
});
export type RecipeOutput = z.infer<typeof RecipeOutputSchema>;

// For POST /api/recipe/analyze-image's JSON-body path. `image` may be a full
// data: URL ("data:image/jpeg;base64,...") or a raw base64 string, in which
// case `mimeType` should be set so the server knows how to label it.
export const AnalyzeImageRequestSchema = z.object({
  image: z.string().min(1),
  mimeType: z.string().optional(),
});
export type AnalyzeImageRequest = z.infer<typeof AnalyzeImageRequestSchema>;
