import React, { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, ArrowUp, Code2, Database as DbIcon, Eye, LayoutTemplate, Loader2, LogOut, Menu, RefreshCw, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { firebaseService } from '../services/firebaseService';
import { BuilderTab, BUILD_STATE_META } from '../types';
import { APP_CONFIG } from '../config';
import BuilderSidebar from './BuilderSidebar';
import ContentModeModal from './ContentModeModal';
import TemplateGallery from './TemplateGallery';

const PreviewPanel   = lazy(() => import('./panels/PreviewPanel'));
const CodePanel      = lazy(() => import('./panels/CodePanel'));
const BlueprintPanel = lazy(() => import('./panels/BlueprintPanel'));
const DatabasePanel  = lazy(() => import('./panels/DatabasePanel'));

const TABS: { id: BuilderTab; label: string; Icon: LucideIcon }[] = [
  { id: 'preview',   label: 'Preview',   Icon: Eye            },
  { id: 'code',      label: 'Code',      Icon: Code2          },
  { id: 'blueprint', label: 'Blueprint', Icon: LayoutTemplate },
  { id: 'database',  label: 'Database',  Icon: DbIcon         },
];

const SUGGESTIONS = [
  'SaaS landing page for an AI tool',
  'Portfolio for a developer',
  'Restaurant website with menu',
  'E-commerce storefront',
];

const BuilderApp: React.FC = () => {
  const {
    prompt, setPrompt, generate, refine, refinePrompt, setRefinePrompt,
    state, error, newProject, user, abort, activeTab, setActiveTab,
    sidebarOpen, setSidebarOpen, currentProject, progress,
    clarificationQuestions, clarificationAnswers, setClarificationAnswer, submitClarification,
    showContentModal, setShowContentModal, showTemplateGallery, setShowTemplateGallery,
    startGenerateWithContent, applyTemplate,
  } = useBuilderStore();

  const promptRef = useRef<HTMLInputElement>(null);
  const refineRef = useRef<HTMLInputElement>(null);
  const isBuilding = !['queued','complete','failed'].includes(state);
  const hasResult  = !!currentProject?.bundle?.files?.length;
  const waitingClarification = state === 'clarification_needed';
  const warningsCount = currentProject?.bundle?.validation?.warnings?.length ?? 0;
  const shortcutPrefix = useMemo(() => typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(window.navigator.platform) ? 'Cmd' : 'Ctrl', []);

  useEffect(() => { if (!isBuilding && !hasResult) promptRef.current?.focus(); }, [isBuilding, hasResult]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'k') { e.preventDefault(); if (!isBuilding) newProject(); return; }
      if (k !== 'enter') return;
      e.preventDefault(); if (isBuilding) return;
      const el = document.activeElement;
      if (el === refineRef.current) { if (refinePrompt.trim()) void refine(); return; }
      if (el === promptRef.current || !hasResult) { if (prompt.trim()) runGenerate(); return; }
      if (refinePrompt.trim()) void refine(); else if (prompt.trim()) runGenerate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [generate, hasResult, isBuilding, newProject, prompt, refine, refinePrompt]);

  const runGenerate = () => { if (!isBuilding && prompt.trim()) setShowContentModal(true); };
  const runRefine   = () => { if (!isBuilding && refinePrompt.trim()) void refine(); };

  const renderPanel = () => {
    if (!hasResult || activeTab === 'preview') return <PreviewPanel />;
    if (activeTab === 'code') return <CodePanel />;
    if (activeTab === 'blueprint') return <BlueprintPanel />;
    return <DatabasePanel />;
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <BuilderSidebar />
      {sidebarOpen && <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-black/50 lg:hidden" />}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <header className="flex items-center gap-2 border-b border-white/6 bg-slate-900/60 backdrop-blur-sm px-3 h-11 shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/6 transition-colors">
              <Menu size={14} />
            </button>
          )}
          <div className="flex items-center gap-0.5 text-sm font-black select-none">
            <span className="text-indigo-400">Orin</span><span className="text-cyan-400">AI</span>
            <span className="text-slate-600 mx-1.5 font-normal">/</span>
            <span className="text-slate-400 text-[13px] font-semibold">Builder</span>
          </div>
          {currentProject?.title && !isBuilding && (
            <><span className="text-slate-700 text-xs">›</span><span className="text-[11px] text-slate-500 truncate max-w-[180px]">{currentProject.title}</span></>
          )}

          <div className="ml-auto flex items-center gap-2">
            {isBuilding && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <Loader2 size={11} className="animate-spin text-indigo-400" />
                <span className="hidden sm:inline text-slate-400">{BUILD_STATE_META[state]?.label}</span>
                <span className="text-indigo-400">{progress}%</span>
                <button onClick={abort} className="ml-1 text-[10px] text-slate-600 hover:text-red-400 transition-colors">abort</button>
              </div>
            )}
            {hasResult && !isBuilding && (
              <div className="flex items-center gap-1">
                <button onClick={runGenerate} disabled={!prompt.trim()} className="text-[11px] px-2.5 py-1 rounded-lg border border-white/8 bg-white/4 text-slate-400 hover:text-white hover:border-white/15 transition-colors disabled:opacity-30">Rebuild</button>
                <button onClick={newProject} className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors" title={`${shortcutPrefix}+K`}>New</button>
              </div>
            )}
            {user && (
              <div className="flex items-center gap-1.5">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="h-6 w-6 rounded-full border border-white/10" />
                  : <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black text-indigo-400 flex items-center justify-center">{user.name[0]}</div>
                }
                <button onClick={() => firebaseService.logout()} className="p-1 text-slate-600 hover:text-slate-400 rounded transition-colors" title="Sign out"><LogOut size={12} /></button>
              </div>
            )}
          </div>
        </header>

        {/* ── Error ── */}
        {state === 'failed' && error && (
          <div className="flex items-center justify-between gap-2 border-b border-red-900/30 bg-red-950/20 px-4 py-1.5 shrink-0">
            <div className="flex items-center gap-2 text-xs text-red-400/80"><AlertCircle size={12} /><span>{error}</span></div>
            <button onClick={runGenerate} disabled={!prompt.trim()||isBuilding} className="flex items-center gap-1 text-[11px] text-red-500/60 hover:text-red-400 disabled:opacity-40 transition-colors"><RefreshCw size={10} /> Retry</button>
          </div>
        )}

        {/* ── Progress ── */}
        {(isBuilding || waitingClarification) && (
          <div className="border-b border-indigo-500/10 bg-indigo-500/3 px-4 py-2 shrink-0">
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/6 mb-1.5">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-700 ease-out" style={{ width:`${progress}%` }} />
            </div>
            <p className="text-[10px] text-slate-500">{BUILD_STATE_META[state]?.message}</p>
          </div>
        )}

        {/* ── Clarification ── */}
        {clarificationQuestions && clarificationQuestions.length > 0 && (
          <ClarificationBanner questions={clarificationQuestions} answers={clarificationAnswers} onAnswer={setClarificationAnswer} onSubmit={submitClarification} />
        )}

        {/* ── Main ── */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!hasResult && !isBuilding ? (

            /* Welcome screen */
            <div className="flex flex-col items-center justify-center flex-1 px-6 gap-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 animate-scale-in">
                  <Sparkles size={22} className="text-indigo-400" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'50ms'}}>What do you want to build?</h1>
                <p className="text-sm text-slate-400 opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'100ms'}}>
                  Describe your website — OrinAI generates the full stack.
                </p>
              </div>

              <div className="w-full max-w-2xl space-y-3 opacity-0 animate-reveal" style={{animationFillMode:'forwards',animationDelay:'150ms'}}>
                {/* Input */}
                <div className="relative rounded-2xl border border-white/8 bg-slate-900/80 focus-within:border-indigo-500/40 focus-within:shadow-[0_0_0_3px_rgb(99_102_241/0.1)] transition-all shadow-xl shadow-black/30 input-glow">
                  <input ref={promptRef}
                    className="w-full bg-transparent px-4 py-4 pr-14 text-sm text-white placeholder-slate-600 outline-none"
                    placeholder='"A dark SaaS landing page for an AI scheduling tool with pricing"'
                    value={prompt} disabled={isBuilding}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !isBuilding) runGenerate(); }}
                  />
                  <button onClick={runGenerate} disabled={isBuilding || !prompt.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                    title={`${shortcutPrefix}+Enter`}>
                    <ArrowUp size={15} />
                  </button>
                </div>

                {/* Template */}
                <div className="flex justify-center">
                  <button onClick={() => setShowTemplateGallery(true)} disabled={isBuilding}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 border border-white/6 rounded-xl px-4 py-2 bg-white/3 hover:bg-white/6 hover:border-white/12 transition-all disabled:opacity-30">
                    <LayoutTemplate size={12} /> Start from a template
                  </button>
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => { setPrompt(s); promptRef.current?.focus(); }} disabled={isBuilding}
                      className="text-[11px] text-slate-600 hover:text-slate-300 border border-white/5 rounded-lg px-3 py-1 bg-white/2 hover:bg-white/5 hover:border-white/10 transition-colors disabled:opacity-30">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          ) : (
            /* Result view */
            <div className="flex flex-col flex-1 min-h-0">
              {hasResult && (
                <div className="flex items-center border-b border-white/6 bg-slate-900/30 px-1 shrink-0">
                  <div className="flex min-w-0 flex-1 overflow-x-auto no-scrollbar">
                    {TABS.map(({ id, label, Icon }) => (
                      <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                          activeTab === id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-600 hover:text-slate-400'
                        }`}>
                        <Icon size={11} />{label}
                      </button>
                    ))}
                  </div>
                  {warningsCount > 0 && (
                    <span className="mr-3 flex shrink-0 items-center gap-1 text-[10px] text-amber-500/70"><AlertCircle size={10} />{warningsCount}</span>
                  )}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>}>
                  <div key={hasResult ? activeTab : 'building'} className="view-enter h-full">{renderPanel()}</div>
                </Suspense>
              </div>
            </div>
          )}
        </main>

        {/* ── Refine bar ── */}
        {hasResult && (
          <div className="border-t border-white/6 bg-slate-900/40 px-3 py-2.5 shrink-0">
            <div className="relative rounded-xl border border-white/8 bg-slate-900/80 focus-within:border-indigo-500/35 focus-within:shadow-[0_0_0_3px_rgb(99_102_241/0.08)] transition-all max-w-4xl mx-auto input-glow">
              <input ref={refineRef}
                className="w-full bg-transparent px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-600 outline-none"
                placeholder="Refine: add pricing table, improve hero, change colors..."
                value={refinePrompt} disabled={isBuilding}
                onChange={(e) => setRefinePrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !isBuilding) runRefine(); }}
              />
              <button onClick={runRefine} disabled={isBuilding || !refinePrompt.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20"
                title={`${shortcutPrefix}+Enter`}>
                {isBuilding ? <Loader2 size={11} className="animate-spin" /> : <ArrowUp size={11} />}
              </button>
            </div>
          </div>
        )}

        {/* ── Status bar ── */}
        <div className="flex items-center justify-between gap-3 border-t border-white/4 bg-slate-950 px-4 py-1 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="text-indigo-400 font-black">Orin</span><span className="text-cyan-400 font-black">AI</span>
            <span className="opacity-20 mx-0.5">·</span><span>Builder</span>
            {user && (
              <><span className="opacity-20 mx-1">·</span>
              <span className="truncate max-w-[120px]">{user.name}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider ml-0.5">{(user as any).tier ?? 'Free'}</span></>
            )}
          </div>
          <button onClick={async () => {
            try { const { getAuth } = await import('firebase/auth'); const tok = await getAuth().currentUser?.getIdToken(); window.open(tok ? `${APP_CONFIG.mainAppUrl}?ot=${tok}` : APP_CONFIG.mainAppUrl, '_blank', 'noopener,noreferrer'); }
            catch { window.open(APP_CONFIG.mainAppUrl, '_blank', 'noopener,noreferrer'); }
          }} className="text-[10px] text-slate-600 hover:text-indigo-400 transition-colors flex items-center gap-1 shrink-0">
            Orin AI <span className="text-[9px]">↗</span>
          </button>
        </div>
      </div>

      {showContentModal && <ContentModeModal prompt={prompt} onConfirm={(mode, upload) => void startGenerateWithContent(mode, upload)} onCancel={() => setShowContentModal(false)} />}
      {showTemplateGallery && <TemplateGallery onSelect={applyTemplate} onClose={() => setShowTemplateGallery(false)} />}
    </div>
  );
};

const ClarificationBanner: React.FC<{ questions: string[]; answers: Record<string,string>; onAnswer: (q:string,a:string)=>void; onSubmit: ()=>void }> = ({ questions, answers, onAnswer, onSubmit }) => {
  const allAnswered = questions.every((q) => (answers[q] ?? '').trim().length > 0);
  return (
    <div className="border-b border-amber-500/15 bg-amber-950/15 px-4 py-3 shrink-0">
      <p className="mb-2 text-xs font-bold text-amber-400/80">A few details needed before continuing:</p>
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <div key={q} className="flex items-start gap-2">
            <span className="mt-1.5 w-4 shrink-0 text-[11px] text-amber-500/40">{i+1}.</span>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[11px] text-amber-200/70">{q}</span>
              <input className="rounded-lg border border-white/8 bg-slate-900/80 px-2.5 py-1 text-xs text-white placeholder-slate-600 outline-none focus:border-amber-500/30 transition-colors"
                placeholder="Your answer" value={answers[q] ?? ''}
                onChange={(e) => onAnswer(q, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && allAnswered) onSubmit(); }}
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={onSubmit} disabled={!allAnswered}
        className="mt-2.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-40 disabled:pointer-events-none transition-colors">
        Continue build
      </button>
    </div>
  );
};

export default BuilderApp;
