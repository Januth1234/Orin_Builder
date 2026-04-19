/**
 * services/geminiBuilderService.ts — Orin Builder
 *
 * Drives the complete website generation pipeline via Gemini.
 * Mirrors the getApiKey / GoogleGenAI pattern from the main Orin AI geminiService.ts.
 *
 * Stage order (matches PIPELINE in types.ts):
 *   parsing → blueprint → database → backend → frontend → assembling → checks → done
 */

import { GoogleGenAI } from '@google/genai';
import { SiteBlueprint, DbTable, GeneratedComponent, GenerationResult, BuildStage } from '../types';
import { APP_CONFIG, PLAN_LIMITS } from '../config';
import type { UserAccount } from '../types';

export type StageCallback = (stage: BuildStage, detail?: string) => void;

// ── API key resolution (identical to main geminiService.ts) ──────────────────
function getApiKey(): string {
  const key = process.env.API_KEY;
  if (key) return key;
  throw new Error('Gemini API key missing. Add API_KEY to .env.local');
}

function getModel(user: UserAccount | null): string {
  if (!user) return APP_CONFIG.defaultModel;
  return PLAN_LIMITS[user.tier]?.premiumModel ? APP_CONFIG.premiumModel : APP_CONFIG.defaultModel;
}

async function callGemini(model: string, prompt: string, maxTokens = 8192): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { maxOutputTokens: maxTokens },
  });
  return res.text ?? '';
}

function parseJSON<T>(raw: string): T {
  const clean = raw.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
  return JSON.parse(clean) as T;
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const P_BLUEPRINT = (prompt: string) => `
You are an expert web architect. Produce a structured JSON blueprint for this website request.

REQUEST: "${prompt}"

Return ONLY valid JSON — no markdown, no backticks.
{
  "siteName": "string",
  "tagline": "string",
  "domain": "slug-string",
  "pages": ["Home","About","Pricing","Contact"],
  "sections": [
    {"name":"Navbar","type":"navbar","purpose":"brief description","hasAnimation":false},
    {"name":"Hero","type":"hero","purpose":"brief description","hasAnimation":true}
  ],
  "colorScheme": {
    "primary":"#hex","secondary":"#hex","accent":"#hex",
    "background":"#hex","text":"#hex","surface":"#hex"
  },
  "fonts": {"heading":"Google Font name","body":"Google Font name"},
  "stack": ["HTML5","CSS3","Vanilla JS"],
  "tone": "professional|playful|minimal|bold|elegant",
  "targetAudience": "string",
  "seoKeywords": ["keyword1","keyword2","keyword3"]
}`.trim();

const P_DATABASE = (bp: SiteBlueprint) => `
Design a production PostgreSQL schema for: "${bp.siteName}" (${bp.targetAudience})
Pages: ${bp.pages.join(', ')}

Return ONLY a valid JSON array — no markdown, no backticks.
[
  {
    "table": "users",
    "purpose": "Stores authenticated accounts",
    "fields": [
      {"name":"id","type":"UUID","note":"Primary key, auto-generated","nullable":false},
      {"name":"email","type":"VARCHAR","note":"Unique, indexed","nullable":false},
      {"name":"created_at","type":"TIMESTAMP","note":"Auto set on insert","nullable":false}
    ],
    "relations": []
  }
]
Include: auth tables, core domain entities, relational joins, audit/log tables where relevant.`.trim();

const P_COMPONENTS = (bp: SiteBlueprint) => `
List every UI component needed for "${bp.siteName}".

Return ONLY a valid JSON array — no markdown, no backticks.
[{"name":"Navbar","type":"navigation","description":"Sticky nav with logo, links, mobile hamburger"}]

Must cover: ${bp.sections.map(s => s.name).join(', ')} — plus forms, modals, cards where appropriate.`.trim();

const P_HTML = (prompt: string, bp: SiteBlueprint, comps: GeneratedComponent[]) => `
You are a senior frontend engineer. Generate a COMPLETE, production-quality website as ONE self-contained HTML file.

USER REQUEST: "${prompt}"

SITE SPEC:
- Name: ${bp.siteName} | Tagline: ${bp.tagline}
- Tone: ${bp.tone} | Audience: ${bp.targetAudience}
- Pages: ${bp.pages.join(', ')}
- Sections (must ALL be present): ${bp.sections.map(s => s.name).join(', ')}
- Colors: primary=${bp.colorScheme.primary} secondary=${bp.colorScheme.secondary} accent=${bp.colorScheme.accent} bg=${bp.colorScheme.background} text=${bp.colorScheme.text} surface=${bp.colorScheme.surface}
- Fonts: ${bp.fonts.heading} (headings), ${bp.fonts.body} (body)
- SEO: ${bp.seoKeywords.join(', ')}
- Components: ${comps.map(c => c.name).join(', ')}

HARD REQUIREMENTS — every single one must be satisfied:
1. Single self-contained .html file. Inline all CSS in <style>. Inline all JS in <script>. Zero external JS except Google Fonts.
2. Google Fonts <link> in <head> for "${bp.fonts.heading}" and "${bp.fonts.body}".
3. CSS custom properties at :root — --primary, --secondary, --accent, --bg, --surface, --text.
4. Implement EVERY section in the spec with real, meaningful content matching the site domain. No Lorem Ipsum.
5. Fully responsive — mobile-first, breakpoints at 640px and 1024px. Hamburger nav on mobile.
6. Scroll-triggered fade-in animations using IntersectionObserver. Smooth scroll on nav links.
7. Hover states, button focus rings, transition effects throughout.
8. Semantic HTML5: <header><nav><main><section><article><footer> with aria-labels.
9. SEO: <title>, <meta name="description">, Open Graph tags, h1/h2/h3 hierarchy.
10. Footer: links, copyright "${bp.siteName} ${new Date().getFullYear()}", "Built with Orin Builder".
11. MINIMUM 500 lines. This must be a real, impressive website — not a skeleton.
12. Match tone precisely: ${bp.tone}. A "bold" site should feel bold. A "minimal" site should breathe.

Return ONLY the raw HTML — no markdown fences, no commentary. Start with <!DOCTYPE html>.`.trim();

// ── Service ───────────────────────────────────────────────────────────────────

export class GeminiBuilderService {

  async generateWebsite(
    userPrompt: string,
    user: UserAccount | null,
    onStage: StageCallback,
  ): Promise<GenerationResult> {
    const model = getModel(user);

    // Stage 1 – Blueprint
    onStage('blueprint', 'Generating site architecture…');
    const blueprint = parseJSON<SiteBlueprint>(
      await callGemini(model, P_BLUEPRINT(userPrompt), 2048)
    );

    // Stage 2 – Database
    onStage('database', 'Designing database schema…');
    const dbSchema = parseJSON<DbTable[]>(
      await callGemini(model, P_DATABASE(blueprint), 2048)
    );

    // Stage 3 – Components (lightweight frontend planning)
    onStage('frontend', 'Planning UI components…');
    const components = parseJSON<GeneratedComponent[]>(
      await callGemini(model, P_COMPONENTS(blueprint), 1024)
    );

    // Stage 4 – Full HTML (largest token budget)
    onStage('assembling', 'Assembling complete HTML/CSS/JS…');
    const rawHtml = await callGemini(model, P_HTML(userPrompt, blueprint, components), 16384);

    // Stage 5 – Validate
    onStage('checks', 'Validating output…');
    const html = validateHtml(rawHtml, blueprint.siteName);

    onStage('done');
    return {
      blueprint, dbSchema, components, html,
      promptUsed: userPrompt,
      generatedAt: new Date().toISOString(),
      modelUsed: model,
    };
  }

  async refineWebsite(
    existingHtml: string,
    refinementPrompt: string,
    user: UserAccount | null,
    onStage: StageCallback,
  ): Promise<string> {
    onStage('assembling', 'Applying refinements…');
    const prompt = `
You have an existing website HTML. Apply ONLY the requested changes. Keep everything else intact.

REFINEMENT: "${refinementPrompt}"

EXISTING HTML:
${existingHtml}

Return ONLY the updated HTML — no markdown, no backticks. Start with <!DOCTYPE html>.`.trim();

    const result = await callGemini(getModel(user), prompt, 16384);
    onStage('done');
    return validateHtml(result, '');
  }
}

function validateHtml(html: string, siteName: string): string {
  let out = html.trim();
  // Strip accidental markdown fences from model response
  if (out.startsWith('```')) out = out.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();
  if (!out.toLowerCase().startsWith('<!doctype')) out = '<!DOCTYPE html>\n' + out;
  if (!out.toLowerCase().endsWith('</html>')) out += '\n</html>';
  if (siteName && !out.includes('Orin Builder')) {
    out = out.replace('</body>', `<!-- Built with Orin Builder (builder.orinai.org) -->\n</body>`);
  }
  return out;
}

export const geminiBuilderService = new GeminiBuilderService();
