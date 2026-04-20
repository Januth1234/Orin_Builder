import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, Plus, Trash2, ChevronLeft, XCircle, Radio } from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { PIPELINE, PipelineStep, BuildState, BuilderProject, BUILD_STATE_META } from '../types';

const ORDERED: BuildState[] = [
  'analyzing','planning','generating_backend','generating_database',
  'generating_frontend','generating_content','assembling_preview','validating',
];

function stepStatus(step: PipelineStep, current: BuildState): 'done'|'active'|'pending'|'error' {
  if (current === 'failed') return 'error';
  if (current === 'complete') return 'done';
  const ci = ORDERED.indexOf(current);
  const si = ORDERED.indexOf(step.id);
  if (ci < 0) return 'pending';
  if (si < ci) return 'done';
  if (si === ci) return 'active';
  return 'pending';
}

const BuilderSidebar: React.FC = () => {
  const {
    state, currentTask, progress, events,
    currentProject, projects, user,
    sidebarOpen, setSidebarOpen,
    setCurrentProject, deleteProject, newProject, abort,
  } = useBuilderStore();

  const isBuilding = !['queued','complete','failed'].includes(state);
  const bp = currentProject?.blueprint;
  const bundle = currentProject?.bundle;
  const dbTables = bundle?.db_schema ? [] : [];

  return (
    <aside className={`flex-shrink-0 flex flex-col bg-b-surf border-r border-b-border transition-all duration-200 overflow-hidden ${sidebarOpen ? 'w-[228px]' : 'w-0'}`}>
      <div className="flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-b-border flex-shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-b-dim">Orin Builder</span>
          <div className="flex items-center gap-1">
            <button onClick={newProject} className="p-1.5 rounded-md text-b-muted hover:text-b-accent hover:bg-b-elev transition-colors" title="New project">
              <Plus size={13} />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors" title="Collapse">
              <ChevronLeft size={13} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">

          {/* Progress bar */}
          {isBuilding && (
            <div className="px-3 pt-3 pb-1 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-b-accent font-mono">{progress}%</span>
                <button onClick={abort} className="text-[10px] text-b-dim hover:text-red-400 transition-colors flex items-center gap-1">
                  <XCircle size={10} /> Abort
                </button>
              </div>
              <div className="w-full h-1 bg-b-border rounded-full overflow-hidden">
                <div className="h-full bg-b-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Pipeline steps */}
          <div className="px-3 pt-3 pb-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-2">Pipeline</p>
            {PIPELINE.map(step => {
              const status = stepStatus(step, state);
              return (
                <div key={step.id} className="flex items-start gap-2 py-1">
                  <div className="mt-0.5 flex-shrink-0">
                    {status === 'done'   && <CheckCircle2 size={12} className="text-b-accent" />}
                    {status === 'active' && <Loader2 size={12} className="text-b-accent animate-spin-slow" />}
                    {status === 'error'  && <AlertCircle size={12} className="text-red-400" />}
                    {status === 'pending'&& <Circle size={12} className="text-b-border" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-medium leading-tight truncate ${
                      status === 'done'    ? 'text-b-accent'
                      : status === 'active' ? 'text-white'
                      : status === 'error'  ? 'text-red-400'
                      : 'text-b-dim'
                    }`}>{step.label}</p>
                    {status === 'active' && currentTask && (
                      <p className="text-[10px] text-b-muted leading-tight mt-0.5 line-clamp-2">{currentTask}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {state === 'complete' && (
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 size={12} className="text-b-accent" />
                <p className="text-[11px] text-b-accent font-medium">Build complete</p>
              </div>
            )}
          </div>

          {/* Live event feed (last 5) */}
          {events.length > 0 && (
            <>
              <div className="h-px bg-b-border mx-3 my-1" />
              <div className="px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-1.5">Live Feed</p>
                <div className="flex flex-col gap-0.5">
                  {events.slice(-6).reverse().map((ev, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Radio size={8} className={`mt-1 flex-shrink-0 ${i === 0 ? 'text-b-accent' : 'text-b-border'}`} />
                      <span className={`text-[10px] leading-tight line-clamp-2 ${i === 0 ? 'text-b-muted' : 'text-b-dim'}`}>
                        {ev.message || ev.current_task || ev.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Blueprint summary */}
          {bp && (
            <>
              <div className="h-px bg-b-border mx-3 my-1" />
              <div className="px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-1.5">Blueprint</p>
                <p className="text-[12px] font-semibold text-white truncate">{bp.siteName}</p>
                <p className="text-[10px] text-b-muted mb-1.5 line-clamp-2">{bp.tagline}</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {bp.pages?.map((p, i) => (
                    <span key={i} className="text-[9px] bg-b-elev border border-b-border text-b-muted rounded px-1.5 py-0.5">{p}</span>
                  ))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {bp.colorScheme && Object.values(bp.colorScheme).slice(0, 5).map((v, i) => (
                    <div key={i} title={v as string} className="w-3 h-3 rounded-sm border border-white/10" style={{ background: v as string }} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Artifact files */}
          {(bundle?.files?.length ?? 0) > 0 && (
            <>
              <div className="h-px bg-b-border mx-3 my-1" />
              <div className="px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-1.5">Artifacts</p>
                {bundle?.files?.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-b-accent/60 flex-shrink-0" />
                    <span className="text-[11px] font-mono text-b-muted truncate">{f.path}</span>
                    <span className="text-[9px] text-b-dim ml-auto flex-shrink-0">
                      {((f.sizeBytes ?? f.content?.length ?? 0) / 1024).toFixed(0)}KB
                    </span>
                  </div>
                ))}
                {(bundle?.validation?.warnings?.length ?? 0) > 0 && (
                  <div className="mt-1.5 text-[10px] text-amber-400/80">
                    ⚠ {bundle?.validation?.warnings?.length} warning{(bundle?.validation?.warnings?.length ?? 0) > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </>
          )}

          {/* History */}
          {projects.length > 0 && (
            <>
              <div className="h-px bg-b-border mx-3 my-1" />
              <div className="px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-1.5">History</p>
                {projects.slice(0, 8).map(p => (
                  <ProjectRow key={p.id} project={p} onDelete={deleteProject} onSelect={setCurrentProject} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* User footer */}
        {user && (
          <div className="flex-shrink-0 px-3 py-2 border-t border-b-border">
            <div className="flex items-center gap-2">
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                : <div className="w-6 h-6 rounded-full bg-b-elev flex items-center justify-center text-[10px] font-bold text-b-accent">{user.name[0]}</div>
              }
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-white truncate">{user.name}</p>
                <p className="text-[9px] text-b-dim">{user.tier}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const ProjectRow: React.FC<{
  project: BuilderProject;
  onDelete: (id: string) => void;
  onSelect: (p: BuilderProject) => void;
}> = ({ project, onDelete, onSelect }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      className="flex items-center justify-between py-0.5 cursor-pointer group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSelect(project)}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {project.state === 'complete'
          ? <div className="w-1.5 h-1.5 rounded-full bg-b-accent flex-shrink-0" />
          : <div className="w-1.5 h-1.5 rounded-full bg-red-500/60 flex-shrink-0" />
        }
        <span className="text-[11px] text-b-muted hover:text-white transition-colors truncate">
          {project.title || project.prompt.slice(0, 22)}
        </span>
      </div>
      {hover && project.id && (
        <button onClick={e => { e.stopPropagation(); onDelete(project.id); }} className="p-0.5 rounded text-b-dim hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

export default BuilderSidebar;
