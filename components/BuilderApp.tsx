import React, { lazy, Suspense, useRef, useEffect } from 'react';
import {
  Eye, Code2, LayoutTemplate, Database as DbIcon,
  ChevronRight, Loader2, AlertCircle, RefreshCw, LogOut, Menu,
} from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { firebaseService } from '../services/firebaseService';
import BuilderSidebar from './BuilderSidebar';
import { BuilderTab } from '../types';
import { APP_CONFIG } from '../config';

const PreviewPanel   = lazy(() => import('./panels/PreviewPanel'));
const CodePanel      = lazy(() => import('./panels/CodePanel'));
const BlueprintPanel = lazy(() => import('./panels/BlueprintPanel'));
const DatabasePanel  = lazy(() => import('./panels/DatabasePanel'));

const TABS: { id: BuilderTab; label: string; Icon: React.FC<any> }[] = [
  { id: 'preview',   label: 'Preview',   Icon: Eye            },
  { id: 'code',      label: 'Code',      Icon: Code2          },
  { id: 'blueprint', label: 'Blueprint', Icon: LayoutTemplate },
  { id: 'database',  label: 'Database',  Icon: DbIcon         },
];

const BuilderApp: React.FC = () => {
  const {
    prompt, setPrompt, generate, refine, refinePrompt, setRefinePrompt,
    stage, error, newProject, user,
    activeTab, setActiveTab, sidebarOpen, setSidebarOpen,
    currentProject,
  } = useBuilderStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const isBuilding = !['idle','done','error'].includes(stage);
  const hasResult  = !!currentProject?.result;

  useEffect(() => {
    if (stage === 'idle') inputRef.current?.focus();
  }, [stage]);

  const handleLogout = async () => {
    await firebaseService.logout();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-b-bg text-white">

      {/* Sidebar */}
      <BuilderSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-2 px-3 py-2.5 border-b border-b-border bg-b-surf flex-shrink-0">
          {/* Sidebar toggle */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors tap-target"
            >
              <Menu size={15} />
            </button>
          )}
          {/* Logo */}
          <a href={APP_CONFIG.mainAppUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 mr-1">
            <span className="text-sm font-bold">
              <span className="text-b-accent">Orin</span><span className="text-b-blue">AI</span>
            </span>
            <ChevronRight size={12} className="text-b-dim" />
            <span className="text-sm font-semibold text-white">Builder</span>
          </a>

          {/* Prompt input */}
          <div className="flex-1 flex items-center bg-b-elev border border-b-border rounded-xl px-3 py-1.5 gap-2 focus-within:border-b-accent/60 transition-colors">
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-sm text-white placeholder-b-dim outline-none min-w-0"
              placeholder='Describe your website… e.g. "A SaaS landing page for an AI scheduling tool"'
              value={prompt}
              disabled={isBuilding}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isBuilding && generate()}
            />
            {isBuilding && <Loader2 size={14} className="text-b-accent animate-spin-slow flex-shrink-0" />}
          </div>

          {/* Generate / New */}
          {!hasResult ? (
            <button
              onClick={generate}
              disabled={isBuilding || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-b-accent text-black hover:bg-green-400 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.97] tap-target flex-shrink-0"
            >
              {isBuilding ? <Loader2 size={14} className="animate-spin-slow" /> : '⚡'}
              {isBuilding ? 'Building…' : 'Generate'}
            </button>
          ) : (
            <button
              onClick={newProject}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-b-border text-b-muted hover:text-white hover:border-b-muted transition-colors tap-target flex-shrink-0"
            >
              + New
            </button>
          )}

          {/* User avatar + logout */}
          {user && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full border border-b-border" />
                : <div className="w-7 h-7 rounded-full bg-b-elev border border-b-border flex items-center justify-center text-xs font-bold text-b-accent">{user.name[0]}</div>
              }
              <button onClick={handleLogout} className="p-1.5 rounded-md text-b-dim hover:text-b-muted transition-colors" title="Sign out">
                <LogOut size={13} />
              </button>
            </div>
          )}
        </header>

        {/* Error banner */}
        {stage === 'error' && error && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-red-950/40 border-b border-red-800/40 flex-shrink-0">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
            <button onClick={generate} disabled={!prompt.trim()} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {/* Tab bar (only once there's a result) */}
        {hasResult && (
          <div className="flex items-center gap-0 border-b border-b-border bg-b-surf flex-shrink-0 px-1">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-b-accent text-white'
                    : 'border-transparent text-b-muted hover:text-white hover:border-b-border'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Panel content */}
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={<PanelLoader />}>
            {(!hasResult && stage === 'idle') && <IdleScreen />}
            {(!hasResult && isBuilding) && <PreviewPanel />}
            {(!hasResult && stage === 'error' && !error) && <IdleScreen />}
            {hasResult && activeTab === 'preview'   && <PreviewPanel />}
            {hasResult && activeTab === 'code'      && <CodePanel />}
            {hasResult && activeTab === 'blueprint' && <BlueprintPanel />}
            {hasResult && activeTab === 'database'  && <DatabasePanel />}
          </Suspense>
        </main>

        {/* Refine bar — shown after generation */}
        {hasResult && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-b-border bg-b-surf flex-shrink-0">
            <input
              className="flex-1 bg-b-elev border border-b-border rounded-xl px-3 py-1.5 text-sm text-white placeholder-b-dim outline-none focus:border-b-accent/60 transition-colors min-w-0"
              placeholder="Refine: add dark mode, add a pricing section, change font to Playfair Display…"
              value={refinePrompt}
              disabled={isBuilding}
              onChange={e => setRefinePrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isBuilding && refine()}
            />
            <button
              onClick={refine}
              disabled={isBuilding || !refinePrompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-b-elev border border-b-border text-b-muted hover:text-white hover:border-b-muted disabled:opacity-40 disabled:pointer-events-none transition-all tap-target flex-shrink-0"
            >
              {isBuilding ? <Loader2 size={12} className="animate-spin-slow" /> : '↻'}
              Refine
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const PanelLoader = () => (
  <div className="flex h-full items-center justify-center">
    <Loader2 size={20} className="text-b-accent animate-spin-slow" />
  </div>
);

const IdleScreen = () => {
  const { setPrompt } = useBuilderStore();
  const examples = [
    'A SaaS landing page for an AI scheduling tool',
    'Photography portfolio with dark theme',
    'E-commerce store for handmade jewellery',
    'Restaurant website with online reservation',
    'Startup landing page for a fintech app',
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-6 text-center">
      <div>
        <div className="text-4xl font-bold mb-2">
          <span className="text-b-accent">Orin</span><span className="text-b-blue">AI</span>
          <span className="text-white ml-2">Builder</span>
        </div>
        <p className="text-b-muted text-sm max-w-md">
          Describe your website. Gemini generates a complete blueprint, database schema, and production HTML in seconds.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-xl">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => setPrompt(ex)}
            className="text-xs bg-b-surf border border-b-border text-b-muted hover:text-white hover:border-b-muted px-3 py-1.5 rounded-full transition-colors tap-target"
          >
            {ex}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-b-dim">{APP_CONFIG.branding}</p>
    </div>
  );
};

export default BuilderApp;
