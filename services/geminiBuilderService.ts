/**
 * services/geminiBuilderService.ts — Orin Builder
 *
 * Refinement helper — POSTs to orinai.org /api/chat (mode=refine-html)
 * so the Gemini API key stays server-side only.
 * Falls back to direct SDK call only in local dev (API_KEY in env).
 */
import { GoogleGenAI } from '@google/genai';
import { APP_CONFIG, PLAN_LIMITS } from '../config';
import type { UserAccount } from '../types';
import { firebaseService } from './firebaseService';

function getModel(user: UserAccount | null): string {
  if (!user) return APP_CONFIG.defaultModel;
  return PLAN_LIMITS[user.tier]?.premiumModel ? APP_CONFIG.premiumModel : APP_CONFIG.defaultModel;
}

/**
 * Apply a refinement instruction to an existing HTML file.
 * Routes through the main Orin AI backend (/api/chat mode=refine-html)
 * so the Gemini API key never ships to the browser.
 */
export async function refineHtml(
  existingHtml: string,
  instruction: string,
  user: UserAccount | null,
  onProgress?: (msg: string) => void,
): Promise<string> {
  onProgress?.('Applying refinement…');

  const model = getModel(user);
  const plan  = (user as any)?.plan ?? 'free';

  // ── Try backend proxy first (production) ──────────────────────────────────
  try {
    let idToken: string | null = null;
    try { idToken = await (firebaseService as any).getIdToken?.(); } catch {}

    const BACKEND = 'https://www.orinai.org/api/chat';
    const r = await fetch(BACKEND, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({
        mode: 'refine-html',
        existingHtml,
        instruction,
        plan,
      }),
    });

    if (r.ok) {
      const d = await r.json();
      if (d.html) {
        onProgress?.('Refinement complete');
        return d.html;
      }
    }
  } catch { /* fall through to local dev fallback */ }

  // ── Local dev fallback (API_KEY in .env.local) ───────────────────────────
  const apiKey = (process.env as any).API_KEY;
  if (!apiKey) throw new Error('Refinement failed: backend unavailable and API_KEY not set for local dev.');

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You have an existing website HTML. Apply ONLY the requested change. Keep everything else intact.\n\nREFINEMENT: "${instruction}"\n\nEXISTING HTML:\n${existingHtml}\n\nReturn ONLY the updated HTML — no markdown, no backticks. Start with <!DOCTYPE html>.`;

  const res = await ai.models.generateContent({ model, contents: prompt, config: { maxOutputTokens: 16384 } });
  let out = (res.text ?? '').trim();
  if (out.startsWith('```')) out = out.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();
  if (!out.toLowerCase().startsWith('<!doctype')) out = '<!DOCTYPE html>\n' + out;
  if (!out.toLowerCase().endsWith('</html>')) out += '\n</html>';

  onProgress?.('Refinement complete');
  return out;
}
