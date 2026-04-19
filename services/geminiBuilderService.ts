/**
 * services/geminiBuilderService.ts — Orin Builder
 *
 * Thin wrapper kept for backward compat.
 * All generation is now handled by services/orchestrator.ts.
 * This file exposes a simple refine() helper used by the store.
 */

import { GoogleGenAI } from '@google/genai';
import { APP_CONFIG, PLAN_LIMITS } from '../config';
import type { UserAccount, ArtifactFile } from '../types';

function getApiKey(): string {
  const k = process.env.API_KEY;
  if (k) return k;
  throw new Error('API_KEY not set. Add it to .env.local');
}

function getModel(user: UserAccount | null): string {
  if (!user) return APP_CONFIG.defaultModel;
  return PLAN_LIMITS[user.tier]?.premiumModel ? APP_CONFIG.premiumModel : APP_CONFIG.defaultModel;
}

/**
 * Apply a refinement instruction to an existing HTML file.
 * Called when the user types in the refine bar after a completed build.
 */
export async function refineHtml(
  existingHtml: string,
  instruction: string,
  user: UserAccount | null,
  onProgress?: (msg: string) => void,
): Promise<string> {
  const model = getModel(user);
  const ai    = new GoogleGenAI({ apiKey: getApiKey() });

  onProgress?.('Applying refinement…');

  const prompt = `
You have an existing website HTML. Apply ONLY the requested change. Keep everything else intact.

REFINEMENT: "${instruction}"

EXISTING HTML:
${existingHtml}

Return ONLY the updated HTML — no markdown, no backticks. Start with <!DOCTYPE html>.
  `.trim();

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { maxOutputTokens: 16384 },
  });

  let out = (res.text ?? '').trim();
  if (out.startsWith('```')) out = out.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();
  if (!out.toLowerCase().startsWith('<!doctype')) out = '<!DOCTYPE html>\n' + out;
  if (!out.toLowerCase().endsWith('</html>')) out += '\n</html>';

  onProgress?.('Refinement complete');
  return out;
}
