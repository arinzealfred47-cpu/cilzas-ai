import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  RecipeOutputSchema,
  type RecipeOutput,
  type RecipeRequest,
  type HealthFlag,
} from "@repo/recipes";

const SPECIFICITY_REQUIREMENTS = `Every recipe you produce must be HIGHLY specific and thorough — never a short,
generic outline. Concretely:
- Every ingredient needs an exact, real-world quantity and unit (never "to taste" or
  "as needed" alone — give a real starting amount, e.g. "1/2 tsp kosher salt", even for
  ingredients most cooks would season by feel) plus, where it matters to the outcome, a
  prep note (e.g. "1 medium yellow onion, finely diced", "2 cloves garlic, minced",
  "1 cup unsalted butter, softened to room temperature").
- Directions must be long and granular, not a shortened summary. Break the dish into
  every real sub-stage a professional recipe would separate (e.g. searing, deglazing,
  reducing, resting, plating) rather than compressing stages together. A simple dish
  should still read as a complete step-by-step walkthrough, not a 3-line sketch.
- Every step must state the specific technique, exact temperature (°F and °C) or heat
  level, exact time or time range, the equipment used (pan size/material, oven rack
  position, etc.), and a concrete sensory or visual doneness cue to check for (e.g.
  "cook until the edges turn golden brown and pull away from the pan, about 4–5
  minutes" rather than just "cook until done").
- Do not omit any step a real cook would need — resting times, preheating, ingredient
  temperature before use, mise en place, how to check doneness, and plating/serving
  guidance all belong in the steps.
Depth and precision are the priority over brevity in every recipe you generate.`;

const SYSTEM_PROMPT = `You are a world-class culinary recipe engine. You have full theoretical
capability to formulate any globally recognized dish — from any cuisine, region, or
culinary tradition — based on the parameters you're given. Do not artificially limit
yourself to a narrow set of cuisines.

Given the input parameters, produce exactly one concrete, cookable recipe. Always return:
- a specific, concrete recipe title (not a category or vague description)
- a standardized ingredient list, where each ingredient has a name, a numeric quantity,
  and a unit (e.g. "cups", "g", "tbsp", "whole")
- sequential, numbered-in-order preparation directions, each step a single clear
  instruction

Completeness is mandatory: the ingredient list must be sufficient on its own for someone
to actually make the dish from scratch with no missing steps. Never omit foundational or
"implied" ingredients just because they seem obvious — salt, oil or fat, aromatics
(onion, garlic), leavening agents, binding agents (eggs, starch), and any base component
of the dish (e.g. the dough for a pizza, the stock for a soup, the marinade for a grilled
protein) must all be explicitly listed with their own quantity and unit. If a component is
traditionally made from scratch, include its sub-ingredients rather than naming it as a
single opaque item.

${SPECIFICITY_REQUIREMENTS}

Respect every constraint given (allergies, dietary restrictions, vegan/vegetarian status,
health preference, serving size) strictly — never include an ingredient the user is
allergic to or that violates a stated restriction.`;

const VISION_SYSTEM_PROMPT = `You are a world-class culinary vision system. You have full
theoretical capability to recognize any globally recognized dish — from any cuisine,
region, or culinary tradition — from a photograph. Do not artificially limit yourself to
a narrow set of cuisines.

Carefully examine the photograph. Identify the specific dish or food presentation shown —
not a generic category, the actual dish. Reverse-engineer a complete, cookable recipe for
it. Always return:
- a specific, concrete recipe title identifying the dish you see
- a standardized ingredient list, where each ingredient has a name, a numeric quantity,
  and a unit (e.g. "cups", "g", "tbsp", "whole") — estimate realistic portions from what's
  visible in the image (plate size, apparent servings, visible quantities)
- sequential, numbered-in-order preparation directions that would produce the dish shown,
  each step a single clear instruction

Completeness is mandatory: list every ingredient required to actually reproduce the dish,
including foundational or "implied" ones that may not be visually obvious in the photo —
salt, oil or fat, aromatics, leavening or binding agents, and any from-scratch base
component (dough, stock, marinade, sauce). Infer these from what the finished dish
requires, not just what's visibly plated.

${SPECIFICITY_REQUIREMENTS}

If the image does not clearly show food, still make your best concrete effort — describe
the most plausible dish and recipe rather than refusing.`;

const HEALTHIFY_SYSTEM_PROMPT = `You are a culinary reformulation engine. When given a
recipe and a list of ingredients flagged for unhealthy vectors, you produce a healthier
version of that exact recipe.

Strict constraint: you must preserve the original recipe's flavor profile, texture, and
sensory character as closely as possible. Do not redesign the dish, change the cuisine, or
alter its overall concept. Only replace the flagged ingredients (and adjust anything
structurally required by that substitution) with healthier alternatives that optimize
nutrition — e.g. swap refined sugar for a lower-glycemic natural sweetener in an
equivalent amount, swap processed/hydrogenated oils for a minimally processed oil like
olive or avocado oil, eliminate trans fats entirely. Every other ingredient and step
should stay the same unless the substitution requires a minor knock-on adjustment.`;

function buildUserPrompt(request: RecipeRequest): string {
  if (request.mode === "custom") {
    const ingredientList = request.ingredients
      .map((i) => `- ${i.quantity} ${i.unit} ${i.name}`)
      .join("\n");
    return `Generate a recipe using exactly these ingredients (adjust quantities to taste, but do not introduce ingredients outside common pantry staples like salt, oil, and water unless necessary):
${ingredientList}

Scale the recipe to serve ${request.servings} people.`;
  }

  const partyDescription = request.eatingAlone
    ? "Cooking for one person."
    : `Cooking for ${request.partySize} people.`;

  const dietDescription =
    request.dietType === "none"
      ? "No vegan/vegetarian requirement."
      : `Must be strictly ${request.dietType}.`;

  return `Recommend a recipe based on the following preferences:
- Time of day: ${request.timeOfDay}
- Should be healthy: ${request.needsHealthy ? "yes" : "no"}
- ${partyDescription}
- Allergies to avoid: ${request.allergies || "none stated"}
- Diet type: ${dietDescription}
- Other dietary restrictions: ${request.dietaryRestrictions || "none stated"}

Scale the recipe to serve ${request.eatingAlone ? 1 : request.partySize} people.`;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey });
}

const MODEL = () => process.env.OPENAI_MODEL || "gpt-5.6";

export async function generateRecipe(
  request: RecipeRequest,
): Promise<RecipeOutput> {
  const client = getClient();

  const response = await client.responses.parse({
    model: MODEL(),
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(request) },
    ],
    text: {
      format: zodTextFormat(RecipeOutputSchema, "recipe"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return a parseable recipe.");
  }

  return response.output_parsed;
}

// `image` is a full data: URL ("data:image/jpeg;base64,...").
export async function analyzeRecipeImage(image: string): Promise<RecipeOutput> {
  const client = getClient();

  const response = await client.responses.parse({
    model: MODEL(),
    input: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Identify the dish in this photo and produce a complete recipe for it.",
          },
          { type: "input_image", image_url: image, detail: "auto" },
        ],
      },
    ],
    text: {
      format: zodTextFormat(RecipeOutputSchema, "recipe"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return a parseable recipe.");
  }

  return response.output_parsed;
}

// Best-effort dish photo generated alongside a recipe. Callers should catch
// and swallow failures here rather than let a bad image generation fail an
// otherwise-successful recipe.
export async function generateDishImage(title: string): Promise<string> {
  const client = getClient();

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt: `A professional, appetizing food photograph of "${title}", plated and ready to eat, shot from a natural overhead or three-quarter angle with soft studio lighting and a shallow depth of field. No text, no watermarks, no hands or utensils in frame.`,
    size: "1024x1024",
    quality: "medium",
    output_format: "jpeg",
    output_compression: 70,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("The model did not return image data.");
  }
  return `data:image/jpeg;base64,${b64}`;
}

function buildHealthifyPrompt(original: RecipeOutput, flags: HealthFlag[]): string {
  const ingredientList = original.ingredients
    .map((i) => `- ${i.quantity} ${i.unit} ${i.name}`)
    .join("\n");
  const stepList = original.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const flaggedList = flags
    .map((f) => `- ${f.ingredientName} (flagged: ${f.vectors.join(", ")})`)
    .join("\n");

  return `Here is a recipe:

Title: ${original.title}
Servings: ${original.servings}
Ingredients:
${ingredientList}
Directions:
${stepList}

The following ingredients were flagged for unhealthy vectors:
${flaggedList}

Produce a healthier version of this exact recipe per your instructions.`;
}

export async function healthifyRecipe(
  original: RecipeOutput,
  flags: HealthFlag[],
): Promise<RecipeOutput> {
  const client = getClient();

  const response = await client.responses.parse({
    model: MODEL(),
    input: [
      { role: "system", content: HEALTHIFY_SYSTEM_PROMPT },
      { role: "user", content: buildHealthifyPrompt(original, flags) },
    ],
    text: {
      format: zodTextFormat(RecipeOutputSchema, "recipe"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return a parseable recipe.");
  }

  return response.output_parsed;
}
