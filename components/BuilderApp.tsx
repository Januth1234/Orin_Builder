import React, { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle, ArrowUp, Code2, Database as DbIcon, Eye,
  LayoutTemplate, Loader2, LogOut, Menu, RefreshCw, Sparkles,
} from 'lucide-react';
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
  'Restaurant website',
  'E-commerce storefront',
];

const BuilderApp: React.FC = () => {
  const {
    prompt, setPrompt, generate, refine, refinePrompt, setRefinePrompt,
    state, error, newProject, user, abort, activeTab, setActiveTab,
    sidebarOpen, setSidebarOpen, currentProject, progress,
    clarificationQuestions, clarificationAnswers,
    setClarificationAnswer, submitClarification,
    showContentModal, setShowContentModal,
    showTemplateGallery, setShowTemplateGallery,
    startGenerateWithContent, applyTemplate,
  } = useBuilderStore();

  const promptRef = useRef<HTMLInputElement>(null);
  const refineRef = useRef<HTMLInputElement>(null);

  const isBuilding             = !['queued', 'complete', 'failed'].includes(state);
  const hasResult              = !!currentProject?.bundle?.files?.length;
  const waitingForClarification = state === 'clarification_needed';
  const warningsCount          = currentProject?.bundle?.validation?.warnings?.length ?? 0;

  const shortcutPrefix = useMemo(() =>
    typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(window.navigator.platform) ? 'Cmd' : 'Ctrl'
  , []);

  useEffect(() => { if (!isBuilding && !hasResult) promptRef.current?.focus(); }, [isBuilding, hasResult]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'k') { e.preventDefault(); if (!isBuilding) newProject(); return; }
      if (k !== 'enter') return;
      e.preventDefault();
      if (isBuilding) return;
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
    if (activeTab === 'code')      return <CodePanel />;
    if (activeTab === 'blueprint') return <BlueprintPanel />;
    return <DatabasePanel />;
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-b-bg text-white">
      <BuilderSidebar />

      {sidebarOpen && (
        <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 lg:hidden" />
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-2 border-b border-b-border/50 bg-b-surf/40 px-3 h-10 shrink-0 backdrop-blur-sm">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-b-dim hover:text-white rounded-md hover:bg-b-elev transition-colors">
              <Menu size={13} />
            </button>
          )}

          <div className="flex items-center gap-0.5 text-sm font-semibold select-none">
            <span className="text-b-accent">Orin</span><span className="text-b-blue">AI</span>
            <span className="text-b-dim/40 mx-1.5 font-light">/</span>
            <span className="text-white/40 text-[13px] font-medium">Builder</span>
          </div>

          {currentProject?.title && !isBuilding && (
            <>
              <span className="text-b-border text-xs mx-0.5">›</span>
              <span className="text-[11px] text-b-muted truncate max-w-[180px]">{currentProject.title}</span>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            {isBuilding && (
              <div className="flex items-center gap-1.5 text-[11px] text-b-accent font-mono">
                <Loader2 size={11} className="animate-spin-slow" />
                <span className="hidden sm:inline">{BUILD_STATE_META[state]?.label}</span>
                <span className="text-b-muted">· {progress}%</span>
                <button onClick={abort} className="ml-1 text-[10px] text-b-dim hover:text-red-400 transition-colors">abort</button>
              </div>
            )}

            {hasResult && !isBuilding && (
              <div className="flex items-center gap-1">
                <button onClick={runGenerate} disabled={!prompt.trim()}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-b-elev border border-b-border text-b-muted hover:text-white hover:border-b-muted transition-colors disabled:opacity-30">
                  Rebuild
                </button>
                <button onClick={newProject}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-b-accent text-black font-semibold hover:bg-green-400 transition-colors"
                  title={`${shortcutPrefix}+K`}>
                  New
                </button>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-1.5">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="h-6 w-6 rounded-full border border-b-border/60" />
                  : <div className="h-6 w-6 rounded-full bg-b-elev border border-b-border text-[10px] font-bold text-b-accent flex items-center justify-center">{user.name[0]}</div>
                }
                <button onClick={() => firebaseService.logout()}
                  className="p-1 text-b-dim hover:text-b-muted rounded transition-colors" title="Sign out">
                  <LogOut size={12} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Error */}
        {state === 'failed' && error && (
          <div className="flex items-center justify-between gap-2 border-b border-red-900/30 bg-red-950/20 px-4 py-1.5 shrink-0">
            <div className="flex items-center gap-2 text-xs text-red-300/80"><AlertCircle size={12} /><span>{error}</span></div>
            <button onClick={runGenerate} disabled={!prompt.trim() || isBuilding}
              className="flex items-center gap-1 text-[11px] text-red-400/60 hover:text-red-300 disabled:opacity-40 transition-colors">
              <RefreshCw size={10} /> Retry
            </button>
          </div>
        )}

        {/* Progress bar */}
        {(isBuilding || waitingForClarification) && (
          <div className="border-b border-b-accent/10 px-4 py-2 shrink-0">
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-b-border mb-1.5">
              <div className="h-full rounded-full bg-b-accent transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-b-muted">{BUILD_STATE_META[state]?.message}</p>
          </div>
        )}

        {/* Clarification */}
        {clarificationQuestions && clarificationQuestions.length > 0 && (
          <ClarificationBanner
            questions={clarificationQuestions} answers={clarificationAnswers}
            onAnswer={setClarificationAnswer} onSubmit={submitClarification}
          />
        )}

        {/* Main */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!hasResult && !isBuilding ? (

            /* Welcome screen */
            <div className="flex flex-col items-center justify-center flex-1 px-6 gap-8">
              <div className="text-center space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-b-accent/10 border border-b-accent/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={20} className="text-b-accent" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">What do you want to build?</h1>
                <p className="text-sm text-b-muted">Describe your website — OrinAI generates the full stack.</p>
              </div>

              <div className="w-full max-w-2xl space-y-3">
                <div className="relative rounded-2xl border border-b-border bg-b-surf/60 focus-within:border-b-accent/50 transition-all shadow-xl shadow-black/30">
                  <input
                    ref={promptRef}
                    className="w-full bg-transparent px-4 py-4 pr-14 text-sm text-white placeholder-b-dim/50 outline-none"
                    placeholder='"A dark SaaS landing page for an AI scheduling tool with pricing"'
                    value={prompt} disabled={isBuilding}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !isBuilding) runGenerate(); }}
                  />
                  <button onClick={runGenerate} disabled={isBuilding || !prompt.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-b-accent flex items-center justify-center text-black hover:bg-green-400 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                    title={`${shortcutPrefix}+Enter`}>
                    <ArrowUp size={15} />
                  </button>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => setShowTemplateGallery(true)} disabled={isBuilding}
                    className="flex items-center gap-2 text-xs text-b-muted hover:text-white border border-b-border/60 rounded-xl px-4 py-2 bg-b-elev/30 hover:bg-b-elev hover:border-b-muted transition-all disabled:opacity-30">
                    <LayoutTemplate size={12} /> Start from a template
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => { setPrompt(s); promptRef.current?.focus(); }} disabled={isBuilding}
                      className="text-[11px] text-b-dim hover:text-b-muted border border-b-border/30 rounded-lg px-3 py-1 bg-b-elev/20 hover:bg-b-elev/50 transition-colors disabled:opacity-30">
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
                <div className="flex items-center border-b border-b-border/50 bg-b-surf/20 px-1 shrink-0">
                  <div className="flex min-w-0 flex-1 overflow-x-auto no-scrollbar">
                    {TABS.map(({ id, label, Icon }) => (
                      <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-all ${
                          activeTab === id ? 'border-b-accent text-white' : 'border-transparent text-b-dim hover:text-b-muted'
                        }`}>
                        <Icon size={11} />{label}
                      </button>
                    ))}
                  </div>
                  {warningsCount > 0 && (
                    <span className="mr-3 flex shrink-0 items-center gap-1 text-[10px] text-amber-400/70">
                      <AlertCircle size={10} />{warningsCount}
                    </span>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 size={16} className="animate-spin-slow text-b-accent" /></div>}>
                  <div key={hasResult ? activeTab : 'building'} className="view-enter h-full">
                    {renderPanel()}
                  </div>
                </Suspense>
              </div>
            </div>
          )}
        </main>

        {/* Refine bar */}
        {hasResult && (
          <div className="border-t border-b-border/50 bg-b-surf/20 px-3 py-2.5 shrink-0">
            <div className="relative rounded-xl border border-b-border/70 bg-b-elev/50 focus-within:border-b-accent/40 transition-colors max-w-4xl mx-auto">
              <input
                ref={refineRef}
                className="w-full bg-transparent px-4 py-2.5 pr-11 text-sm text-white placeholder-b-dim/50 outline-none"
                placeholder="Refine: add pricing table, improve hero, change colors..."
                value={refinePrompt} disabled={isBuilding}
                onChange={(e) => setRefinePrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !isBuilding) runRefine(); }}
              />
              <button onClick={runRefine} disabled={isBuilding || !refinePrompt.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none bg-b-accent/10 hover:bg-b-accent text-b-accent hover:text-black border border-b-accent/20"
                title={`${shortcutPrefix}+Enter`}>
                {isBuilding ? <Loader2 size={11} className="animate-spin-slow" /> : <ArrowUp size={11} />}
              </button>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between gap-3 border-t border-b-border/30 bg-b-bg px-4 py-1 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-b-dim">
            <span className="text-b-accent font-bold">Orin</span><span className="text-b-blue font-bold">AI</span>
            <span className="opacity-20 mx-0.5">·</span><span>Builder</span>
            {user && (
              <>
                <span className="opacity-20 mx-1">·</span>
                <span className="truncate max-w-[120px]">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-b-accent/10 text-b-accent border border-b-accent/20 text-[9px] font-bold uppercase tracking-wider ml-0.5">
                  {(user as any).tier ?? 'Free'}
                </span>
              </>
            )}
          </div>
          <button
            onClick={async () => {
              try {
                const { getAuth } = await import('firebase/auth');
                const tok = await getAuth().currentUser?.getIdToken();
                window.open(tok ? `${APP_CONFIG.mainAppUrl}?ot=${tok}` : APP_CONFIG.mainAppUrl, '_blank', 'noopener,noreferrer');
              } catch { window.open(APP_CONFIG.mainAppUrl, '_blank', 'noopener,noreferrer'); }
            }}
            className="text-[10px] text-b-dim hover:text-b-accent transition-colors flex items-center gap-1 shrink-0">
            Orin AI <span className="text-[9px]">↗</span>
          </button>
        </div>
      </div>

      {showContentModal && (
        <ContentModeModal prompt={prompt}
          onConfirm={(mode, upload) => void startGenerateWithContent(mode, upload)}
          onCancel={() => setShowContentModal(false)} />
      )}
      {showTemplateGallery && (
        <TemplateGallery onSelect={applyTemplate} onClose={() => setShowTemplateGallery(false)} />
      )}
    </div>
  );
};

const ClarificationBanner: React.FC<{
  questions: string[]; answers: Record<string, string>;
  onAnswer: (q: string, a: string) => void; onSubmit: () => void;
}> = ({ questions, answers, onAnswer, onSubmit }) => {
  const allAnswered = questions.every((q) => (answers[q] ?? '').trim().length > 0);
  return (
    <div className="border-b border-amber-800/30 bg-amber-950/15 px-4 py-3 shrink-0">
      <p className="mb-2 text-xs font-semibold text-amber-300/90">A few details needed before continuing:</p>
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <div key={q} className="flex items-start gap-2">
            <span className="mt-1.5 w-4 shrink-0 text-[11px] text-amber-200/50">{i + 1}.</span>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[11px] text-amber-200/75">{q}</span>
              <input
                className="rounded-lg border border-amber-800/35 bg-b-elev px-2.5 py-1 text-xs text-white placeholder-b-dim outline-none focus:border-amber-600/40 transition-colors"
                placeholder="Your answer" value={answers[q] ?? ''}
                onChange={(e) => onAnswer(q, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && allAnswered) onSubmit(); }}
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={onSubmit} disabled={!allAnswered}
        className="mt-2.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-40 disabled:pointer-events-none transition-colors">
        Continue build
      </button>
    </div>
  );
};

export default BuilderApp;
