import React, { useRef, useState } from 'react';
import { Smartphone, Monitor, Tablet, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';
import { BUILD_STATE_META, PIPELINE } from '../../types';

type Viewport = 'desktop' | 'tablet' | 'mobile';
const VP: Record<Viewport, { w: string; label: string }> = {
  desktop: { w: '100%',  label: 'Desktop' },
  tablet:  { w: '768px', label: 'Tablet'  },
  mobile:  { w: '390px', label: 'Mobile'  },
};

const ORDERED_STATES = [
  'analyzing','planning','generating_backend','generating_database',
  'generating_frontend','generating_content','assembling_preview','validating',
];

const PreviewPanel: React.FC = () => {
  const { currentProject, state, progress, currentTask } = useBuilderStore();
  const [vp, setVp] = useState<Viewport>('desktop');
  const [key, setKey] = useState(0);

  const html = currentProject?.bundle?.files.find(f => f.path === 'index.html')?.content ?? '';
  const isBuilding = !['queued','complete','failed'].includes(state);
  const warnings = currentProject?.bundle?.validation?.warnings ?? [];

  const exportHtml = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${currentProject?.title ?? 'website'}.html`;
    a.click();
  };

  const openTab = () => {
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-b-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-b-border bg-b-surf flex-shrink-0">
        <div className="flex items-center gap-0.5 bg-b-elev rounded-lg p-0.5">
          {(['desktop','tablet','mobile'] as Viewport[]).map((v) => {
            const Icon = v === 'desktop' ? Monitor : v === 'tablet' ? Tablet : Smartphone;
            return (
              <button key={v} onClick={() => setVp(v)} title={VP[v].label}
                className={`p-1.5 rounded-md transition-colors ${vp === v ? 'bg-b-surf text-white' : 'text-b-muted hover:text-white'}`}>
                <Icon size={13} />
              </button>
            );
          })}
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center bg-b-elev border border-b-border rounded-lg px-2.5 py-1 gap-2 min-w-0">
          <div className="flex gap-1 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
          <span className="text-[11px] text-b-muted truncate font-mono">
            {currentProject?.blueprint?.domain
              ? `${currentProject.blueprint.domain}.orinai.app`
              : 'your-site.orinai.app'}
          </span>
          {warnings.length > 0 && (
            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
              <AlertTriangle size={10} className="text-amber-400" />
              <span className="text-[10px] text-amber-400">{warnings.length}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setKey(k => k+1)} className="p-1.5 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors" title="Reload">
            <RefreshCw size={12} />
          </button>
          <button onClick={openTab} disabled={!html} className="p-1.5 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors disabled:opacity-30" title="Open in new tab">
            <ExternalLink size={12} />
          </button>
          <button onClick={exportHtml} disabled={!html}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-b-accent text-black hover:bg-green-400 disabled:opacity-30 disabled:pointer-events-none transition-colors">
            ↓ Export
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex items-start justify-center bg-[#16171f] p-3">
        {isBuilding && <BuildingView />}

        {!isBuilding && !html && (
          <div className="flex h-full w-full items-center justify-center flex-col gap-3 text-b-dim">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="11" fill="#22c892" fillOpacity="0.06"/>
              <path d="M13 22h18M22 13v18" stroke="#22c892" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35"/>
            </svg>
            <span className="text-sm">Enter a prompt to build your website</span>
          </div>
        )}

        {!isBuilding && html && (
          <div className="h-full bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 flex-shrink-0" style={{ width: VP[vp].w, maxWidth:'100%' }}>
            <iframe key={key} srcDoc={html} sandbox="allow-scripts allow-same-origin allow-forms" className="w-full h-full border-0" title="Preview" />
          </div>
        )}
      </div>
    </div>
  );
};

const BuildingView: React.FC = () => {
  const { state, progress, currentTask } = useBuilderStore();
  const meta = BUILD_STATE_META[state];
  const stateIdx = ORDERED_STATES.indexOf(state);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6 px-6">
      <div className="w-10 h-10 rounded-full border-2 border-b-accent/30 border-t-b-accent animate-spin-slow" />

      <div className="text-center max-w-xs">
        <p className="text-sm font-semibold text-white mb-1">{meta?.label ?? state}</p>
        <p className="text-xs text-b-muted">{currentTask || meta?.message}</p>
      </div>

      {/* Progress */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-[10px] text-b-dim mb-1.5">
          <span>Progress</span>
          <span className="font-mono text-b-accent">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-b-border rounded-full overflow-hidden">
          <div className="h-full bg-b-accent rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-2">
        {ORDERED_STATES.map((s, i) => (
          <div key={s} className={`rounded-full transition-all duration-300 ${
            i < stateIdx  ? 'w-2 h-2 bg-b-accent'
            : i === stateIdx ? 'w-3 h-3 bg-b-accent animate-pulse'
            : 'w-2 h-2 bg-b-border'
          }`} />
        ))}
      </div>
    </div>
  );
};

export default PreviewPanel;
