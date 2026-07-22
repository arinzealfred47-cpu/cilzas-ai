export interface RecipeEmailInput {
  title: string;
  servings: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: string[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Matches the Recipe History preview length in the app UI.
const EMAIL_PREVIEW_INGREDIENTS = 3;
const EMAIL_PREVIEW_STEPS = 2;

// Email clients strip <style> blocks and JS unpredictably, so every rule
// here is inlined — this can't reuse the app's globals.css utility classes.
// The one exception is the Show More/Show Less accordion below, which needs
// a <style> block for the checkbox-hack technique (a hidden <input
// type="checkbox"> + <label> + a ":checked ~ sibling" CSS rule) since email
// clients block <script>. Support is inconsistent: Apple Mail, Gmail
// (web/app), and Yahoo Mail render it correctly, but Outlook desktop's Word
// rendering engine does not support the :checked selector at all. The extra
// ingredients/steps default to visible and are only hidden by the <style>
// block, so clients that ignore the block (like Outlook) just show the full
// recipe with an inert toggle instead of losing content.
export function buildRecipeEmailHtml(
  recipe: RecipeEmailInput,
  opts: { imageDataUrl?: string | null; signUpUrl: string },
): string {
  const previewIngredients = recipe.ingredients.slice(
    0,
    EMAIL_PREVIEW_INGREDIENTS,
  );
  const extraIngredients = recipe.ingredients.slice(EMAIL_PREVIEW_INGREDIENTS);
  const previewSteps = recipe.steps.slice(0, EMAIL_PREVIEW_STEPS);
  const extraSteps = recipe.steps.slice(EMAIL_PREVIEW_STEPS);
  const hasMore = extraIngredients.length > 0 || extraSteps.length > 0;

  const renderIngredient = (i: RecipeEmailInput["ingredients"][number]) =>
    `<li style="margin-bottom:4px;">${escapeHtml(String(i.quantity))} ${escapeHtml(i.unit)} ${escapeHtml(i.name)}</li>`;
  const renderStep = (s: string) =>
    `<li style="margin-bottom:8px;">${escapeHtml(s)}</li>`;

  const listStyle =
    "margin:0;padding-left:18px;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.6;";
  const labelStyle =
    "display:inline-block;margin-top:4px;color:#60EFFF;font-size:13px;font-weight:600;cursor:pointer;text-decoration:underline;";

  const recipeBodyHtml = hasMore
    ? `
                <input type="checkbox" id="rg-toggle" style="position:absolute;opacity:0;width:1px;height:1px;overflow:hidden;" />
                <p style="margin:0 0 8px;color:#ffffff;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Ingredients</p>
                <ul style="${listStyle}">${previewIngredients.map(renderIngredient).join("")}</ul>
                <ul class="rg-extra" style="${listStyle}">${extraIngredients.map(renderIngredient).join("")}</ul>
                <p style="margin:16px 0 8px;color:#ffffff;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Directions</p>
                <ol style="${listStyle}">${previewSteps.map(renderStep).join("")}</ol>
                <ol class="rg-extra" style="${listStyle}">${extraSteps.map(renderStep).join("")}</ol>
                <label for="rg-toggle" class="rg-show-more" style="${labelStyle}">Show More</label>
                <label for="rg-toggle" class="rg-show-less" style="${labelStyle}display:none;">Show Less</label>`
    : `
                <p style="margin:0 0 8px;color:#ffffff;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Ingredients</p>
                <ul style="${listStyle}">${previewIngredients.map(renderIngredient).join("")}</ul>
                <p style="margin:16px 0 8px;color:#ffffff;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Directions</p>
                <ol style="${listStyle}">${previewSteps.map(renderStep).join("")}</ol>`;

  const accordionStyleBlock = hasMore
    ? `
    <style>
      .rg-extra { display: none; }
      #rg-toggle:checked ~ .rg-extra { display: block !important; }
      #rg-toggle:checked ~ .rg-show-more { display: none !important; }
      #rg-toggle:checked ~ .rg-show-less { display: inline-block !important; }
    </style>`
    : "";

  const imageBlock = opts.imageDataUrl
    ? `<tr><td style="padding-bottom:24px;"><img src="${opts.imageDataUrl}" width="480" alt="${escapeHtml(recipe.title)}" style="width:100%;max-width:480px;border-radius:8px;display:block;" /></td></tr>`
    : "";

  return `
<!doctype html>
<html>
  <head>${accordionStyleBlock}
  </head>
  <body style="margin:0;padding:0;background-color:#000000;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
            ${imageBlock}
            <tr>
              <td style="padding-bottom:8px;">
                <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${escapeHtml(recipe.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <p style="margin:0;color:rgba(255,255,255,0.5);font-size:13px;">Serves ${recipe.servings}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;position:relative;">${recipeBodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 0;border-top:1px solid rgba(255,255,255,0.12);text-align:center;">
                <p style="margin:0 0 14px;color:rgba(255,255,255,0.6);font-size:13px;line-height:1.5;">
                  This recipe was made with Cilzas AI — turn whatever's in your kitchen into a real recipe in seconds.
                </p>
                <a
                  href="${opts.signUpUrl}"
                  style="display:inline-block;padding:14px 32px;border-radius:999px;background-image:linear-gradient(135deg,#00FF87 0%,#60EFFF 100%);color:#000000;font-weight:700;font-size:14px;text-decoration:none;"
                >
                  Sign Up
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}
