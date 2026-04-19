# Orin Builder — Codex Handoff

## What this is
AI website builder sub-product of [Orin AI](https://www.orinai.org).
- `/` → builder workspace (authenticated)
- `/home` → marketing landing page (public)

## Backend status: PRODUCTION-READY ✓
All backend work is done. Do not modify:
- `services/orchestrator.ts` — Gemini function-calling pipeline
- `services/firebaseService.ts` — auth, SSO, Firestore persistence
- `services/builderStore.ts` — Zustand state machine
- `types.ts` — all shared types

## Frontend status: SKETCH — needs Codex
These components are intentional sketches with `// TODO Codex:` markers:
- `components/LandingPage.tsx` — `/home` route, needs full visual design
- `components/BuilderApp.tsx` — layout shell is functional, needs visual polish
- `components/BuilderSidebar.tsx` — functional, needs polish
- `components/panels/*.tsx` — functional, needs polish

## Stack
React 18 + TypeScript + Vite + TailwindCSS + Firebase + Gemini (`@google/genai`) + Zustand + react-router-dom

## Routes
| Route | Component | Auth |
|---|---|---|
| `/` | `BuilderApp` (inside `AuthGate`) | Required |
| `/home` | `LandingPage` | Public |

## Color tokens (Tailwind custom)
```
bg-b-bg      #0c0d11   page background
bg-b-surf    #13141b   panel background
bg-b-elev    #1a1b24   elevated surface
bg-b-border  #1f2130   borders
text-b-accent #22c892  primary accent (green)
text-b-blue   #4d9fff  secondary accent
text-b-muted  #686b7e  muted text
text-b-dim    #45475a  very dim text
```

## LandingPage TODOs for Codex
1. Animated gradient headline
2. Product screenshot / animated demo mockup
3. Pricing section (link to orinai.org/pricing)
4. Scroll-triggered fade-ins using IntersectionObserver
5. Testimonials or social proof section
6. Full mobile responsive polish
7. Replace placeholder icons with SVGs

## BuilderApp TODOs for Codex
1. Micro-animations on tab switches
2. Build progress visualization improvements
3. Mobile responsive layout (currently desktop-optimized)
4. Keyboard shortcuts (⌘K for new project, ⌘Enter to generate)

## Backend: how the pipeline works
```
User prompt → builderStore.generate()
  → createOrchestrator()
  → orchestrator.run()
    ↳ Gemini function-calling loop (up to 20 iterations)
    ↳ Tools called in order: analyze_prompt → create_blueprint
      → generate_backend_plan → generate_database_plan
      → generate_frontend_plan → assemble_artifacts → validate_bundle
    ↳ Each tool calls Gemini internally (3 retries, exponential backoff)
    ↳ Events emitted via EventCallback → builderStore → React state
  → firebaseService.saveProject() (strips large HTML content before write)
  → loadProjects() refreshes sidebar history
```

## Key backend contracts

### ArtifactBundle (the output)
```typescript
{
  files: [
    { path: 'index.html', content: '<full html>', language: 'html' },
    { path: 'schema.sql', content: 'CREATE TABLE...', language: 'sql' },
    { path: 'api.md',     content: '# API Contracts...', language: 'markdown' },
  ],
  preview_entry: 'index.html',
  db_schema: 'CREATE TABLE...',
  api_contracts: ['GET /api/users — ...'],
  status: 'complete',
  validation: { valid: true, warnings: [], errors: [], checks: [...] },
}
```

### StreamEvent (live build updates)
```typescript
{ type, project_id, state, timestamp, message, progress, current_task, tool_name }
```
States: queued → analyzing → planning → generating_backend → generating_database
        → generating_frontend → assembling_preview → validating → complete

### Clarification flow
If Gemini calls `request_clarification`, the pipeline pauses.
builderStore exposes `clarificationQuestions` and `submitClarification()`.
BuilderApp renders `ClarificationBanner` automatically.
5-minute timeout — auto-fails if not answered.

## Firestore schema
```
/users/{uid}
  id, name, email, avatar, tier, plan, dailyUsage, createdAt

/builder_projects/{docId}
  userId, prompt, state, title, events[],
  analysis, blueprint, backendPlan, databasePlan, frontendPlan,
  bundle (HTML stripped, metadata only), clarifications,
  createdAt, updatedAt, isPublished
```

## SSO setup (one-time)
Add to main repo `functions/index.js`:
```js
exports.issueCustomToken = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://build.orinai.org');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  const { idToken } = req.body;
  const decoded = await admin.auth().verifyIdToken(idToken);
  const token = await admin.auth().createCustomToken(decoded.uid);
  res.json({ customToken: token });
});
```

## Deploy
```bash
npm run build && vercel --prod
# Env vars: API_KEY, FIREBASE_API_KEY, FIREBASE_APP_ID
firebase deploy --only firestore:rules
```
