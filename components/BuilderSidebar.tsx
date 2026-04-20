import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Loader2,
  Plus,
  Radio,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { PIPELINE, PipelineStep, BuildState, BuilderProject } from '../types';

const ORDERED: BuildState[] = [
  'analyzing',
  'planning',
  'generating_backend',
  'generating_database',
  'generating_frontend',
  'generating_content',
  'assembling_preview',
  'validating',
];

function stepStatus(step: PipelineStep, current: BuildState): 'done' | 'active' | 'pending' | 'error' {
  if (current === 'failed') return 'error';
  if (current === 'complete') return 'done';

  if (current === 'clarification_needed') {
    const planningIndex = ORDERED.indexOf('planning');
    const stepIndex = ORDERED.indexOf(step.id);
    if (step.id === 'planning') return 'active';
    if (stepIndex >= 0 && stepIndex < planningIndex) return 'done';
    return 'pending';
  }

  const currentIndex = ORDERED.indexOf(current);
  const stepIndex = ORDERED.indexOf(step.id);
  if (currentIndex < 0) return 'pending';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

const BuilderSidebar: React.FC = () => {
  const {
    state,
    currentTask,
    progress,
    events,
    currentProject,
    projects,
    user,
    sidebarOpen,
    setSidebarOpen,
    setCurrentProject,
    deleteProject,
    newProject,
    abort,
  } = useBuilderStore();

  const isBuilding = !['queued', 'complete', 'failed'].includes(state);
  const blueprint = currentProject?.blueprint;
  const bundle = currentProject?.bundle;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 overflow-hidden border-r border-b-border bg-b-surf transition-all duration-300 lg:static lg:z-0 ${
        sidebarOpen
          ? 'w-[278px] translate-x-0 shadow-2xl shadow-black/40 lg:w-[258px] lg:shadow-none'
          : 'w-[278px] -translate-x-full shadow-2xl shadow-black/35 lg:w-0 lg:translate-x-0 lg:border-r-transparent lg:shadow-none'
      }`}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-b-border px-3 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-b-dim">Workspace</span>
          <div className="flex items-center gap-1">
            <button
              onClick={newProject}
              className="rounded-md p-1.5 text-b-muted transition-colors hover:bg-b-elev hover:text-b-accent"
              title="New project"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1.5 text-b-muted transition-colors hover:bg-b-elev hover:text-white"
              title="Collapse"
            >
              <ChevronLeft size={13} />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {isBuilding && (
            <div className="px-3 pb-1 pt-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-[10px] text-b-accent">{progress}%</span>
                <button
                  onClick={abort}
                  className="flex items-center gap-1 text-[10px] text-b-dim transition-colors hover:text-red-400"
                >
                  <XCircle size={10} />
                  Abort
                </button>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-b-border">
                <div className="h-full rounded-full bg-b-accent transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="px-3 pb-2 pt-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-b-dim">Pipeline</p>
            {PIPELINE.map((step) => {
              const status = stepStatus(step, state);
              return (
                <div key={step.id} className="flex items-start gap-2 py-1">
                  <div className="mt-0.5 flex-shrink-0">
                    {status === 'done' && <CheckCircle2 size={12} className="text-b-accent" />}
                    {status === 'active' && <Loader2 size={12} className="animate-spin-slow text-b-accent" />}
                    {status === 'error' && <AlertCircle size={12} className="text-red-400" />}
                    {status === 'pending' && <Circle size={12} className="text-b-border" />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-[11px] font-medium leading-tight ${
                        status === 'done'
                          ? 'text-b-accent'
                          : status === 'active'
                          ? 'text-white'
                          : status === 'error'
                          ? 'text-red-400'
                          : 'text-b-dim'
                      }`}
                    >
                      {step.label}
                    </p>
                    {status === 'active' && currentTask && (
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-b-muted">{currentTask}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {state === 'clarification_needed' && (
              <p className="mt-1 rounded-md border border-amber-800/40 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-300">
                Waiting for clarification answers.
              </p>
            )}

            {state === 'complete' && (
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 size={12} className="text-b-accent" />
                <p className="text-[11px] font-medium text-b-accent">Build complete</p>
              </div>
            )}
          </div>

          {events.length > 0 && (
            <>
              <div className="mx-3 my-1 h-px bg-b-border" />
              <div className="px-3 py-2">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-b-dim">Live Feed</p>
                <div className="flex flex-col gap-1">
                  {events.slice(-6).reverse().map((event, index) => (
                    <div key={`${event.type}-${event.timestamp}-${index}`} className="flex items-start gap-1.5">
                      <Radio size={8} className={`mt-1 flex-shrink-0 ${index === 0 ? 'text-b-accent' : 'text-b-border'}`} />
                      <div className="min-w-0">
                        <p className={`line-clamp-2 text-[10px] leading-tight ${index === 0 ? 'text-b-muted' : 'text-b-dim'}`}>
                          {event.message || event.current_task || event.type}
                        </p>
                        {index === 0 && (
                          <p className="text-[9px] text-b-dim">{new Date(event.timestamp).toLocaleTimeString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {blueprint && (
            <>
              <div className="mx-3 my-1 h-px bg-b-border" />
              <div className="px-3 py-2">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-b-dim">Blueprint</p>
                <p className="truncate text-[12px] font-semibold text-white">{blueprint.siteName}</p>
                <p className="mb-1.5 line-clamp-2 text-[10px] text-b-muted">{blueprint.tagline}</p>
                <div className="mb-1.5 flex flex-wrap gap-1">
                  {(blueprint.pages ?? []).map((page) => (
                    <span key={page} className="rounded px-1.5 py-0.5 text-[9px] text-b-muted border border-b-border bg-b-elev">
                      {page}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.values(blueprint.colorScheme ?? {}).slice(0, 6).map((value, index) => (
                    <div
                      key={`${value}-${index}`}
                      title={value}
                      className="h-3 w-3 rounded-sm border border-white/10"
                      style={{ background: value }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {(bundle?.files?.length ?? 0) > 0 && (
            <>
              <div className="mx-3 my-1 h-px bg-b-border" />
              <div className="px-3 py-2">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-b-dim">Artifacts</p>
                {(bundle?.files ?? []).map((file) => {
                  const sizeBytes = file.sizeBytes ?? file.content?.length ?? 0;
                  return (
                    <div key={file.path} className="flex items-center gap-1.5 py-0.5">
                      <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-b-accent/70" />
                      <span className="truncate text-[11px] font-mono text-b-muted">{file.path}</span>
                      <span className="ml-auto flex-shrink-0 text-[9px] text-b-dim">{(sizeBytes / 1024).toFixed(0)}KB</span>
                    </div>
                  );
                })}
                {(bundle?.validation?.warnings?.length ?? 0) > 0 && (
                  <p className="mt-1.5 text-[10px] text-amber-400">
                    {bundle?.validation?.warnings?.length} warning
                    {(bundle?.validation?.warnings?.length ?? 0) > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </>
          )}

          {projects.length > 0 && (
            <>
              <div className="mx-3 my-1 h-px bg-b-border" />
              <div className="px-3 py-2">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-b-dim">History</p>
                {projects.slice(0, 10).map((project) => (
                  <ProjectRow key={project.id || project.updatedAt} project={project} onDelete={deleteProject} onSelect={setCurrentProject} />
                ))}
              </div>
            </>
          )}
        </div>

        {user && (
          <div className="flex-shrink-0 border-t border-b-border px-3 py-2">
            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-b-elev text-[10px] font-bold text-b-accent">
                  {user.name[0]}
                </div>
              )}
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
  onSelect: (project: BuilderProject) => void;
}> = ({ project, onDelete, onSelect }) => {
  const [hovered, setHovered] = React.useState(false);

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!project.id) return;
    await onDelete(project.id);
  };

  return (
    <div
      className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 transition-colors hover:bg-b-elev/45"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(project)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${project.state === 'complete' ? 'bg-b-accent' : 'bg-red-500/70'}`} />
          <span className="truncate text-[11px] text-b-muted transition-colors group-hover:text-white">
            {project.title || project.prompt.slice(0, 26) || 'Untitled project'}
          </span>
        </div>
        <p className="truncate pl-3 text-[9px] text-b-dim">{formatRelativeDate(project.updatedAt || project.createdAt)}</p>
      </div>

      {hovered && project.id && (
        <button
          onClick={handleDelete}
          className="rounded p-0.5 text-b-dim transition-colors hover:text-red-400"
          title="Delete project"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

function formatRelativeDate(value?: string): string {
  if (!value) return 'Unknown update time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown update time';

  const now = Date.now();
  const deltaMinutes = Math.round((now - date.getTime()) / 60000);

  if (deltaMinutes < 1) return 'Just now';
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  const deltaDays = Math.round(deltaHours / 24);
  if (deltaDays < 7) return `${deltaDays}d ago`;

  return date.toLocaleDateString();
}

export default BuilderSidebar;
