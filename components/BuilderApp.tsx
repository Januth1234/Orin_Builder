import React, { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Code2,
  Database as DbIcon,
  Eye,
  LayoutTemplate,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { firebaseService } from '../services/firebaseService';
import { BuilderTab, BUILD_STATE_META } from '../types';
import { APP_CONFIG } from '../config';
import BuilderSidebar from './BuilderSidebar';

const PreviewPanel = lazy(() => import('./panels/PreviewPanel'));
const CodePanel = lazy(() => import('./panels/CodePanel'));
const BlueprintPanel = lazy(() => import('./panels/BlueprintPanel'));
const DatabasePanel = lazy(() => import('./panels/DatabasePanel'));

const TABS: { id: BuilderTab; label: string; Icon: LucideIcon }[] = [
  { id: 'preview', label: 'Preview', Icon: Eye },
  { id: 'code', label: 'Code', Icon: Code2 },
  { id: 'blueprint', label: 'Blueprint', Icon: LayoutTemplate },
  { id: 'database', label: 'Database', Icon: DbIcon },
];

const BuilderApp: React.FC = () => {
  const {
    prompt,
    setPrompt,
    generate,
    refine,
    refinePrompt,
    setRefinePrompt,
    state,
    error,
    newProject,
    user,
    abort,
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    currentProject,
    progress,
    clarificationQuestions,
    clarificationAnswers,
    setClarificationAnswer,
    submitClarification,
  } = useBuilderStore();

  const promptRef = useRef<HTMLInputElement>(null);
  const refineRef = useRef<HTMLInputElement>(null);

  const waitingForClarification = state === 'clarification_needed';
  const isBuilding = !['queued', 'complete', 'failed'].includes(state);
  const hasResult = !!currentProject?.bundle?.files?.length;
  const warningsCount = currentProject?.bundle?.validation?.warnings?.length ?? 0;

  const shortcutPrefix = useMemo(() => {
    if (typeof window === 'undefined') return 'Ctrl';
    return /Mac|iPhone|iPad|iPod/.test(window.navigator.platform) ? 'Cmd' : 'Ctrl';
  }, []);

  useEffect(() => {
    if (!isBuilding) promptRef.current?.focus();
  }, [isBuilding]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();

      if (key === 'k') {
        event.preventDefault();
        if (!isBuilding) newProject();
        return;
      }

      if (key !== 'enter') return;

      event.preventDefault();
      if (isBuilding) return;

      const activeElement = document.activeElement;
      if (activeElement === refineRef.current) {
        if (refinePrompt.trim()) void refine();
        return;
      }

      if (activeElement === promptRef.current || !hasResult) {
        if (prompt.trim()) void generate();
        return;
      }

      if (refinePrompt.trim()) {
        void refine();
      } else if (prompt.trim()) {
        void generate();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [generate, hasResult, isBuilding, newProject, prompt, refine, refinePrompt]);

  const runGenerate = () => {
    if (!isBuilding && prompt.trim()) void generate();
  };

  const runRefine = () => {
    if (!isBuilding && refinePrompt.trim()) void refine();
  };

  const renderPanel = () => {
    if (!hasResult) return <PreviewPanel />;
    if (activeTab === 'preview') return <PreviewPanel />;
    if (activeTab === 'code') return <CodePanel />;
    if (activeTab === 'blueprint') return <BlueprintPanel />;
    return <DatabasePanel />;
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-b-bg text-white">
      <BuilderSidebar />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/45 lg:hidden"
        />
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex flex-wrap items-center gap-2 border-b border-b-border bg-b-surf px-3 py-2.5 sm:flex-nowrap sm:gap-3 sm:px-4">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-b-muted transition-colors hover:bg-b-elev hover:text-white"
              title="Open sidebar"
            >
              <Menu size={15} />
            </button>
          )}

          <button
            onClick={async () => {
              try {
                const { getAuth } = await import('firebase/auth');
                const tok = await getAuth().currentUser?.getIdToken();
                const url = tok ? `${APP_CONFIG.mainAppUrl}?ot=${tok}` : APP_CONFIG.mainAppUrl;
                window.open(url, '_blank', 'noopener,noreferrer');
              } catch { window.open(APP_CONFIG.mainAppUrl, '_blank', 'noopener,noreferrer'); }
            }}
            className="flex flex-shrink-0 items-center gap-1.5 group"
            title="Back to Orin AI"
          >
            <span className="text-[10px] text-b-muted group-hover:text-b-accent transition-colors">←</span>
            <span className="text-sm font-bold">
              <span className="text-b-accent">Orin</span>
              <span className="text-b-blue">AI</span>
            </span>
            <ChevronRight size={11} className="text-b-dim" />
            <span className="text-sm font-semibold text-white">Builder</span>
          </button>

          <div className="order-3 flex w-full min-w-0 flex-1 items-center gap-2 rounded-xl border border-b-border bg-b-elev px-3 py-1.5 focus-within:border-b-accent/55 sm:order-none">
            <Sparkles size={14} className="hidden flex-shrink-0 text-b-accent sm:block" />
            <input
              ref={promptRef}
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-b-dim outline-none"
              placeholder='Describe your website, for example: "A SaaS landing page for an AI scheduling tool"'
              value={prompt}
              disabled={isBuilding}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isBuilding) runGenerate();
              }}
            />
            {isBuilding && (
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="font-mono text-[11px] text-b-accent">{progress}%</span>
                <Loader2 size={13} className="animate-spin-slow text-b-accent" />
              </div>
            )}
          </div>

          {!hasResult ? (
            <button
              onClick={runGenerate}
              disabled={isBuilding || !prompt.trim()}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-b-accent px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-green-400 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
              title={`${shortcutPrefix}+Enter`}
            >
              {isBuilding ? <Loader2 size={13} className="animate-spin-slow" /> : <Sparkles size={13} />}
              {isBuilding ? 'Building' : 'Generate'}
            </button>
          ) : (
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                onClick={runGenerate}
                disabled={isBuilding || !prompt.trim()}
                className="rounded-lg bg-b-accent px-2.5 py-1.5 text-xs font-medium text-black transition-all hover:bg-green-400 disabled:opacity-30"
                title={`${shortcutPrefix}+Enter`}
              >
                Rebuild
              </button>
              <button
                onClick={newProject}
                disabled={isBuilding}
                className="rounded-lg border border-b-border px-2.5 py-1.5 text-xs font-medium text-b-muted transition-colors hover:border-b-muted hover:text-white disabled:opacity-30"
                title={`${shortcutPrefix}+K`}
              >
                New
              </button>
            </div>
          )}

          {user && (
            <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:ml-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-7 w-7 rounded-full border border-b-border" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-b-border bg-b-elev text-xs font-bold text-b-accent">
                  {user.name[0]}
                </div>
              )}
              <button
                onClick={() => firebaseService.logout()}
                className="rounded-md p-1.5 text-b-dim transition-colors hover:bg-b-elev hover:text-b-muted"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </header>

        {state === 'failed' && error && (
          <div className="flex items-center justify-between gap-2 border-b border-red-800/40 bg-red-950/40 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-red-300">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
            <button
              onClick={runGenerate}
              disabled={!prompt.trim() || isBuilding}
              className="flex items-center gap-1 text-[11px] text-red-300 transition-colors hover:text-red-200 disabled:opacity-40"
            >
              <RefreshCw size={11} />
              Retry
            </button>
          </div>
        )}

        {(isBuilding || waitingForClarification) && (
          <div className="border-b border-b-accent/20 bg-b-accent/6 px-4 py-2">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-b-accent">{BUILD_STATE_META[state]?.label}</span>
              <div className="flex items-center gap-2 text-[11px] text-b-muted">
                <span className="font-mono text-b-accent">{progress}%</span>
                <button
                  onClick={abort}
                  className="text-b-dim transition-colors hover:text-red-400"
                  disabled={!isBuilding}
                >
                  Abort
                </button>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-b-border">
              <div className="h-full rounded-full bg-b-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-b-muted">{BUILD_STATE_META[state]?.message}</p>
          </div>
        )}

        {clarificationQuestions && clarificationQuestions.length > 0 && (
          <ClarificationBanner
            questions={clarificationQuestions}
            answers={clarificationAnswers}
            onAnswer={setClarificationAnswer}
            onSubmit={submitClarification}
          />
        )}

        {hasResult && (
          <div className="flex items-center border-b border-b-border bg-b-surf px-1">
            <div className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-all ${
                    activeTab === id
                      ? 'border-b-accent text-white'
                      : 'border-transparent text-b-muted hover:border-b-border hover:text-white'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            {warningsCount > 0 && (
              <span className="mr-3 flex flex-shrink-0 items-center gap-1 text-[10px] text-amber-400">
                <AlertCircle size={10} />
                {warningsCount} warning{warningsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <main className="flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Loader2 size={18} className="animate-spin-slow text-b-accent" />
              </div>
            }
          >
            <div key={hasResult ? activeTab : 'preview'} className="view-enter h-full">
              {renderPanel()}
            </div>
          </Suspense>
        </main>

        {hasResult && (
          <div className="flex items-center gap-2 border-t border-b-border bg-b-surf px-3 py-2">
            <MessageSquare size={13} className="flex-shrink-0 text-b-muted" />
            <input
              ref={refineRef}
              className="min-w-0 flex-1 rounded-xl border border-b-border bg-b-elev px-3 py-1.5 text-sm text-white placeholder-b-dim outline-none transition-colors focus:border-b-accent/50"
              placeholder="Refine: add pricing table, improve hero copy, adjust typography"
              value={refinePrompt}
              disabled={isBuilding}
              onChange={(event) => setRefinePrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isBuilding) runRefine();
              }}
            />
            <button
              onClick={runRefine}
              disabled={isBuilding || !refinePrompt.trim()}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-b-border bg-b-elev px-3 py-1.5 text-xs font-semibold text-b-muted transition-all hover:border-b-muted hover:text-white disabled:pointer-events-none disabled:opacity-40"
              title={`${shortcutPrefix}+Enter`}
            >
              {isBuilding ? <Loader2 size={12} className="animate-spin-slow" /> : <Sparkles size={12} />}
              Refine
            </button>
          </div>
        )}
      {/* Ecosystem bar — always visible, links builder ↔ orinai.org */}
      <div className="flex items-center justify-between gap-3 border-t border-b-border/50 bg-b-bg px-4 py-1.5 z-10 relative">
        <div className="flex items-center gap-2 text-[10px] text-b-dim">
          <span className="text-b-accent font-bold">Orin</span>
          <span className="text-b-blue font-bold">AI</span>
          <span className="opacity-30">›</span>
          <span className="text-b-muted font-semibold">Builder</span>
          {user && (
            <>
              <span className="opacity-20 mx-1">·</span>
              <span className="truncate max-w-[140px]">{user.name}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-b-accent/10 text-b-accent border border-b-accent/20 text-[9px] font-bold uppercase tracking-wider ml-1">
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
              const url = tok ? `https://www.orinai.org?ot=${tok}` : 'https://www.orinai.org';
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch { window.open('https://www.orinai.org', '_blank', 'noopener,noreferrer'); }
          }}
          className="text-[10px] text-b-dim hover:text-b-accent transition-colors font-medium flex items-center gap-1 shrink-0"
        >
          Open Orin AI <span className="text-[9px]">↗</span>
        </button>
      </div>
    </div>
  );
};

const ClarificationBanner: React.FC<{
  questions: string[];
  answers: Record<string, string>;
  onAnswer: (q: string, a: string) => void;
  onSubmit: () => void;
}> = ({ questions, answers, onAnswer, onSubmit }) => {
  const allAnswered = questions.every((question) => (answers[question] ?? '').trim().length > 0);

  return (
    <div className="border-b border-amber-800/45 bg-amber-950/30 px-4 py-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-300">
        Clarification needed before generation can continue
      </p>

      <div className="flex flex-col gap-2">
        {questions.map((question, index) => (
          <div key={question} className="flex items-start gap-2">
            <span className="mt-1.5 w-4 flex-shrink-0 text-[11px] text-amber-200/70">{index + 1}.</span>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[11px] text-amber-200/85">{question}</span>
              <input
                className="rounded-lg border border-amber-800/45 bg-b-elev px-2.5 py-1 text-xs text-white placeholder-b-dim outline-none transition-colors focus:border-amber-600/60"
                placeholder="Your answer"
                value={answers[question] ?? ''}
                onChange={(event) => onAnswer(question, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && allAnswered) onSubmit();
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={!allAnswered}
        className="mt-2 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-500 disabled:pointer-events-none disabled:opacity-40"
      >
        Continue Build
      </button>
    </div>
  );
};

export default BuilderApp;
