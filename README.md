# Orin Builder

**AI website builder** — sub-product of [Orin AI](https://www.orinai.org) by JN Productions.

Enter a prompt → Gemini generates blueprint + DB schema + full production HTML/CSS/JS.

## Setup
```bash
npm install
cp .env.local.example .env.local   # fill in API_KEY
npm run dev                         # :5174
```

## SSO
Same Firebase project `orin-ai-f6798`. Users signed in to orinai.org are automatically signed in here.
Cross-subdomain: main app navigates with `?ot=<idToken>`, exchanged via `issueCustomToken` Cloud Function.
See README for full Cloud Function snippet.

## Deploy
```bash
npm run build && vercel --prod
# Vercel env vars: API_KEY, FIREBASE_API_KEY, FIREBASE_APP_ID
firebase deploy --only firestore:rules
```

© 2026 JN Productions Global • Orin AI
