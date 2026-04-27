import React from 'react';
import { CheckCircle2, ChevronLeft, Circle, Loader2, Plus, Trash2, AlertCircle, XCircle } from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { PIPELINE, PipelineStep, BuildState, BuilderProject } from '../types';

const ORDERED: BuildState[] = ['analyzing','planning','generating_backend','generating_database','generating_frontend','generating_content','assembling_preview','validating'];

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
  const { state, currentTask, progress, currentProject, projects, user, sidebarOpen, setSidebarOpen, setCurrentProject, deleteProject, newProject, abort } = useBuilderStore();
  const isBuilding = !['queued','complete','failed'].includes(state);
  const blueprint  = currentProject?.blueprint;
  const bundle     = currentProject?.bundle;

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 border-r border-white/6 bg-slate-900 transition-all duration-300 lg:static lg:z-0 overflow-hidden ${
      sidebarOpen ? 'w-[255px] translate-x-0 shadow-2xl shadow-black/50 lg:shadow-none' : 'w-[255px] -translate-x-full lg:w-0 lg:translate-x-0 lg:border-r-transparent'
    }`}>
      <div className="flex h-full flex-col overflow-hidden">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/6 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-indigo-400 font-black text-sm">Orin</span>
            <span className="text-cyan-400 font-black text-sm">AI</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Builder</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={newProject} className="rounded-lg p-1.5 text-slate-600 hover:bg-white/6 hover:text-indigo-400 transition-colors" title="New project"><Plus size={13} /></button>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-slate-600 hover:bg-white/6 hover:text-white transition-colors"><ChevronLeft size={13} /></button>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">

          {/* Progress */}
          {isBuilding && (
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-indigo-400">{progress}%</span>
                <button onClick={abort} className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-red-400 transition-colors"><XCircle size={10} /> Abort</button>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/6">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500" style={{ width:`${progress}%` }} />
              </div>
            </div>
          )}

          {/* Pipeline */}
          <div className="px-3 py-3">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-600">Pipeline</p>
            {PIPELINE.map((step) => {
              const status = stepStatus(step, state);
              return (
                <div key={step.id} className="flex items-start gap-2 py-[3px]">
                  <div className="mt-0.5 shrink-0">
                    {status === 'done'    && <CheckCircle2 size={12} className="text-indigo-400" />}
                    {status === 'active'  && <Loader2 size={12} className="animate-spin text-indigo-400" />}
                    {status === 'error'   && <AlertCircle size={12} className="text-red-400" />}
                    {status === 'pending' && <Circle size={12} className="text-white/10" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-[11px] font-semibold leading-tight ${
                      status === 'done' ? 'text-indigo-400' : status === 'active' ? 'text-white' : status === 'error' ? 'text-red-400' : 'text-slate-700'
                    }`}>{step.label}</p>
                    {status === 'active' && currentTask && <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-slate-500">{currentTask}</p>}
                  </div>
                </div>
              );
            })}
            {state === 'complete' && (
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 size={12} className="text-indigo-400" />
                <p className="text-[11px] font-semibold text-indigo-400">Build complete</p>
              </div>
            )}
          </div>

          {/* Blueprint */}
          {blueprint && (
            <>
              <div className="mx-3 h-px bg-white/5" />
              <div className="px-3 py-2.5">
                <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600">Blueprint</p>
                <p className="truncate text-[12px] font-bold text-white">{blueprint.siteName}</p>
                <p className="mb-1.5 line-clamp-2 text-[10px] text-slate-500">{blueprint.tagline}</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {(blueprint.pages ?? []).slice(0,5).map((page) => (
                    <span key={page} className="rounded-md px-1.5 py-0.5 text-[9px] text-slate-500 border border-white/6 bg-white/3">{page}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.values(blueprint.colorScheme ?? {}).slice(0,5).map((value, i) => (
                    <div key={`${value}-${i}`} className="h-3 w-3 rounded-sm border border-white/10" style={{ background: value }} title={value} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Artifacts */}
          {(bundle?.files?.length ?? 0) > 0 && (
            <>
              <div className="mx-3 h-px bg-white/5" />
              <div className="px-3 py-2.5">
                <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600">Artifacts</p>
                {(bundle?.files ?? []).map((file) => (
                  <div key={file.path} className="flex items-center gap-1.5 py-0.5">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60" />
                    <span className="truncate text-[11px] font-mono text-slate-500">{file.path}</span>
                    <span className="ml-auto shrink-0 text-[9px] text-slate-700">{((file.sizeBytes ?? file.content?.length ?? 0)/1024).toFixed(0)}KB</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* History */}
          {projects.length > 0 && (
            <>
              <div className="mx-3 h-px bg-white/5" />
              <div className="px-3 py-2.5">
                <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600">History</p>
                {projects.slice(0,12).map((p) => (
                  <ProjectRow key={p.id || p.updatedAt} project={p} onDelete={deleteProject} onSelect={setCurrentProject} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* User footer */}
        {user && (
          <div className="shrink-0 border-t border-white/6 px-3 py-2">
            <div className="flex items-center gap-2">
              {user.avatar
                ? <img src={user.avatar} alt="" className="h-6 w-6 rounded-full border border-white/10" />
                : <div className="h-6 w-6 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-[10px] font-black text-indigo-400 flex items-center justify-center">{user.name[0]}</div>
              }
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-white">{user.name}</p>
                <p className="text-[9px] text-slate-600">{user.tier}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const ProjectRow: React.FC<{ project: BuilderProject; onDelete:(id:string)=>Promise<void>; onSelect:(p:BuilderProject)=>void }> = ({ project, onDelete, onSelect }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1.5 py-1 hover:bg-white/4 transition-colors"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => onSelect(project)}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${project.state === 'complete' ? 'bg-indigo-400' : 'bg-red-500/50'}`} />
          <span className="truncate text-[11px] text-slate-500 group-hover:text-slate-300 transition-colors">{project.title || project.prompt.slice(0,28) || 'Untitled'}</span>
        </div>
        <p className="truncate pl-3 text-[9px] text-slate-700">{formatRelative(project.updatedAt || project.createdAt)}</p>
      </div>
      {hovered && project.id && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="rounded p-0.5 text-slate-700 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
      )}
    </div>
  );
};

function formatRelative(value?: string): string {
  if (!value) return '';
  const date = new Date(value); if (isNaN(date.getTime())) return '';
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins/60); if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs/24); if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default BuilderSidebar;
