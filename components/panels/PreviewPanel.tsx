import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';
import { BUILD_STATE_META } from '../../types';

type Viewport = 'desktop' | 'tablet' | 'mobile';

type ViewportConfig = {
  width: number;
  label: string;
};

const VIEWPORTS: Record<Viewport, ViewportConfig> = {
  desktop: { width: 1280, label: 'Desktop' },
  tablet: { width: 768, label: 'Tablet' },
  mobile: { width: 390, label: 'Mobile' },
};

const ORDERED_STATES = [
  'analyzing',
  'planning',
  'generating_backend',
  'generating_database',
  'generating_frontend',
  'generating_content',
  'assembling_preview',
  'validating',
];

const PreviewPanel: React.FC = () => {
  const { currentProject, state, progress, currentTask, setActiveTab } = useBuilderStore();
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [frameKey, setFrameKey] = useState(0);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  const files = currentProject?.bundle?.files ?? [];
  const entryPath = currentProject?.bundle?.preview_entry || 'index.html';
  const htmlFile = files.find((file) => file.path === entryPath) ?? files.find((file) => file.path === 'index.html');
  const html = htmlFile?.content ?? '';

  const isBuilding = !['queued', 'complete', 'failed'].includes(state);
  const warnings = currentProject?.bundle?.validation?.warnings ?? [];
  const hasHtmlFile = Boolean(htmlFile);
  const hasHtmlContent = Boolean(html.trim());
  const metadataOnly = hasHtmlFile && !hasHtmlContent;

  useEffect(() => {
    if (!stageRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setStageSize({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });

    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const selectedViewport = VIEWPORTS[viewport];

  const scale = useMemo(() => {
    if (!stageSize.width) return 1;
    const available = Math.max(320, stageSize.width - 28);
    return Math.min(1, available / selectedViewport.width);
  }, [selectedViewport.width, stageSize.width]);

  const frameHeight = useMemo(() => {
    const fallbackHeight = viewport === 'mobile' ? 780 : viewport === 'tablet' ? 880 : 940;
    if (!stageSize.height) return fallbackHeight;
    const scaleForHeight = Math.max(scale, 0.5);
    return Math.max(fallbackHeight, Math.round((stageSize.height - 10) / scaleForHeight));
  }, [scale, stageSize.height, viewport]);

  const scaledFrameSize = {
    width: Math.round(selectedViewport.width * scale),
    height: Math.round(frameHeight * scale),
  };

  const exportHtml = () => {
    if (!hasHtmlContent) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(currentProject?.title ?? 'website').replace(/\s+/g, '-').toLowerCase()}.html`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const openInTab = () => {
    if (!hasHtmlContent) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <div className="flex h-full flex-col bg-b-bg">
      <div className="flex flex-wrap items-center gap-2 border-b border-b-border bg-b-surf px-3 py-2 sm:flex-nowrap">
        <div className="flex items-center gap-0.5 rounded-lg bg-b-elev p-0.5">
          {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((key) => {
            const Icon = key === 'desktop' ? Monitor : key === 'tablet' ? Tablet : Smartphone;
            const active = viewport === key;
            return (
              <button
                key={key}
                onClick={() => setViewport(key)}
                title={VIEWPORTS[key].label}
                className={`rounded-md p-1.5 transition-colors ${
                  active ? 'bg-b-surf text-white' : 'text-b-muted hover:text-white'
                }`}
              >
                <Icon size={13} />
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-b-border bg-b-elev px-2.5 py-1">
          <div className="flex flex-shrink-0 gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500/55" />
            <div className="h-2 w-2 rounded-full bg-amber-500/55" />
            <div className="h-2 w-2 rounded-full bg-green-500/55" />
          </div>
          <span className="truncate font-mono text-[11px] text-b-muted">
            {currentProject?.blueprint?.domain ? `${currentProject.blueprint.domain}.orinai.app` : 'your-site.orinai.app'}
          </span>
          {warnings.length > 0 && (
            <span className="ml-auto flex flex-shrink-0 items-center gap-1 text-[10px] text-amber-400">
              <AlertTriangle size={10} />
              {warnings.length}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setFrameKey((value) => value + 1)}
            className="rounded-md p-1.5 text-b-muted transition-colors hover:bg-b-elev hover:text-white"
            title="Reload preview"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={openInTab}
            disabled={!hasHtmlContent}
            className="rounded-md p-1.5 text-b-muted transition-colors hover:bg-b-elev hover:text-white disabled:opacity-30"
            title="Open in new tab"
          >
            <ExternalLink size={12} />
          </button>
          <button
            onClick={exportHtml}
            disabled={!hasHtmlContent}
            className="rounded-lg bg-b-accent px-2.5 py-1 text-[11px] font-semibold text-black transition-colors hover:bg-green-400 disabled:opacity-30"
            title="Export HTML"
          >
            Export
          </button>
        </div>
      </div>

      <div ref={stageRef} className="relative flex-1 overflow-auto bg-[#16171f] p-3">
        {isBuilding && <BuildingView />}

        {!isBuilding && !hasHtmlFile && (
          <StateCard
            title="No preview yet"
            description="Generate a website from the workspace prompt to populate the live preview panel."
          />
        )}

        {!isBuilding && metadataOnly && (
          <StateCard
            title="Preview content not available"
            description="This project was loaded from saved history with metadata-only files. Rebuild the project to restore full preview content."
            actionLabel="Open Code Tab"
            onAction={() => setActiveTab('code')}
          />
        )}

        {!isBuilding && hasHtmlContent && (
          <div className="flex min-h-full items-start justify-center pb-6 pt-2">
            <div style={{ width: `${scaledFrameSize.width}px`, height: `${scaledFrameSize.height}px` }}>
              <div
                className="overflow-hidden rounded-lg bg-white shadow-2xl"
                style={{
                  width: `${selectedViewport.width}px`,
                  height: `${frameHeight}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <iframe
                  key={`${frameKey}-${viewport}`}
                  srcDoc={html}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  className="h-full w-full border-0"
                  title="Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StateCard: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="flex h-full w-full items-center justify-center px-6">
    <div className="max-w-md rounded-xl border border-b-border bg-b-surf/70 p-5 text-center">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-b-muted">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-lg border border-b-border px-3 py-1.5 text-xs font-medium text-b-muted transition-colors hover:border-b-muted hover:text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

const BuildingView: React.FC = () => {
  const { state, progress, currentTask } = useBuilderStore();
  const meta = BUILD_STATE_META[state];
  const stateIndex = ORDERED_STATES.indexOf(state);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#16171f]/92 px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-b-border bg-b-surf/75 p-6 backdrop-blur">
        <div className="h-10 w-10 rounded-full border-2 border-b-accent/35 border-t-b-accent animate-spin-slow" />

        <div className="text-center">
          <p className="text-sm font-semibold text-white">{meta?.label ?? state}</p>
          <p className="mt-1 text-xs text-b-muted">{currentTask || meta?.message}</p>
        </div>

        <div className="w-full">
          <div className="mb-1.5 flex justify-between text-[10px] text-b-dim">
            <span>Progress</span>
            <span className="font-mono text-b-accent">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-b-border">
            <div className="h-full rounded-full bg-b-accent transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ORDERED_STATES.map((step, index) => (
            <div
              key={step}
              className={`rounded-full transition-all duration-300 ${
                index < stateIndex
                  ? 'h-2 w-2 bg-b-accent'
                  : index === stateIndex
                  ? 'h-3 w-3 animate-pulse bg-b-accent'
                  : 'h-2 w-2 bg-b-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
