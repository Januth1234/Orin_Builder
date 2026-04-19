/**
 * components/LandingPage.tsx — /home route
 *
 * SKETCH ONLY — intentionally minimal.
 * Codex should finish the visual design.
 *
 * Structure:
 *   <header>  — logo + nav
 *   <Hero>    — headline, subheadline, CTA → /
 *   <Features>— 3 feature cards
 *   <footer>  — links, branding
 *
 * TODO (Codex):
 *   - Full visual design matching Orin AI brand
 *   - Animations (fade-in, scroll triggers)
 *   - Responsive polish
 *   - Feature screenshots / preview mockup
 *   - Pricing section
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config';

// ── Feature definitions — Codex should turn these into polished cards ─────────
const FEATURES = [
  {
    icon: '⚡',
    title: 'Prompt → Website',
    description: 'Describe your site in plain language. Gemini generates a complete blueprint, database schema, and production HTML.',
  },
  {
    icon: '🏗',
    title: 'Backend-First',
    description: 'API routes, auth strategy, and database schema are designed before any frontend code is generated.',
  },
  {
    icon: '🔍',
    title: 'Live Preview',
    description: 'Watch your website take shape in real time. Switch between desktop, tablet, and mobile viewports.',
  },
];

const LandingPage: React.FC = () => {
  const nav = useNavigate();

  return (
    // SKETCH: Codex should apply full dark theme, animations, and brand styling
    <div className="min-h-screen bg-b-bg text-white flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-b-border">
        <a href="/home" className="text-xl font-bold">
          <span className="text-b-accent">Orin</span>
          <span className="text-b-blue">AI</span>
          <span className="text-white ml-1.5 font-normal text-base">Builder</span>
        </a>
        <nav className="flex items-center gap-6">
          {/* TODO Codex: add smooth-scroll links to features, pricing sections */}
          <a href={APP_CONFIG.mainAppUrl} target="_blank" rel="noreferrer"
             className="text-sm text-b-muted hover:text-white transition-colors">
            Orin AI →
          </a>
          <button
            onClick={() => nav('/')}
            className="px-4 py-2 rounded-xl bg-b-accent text-black text-sm font-semibold hover:bg-green-400 transition-colors">
            Open Builder
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      {/* TODO Codex: full-width hero, animated headline, mockup screenshot, gradient bg */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
        <h1 className="text-5xl font-bold max-w-2xl leading-tight">
          {/* TODO Codex: animated gradient text */}
          Build any website from a single prompt.
        </h1>
        <p className="text-xl text-b-muted max-w-xl">
          Orin Builder uses Gemini to generate a complete site — blueprint, database schema,
          and production HTML/CSS/JS — in seconds.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav('/')}
            className="px-8 py-3 rounded-xl bg-b-accent text-black font-semibold text-base hover:bg-green-400 active:scale-[0.97] transition-all">
            ⚡ Start Building Free
          </button>
          <a href={APP_CONFIG.mainAppUrl} target="_blank" rel="noreferrer"
             className="px-6 py-3 rounded-xl border border-b-border text-b-muted text-sm hover:text-white hover:border-b-muted transition-colors">
            Visit Orin AI
          </a>
        </div>
        {/* TODO Codex: embed a short animated demo video or screenshot here */}
        <div className="w-full max-w-3xl h-64 bg-b-surf border border-b-border rounded-2xl flex items-center justify-center text-b-dim text-sm mt-4">
          {/* TODO Codex: Replace with product screenshot / animated preview */}
          [Product screenshot placeholder]
        </div>
      </section>

      {/* ── Features ── */}
      {/* TODO Codex: 3-column grid with icons, hover effects, and scroll fade-in */}
      <section className="px-8 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-b-surf border border-b-border rounded-2xl p-6 flex flex-col gap-3">
              {/* TODO Codex: replace emoji with SVG icons, add hover scale */}
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-b-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-8 py-6 border-t border-b-border flex items-center justify-between text-xs text-b-dim">
        <span>{APP_CONFIG.branding}</span>
        <div className="flex gap-4">
          <a href={`${APP_CONFIG.mainAppUrl}/#terms`} target="_blank" rel="noreferrer" className="hover:text-b-muted transition-colors">Terms</a>
          <a href={`${APP_CONFIG.mainAppUrl}/#privacy`} target="_blank" rel="noreferrer" className="hover:text-b-muted transition-colors">Privacy</a>
          <a href={`https://github.com/${APP_CONFIG.githubRepo}`} target="_blank" rel="noreferrer" className="hover:text-b-muted transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
