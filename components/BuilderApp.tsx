import React, { lazy, Suspense, useRef, useEffect } from 'react';
import { Eye, Code2, LayoutTemplate, Database as DbIcon, ChevronRight, Loader2, AlertCircle, RefreshCw, LogOut, Menu, MessageSquare } from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { firebaseService } from '../services/firebaseService';
import BuilderSidebar from './BuilderSidebar';
import { BuilderTab, BUILD_STATE_META } from '../types';
import { APP_CONFIG } from '../config';

const PreviewPanel   = lazy(() => import('./panels/PreviewPanel'));
const CodePanel      = lazy(() => import('./panels/CodePanel'));
const BlueprintPanel = lazy(() => import('./panels/BlueprintPanel'));
const DatabasePanel  = lazy(() => import('./panels/DatabasePanel'));

const TABS: { id: BuilderTab; label: string; Icon: React.FC<any> }[] = [
  { id: 'preview',   label: 'Preview',   Icon: Eye },
  { id: 'code',      label: 'Code',      Icon: Code2 },
  { id: 'blueprint', label: 'Blueprint', Icon: LayoutTemplate },
  { id: 'database',  label: 'Database',  Icon: DbIcon },
];

const BuilderApp: React.FC = () => {
  const {
    prompt, setPrompt, generate, refine, refinePrompt, setRefinePrompt,
    state, error, newProject, user, abort,
    activeTab, setActiveTab, sidebarOpen, setSidebarOpen,
    currentProject, progress,
    clarificationQuestions, clarificationAnswers, setClarificationAnswer, submitClarification,
  } = useBuilderStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const isBuilding = !['queued','complete','failed'].includes(state);
  const hasResult  = !!currentProject?.bundle?.files?.length;

  useEffect(() => {
    if (!isBuilding) inputRef.current?.focus();
  }, [isBuilding]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-b-bg text-white">
      <BuilderSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-2 px-3 py-2.5 border-b border-b-border bg-b-surf flex-shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors">
              <Menu size={15} />
            </button>
          )}
          <a href={APP_CONFIG.mainAppUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-sm font-bold"><span className="text-b-accent">Orin</span><span className="text-b-blue">AI</span></span>
            <ChevronRight size={11} className="text-b-dim" />
            <span className="text-sm font-semibold text-white">Builder</span>
          </a>

          {/* Prompt input */}
          <div className="flex-1 flex items-center bg-b-elev border border-b-border rounded-xl px-3 py-1.5 gap-2 focus-within:border-b-accent/50 transition-colors">
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-sm text-white placeholder-b-dim outline-none min-w-0"
              placeholder='Describe your website… e.g. "A SaaS landing page for an AI scheduling tool"'
              value={prompt}
              disabled={isBuilding}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isBuilding && generate()}
            />
            {isBuilding && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-b-accent font-mono">{progress}%</span>
                <Loader2 size={13} className="text-b-accent animate-spin-slow" />
              </div>
            )}
          </div>

          {!hasResult ? (
            <button onClick={generate} disabled={isBuilding || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-b-accent text-black hover:bg-green-400 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.97] flex-shrink-0">
              {isBuilding ? <Loader2 size={13} className="animate-spin-slow" /> : '⚡'}
              {isBuilding ? 'Building…' : 'Generate'}
            </button>
          ) : (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={generate} disabled={isBuilding || !prompt.trim()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-b-accent text-black hover:bg-green-400 disabled:opacity-30 transition-all">
                ↺ Rebuild
              </button>
              <button onClick={newProject} className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-b-border text-b-muted hover:text-white hover:border-b-muted transition-colors">
                + New
              </button>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full border border-b-border"/>
                : <div className="w-7 h-7 rounded-full bg-b-elev border border-b-border flex items-center justify-center text-xs font-bold text-b-accent">{user.name[0]}</div>
              }
              <button onClick={() => firebaseService.logout()} className="p-1.5 rounded-md text-b-dim hover:text-b-muted transition-colors" title="Sign out">
                <LogOut size={13}/>
              </button>
            </div>
          )}
        </header>

        {/* Error banner */}
        {state === 'failed' && error && (
          <div className="flex items-center justify-between px-4 py-2 bg-red-950/40 border-b border-red-800/40 flex-shrink-0">
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle size={13}/><span>{error}</span>
            </div>
            <button onClick={generate} disabled={!prompt.trim()} className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors">
              <RefreshCw size={11}/> Retry
            </button>
          </div>
        )}

        {/* Status bar (building) */}
        {isBuilding && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-b-accent/5 border-b border-b-accent/20 flex-shrink-0">
            <span className="text-[11px] text-b-accent font-medium">{BUILD_STATE_META[state]?.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-b-muted">{BUILD_STATE_META[state]?.message}</span>
              <button onClick={abort} className="text-[11px] text-b-dim hover:text-red-400 transition-colors">✕ Abort</button>
            </div>
          </div>
        )}

        {/* Clarification overlay */}
        {clarificationQuestions && clarificationQuestions.length > 0 && (
          <ClarificationBanner
            questions={clarificationQuestions}
            answers={clarificationAnswers}
            onAnswer={setClarificationAnswer}
            onSubmit={submitClarification}
          />
        )}

        {/* Tab bar */}
        {hasResult && (
          <div className="flex items-center border-b border-b-border bg-b-surf flex-shrink-0 px-1">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === id ? 'border-b-accent text-white' : 'border-transparent text-b-muted hover:text-white hover:border-b-border'
                }`}>
                <Icon size={12}/>{label}
              </button>
            ))}
            {(currentProject?.bundle?.validation?.warnings?.length ?? 0) > 0 && (
              <span className="ml-auto mr-3 text-[10px] text-amber-400 flex items-center gap-1">
                ⚠ {currentProject?.bundle?.validation?.warnings.length} warning{(currentProject?.bundle?.validation?.warnings?.length ?? 0) > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Main panel */}
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 size={18} className="text-b-accent animate-spin-slow"/></div>}>
            {(!hasResult) && <PreviewPanel />}
            {hasResult && activeTab === 'preview'   && <PreviewPanel />}
            {hasResult && activeTab === 'code'      && <CodePanel />}
            {hasResult && activeTab === 'blueprint' && <BlueprintPanel />}
            {hasResult && activeTab === 'database'  && <DatabasePanel />}
          </Suspense>
        </main>

        {/* Refine bar */}
        {hasResult && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-b-border bg-b-surf flex-shrink-0">
            <MessageSquare size={13} className="text-b-muted flex-shrink-0" />
            <input
              className="flex-1 bg-b-elev border border-b-border rounded-xl px-3 py-1.5 text-sm text-white placeholder-b-dim outline-none focus:border-b-accent/50 transition-colors min-w-0"
              placeholder="Refine: add dark mode, add pricing section, change hero font…"
              value={refinePrompt}
              disabled={isBuilding}
              onChange={e => setRefinePrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isBuilding && refine()}
            />
            <button onClick={refine} disabled={isBuilding || !refinePrompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-b-elev border border-b-border text-b-muted hover:text-white hover:border-b-muted disabled:opacity-40 disabled:pointer-events-none transition-all flex-shrink-0">
              {isBuilding ? <Loader2 size={12} className="animate-spin-slow"/> : '↻'}
              Refine
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Clarification overlay ─────────────────────────────────────────────────────
const ClarificationBanner: React.FC<{
  questions: string[];
  answers: Record<string, string>;
  onAnswer: (q: string, a: string) => void;
  onSubmit: () => void;
}> = ({ questions, answers, onAnswer, onSubmit }) => {
  const allAnswered = questions.every(q => (answers[q] ?? '').trim().length > 0);
  return (
    <div className="px-4 py-3 bg-amber-950/30 border-b border-amber-800/40 flex-shrink-0">
      <p className="text-[11px] font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
        <span>?</span> A few details needed before we continue
      </p>
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[11px] text-amber-200/70 mt-1.5 flex-shrink-0 w-4">{i+1}.</span>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[11px] text-amber-200/80">{q}</span>
              <input
                className="bg-b-elev border border-amber-800/40 rounded-lg px-2.5 py-1 text-xs text-white placeholder-b-dim outline-none focus:border-amber-600/50 transition-colors"
                placeholder="Your answer…"
                value={answers[q] ?? ''}
                onChange={e => onAnswer(q, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && allAnswered && onSubmit()}
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={onSubmit} disabled={!allAnswered}
        className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 disabled:pointer-events-none transition-colors">
        Continue Build →
      </button>
    </div>
  );
};

export default BuilderApp;
