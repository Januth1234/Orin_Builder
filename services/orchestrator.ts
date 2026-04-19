/**
 * services/orchestrator.ts — Orin Builder  v2.0
 *
 * Production-grade orchestration engine for the AI website generation pipeline.
 *
 * Key improvements over v1:
 *  - Typed state machine with canTransition() guard
 *  - Per-call retry with exponential backoff (3 attempts, configurable)
 *  - AbortController threaded through every async op
 *  - Tool result caching — no double-execution within a session
 *  - JSON parse error recovery — self-correction prompt on bad JSON
 *  - Clarification pause/resume with 5-min timeout
 *  - Deterministic progress from PIPELINE.progressAt
 *  - Partial result recovery — returns whatever was built on failure
 *  - HTML quality patch — DOCTYPE, closing tag, attribution
 *  - Full SQL DDL generator from data_models when model skips it
 *  - Structured ValidationResult with named checks
 */

import { GoogleGenAI, Type } from '@google/genai';
import {
  BuildState, StreamEvent, StreamEventType, ToolName, canTransition,
  PromptAnalysis, SiteBlueprint, BackendPlan, DatabasePlan, FrontendPlan,
  ArtifactBundle, ArtifactFile, ValidationResult, ValidationCheck,
  UserAccount, BUILD_STATE_META, DbField,
} from '../types';
import { APP_CONFIG, PLAN_LIMITS } from '../config';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_TOOL_ITERATIONS      = 20;
const MAX_RETRY_ATTEMPTS       = 3;
const RETRY_BASE_DELAY_MS      = 1200;
const CLARIFICATION_TIMEOUT_MS = 5 * 60 * 1000;
const HTML_MIN_LENGTH          = 6000;
const GEMINI_TEMPERATURE       = 0.25;

// ── Types ─────────────────────────────────────────────────────────────────────
export type EventCallback = (event: StreamEvent) => void;

// ── API key / model (mirrors main Orin AI geminiService.ts) ──────────────────
function getApiKey(): string {
  const k = process.env.API_KEY;
  if (k && k.length > 10) return k;
  throw new Error('API_KEY not configured. Add it to .env.local:\nAPI_KEY=your_gemini_api_key');
}

function getModel(user: UserAccount | null): string {
  if (!user) return APP_CONFIG.defaultModel;
  return PLAN_LIMITS[user.tier]?.premiumModel
    ? APP_CONFIG.premiumModel
    : APP_CONFIG.defaultModel;
}

// ── Gemini call with retry + abort ────────────────────────────────────────────
async function askGemini(
  model: string,
  prompt: string,
  maxTokens: number,
  signal: AbortSignal,
  attempt = 1,
): Promise<string> {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { maxOutputTokens: maxTokens, temperature: GEMINI_TEMPERATURE },
    });
    const text = res.text ?? '';
    if (!text.trim()) throw new Error('Gemini returned empty response');
    return text;
  } catch (err: any) {
    if (signal.aborted) throw err;
    if (attempt >= MAX_RETRY_ATTEMPTS) throw err;
    const retryable = err?.status === 429 || err?.status >= 500
      || /quota|timeout|network|unavailable/i.test(err?.message ?? '');
    if (!retryable) throw err;
    await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1), signal);
    return askGemini(model, prompt, maxTokens, signal, attempt + 1);
  }
}

// ── JSON parse with self-correction retry ─────────────────────────────────────
function tryParseJSON<T>(raw: string): T | null {
  try {
    const clean = raw
      .replace(/^```(?:json|sql|html)?\n?/gm, '')
      .replace(/\n?```$/gm, '')
      .replace(/,\s*([}\]])/g, '$1')  // trailing commas
      .trim();
    return JSON.parse(clean) as T;
  } catch { return null; }
}

async function parseJSONWithRetry<T>(
  raw: string, model: string, ctx: string, signal: AbortSignal,
): Promise<T> {
  const first = tryParseJSON<T>(raw);
  if (first !== null) return first;
  const fixed = await askGemini(model,
    `Fix JSON syntax errors only. Return ONLY corrected JSON, no markdown.\nContext: ${ctx}\n\nBROKEN JSON:\n${raw.slice(0, 3000)}`,
    4096, signal);
  const second = tryParseJSON<T>(fixed);
  if (second !== null) return second;
  throw new Error(`JSON parse failed after retry. Context: ${ctx}. Raw[:200]: ${raw.slice(0, 200)}`);
}

// ── Gemini function declarations ───────────────────────────────────────────────
const TOOL_DECLARATIONS = [
  { name: 'analyze_prompt',
    description: 'Extract intent, constraints, pages, features, and ambiguities from the user prompt.',
    parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ['prompt'] } },
  { name: 'create_blueprint',
    description: 'Transform prompt analysis into a complete website blueprint. Always called after analyze_prompt.',
    parameters: { type: Type.OBJECT,
      properties: { intent: { type: Type.STRING }, constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
        pages: { type: Type.ARRAY, items: { type: Type.STRING } }, features: { type: Type.ARRAY, items: { type: Type.STRING } } },
      required: ['intent', 'pages', 'features'] } },
  { name: 'request_clarification',
    description: 'Ask user for missing info. Call ONLY when critical details are absent.',
    parameters: { type: Type.OBJECT, properties: { questions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['questions'] } },
  { name: 'generate_backend_plan',
    description: 'Create backend architecture: API routes, auth, middleware, env vars. Always before frontend.',
    parameters: { type: Type.OBJECT, properties: { blueprint: { type: Type.OBJECT } }, required: ['blueprint'] } },
  { name: 'generate_database_plan',
    description: 'Generate PostgreSQL schema, SQL DDL, and data relationships.',
    parameters: { type: Type.OBJECT, properties: { blueprint: { type: Type.OBJECT } }, required: ['blueprint'] } },
  { name: 'generate_frontend_plan',
    description: 'Create UI component specs, layout strategy, and animation plan. After backend.',
    parameters: { type: Type.OBJECT, properties: { blueprint: { type: Type.OBJECT } }, required: ['blueprint'] } },
  { name: 'assemble_artifacts',
    description: 'Combine all plans into complete HTML/CSS/JS + SQL + API docs. Requires backend, frontend, and database plans.',
    parameters: { type: Type.OBJECT,
      properties: { backend_plan: { type: Type.OBJECT }, frontend_plan: { type: Type.OBJECT }, database_plan: { type: Type.OBJECT } },
      required: ['backend_plan', 'frontend_plan', 'database_plan'] } },
  { name: 'validate_bundle',
    description: 'Check artifact bundle for errors, missing elements, and schema mismatches. Always last.',
    parameters: { type: Type.OBJECT, properties: { files: { type: Type.ARRAY, items: { type: Type.OBJECT } } }, required: ['files'] } },
];

// ── Tool implementations ──────────────────────────────────────────────────────
async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  model: string,
  signal: AbortSignal,
  cache: Map<ToolName, unknown>,
): Promise<unknown> {
  if (cache.has(name)) return cache.get(name);

  switch (name) {

    case 'analyze_prompt': {
      const raw = await askGemini(model, `
Analyze this website request. Return ONLY valid JSON, no markdown:

REQUEST: "${(args.prompt as string).slice(0, 2000)}"

{
  "intent": "one sentence: exactly what the user wants to build",
  "constraints": ["array of constraints mentioned"],
  "pages": ["Home","About","all pages needed"],
  "features": ["every feature needed"],
  "ambiguities": ["anything unclear"],
  "audience": "target audience description"
}`.trim(), 1500, signal);
      return parseJSONWithRetry<PromptAnalysis>(raw, model, 'analyze_prompt', signal);
    }

    case 'create_blueprint': {
      const { intent, pages, features, constraints } = args as any;
      const raw = await askGemini(model, `
Create a complete website blueprint. Return ONLY valid JSON, no markdown:

INTENT: "${intent}"
PAGES: ${JSON.stringify(pages)}
FEATURES: ${JSON.stringify(features)}
CONSTRAINTS: ${JSON.stringify(constraints ?? [])}

{
  "project_type": "saas|portfolio|ecommerce|blog|corporate|restaurant|agency|other",
  "siteName": "Site Name",
  "tagline": "one-sentence tagline",
  "domain": "slug-no-spaces",
  "audience": "specific target audience",
  "pages": ${JSON.stringify(pages)},
  "sections": [
    {"name":"Navbar","type":"navbar","purpose":"sticky nav with logo, links, CTA","hasAnimation":false},
    {"name":"Hero","type":"hero","purpose":"above-fold headline + CTA","hasAnimation":true},
    {"name":"Features","type":"features","purpose":"3-col feature grid","hasAnimation":true},
    {"name":"Footer","type":"footer","purpose":"links, copyright, attribution","hasAnimation":false}
  ],
  "components": ["Navbar","HeroSection","FeatureGrid","Footer"],
  "data_models": [
    {"name":"users","fields":[
      {"name":"id","type":"UUID","note":"Primary key","nullable":false},
      {"name":"email","type":"VARCHAR","note":"Unique, indexed","nullable":false},
      {"name":"created_at","type":"TIMESTAMP","note":"Auto set","nullable":false,"defaultValue":"NOW()"}
    ],"relations":[],"indexes":["email (unique)"]}
  ],
  "integrations": ["Google Analytics"],
  "content_requirements": ["hero headline","feature descriptions"],
  "preview_requirements": ["responsive","smooth scroll"],
  "risk_flags": [],
  "colorScheme": {"primary":"#2563eb","secondary":"#1e40af","accent":"#06b6d4","background":"#0f172a","text":"#f8fafc","surface":"#1e293b"},
  "fonts": {"heading":"Inter","body":"Inter"},
  "tone": "professional",
  "seoKeywords": ["keyword1","keyword2","keyword3"]
}
Return ONLY the JSON object.`.trim(), 3000, signal);
      return parseJSONWithRetry<SiteBlueprint>(raw, model, 'create_blueprint', signal);
    }

    case 'request_clarification':
      return { questions: (args.questions as string[]) ?? [] };

    case 'generate_backend_plan': {
      const bp = args.blueprint as SiteBlueprint;
      const raw = await askGemini(model, `
Generate a production backend architecture plan for "${bp.siteName}" (${bp.project_type}).
Audience: ${bp.audience} | Pages: ${bp.pages.join(', ')} | Models: ${bp.data_models?.map(d => d.name).join(', ')}

Return ONLY valid JSON, no markdown:
{
  "backend_tasks": ["ordered implementation task list"],
  "api_routes": [
    {"method":"GET","path":"/api/health","description":"Health check","auth":false,"response":"{ status: string }"},
    {"method":"POST","path":"/api/auth/login","description":"Authenticate user","auth":false,"body":"{ email, password }","response":"{ token, user }"},
    {"method":"GET","path":"/api/users/me","description":"Get current user","auth":true,"response":"User object"}
  ],
  "auth_strategy": "Firebase Auth|JWT|OAuth2",
  "middleware": ["cors","rate-limiting","auth","helmet","request-validation"],
  "environment_vars": ["DATABASE_URL","JWT_SECRET","API_KEY"],
  "execution_order": ["1. Setup middleware","2. Auth routes","3. Domain routes","4. Error handlers"]
}
Include routes for all features the site needs.`.trim(), 2500, signal);
      return parseJSONWithRetry<BackendPlan>(raw, model, 'generate_backend_plan', signal);
    }

    case 'generate_database_plan': {
      const bp = args.blueprint as SiteBlueprint;
      const raw = await askGemini(model, `
Design a complete PostgreSQL schema for "${bp.siteName}" (${bp.project_type}).
Tables needed: ${bp.data_models?.map(d => d.name).join(', ')} | Pages: ${bp.pages.join(', ')}

Return ONLY valid JSON, no markdown:
{
  "database_tasks": ["Create users table","Add indexes","Create FK constraints"],
  "tables": [
    {
      "name": "users",
      "table": "users",
      "purpose": "Stores authenticated user accounts",
      "fields": [
        {"name":"id","type":"UUID","note":"Primary key","nullable":false},
        {"name":"email","type":"VARCHAR","note":"Unique, 255 chars max","nullable":false},
        {"name":"display_name","type":"VARCHAR","note":"User display name","nullable":true},
        {"name":"created_at","type":"TIMESTAMP","note":"Auto set on insert","nullable":false,"defaultValue":"NOW()"},
        {"name":"updated_at","type":"TIMESTAMP","note":"Auto updated","nullable":false,"defaultValue":"NOW()"}
      ],
      "relations": [],
      "indexes": ["email (unique)","created_at"]
    }
  ],
  "sql": "CREATE TABLE IF NOT EXISTS users (\\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\\n  email VARCHAR(255) UNIQUE NOT NULL,\\n  display_name VARCHAR(255),\\n  created_at TIMESTAMP NOT NULL DEFAULT NOW(),\\n  updated_at TIMESTAMP NOT NULL DEFAULT NOW()\\n);\\n\\nCREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);",
  "indexes": []
}
Write complete, runnable SQL DDL for ALL tables.`.trim(), 3000, signal);
      return parseJSONWithRetry<DatabasePlan>(raw, model, 'generate_database_plan', signal);
    }

    case 'generate_frontend_plan': {
      const bp = args.blueprint as SiteBlueprint;
      const raw = await askGemini(model, `
Plan the frontend for "${bp.siteName}" (${bp.tone} tone, ${bp.project_type}).
Sections: ${bp.sections?.map(s => s.name).join(', ')} | Colors: primary=${bp.colorScheme?.primary} accent=${bp.colorScheme?.accent} bg=${bp.colorScheme?.background}
Fonts: ${bp.fonts?.heading} / ${bp.fonts?.body}

Return ONLY valid JSON, no markdown:
{
  "frontend_tasks": ["ordered frontend implementation tasks"],
  "components": [
    {"name":"Navbar","type":"navigation","description":"Sticky top nav. Logo left, links center, CTA right. Hamburger at 768px.","hasAnimation":false},
    {"name":"HeroSection","type":"section","description":"Full-width hero. H1, subheadline, primary CTA, secondary link. Fade-in on load.","hasAnimation":true}
  ],
  "layout_strategy": "CSS Grid for page layout, Flexbox for components. 12-column grid.",
  "animation_strategy": "IntersectionObserver for scroll fade-in. CSS transitions only. No JS libs.",
  "responsive_breakpoints": ["640px","768px","1024px","1280px"]
}`.trim(), 2000, signal);
      return parseJSONWithRetry<FrontendPlan>(raw, model, 'generate_frontend_plan', signal);
    }

    case 'assemble_artifacts': {
      const bp           = args.blueprint   as SiteBlueprint | undefined;
      const backendPlan  = args.backend_plan  as BackendPlan  | undefined;
      const frontendPlan = args.frontend_plan as FrontendPlan | undefined;
      const databasePlan = args.database_plan as DatabasePlan | undefined;

      const routeList = backendPlan?.api_routes?.slice(0, 8)
        .map(r => `${r.method} ${r.path} — ${r.description}`).join('\n') ?? '';
      const componentList = frontendPlan?.components?.map(c => c.name).join(', ')
        ?? bp?.components?.join(', ') ?? '';

      const htmlPrompt = `
You are a senior frontend engineer. Generate a COMPLETE, production-quality website as ONE self-contained HTML file.

SITE SPEC:
  Name: ${bp?.siteName}  |  Type: ${bp?.project_type}  |  Tone: ${bp?.tone}
  Tagline: ${bp?.tagline}
  Audience: ${bp?.audience}
  Pages: ${bp?.pages?.join(', ')}
  Sections (ALL must be implemented): ${bp?.sections?.map(s => s.name).join(', ')}
  Components: ${componentList}
  Heading Font: ${bp?.fonts?.heading}  |  Body Font: ${bp?.fonts?.body}

COLOR SCHEME (declare as CSS custom properties at :root):
  --primary:   ${bp?.colorScheme?.primary}
  --secondary: ${bp?.colorScheme?.secondary}
  --accent:    ${bp?.colorScheme?.accent}
  --bg:        ${bp?.colorScheme?.background}
  --surface:   ${bp?.colorScheme?.surface}
  --text:      ${bp?.colorScheme?.text}

BACKEND ROUTES (reference in demo/navigation if relevant):
${routeList}

SEO KEYWORDS: ${bp?.seoKeywords?.join(', ')}

HARD REQUIREMENTS — ALL must be satisfied:
1. Single self-contained HTML file. ALL CSS in <style>. ALL JS in <script>. ZERO external JS except Google Fonts.
2. <link> Google Fonts for "${bp?.fonts?.heading}" and "${bp?.fonts?.body}" in <head>.
3. CSS custom properties at :root as listed above.
4. Every section listed must appear with REAL content specific to "${bp?.siteName}". NO Lorem Ipsum.
5. Fully responsive — mobile-first. Hamburger nav toggles at 768px using pure JS.
6. IntersectionObserver scroll fade-in on all sections. Smooth scroll on anchor links.
7. Hover states, keyboard focus rings. No inline event handlers — use addEventListener.
8. Semantic HTML5: <header><nav><main><section id="..."><footer> with aria-labels.
9. <title>, <meta name="description">, Open Graph tags, h1→h2→h3 hierarchy.
10. Footer: navigation links, copyright, link to https://builder.orinai.org.
11. MINIMUM 600 lines. Match tone precisely: ${bp?.tone}. Professional output only.
12. No external CSS frameworks. No jQuery. Pure CSS and vanilla JS only.

Return ONLY the raw HTML starting with <!DOCTYPE html>. No markdown. No backticks. No commentary before or after.`.trim();

      const rawHtml = await askGemini(model, htmlPrompt, 16384, signal);
      const html    = patchHtml(rawHtml, bp?.siteName ?? 'Website');

      const sql  = databasePlan?.sql?.trim()
        || generateSqlFromTables(databasePlan?.tables ?? bp?.data_models ?? []);
      const apiMd = buildApiMarkdown(bp, backendPlan);

      const files: ArtifactFile[] = [
        { path: 'index.html', content: html,   language: 'html',     sizeBytes: html.length   },
        { path: 'schema.sql', content: sql,    language: 'sql',      sizeBytes: sql.length    },
        { path: 'api.md',     content: apiMd,  language: 'markdown', sizeBytes: apiMd.length  },
      ];

      return {
        files,
        preview_entry: 'index.html',
        db_schema: sql,
        api_contracts: backendPlan?.api_routes?.map(r => `${r.method} ${r.path} — ${r.description}`) ?? [],
        status: 'assembling',
        assembled_at: new Date().toISOString(),
      } satisfies ArtifactBundle;
    }

    case 'validate_bundle': {
      const files = args.files as ArtifactFile[];
      const html  = files.find(f => f.path === 'index.html')?.content ?? '';
      const sql   = files.find(f => f.path === 'schema.sql')?.content ?? '';

      const checks: ValidationCheck[] = [
        { name: 'DOCTYPE present',        passed: html.toLowerCase().startsWith('<!doctype'),         message: html.toLowerCase().startsWith('<!doctype') ? 'Valid DOCTYPE' : 'Missing <!DOCTYPE html>' },
        { name: 'HTML closes properly',   passed: html.toLowerCase().includes('</html>'),             message: html.toLowerCase().includes('</html>') ? 'Closing tag found' : 'Missing </html>' },
        { name: 'Viewport meta',          passed: html.includes('viewport'),                          message: html.includes('viewport') ? 'Viewport meta found' : 'Missing viewport meta — mobile will break' },
        { name: 'Meta description',       passed: html.includes('<meta name="description"'),          message: html.includes('<meta name="description"') ? 'Meta description found' : 'Missing meta description — SEO impact' },
        { name: 'CSS custom properties',  passed: html.includes('--primary') && html.includes('--bg'),message: html.includes('--primary') ? 'CSS variables found' : 'CSS custom properties missing — theming broken' },
        { name: 'HTML length',            passed: html.length >= HTML_MIN_LENGTH,                     message: `HTML is ${Math.round(html.length/1024)}KB${html.length < HTML_MIN_LENGTH ? ' — may be incomplete' : ''}` },
        { name: 'Footer present',         passed: html.toLowerCase().includes('<footer'),             message: html.toLowerCase().includes('<footer') ? 'Footer found' : 'Missing <footer>' },
        { name: 'No inline handlers',     passed: !(/onclick\s*=\s*["']/i.test(html)),               message: /onclick\s*=\s*["']/i.test(html) ? 'Inline event handlers found' : 'No inline event handlers' },
        { name: 'SQL schema present',     passed: sql.length > 80,                                    message: `SQL is ${sql.length} chars` },
        { name: 'Google Fonts loaded',    passed: html.includes('fonts.googleapis.com'),              message: html.includes('fonts.googleapis.com') ? 'Google Fonts found' : 'Google Fonts not loaded' },
      ];

      const CRITICAL = new Set(['DOCTYPE present','HTML closes properly','Viewport meta']);
      return {
        valid:    checks.filter(c => CRITICAL.has(c.name)).every(c => c.passed),
        warnings: checks.filter(c => !c.passed && !CRITICAL.has(c.name)).map(c => c.message),
        errors:   checks.filter(c => !c.passed &&  CRITICAL.has(c.name)).map(c => c.message),
        checks,
      } satisfies ValidationResult;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── HTML patch ────────────────────────────────────────────────────────────────
function patchHtml(html: string, siteName: string): string {
  let out = html.trim()
    .replace(/^```(?:html)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
  if (!out.toLowerCase().startsWith('<!doctype')) out = '<!DOCTYPE html>\n' + out;
  if (!out.toLowerCase().endsWith('</html>'))    out += '\n</html>';
  if (!out.includes('builder.orinai.org'))
    out = out.replace('</body>', `<!-- Built with Orin Builder | builder.orinai.org -->\n</body>`);
  return out;
}

// ── SQL DDL generator (fallback when model returns no SQL) ────────────────────
function generateSqlFromTables(tables: any[]): string {
  if (!tables?.length) return '-- No tables defined\n';
  const TYPE_MAP: Record<string, string> = {
    UUID:'UUID', VARCHAR:'VARCHAR(255)', TEXT:'TEXT', INTEGER:'INTEGER',
    BIGINT:'BIGINT', BOOLEAN:'BOOLEAN', TIMESTAMP:'TIMESTAMP', JSONB:'JSONB',
    FLOAT:'FLOAT', DECIMAL:'DECIMAL(10,2)', ENUM:'TEXT',
  };
  return tables.map(t => {
    const tName = (t.table ?? t.name ?? 'unknown_table') as string;
    const cols  = (t.fields ?? [] as DbField[]).map((f: any) => {
      const pg   = TYPE_MAP[f.type] ?? f.type;
      const pk   = f.name === 'id' ? ' PRIMARY KEY DEFAULT gen_random_uuid()' : '';
      const nn   = f.nullable === false && !pk ? ' NOT NULL' : '';
      const def  = f.defaultValue && !pk ? ` DEFAULT ${f.defaultValue}` : '';
      return `  ${f.name} ${pg}${pk}${nn}${def}`;
    }).join(',\n');
    const stmt = `CREATE TABLE IF NOT EXISTS ${tName} (\n${cols}\n);`;
    const idx  = (t.indexes ?? [] as string[]).map((i: string) => {
      const col = i.split(' ')[0];
      const uniq = i.toLowerCase().includes('unique') ? 'UNIQUE ' : '';
      return `CREATE ${uniq}INDEX IF NOT EXISTS ${tName}_${col}_idx ON ${tName}(${col});`;
    }).join('\n');
    return idx ? `${stmt}\n${idx}` : stmt;
  }).join('\n\n');
}

// ── API markdown builder ───────────────────────────────────────────────────────
function buildApiMarkdown(bp?: SiteBlueprint, plan?: BackendPlan): string {
  const routes = plan?.api_routes ?? [];
  return [
    `# API Contracts — ${bp?.siteName ?? 'Website'}`,
    `> Generated: ${new Date().toISOString()} | Project: ${bp?.project_type ?? 'unknown'}`,
    '',
    `## Auth Strategy: ${plan?.auth_strategy ?? 'JWT'}`,
    '',
    `## Middleware`,
    ...(plan?.middleware ?? []).map(m => `- ${m}`),
    '',
    `## Routes`,
    '',
    ...routes.map(r => [
      `### \`${r.method} ${r.path}\``,
      r.description,
      `**Auth required:** ${r.auth ? 'Yes' : 'No'}`,
      ...(r.body     ? [`**Request body:** \`${r.body}\``]     : []),
      ...(r.response ? [`**Response:** \`${r.response}\``]    : []),
      '',
    ].join('  \n')),
    `## Environment Variables`,
    ...(plan?.environment_vars ?? []).map(v => `- \`${v}\``),
  ].join('\n');
}

// ── State/tool mapping ────────────────────────────────────────────────────────
const TOOL_TO_STATE: Record<ToolName, BuildState> = {
  analyze_prompt:         'analyzing',
  create_blueprint:       'planning',
  request_clarification:  'clarification_needed',
  generate_backend_plan:  'generating_backend',
  generate_database_plan: 'generating_database',
  generate_frontend_plan: 'generating_frontend',
  assemble_artifacts:     'assembling_preview',
  validate_bundle:        'validating',
};

const FATAL_TOOLS = new Set<ToolName>(['analyze_prompt','create_blueprint','assemble_artifacts']);

// ── Context injection (fills dependent tool args from prior results) ──────────
function injectContext(
  name: ToolName, args: Record<string, unknown>,
  ctx: { analysis?: any; blueprint?: any; backendPlan?: any; databasePlan?: any; frontendPlan?: any },
): Record<string, unknown> {
  const out = { ...args };
  if (name === 'create_blueprint' && ctx.analysis) {
    out.intent      ??= ctx.analysis.intent;
    out.pages       ??= ctx.analysis.pages;
    out.features    ??= ctx.analysis.features;
    out.constraints ??= ctx.analysis.constraints;
  }
  if (['generate_backend_plan','generate_database_plan','generate_frontend_plan'].includes(name) && ctx.blueprint) {
    out.blueprint = ctx.blueprint;
  }
  if (name === 'assemble_artifacts') {
    if (ctx.blueprint)    out.blueprint     = ctx.blueprint;
    if (ctx.backendPlan)  out.backend_plan  ??= ctx.backendPlan;
    if (ctx.frontendPlan) out.frontend_plan ??= ctx.frontendPlan;
    if (ctx.databasePlan) out.database_plan ??= ctx.databasePlan;
  }
  return out;
}

function makeFnResponse(name: string, id: string | undefined, result: unknown) {
  return { role: 'user', parts: [{ functionResponse: { name, ...(id ? { id } : {}), response: result } }] };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted','AbortError')); return; }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted','AbortError')); }, { once: true });
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────────
export class Orchestrator {
  private projectId: string;
  private model:     string;
  private onEvent:   EventCallback;
  private ctrl = new AbortController();
  private cache = new Map<ToolName, unknown>();

  constructor(pid: string, model: string, cb: EventCallback) {
    this.projectId = pid; this.model = model; this.onEvent = cb;
  }

  get signal() { return this.ctrl.signal; }

  abort() {
    this.ctrl.abort();
    this.emit('state_changed', 'failed', { message: 'Build aborted by user', progress: 0 });
  }

  private emit(type: StreamEventType, state: BuildState, opts: Partial<StreamEvent> = {}) {
    this.onEvent({
      type, project_id: this.projectId, state,
      timestamp: new Date().toISOString(),
      progress: BUILD_STATE_META[state]?.progressAt ?? 0,
      ...opts,
    });
  }

  private transition(next: BuildState, from: BuildState, opts: Partial<StreamEvent> = {}) {
    if (!canTransition(from, next)) {
      console.warn(`[orchestrator] ${from} → ${next} not in allowed transitions`);
    }
    this.emit('state_changed', next, {
      message:      BUILD_STATE_META[next]?.message,
      progress:     BUILD_STATE_META[next]?.progressAt,
      current_task: BUILD_STATE_META[next]?.label,
      ...opts,
    });
  }

  async run(
    prompt: string,
    user: UserAccount | null,
    existingClarifications?: Record<string, string>,
    waitForClarification?: (qs: string[]) => Promise<Record<string, string> | null>,
  ) {
    const { signal } = this;
    let analysis: any, blueprint: any, backendPlan: any, databasePlan: any, frontendPlan: any;
    let bundle: ArtifactBundle | undefined;

    this.emit('state_changed', 'queued', { message: 'Build queued', progress: 0 });

    const systemMsg = `
You are the OrinAI Builder orchestrator. Build a website by calling tools in this exact order:
1. analyze_prompt
2. create_blueprint
3. request_clarification (ONLY if critical info is missing — skip otherwise)
4. generate_backend_plan (ALWAYS before frontend)
5. generate_database_plan
6. generate_frontend_plan
7. assemble_artifacts (requires backend_plan, frontend_plan, database_plan)
8. validate_bundle (always last)

Rules: ONE tool at a time. Pass prior results into later tools. Do NOT repeat any tool.
USER PROMPT: "${prompt.slice(0, 1000)}"
${existingClarifications ? `ANSWERS ALREADY PROVIDED: ${JSON.stringify(existingClarifications)}\nDo NOT call request_clarification.` : ''}`.trim();

    let history: any[] = [{ role: 'user', parts: [{ text: systemMsg }] }];
    let state: BuildState = 'queued';
    let iter = 0;

    while (iter < MAX_TOOL_ITERATIONS && !signal.aborted) {
      iter++;
      let response: any;
      try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        response = await ai.models.generateContent({
          model: this.model,
          contents: history,
          config: { tools: [{ functionDeclarations: TOOL_DECLARATIONS }], maxOutputTokens: 2048, temperature: GEMINI_TEMPERATURE },
        });
      } catch (e: any) {
        this.transition('failed', state, { message: `Gemini API error: ${e.message}` });
        return { blueprint, bundle, state: 'failed' as BuildState, error: e.message };
      }

      if (response.candidates?.[0]?.content?.parts)
        history.push({ role: 'model', parts: response.candidates[0].content.parts });

      const fcs = response.functionCalls;
      if (!fcs?.length) break;

      const responses: any[] = [];

      for (const fc of fcs) {
        if (signal.aborted) break;
        const toolName = fc.name as ToolName;
        const args = injectContext(toolName, fc.args ?? {}, { analysis, blueprint, backendPlan, databasePlan, frontendPlan });
        const newState = TOOL_TO_STATE[toolName] ?? state;

        if (newState !== state) { this.transition(newState, state, { tool_name: toolName, tool_call_id: fc.id }); state = newState; }
        this.emit('tool_call_started', state, { tool_name: toolName, tool_call_id: fc.id });

        // Clarification: pause pipeline
        if (toolName === 'request_clarification') {
          const qs = (args.questions as string[]) ?? [];
          if (qs.length && waitForClarification && !existingClarifications) {
            this.emit('clarification_requested', 'clarification_needed', { message: `${qs.length} question(s) needed` });
            const answers = await Promise.race([
              waitForClarification(qs),
              sleep(CLARIFICATION_TIMEOUT_MS, signal).then(() => null),
            ]).catch(() => null);
            if (!answers) {
              this.transition('failed', state, { message: 'Clarification timed out' });
              return { blueprint, bundle, state: 'failed' as BuildState, error: 'Clarification not provided' };
            }
            responses.push(makeFnResponse(toolName, fc.id, { answers }));
            continue;
          }
          responses.push(makeFnResponse(toolName, fc.id, { skipped: true }));
          continue;
        }

        // Execute with retry
        let result: unknown; let lastErr: Error | null = null;
        for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
          if (signal.aborted) break;
          try {
            result = await executeTool(toolName, args, this.model, signal, this.cache);
            this.cache.set(toolName, result);
            lastErr = null;
            break;
          } catch (e: any) {
            lastErr = e;
            if (attempt < MAX_RETRY_ATTEMPTS) {
              this.emit('retry_attempt', state, { tool_name: toolName, attempt, message: `Retrying ${toolName} (${attempt}/${MAX_RETRY_ATTEMPTS}): ${e.message}` });
              await sleep(RETRY_BASE_DELAY_MS * attempt, signal).catch(() => {});
            }
          }
        }

        if (lastErr) {
          if (FATAL_TOOLS.has(toolName)) {
            this.transition('failed', state, { message: lastErr.message });
            return { blueprint, bundle, state: 'failed' as BuildState, error: lastErr.message };
          }
          this.emit('validation_warning', state, { message: `${toolName} failed (non-fatal): ${lastErr.message}` });
          responses.push(makeFnResponse(toolName, fc.id, { error: lastErr.message }));
          continue;
        }

        if (toolName === 'analyze_prompt')         analysis     = result;
        if (toolName === 'create_blueprint')        blueprint    = result as SiteBlueprint;
        if (toolName === 'generate_backend_plan')   backendPlan  = result;
        if (toolName === 'generate_database_plan')  databasePlan = result;
        if (toolName === 'generate_frontend_plan')  frontendPlan = result;
        if (toolName === 'assemble_artifacts') {
          bundle = result as ArtifactBundle;
          const htmlSize = bundle.files.find(f => f.path === 'index.html')?.sizeBytes ?? 0;
          this.emit('artifact_created', state, { artifact_path: 'index.html', message: `HTML assembled (${Math.round(htmlSize/1024)}KB)` });
        }
        if (toolName === 'validate_bundle' && bundle) {
          const v = result as ValidationResult;
          bundle = { ...bundle, status: v.valid ? 'complete' : 'partial', validation: v };
          v.warnings.forEach(w => this.emit('validation_warning', state, { message: w }));
          v.errors.forEach(e   => this.emit('validation_error',   state, { message: e }));
        }

        this.emit('tool_call_completed', state, { tool_name: toolName, tool_call_id: fc.id });
        responses.push(makeFnResponse(toolName, fc.id, result));
      }

      for (const r of responses) history.push(r);
    }

    // Post-loop: run validation if bundle exists and validate_bundle didn't run
    if (bundle && !this.cache.has('validate_bundle') && !signal.aborted) {
      this.transition('validating', state);
      state = 'validating';
      try {
        const v = await executeTool('validate_bundle', { files: bundle.files }, this.model, signal, this.cache) as ValidationResult;
        bundle = { ...bundle, status: v.valid ? 'complete' : 'partial', validation: v };
        v.warnings.forEach(w => this.emit('validation_warning', 'validating', { message: w }));
      } catch { /* non-fatal */ }
    }

    if (signal.aborted)
      return { blueprint, bundle, state: 'failed' as BuildState, error: 'Aborted' };

    const final: BuildState = bundle ? 'complete' : 'failed';
    this.transition(final, state, { progress: 100, artifact_path: 'index.html',
      message: final === 'complete' ? 'Build complete.' : 'Build did not produce output.' });
    this.emit('build_complete', final, { progress: 100 });

    return {
      analysis, blueprint, backendPlan, databasePlan, frontendPlan,
      bundle: bundle ? { ...bundle, status: bundle.status === 'assembling' ? 'complete' : bundle.status } : undefined,
      state: final,
      title: (blueprint as SiteBlueprint | undefined)?.siteName ?? 'Untitled',
    };
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────
export function createOrchestrator(pid: string, user: UserAccount | null, cb: EventCallback): Orchestrator {
  return new Orchestrator(pid, getModel(user), cb);
}
