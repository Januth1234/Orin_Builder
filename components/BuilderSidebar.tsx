import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { useBuilderStore } from '../services/builderStore';
import { PIPELINE, PipelineStep, BuildStage, BuilderProject } from '../types';

const STAGE_ORDER: BuildStage[] = [
  'parsing','blueprint','database','backend','frontend','assembling','checks','done'
];

function stageStatus(step: PipelineStep, current: BuildStage): 'done'|'active'|'pending' {
  const ci = STAGE_ORDER.indexOf(current);
  const si = STAGE_ORDER.indexOf(step.id);
  if (current === 'done') return 'done';
  if (si < ci) return 'done';
  if (si === ci) return 'active';
  return 'pending';
}

const BuilderSidebar: React.FC = () => {
  const {
    stage, stageDetail, currentProject, projects,
    user, sidebarOpen, setSidebarOpen,
    setCurrentProject, deleteProject, newProject,
  } = useBuilderStore();

  const hasResult = !!currentProject?.result;

  return (
    <aside
      className={`
        flex-shrink-0 flex flex-col bg-b-surf border-r border-b-border
        transition-all duration-200 overflow-hidden
        ${sidebarOpen ? 'w-[220px]' : 'w-0'}
      `}
    >
      <div className="flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-b-border flex-shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-b-dim">
            Orin Builder
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={newProject}
              className="p-1 rounded-md text-b-muted hover:text-b-accent hover:bg-b-elev transition-colors tap-target"
              title="New project"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors tap-target"
              title="Collapse sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">

          {/* Build Pipeline */}
          <div className="px-3 pt-3 pb-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-2">Pipeline</p>
            <div className="flex flex-col gap-0.5">
              {PIPELINE.map((step) => {
                const status = stageStatus(step, stage);
                return (
                  <div key={step.id} className="flex items-start gap-2 py-1">
                    <div className="mt-0.5 flex-shrink-0">
                      {status === 'done'   && <CheckCircle2 size={12} className="text-b-accent" />}
                      {status === 'active' && <Loader2 size={12} className="text-b-accent animate-spin-slow" />}
                      {status === 'pending'&& <Circle size={12} className="text-b-border" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-medium leading-tight truncate ${
                        status === 'done'    ? 'text-b-accent'
                        : status === 'active' ? 'text-white'
                        : 'text-b-dim'
                      }`}>{step.label}</p>
                      {status === 'active' && stageDetail && (
                        <p className="text-[10px] text-b-muted leading-tight mt-0.5 line-clamp-2">{stageDetail}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {stage === 'error' && (
                <div className="flex items-center gap-2 py-1">
                  <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
                  <p className="text-[11px] text-red-400">Build failed</p>
                </div>
              )}
            </div>
          </div>

          {/* Blueprint summary */}
          {hasResult && (
            <>
              <div className="h-px bg-b-border mx-3 my-1" />
              <div className="px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-2">Blueprint</p>
                <p className="text-[11px] font-semibold text-white truncate">{currentProject!.result!.blueprint.siteName}</p>
                <p className="text-[10px] text-b-muted mb-2 line-clamp-2">{currentProject!.result!.blueprint.tagline}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {currentProject!.result!.blueprint.pages.map((p, i) => (
                    <span key={i} className="text-[9px] bg-b-elev border border-b-border text-b-muted rounded px-1.5 py-0.5">{p}</span>
                  ))}
                </div>
                {/* Colour chips */}
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(currentProject!.result!.blueprint.colorScheme).slice(0,4).map(([k, v]) => (
                    <div key={k} title={`${k}: ${v}`} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm border border-white/10" style={{ background: v }} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* DB tables summary */}
          {hasResult && currentProject!.result!.dbSchema.length > 0 && (
            <>
              <div className="h-px bg-b-border mx-3 my-1" />
              <div className="px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-2">Database</p>
                {currentProject!.result!.dbSchema.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="text-[11px] text-b-blue font-mono truncate">{t.table}</span>
                    <span className="text-[9px] text-b-dim">{t.fields.length}f</span>
                  </div>
                ))}
                {currentProject!.result!.dbSchema.length > 5 && (
                  <p className="text-[9px] text-b-dim">+{currentProject!.result!.dbSchema.length - 5} more</p>
                )}
              </div>
            </>
          )}

          {/* Project History */}
          {projects.length > 0 && (
            <>
              <div className="h-px bg-b-border mx-3 my-1" />
              <div className="px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-b-dim mb-2">History</p>
                {projects.slice(0, 8).map((p) => (
                  <ProjectItem key={p.id} project={p} onDelete={deleteProject} onSelect={setCurrentProject} />
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

const ProjectItem: React.FC<{
  project: BuilderProject;
  onDelete: (id: string) => void;
  onSelect: (p: BuilderProject) => void;
}> = ({ project, onDelete, onSelect }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      className="flex items-center justify-between py-0.5 group cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSelect(project)}
    >
      <span className="text-[11px] text-b-muted hover:text-white transition-colors truncate pr-1">
        {project.title || project.prompt.slice(0, 24)}
      </span>
      {hover && project.id && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
          className="flex-shrink-0 p-0.5 rounded text-b-dim hover:text-red-400 transition-colors"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

export default BuilderSidebar;
