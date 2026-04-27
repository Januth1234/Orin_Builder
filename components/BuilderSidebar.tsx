import React from 'react';
import { CheckCircle2, ChevronLeft, Circle, Loader2, Plus, Trash2, XCircle, AlertCircle } from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { PIPELINE, PipelineStep, BuildState, BuilderProject } from '../types';

const ORDERED: BuildState[] = [
  'analyzing','planning','generating_backend','generating_database',
  'generating_frontend','generating_content','assembling_preview','validating',
];

function stepStatus(step: PipelineStep, current: BuildState): 'done'|'active'|'pending'|'error' {
  if (current === 'failed') return 'error';
  if (current === 'complete') return 'done';
  if (current === 'clarification_needed') {
    const si = ORDERED.indexOf(step.id), pi = ORDERED.indexOf('planning');
    if (step.id === 'planning') return 'active';
    if (si >= 0 && si < pi) return 'done';
    return 'pending';
  }
  const ci = ORDERED.indexOf(current), si = ORDERED.indexOf(step.id);
  if (ci < 0) return 'pending';
  if (si < ci) return 'done';
  if (si === ci) return 'active';
  return 'pending';
}

const BuilderSidebar: React.FC = () => {
  const {
    state, currentTask, progress, events, currentProject,
    projects, user, sidebarOpen, setSidebarOpen,
    setCurrentProject, deleteProject, newProject, abort,
  } = useBuilderStore();

  const isBuilding = !['queued','complete','failed'].includes(state);
  const blueprint  = currentProject?.blueprint;
  const bundle     = currentProject?.bundle;

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 border-r border-b-border/50 bg-b-surf transition-all duration-300 lg:static lg:z-0 overflow-hidden ${
      sidebarOpen
        ? 'w-[260px] translate-x-0 shadow-2xl shadow-black/40 lg:shadow-none'
        : 'w-[260px] -translate-x-full lg:w-0 lg:translate-x-0 lg:border-r-transparent'
    }`}>
      <div className="flex h-full flex-col overflow-hidden">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-b-border/50 px-3 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-b-dim">Workspace</span>
          <div className="flex items-center gap-1">
            <button onClick={newProject} className="rounded-md p-1.5 text-b-dim hover:bg-b-elev hover:text-b-accent transition-colors" title="New project">
              <Plus size={13} />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1.5 text-b-dim hover:bg-b-elev hover:text-white transition-colors">
              <ChevronLeft size={13} />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">

          {/* Progress */}
          {isBuilding && (
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-b-accent">{progress}%</span>
                <button onClick={abort} className="flex items-center gap-1 text-[10px] text-b-dim hover:text-red-400 transition-colors">
                  <XCircle size={10} /> Abort
                </button>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-b-border">
                <div className="h-full rounded-full bg-b-accent transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Pipeline */}
          <div className="px-3 py-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-b-dim">Pipeline</p>
            {PIPELINE.map((step) => {
              const status = stepStatus(step, state);
              return (
                <div key={step.id} className="flex items-start gap-2 py-1">
                  <div className="mt-0.5 shrink-0">
                    {status === 'done'    && <CheckCircle2 size={12} className="text-b-accent" />}
                    {status === 'active'  && <Loader2 size={12} className="animate-spin-slow text-b-accent" />}
                    {status === 'error'   && <AlertCircle size={12} className="text-red-400" />}
                    {status === 'pending' && <Circle size={12} className="text-b-border" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-[11px] font-medium leading-tight ${
                      status === 'done'    ? 'text-b-accent' :
                      status === 'active'  ? 'text-white' :
                      status === 'error'   ? 'text-red-400' : 'text-b-dim'
                    }`}>{step.label}</p>
                    {status === 'active' && currentTask && (
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-b-muted">{currentTask}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {state === 'complete' && (
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 size={12} className="text-b-accent" />
                <p className="text-[11px] font-medium text-b-accent">Build complete</p>
              </div>
            )}
          </div>

          {/* Blueprint summary */}
          {blueprint && (
            <>
              <div className="mx-3 h-px bg-b-border/50" />
              <div className="px-3 py-2.5">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-b-dim">Blueprint</p>
                <p className="truncate text-[12px] font-semibold text-white">{blueprint.siteName}</p>
                <p className="mb-1.5 line-clamp-2 text-[10px] text-b-muted">{blueprint.tagline}</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {(blueprint.pages ?? []).slice(0, 5).map((page) => (
                    <span key={page} className="rounded px-1.5 py-0.5 text-[9px] text-b-muted border border-b-border bg-b-elev">{page}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.values(blueprint.colorScheme ?? {}).slice(0, 5).map((value, i) => (
                    <div key={`${value}-${i}`} className="h-3 w-3 rounded-sm border border-white/10" style={{ background: value }} title={value} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Artifacts */}
          {(bundle?.files?.length ?? 0) > 0 && (
            <>
              <div className="mx-3 h-px bg-b-border/50" />
              <div className="px-3 py-2.5">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-b-dim">Artifacts</p>
                {(bundle?.files ?? []).map((file) => (
                  <div key={file.path} className="flex items-center gap-1.5 py-0.5">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-b-accent/60" />
                    <span className="truncate text-[11px] font-mono text-b-muted">{file.path}</span>
                    <span className="ml-auto shrink-0 text-[9px] text-b-dim">
                      {((file.sizeBytes ?? file.content?.length ?? 0) / 1024).toFixed(0)}KB
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* History */}
          {projects.length > 0 && (
            <>
              <div className="mx-3 h-px bg-b-border/50" />
              <div className="px-3 py-2.5">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-b-dim">History</p>
                {projects.slice(0, 12).map((project) => (
                  <ProjectRow key={project.id || project.updatedAt} project={project}
                    onDelete={deleteProject} onSelect={setCurrentProject} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* User footer */}
        {user && (
          <div className="shrink-0 border-t border-b-border/50 px-3 py-2">
            <div className="flex items-center gap-2">
              {user.avatar
                ? <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
                : <div className="h-6 w-6 rounded-full bg-b-elev text-[10px] font-bold text-b-accent flex items-center justify-center">{user.name[0]}</div>
              }
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-white">{user.name}</p>
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
  onDelete: (id: string) => Promise<void>;
  onSelect: (p: BuilderProject) => void;
}> = ({ project, onDelete, onSelect }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-b-elev/40 transition-colors"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(project)}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${project.state === 'complete' ? 'bg-b-accent' : 'bg-red-500/60'}`} />
          <span className="truncate text-[11px] text-b-muted group-hover:text-white transition-colors">
            {project.title || project.prompt.slice(0, 28) || 'Untitled'}
          </span>
        </div>
        <p className="truncate pl-3 text-[9px] text-b-dim">{formatRelative(project.updatedAt || project.createdAt)}</p>
      </div>
      {hovered && project.id && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
          className="rounded p-0.5 text-b-dim hover:text-red-400 transition-colors">
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

function formatRelative(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default BuilderSidebar;
