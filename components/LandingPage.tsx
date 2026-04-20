import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Database, Gauge, LayoutTemplate, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { APP_CONFIG } from '../config';

type Feature = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

type Plan = {
  name: string;
  price: string;
  note: string;
  points: string[];
  featured?: boolean;
};

const FEATURES: Feature[] = [
  {
    title: 'Prompt to production website',
    description:
      'Describe the business in plain language and generate a complete website with structure, copy, and live preview.',
    Icon: Sparkles,
  },
  {
    title: 'Backend-first planning',
    description:
      'Routes, data models, and architecture are planned before UI assembly so the generated output stays aligned to real contracts.',
    Icon: LayoutTemplate,
  },
  {
    title: 'Schema-aware generation',
    description:
      'Database entities and API contracts are generated in the same pipeline and surfaced inside the builder for verification.',
    Icon: Database,
  },
  {
    title: 'Live build telemetry',
    description:
      'Track each generation phase from analysis to validation with progress feedback and event details in real time.',
    Icon: Gauge,
  },
  {
    title: 'Secure account continuity',
    description:
      'Sign in with the same Orin AI account and continue projects with shared identity, plan tiers, and workspace history.',
    Icon: ShieldCheck,
  },
  {
    title: 'Launch-ready artifacts',
    description:
      'Export complete bundles and refine quickly so teams can iterate and ship without rebuilding the project from scratch.',
    Icon: Rocket,
  },
];

const STATS = [
  { label: 'Pipeline Steps', value: '8' },
  { label: 'Contract Layers', value: 'Frontend + API + DB' },
  { label: 'Preview Modes', value: 'Desktop / Tablet / Mobile' },
];

const TESTIMONIALS = [
  {
    quote:
      'The clarification flow prevented bad assumptions and gave us a reliable first version in one build.',
    name: 'Kasun Rajapaksha',
    role: 'Founder, LankaLaunch',
  },
  {
    quote:
      'We used the preview and schema tabs side by side to align frontend and backend before development started.',
    name: 'Nethmi Perera',
    role: 'Product Manager, NorthBay Labs',
  },
  {
    quote:
      'The generated structure was clean enough for our team to iterate immediately instead of rewriting everything.',
    name: 'Dilan Fernando',
    role: 'Engineering Lead, BuildPath',
  },
];

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: 'Free',
    note: 'For exploring ideas quickly',
    points: ['Limited daily builds', 'Live preview workspace', 'Export generated HTML'],
  },
  {
    name: 'Growth',
    price: 'Basic',
    note: 'For active product teams',
    featured: true,
    points: ['Higher build quota', 'Project history & refinements', 'Priority generation throughput'],
  },
  {
    name: 'Pro',
    price: 'Verified / BYO',
    note: 'For production workflows',
    points: ['Expanded model access', 'Advanced generation limits', 'Long-running project continuity'],
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal="true"]'));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -8% 0px',
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-b-bg text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-orb landing-orb-a" />
        <div className="landing-orb landing-orb-b" />
      </div>

      <header className="sticky top-0 z-40 border-b border-b-border/80 bg-b-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/home" className="flex items-center gap-1.5 text-lg font-bold">
            <span className="text-b-accent">Orin</span>
            <span className="text-b-blue">AI</span>
            <span className="ml-1 text-sm font-medium text-white/80">Builder</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-b-muted md:flex">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#proof" className="hover:text-white transition-colors">
              Proof
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={APP_CONFIG.mainAppUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg border border-b-border px-3 py-1.5 text-xs text-b-muted transition-colors hover:border-b-muted hover:text-white sm:inline-flex"
            >
              Main App
            </a>
            <button
              onClick={() => navigate('/')}
              className="rounded-lg bg-b-accent px-3.5 py-1.5 text-xs font-semibold text-black transition-all hover:bg-green-400 active:scale-[0.98]"
            >
              Open Builder
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-14 sm:px-6 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div data-reveal="true" className="reveal-on-scroll space-y-6">
              <p className="inline-flex items-center rounded-full border border-b-border bg-b-surf/70 px-3 py-1 text-xs text-b-muted">
                AI website builder for real product workflows
              </p>

              <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                Build polished websites from a single prompt.
                <span className="hero-gradient-title mt-2 block">Blueprint, schema, API, and preview in one flow.</span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-b-muted sm:text-lg">
                Orin Builder turns intent into deploy-ready output with live build-state feedback, contract-aware planning,
                and a responsive preview workspace your team can iterate on immediately.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="rounded-xl bg-b-accent px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-green-400 active:scale-[0.98]"
                >
                  Start Building
                </button>
                <a
                  href="https://www.orinai.org/pricing"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-b-border px-5 py-3 text-sm font-medium text-b-muted transition-colors hover:border-b-muted hover:text-white"
                >
                  View Pricing
                </a>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {STATS.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-b-border bg-b-surf/60 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-b-dim">{stat.label}</p>
                    <p className="text-sm font-medium text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div data-reveal="true" className="reveal-on-scroll">
              <div className="rounded-2xl border border-b-border bg-b-surf/80 p-3 shadow-2xl shadow-black/30">
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-b-border bg-b-bg px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-red-500/70" />
                  <span className="h-2 w-2 rounded-full bg-amber-500/70" />
                  <span className="h-2 w-2 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-b-muted">builder.orinai.org</span>
                </div>

                <div className="grid gap-3 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-xl border border-b-border bg-b-bg p-3">
                    <p className="text-[10px] uppercase tracking-wide text-b-dim">Build Pipeline</p>
                    <div className="mt-2 space-y-2">
                      {['Analyzing prompt', 'Blueprint planning', 'Database schema', 'Frontend assembly', 'Validation'].map((item, idx) => (
                        <div key={item} className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${idx < 3 ? 'bg-b-accent' : 'bg-b-border'}`} />
                          <span className="text-xs text-b-muted">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-b-border bg-white p-2">
                    <div className="preview-shimmer h-44 rounded-lg bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-3 sm:h-52">
                      <div className="h-2.5 w-24 rounded bg-white/30" />
                      <div className="mt-2 h-1.5 w-36 rounded bg-white/20" />
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="h-14 rounded bg-white/15" />
                        <div className="h-14 rounded bg-white/10" />
                        <div className="h-14 rounded bg-white/10" />
                        <div className="h-14 rounded bg-white/15" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-16">
          <div data-reveal="true" className="reveal-on-scroll mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-b-dim">Features</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Everything needed to ship the first version fast</h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, description }) => (
              <article
                key={title}
                data-reveal="true"
                className="reveal-on-scroll rounded-2xl border border-b-border bg-b-surf/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-b-muted"
              >
                <div className="mb-3 inline-flex rounded-xl border border-b-border bg-b-bg p-2">
                  <Icon size={16} className="text-b-accent" />
                </div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-b-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="proof" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-16">
          <div data-reveal="true" className="reveal-on-scroll rounded-3xl border border-b-border bg-b-surf/60 p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-b-dim">Social proof</p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Teams using Orin Builder for launch workflows</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((item) => (
                <figure key={item.name} className="rounded-xl border border-b-border bg-b-bg/60 p-4">
                  <blockquote className="text-sm leading-relaxed text-b-muted">"{item.quote}"</blockquote>
                  <figcaption className="mt-4">
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-b-dim">{item.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-16">
          <div data-reveal="true" className="reveal-on-scroll mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-b-dim">Pricing</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Plans that scale from idea to production</h2>
            </div>
            <a
              href="https://www.orinai.org/pricing"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-b-blue transition-colors hover:text-blue-300"
            >
              Full pricing details on Orin AI
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                data-reveal="true"
                className={`reveal-on-scroll rounded-2xl border p-5 ${
                  plan.featured
                    ? 'border-b-accent/60 bg-b-accent/10 shadow-lg shadow-b-accent/10'
                    : 'border-b-border bg-b-surf/70'
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-b-dim">{plan.name}</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{plan.price}</h3>
                <p className="mt-2 text-sm text-b-muted">{plan.note}</p>

                <ul className="mt-4 space-y-2">
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-b-muted">
                      <Check size={14} className="mt-0.5 flex-shrink-0 text-b-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:pb-20">
          <div data-reveal="true" className="reveal-on-scroll rounded-2xl border border-b-border bg-b-surf/70 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white">Ready to build your next launch site?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-b-muted sm:text-base">
              Start in the builder workspace, generate your first version, and refine in minutes with the same account you
              use on Orin AI.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/')}
                className="rounded-xl bg-b-accent px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-green-400 active:scale-[0.98]"
              >
                Open Builder Workspace
              </button>
              <a
                href={APP_CONFIG.mainAppUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-b-border px-5 py-2.5 text-sm text-b-muted transition-colors hover:border-b-muted hover:text-white"
              >
                Visit Orin AI
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-b-border bg-b-surf/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-b-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>{APP_CONFIG.branding}</span>
          <div className="flex flex-wrap items-center gap-4">
            <a href={`${APP_CONFIG.mainAppUrl}/#terms`} target="_blank" rel="noreferrer" className="hover:text-b-muted">
              Terms
            </a>
            <a href={`${APP_CONFIG.mainAppUrl}/#privacy`} target="_blank" rel="noreferrer" className="hover:text-b-muted">
              Privacy
            </a>
            <a href={`https://github.com/${APP_CONFIG.githubRepo}`} target="_blank" rel="noreferrer" className="hover:text-b-muted">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
