import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Code2, Database, Gauge, LayoutTemplate, Rocket, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { APP_CONFIG } from '../config';

const FEATURES = [
  { icon: Sparkles,      title: 'Prompt to website',        desc: 'Describe your site in plain English. Get a full HTML/CSS/JS build with live preview in seconds.' },
  { icon: LayoutTemplate,title: 'Blueprint-first planning', desc: 'Architecture, pages, sections and colour scheme locked in before a line of code is written.' },
  { icon: Database,      title: 'Schema-aware output',      desc: 'Database schema and API contracts generated in the same pipeline and shown for verification.' },
  { icon: Gauge,         title: 'Live build telemetry',     desc: 'Watch every pipeline stage from analysis to validation with real-time progress feedback.' },
  { icon: Code2,         title: 'Full-stack artifacts',     desc: 'Download a complete bundle — HTML, SQL schema, and API contract docs — ready to ship.' },
  { icon: ShieldCheck,   title: 'Ecosystem SSO',            desc: 'Sign in with the same Orin AI account. Your plan, tier, and history carry over instantly.' },
];

const STEPS = [
  { n: '01', title: 'Describe', desc: 'Type what you want to build in plain language.' },
  { n: '02', title: 'Generate', desc: 'Watch the 8-stage pipeline build your full stack live.' },
  { n: '03', title: 'Refine',   desc: 'Tweak copy, layout or features with a single sentence.' },
  { n: '04', title: 'Ship',     desc: 'Export the bundle or deploy directly from the workspace.' },
];

const PLANS = [
  { name: 'Starter', price: 'Free',   note: 'For exploring ideas', points: ['3 builds / day', 'Live preview', 'HTML export'], featured: false },
  { name: 'Growth',  price: 'Basic',  note: 'For product teams',   points: ['20 builds / day', 'Project history & refine', 'Priority throughput'], featured: true },
  { name: 'Pro',     price: 'Verified / BYO', note: 'For production', points: ['Unlimited builds', 'Advanced model access', 'Long-running continuity'], featured: false },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const heroRef  = useRef<HTMLDivElement>(null);

  // Scroll reveal
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!nodes.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/6 blur-[100px]" />
      </div>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-white/6 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/home" className="flex items-center gap-0.5 text-base font-black select-none">
            <span className="text-indigo-400">Orin</span><span className="text-cyan-400">AI</span>
            <span className="text-slate-600 mx-1.5 font-normal text-sm">/</span>
            <span className="text-slate-300 text-sm font-semibold">Builder</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-500 md:flex">
            {['Features','How it works','Pricing'].map(s => (
              <a key={s} href={`#${s.toLowerCase().replace(/ /g,'-')}`} className="hover:text-white transition-colors">{s}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href={APP_CONFIG.mainAppUrl} target="_blank" rel="noreferrer"
              className="hidden rounded-lg border border-white/8 px-3 py-1.5 text-xs text-slate-500 hover:border-white/15 hover:text-white transition-colors sm:inline-flex">
              Orin AI
            </a>
            <button onClick={() => navigate('/')}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 active:scale-[0.98] transition-all">
              Open Builder
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">

        {/* ── Hero ── */}
        <section ref={heroRef} className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 pb-24 pt-20 text-center sm:px-6 md:pt-28">

          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/8 px-4 py-1.5 text-xs font-semibold text-indigo-300 opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'0ms'}}>
            <Zap size={11} className="text-indigo-400" />
            Part of the Orin AI ecosystem
          </div>

          <h1 className="max-w-4xl text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'80ms'}}>
            Build a website<br />
            <span className="hero-gradient-title">from a single prompt.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'160ms'}}>
            Orin Builder turns your description into a complete, deploy-ready website — HTML, CSS, JS, database schema, and API contracts in one shot.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'220ms'}}>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25">
              Start Building Free <ArrowRight size={14} />
            </button>
            <a href="#how-it-works"
              className="rounded-xl border border-white/8 px-6 py-3 text-sm font-medium text-slate-400 hover:border-white/15 hover:text-white transition-colors">
              See how it works
            </a>
          </div>

          {/* Browser mockup */}
          <div className="w-full max-w-4xl opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'300ms'}}>
            <div className="rounded-2xl border border-white/8 bg-slate-900/80 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/6 bg-slate-950/60 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 mx-3 rounded-md bg-white/4 border border-white/6 px-3 py-1 text-[11px] text-slate-500 font-mono">
                  builder.orinai.org
                </div>
              </div>
              {/* App UI mockup */}
              <div className="grid grid-cols-[200px_1fr] min-h-[340px]">
                {/* Sidebar mock */}
                <div className="border-r border-white/6 bg-slate-900 p-3 hidden sm:block">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="h-2 w-16 rounded bg-white/10" />
                    <div className="h-4 w-4 rounded bg-indigo-500/20" />
                  </div>
                  {['Analyzing','Blueprint','Backend','Database','Frontend','Assembling'].map((s, i) => (
                    <div key={s} className="flex items-center gap-2 py-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${i < 4 ? 'bg-indigo-400' : i === 4 ? 'bg-indigo-400 animate-pulse' : 'bg-white/10'}`} />
                      <div className={`h-1.5 rounded ${i < 4 ? 'bg-indigo-400/40' : 'bg-white/8'}`} style={{width:`${40+i*10}px`}} />
                    </div>
                  ))}
                  <div className="mt-4 h-1 w-full rounded-full bg-white/6 overflow-hidden">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
                  </div>
                  <p className="mt-1 text-[9px] text-indigo-400 font-mono">72%</p>
                </div>
                {/* Preview mock */}
                <div className="bg-slate-950/50 p-4 preview-shimmer">
                  <div className="h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/6 p-5">
                    <div className="h-3 w-24 rounded-md bg-indigo-400/30 mb-2" />
                    <div className="h-5 w-3/4 rounded-md bg-white/20 mb-2" />
                    <div className="h-3 w-1/2 rounded-md bg-white/10 mb-4" />
                    <div className="flex gap-2 mb-5">
                      <div className="h-7 w-24 rounded-lg bg-indigo-600/70" />
                      <div className="h-7 w-20 rounded-lg border border-white/15" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(3)].map((_,i) => (
                        <div key={i} className="rounded-lg bg-white/5 border border-white/6 p-2">
                          <div className="h-2 w-8 rounded bg-indigo-400/20 mb-1.5" />
                          <div className="h-1.5 w-full rounded bg-white/8 mb-1" />
                          <div className="h-1.5 w-2/3 rounded bg-white/6" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 pt-2 opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'380ms'}}>
            {[['8','Pipeline stages'],['3','Output artifacts'],['<60s','Average build time']].map(([v,l]) => (
              <div key={l} className="rounded-xl border border-white/6 bg-white/3 px-5 py-3 text-center">
                <p className="text-xl font-black text-white">{v}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div data-reveal className="reveal-on-scroll mb-10 text-center">
            <p className="text-xs uppercase tracking-widest text-indigo-400 font-black mb-2">Features</p>
            <h2 className="text-3xl font-black text-white sm:text-4xl">Everything in one pipeline</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} data-reveal className="reveal-on-scroll group rounded-2xl border border-white/6 bg-slate-900/60 p-5 hover:border-indigo-500/30 hover:bg-slate-900 card-lift transition-all">
                <div className="mb-3 inline-flex rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2.5">
                  <Icon size={16} className="text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div data-reveal className="reveal-on-scroll mb-10 text-center">
            <p className="text-xs uppercase tracking-widest text-indigo-400 font-black mb-2">How it works</p>
            <h2 className="text-3xl font-black text-white sm:text-4xl">From idea to website in 4 steps</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.n} data-reveal className="reveal-on-scroll relative rounded-2xl border border-white/6 bg-slate-900/60 p-5">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2 w-4 h-px bg-indigo-500/30 z-10" />
                )}
                <span className="text-3xl font-black text-indigo-500/20 mb-3 block">{s.n}</span>
                <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div data-reveal className="reveal-on-scroll mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-indigo-400 font-black mb-2">Pricing</p>
              <h2 className="text-3xl font-black text-white sm:text-4xl">Start free, scale when ready</h2>
            </div>
            <a href="https://www.orinai.org/pricing" target="_blank" rel="noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              Full pricing on Orin AI <ArrowRight size={12} />
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} data-reveal className={`reveal-on-scroll rounded-2xl border p-6 flex flex-col gap-4 ${
                plan.featured
                  ? 'border-indigo-500/50 bg-indigo-500/8 shadow-xl shadow-indigo-500/10'
                  : 'border-white/6 bg-slate-900/60'
              }`}>
                {plan.featured && (
                  <span className="self-start rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-300">Popular</span>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">{plan.name}</p>
                  <p className="text-2xl font-black text-white mt-1">{plan.price}</p>
                  <p className="text-xs text-slate-500 mt-1">{plan.note}</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-slate-400">
                      <Check size={13} className="mt-0.5 shrink-0 text-indigo-400" />{pt}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/')}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
                    plan.featured
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                      : 'border border-white/8 text-slate-400 hover:border-white/15 hover:text-white'
                  }`}>
                  Get started
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div data-reveal className="reveal-on-scroll rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900/80 to-cyan-500/5 p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-600/12 blur-[80px]" />
            </div>
            <div className="relative">
              <Rocket size={32} className="text-indigo-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white mb-3">Ready to build your next site?</h2>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">Jump into the workspace, generate your first version, and refine in minutes.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => navigate('/')}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25">
                  Open Builder <ArrowRight size={14} />
                </button>
                <a href={APP_CONFIG.mainAppUrl} target="_blank" rel="noreferrer"
                  className="rounded-xl border border-white/8 px-6 py-3 text-sm text-slate-400 hover:border-white/15 hover:text-white transition-colors">
                  Visit Orin AI
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 bg-slate-900/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-1.5">
            <span className="text-indigo-400 font-black">Orin</span><span className="text-cyan-400 font-black">AI</span>
            <span className="mx-1 opacity-30">·</span>
            <span>{APP_CONFIG.branding}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href={`${APP_CONFIG.mainAppUrl}/#terms`} target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href={`${APP_CONFIG.mainAppUrl}/#privacy`} target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href={`https://github.com/${APP_CONFIG.githubRepo}`} target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
