import React from 'react';
import { AlertTriangle, CheckCircle2, Globe, Layers, Layout, Palette, Tag as TagIcon, Users } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';

const BlueprintPanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const blueprint = currentProject?.blueprint;
  const bundle = currentProject?.bundle;

  if (!blueprint) {
    return <Empty text="Blueprint will appear after generation." />;
  }

  const toneColor: Record<string, string> = {
    professional: 'text-blue-300 bg-blue-950/35 border-blue-800/35',
    playful: 'text-amber-300 bg-amber-950/35 border-amber-800/35',
    minimal: 'text-gray-300 bg-gray-800/35 border-gray-700/35',
    bold: 'text-purple-300 bg-purple-950/35 border-purple-800/35',
    elegant: 'text-rose-300 bg-rose-950/35 border-rose-800/35',
  };

  const sectionColor: Record<string, string> = {
    navbar: '#4d9fff',
    hero: '#22c892',
    features: '#b47edc',
    pricing: '#f1b982',
    testimonials: '#7dd3fc',
    cta: '#f87171',
    footer: '#686b7e',
    contact: '#34d399',
    gallery: '#c084fc',
    blog: '#fb923c',
    team: '#38bdf8',
    faq: '#a3e635',
    custom: '#94a3b8',
  };

  const sections = blueprint.sections ?? [];
  const pages = blueprint.pages ?? [];
  const components = blueprint.components ?? [];
  const warnings = bundle?.validation?.warnings ?? [];
  const keywords = blueprint.seoKeywords ?? [];

  return (
    <div className="custom-scrollbar flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{blueprint.siteName}</h2>
            <span className="rounded bg-b-elev px-1.5 py-0.5 text-[10px] font-mono text-b-dim border border-b-border">
              {blueprint.project_type}
            </span>
          </div>
          <p className="text-sm text-b-muted">{blueprint.tagline || 'No tagline provided.'}</p>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-[11px] font-medium ${
            toneColor[blueprint.tone] ?? 'border-b-border bg-b-elev text-b-muted'
          }`}
        >
          {blueprint.tone}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card icon={<Layout size={13} />} title="Pages">
          {pages.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {pages.map((page) => (
                <TagChip key={page} name={page} />
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-b-dim">No pages listed.</p>
          )}
        </Card>

        <Card icon={<Layers size={13} />} title="Components">
          {components.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {components.slice(0, 10).map((component) => (
                <span
                  key={component}
                  className="rounded border border-b-accent/25 bg-b-accent/10 px-1.5 py-0.5 text-[10px] text-b-accent"
                >
                  {component}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-b-dim">No components listed.</p>
          )}
        </Card>

        <Card icon={<Palette size={13} />} title="Color Scheme">
          <div className="mt-1.5 flex flex-col gap-1">
            {Object.entries(blueprint.colorScheme ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded border border-white/10" style={{ background: value }} />
                  <span className="text-[11px] capitalize text-b-muted">{key}</span>
                </div>
                <span className="font-mono text-[10px] text-b-dim">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card icon={<Globe size={13} />} title="Domain">
            <p className="mt-1 text-[12px] font-mono text-b-blue">{blueprint.domain}.orinai.app</p>
          </Card>
          <Card icon={<Users size={13} />} title="Audience">
            <p className="mt-1 text-[11px] leading-snug text-b-muted">{blueprint.audience || 'Audience not specified.'}</p>
          </Card>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-b-dim">Page Structure</p>
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <div
              key={`${section.name}-${index}`}
              className="mb-1.5 flex items-center gap-2.5 rounded-lg border border-b-border bg-b-surf px-3 py-2"
            >
              <div className="h-2 w-2 flex-shrink-0 rounded-sm" style={{ background: sectionColor[section.type] ?? '#686b7e' }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-white">{section.name}</span>
                  <span className="font-mono text-[10px] text-b-dim">{section.type}</span>
                  {section.hasAnimation && (
                    <span className="rounded border border-purple-800/35 bg-purple-950/35 px-1 text-[9px] text-purple-300">
                      animation
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-b-muted">{section.purpose || 'No section purpose provided.'}</p>
              </div>
              <span className="flex-shrink-0 text-[10px] text-b-dim">#{index + 1}</span>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-b-border bg-b-surf px-3 py-3 text-[11px] text-b-dim">
            No section definitions available.
          </div>
        )}
      </div>

      {(blueprint.risk_flags?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-b-dim">Risk Flags</p>
          {blueprint.risk_flags?.map((flag, index) => (
            <div key={`${flag}-${index}`} className="flex items-start gap-2 py-1">
              <AlertTriangle size={11} className="mt-0.5 flex-shrink-0 text-amber-400" />
              <span className="text-[11px] text-amber-300/85">{flag}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-400">Validation Warnings</p>
          {warnings.map((warning, index) => (
            <p key={`${warning}-${index}`} className="text-[11px] text-amber-300/85">
              {warning}
            </p>
          ))}
        </div>
      )}

      {bundle?.status === 'complete' && (
        <div className="flex items-center gap-2 rounded-xl border border-b-accent/25 bg-b-accent/10 px-3 py-2">
          <CheckCircle2 size={13} className="text-b-accent" />
          <span className="text-[12px] font-medium text-b-accent">Build validated and complete</span>
        </div>
      )}

      {keywords.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-b-dim">SEO Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="flex items-center gap-1 rounded-full border border-b-border bg-b-elev px-2.5 py-0.5 text-[11px] text-b-muted"
              >
                <TagIcon size={9} />
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TagChip: React.FC<{ name: string }> = ({ name }) => (
  <span className="rounded-md border border-b-border bg-b-bg px-2 py-0.5 text-[11px] text-b-muted">{name}</span>
);

const Card: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="rounded-xl border border-b-border bg-b-surf p-3">
    <div className="flex items-center gap-1.5 text-b-muted">
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-widest">{title}</span>
    </div>
    {children}
  </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex h-full items-center justify-center text-sm text-b-dim">{text}</div>
);

export default BlueprintPanel;
