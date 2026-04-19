import React, { useRef, useState } from 'react';
import { Smartphone, Monitor, Tablet, RefreshCw, ExternalLink } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT: Record<ViewportSize, { w: string; label: string }> = {
  desktop: { w: '100%',  label: 'Desktop' },
  tablet:  { w: '768px', label: 'Tablet'  },
  mobile:  { w: '390px', label: 'Mobile'  },
};

const PreviewPanel: React.FC = () => {
  const { currentProject, stage } = useBuilderStore();
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [key, setKey] = useState(0);    // bump to force iframe reload
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = currentProject?.result?.html ?? '';
  const isBuilding = !['idle','done','error'].includes(stage);

  const exportHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${currentProject?.title ?? 'website'}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const openNewTab = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-b-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-b-border bg-b-surf flex-shrink-0">
        {/* Viewport toggles */}
        <div className="flex items-center gap-0.5 bg-b-elev rounded-lg p-0.5">
          {([ ['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone] ] as [ViewportSize, React.FC<any>][]).map(([vp, Icon]) => (
            <button
              key={vp}
              onClick={() => setViewport(vp)}
              className={`p-1.5 rounded-md transition-colors ${viewport === vp ? 'bg-b-surf text-white' : 'text-b-muted hover:text-white'}`}
              title={VIEWPORT[vp].label}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* URL bar (decorative) */}
        <div className="flex-1 flex items-center bg-b-elev border border-b-border rounded-lg px-2.5 py-1 gap-2 min-w-0">
          <div className="flex gap-1 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-amber-500/60" />
            <div className="w-2 h-2 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] text-b-muted truncate font-mono">
            {currentProject?.result
              ? `${currentProject.result.blueprint.domain}.orinai.app`
              : 'your-site.orinai.app'}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setKey(k => k+1)} className="p-1.5 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors" title="Reload preview">
            <RefreshCw size={12} />
          </button>
          <button onClick={openNewTab} disabled={!html} className="p-1.5 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors disabled:opacity-30" title="Open in new tab">
            <ExternalLink size={12} />
          </button>
          <button
            onClick={exportHtml}
            disabled={!html}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-b-accent text-black hover:bg-green-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            ↓ Export
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex items-start justify-center bg-[#1a1b24] p-4">
        {isBuilding && (
          <div className="flex h-full w-full items-center justify-center flex-col gap-3">
            <BuildingAnimation />
          </div>
        )}

        {!isBuilding && !html && (
          <div className="flex h-full w-full items-center justify-center flex-col gap-3 text-b-dim">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#22c892" fillOpacity="0.06"/>
              <path d="M14 24h20M24 14v20" stroke="#22c892" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4"/>
            </svg>
            <span className="text-sm">Enter a prompt to generate your website</span>
          </div>
        )}

        {!isBuilding && html && (
          <div
            className="h-full bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 flex-shrink-0"
            style={{ width: VIEWPORT[viewport].w, maxWidth: '100%' }}
          >
            <iframe
              ref={iframeRef}
              key={key}
              srcDoc={html}
              sandbox="allow-scripts allow-same-origin allow-forms"
              className="w-full h-full border-0"
              title="Website Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const BuildingAnimation: React.FC = () => {
  const { stage, stageDetail } = useBuilderStore();
  const STAGE_ORDER = ['parsing','blueprint','database','backend','frontend','assembling','checks'];
  const idx = STAGE_ORDER.indexOf(stage);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / STAGE_ORDER.length) * 100);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs">
      <div className="w-8 h-8 rounded-full border-2 border-b-accent/30 border-t-b-accent animate-spin-slow" />
      <div className="text-center">
        <p className="text-sm font-medium text-white">{stageDetail || 'Building…'}</p>
        <p className="text-xs text-b-muted mt-0.5">{pct}% complete</p>
      </div>
      <div className="w-full h-1 bg-b-border rounded-full overflow-hidden">
        <div
          className="h-full bg-b-accent rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default PreviewPanel;
