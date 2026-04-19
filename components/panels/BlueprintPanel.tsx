import React from 'react';
import { Layout, Globe, Palette, Users, Tag, Layers } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';
import { BlueprintSection } from '../../types';

const BlueprintPanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const bp = currentProject?.result?.blueprint;

  if (!bp) return (
    <div className="flex h-full items-center justify-center text-b-dim text-sm">
      Blueprint will appear after generation.
    </div>
  );

  const toneColors: Record<string, string> = {
    professional: 'bg-blue-950/50 text-blue-300 border-blue-800/40',
    playful:      'bg-amber-950/50 text-amber-300 border-amber-800/40',
    minimal:      'bg-gray-800/50 text-gray-300 border-gray-700/40',
    bold:         'bg-purple-950/50 text-purple-300 border-purple-800/40',
    elegant:      'bg-rose-950/50 text-rose-300 border-rose-800/40',
  };

  const sectionTypeColor: Record<BlueprintSection['type'], string> = {
    navbar:       '#4d9fff',
    hero:         '#22c892',
    features:     '#b47edc',
    pricing:      '#f1b982',
    testimonials: '#7dd3fc',
    cta:          '#f87171',
    footer:       '#686b7e',
    contact:      '#34d399',
    gallery:      '#c084fc',
    blog:         '#fb923c',
    team:         '#38bdf8',
    faq:          '#a3e635',
    custom:       '#94a3b8',
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{bp.siteName}</h2>
          <p className="text-sm text-b-muted mt-0.5">{bp.tagline}</p>
        </div>
        <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${toneColors[bp.tone] ?? 'bg-b-elev text-b-muted border-b-border'}`}>
          {bp.tone}
        </span>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-2 gap-3">

        {/* Pages */}
        <Card icon={<Layout size={14} />} title="Pages">
          <div className="flex flex-wrap gap-1 mt-2">
            {bp.pages.map((p, i) => (
              <span key={i} className="text-[11px] bg-b-bg border border-b-border text-b-muted rounded-md px-2 py-0.5">{p}</span>
            ))}
          </div>
        </Card>

        {/* Tech stack */}
        <Card icon={<Layers size={14} />} title="Tech Stack">
          <div className="flex flex-wrap gap-1 mt-2">
            {bp.stack.map((s, i) => (
              <span key={i} className="text-[11px] bg-b-accent/10 border border-b-accent/30 text-b-accent rounded-md px-2 py-0.5">{s}</span>
            ))}
          </div>
        </Card>

        {/* Colours */}
        <Card icon={<Palette size={14} />} title="Colour Scheme">
          <div className="mt-2 flex flex-col gap-1.5">
            {Object.entries(bp.colorScheme).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-white/10 flex-shrink-0" style={{ background: v }} />
                  <span className="text-[11px] text-b-muted capitalize">{k}</span>
                </div>
                <span className="text-[10px] font-mono text-b-dim">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Fonts + Audience */}
        <div className="flex flex-col gap-3">
          <Card icon={<Globe size={14} />} title="Domain">
            <p className="text-[12px] font-mono text-b-blue mt-1">{bp.domain}.orinai.app</p>
            <p className="text-[11px] text-b-dim mt-0.5">Suggested slug</p>
          </Card>
          <Card icon={<Users size={14} />} title="Audience">
            <p className="text-[12px] text-b-muted mt-1 leading-snug">{bp.targetAudience}</p>
          </Card>
        </div>
      </div>

      {/* Section Architecture */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-b-dim mb-3">Page Structure</p>
        <div className="flex flex-col gap-1.5">
          {bp.sections.map((s, i) => (
            <div key={i} className="flex items-center gap-3 bg-b-surf border border-b-border rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: sectionTypeColor[s.type] ?? '#686b7e' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-white">{s.name}</span>
                  <span className="text-[10px] text-b-dim font-mono">{s.type}</span>
                  {s.hasAnimation && (
                    <span className="text-[9px] bg-purple-950/50 border border-purple-800/40 text-purple-300 rounded px-1">✦ animated</span>
                  )}
                </div>
                <p className="text-[11px] text-b-muted truncate">{s.purpose}</p>
              </div>
              <span className="text-[11px] text-b-dim flex-shrink-0">#{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Keywords */}
      {bp.seoKeywords?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-b-dim mb-2">SEO Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {bp.seoKeywords.map((kw, i) => (
              <span key={i} className="flex items-center gap-1 text-[11px] bg-b-elev border border-b-border text-b-muted rounded-full px-2.5 py-0.5">
                <Tag size={9} />
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Card: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-b-surf border border-b-border rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-b-muted">
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-widest">{title}</span>
    </div>
    {children}
  </div>
);

export default BlueprintPanel;
