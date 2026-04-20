import React from 'react';
import { Layout, Globe, Palette, Users, Tag as TagIcon, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';

const BlueprintPanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const bp = currentProject?.blueprint;
  const bundle = currentProject?.bundle;

  if (!bp) return <Empty text="Blueprint will appear after generation." />;

  const toneColor: Record<string, string> = {
    professional:'text-blue-300 bg-blue-950/40 border-blue-800/30',
    playful:'text-amber-300 bg-amber-950/40 border-amber-800/30',
    minimal:'text-gray-300 bg-gray-800/40 border-gray-700/30',
    bold:'text-purple-300 bg-purple-950/40 border-purple-800/30',
    elegant:'text-rose-300 bg-rose-950/40 border-rose-800/30',
  };
  const sectionColor: Record<string, string> = {
    navbar:'#4d9fff',hero:'#22c892',features:'#b47edc',pricing:'#f1b982',
    testimonials:'#7dd3fc',cta:'#f87171',footer:'#686b7e',contact:'#34d399',
    gallery:'#c084fc',blog:'#fb923c',team:'#38bdf8',faq:'#a3e635',custom:'#94a3b8',
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-lg font-bold text-white">{bp.siteName}</h2>
            <span className="text-[10px] font-mono text-b-dim bg-b-elev border border-b-border px-1.5 py-0.5 rounded">{bp.project_type}</span>
          </div>
          <p className="text-sm text-b-muted">{bp.tagline}</p>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full border font-medium flex-shrink-0 ${toneColor[bp.tone] ?? 'text-b-muted bg-b-elev border-b-border'}`}>{bp.tone}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card icon={<Layout size={13}/>} title="Pages">
          <div className="flex flex-wrap gap-1 mt-1.5">
            {bp.pages?.map((p,i)=><TagChip key={i} name={p} />)}
          </div>
        </Card>
        <Card icon={<Layers size={13}/>} title="Tech Stack">
          <div className="flex flex-wrap gap-1 mt-1.5">
            {bp.components?.slice(0,6).map((c,i)=><span key={i} className="text-[10px] bg-b-accent/10 border border-b-accent/25 text-b-accent rounded px-1.5 py-0.5">{c}</span>)}
          </div>
        </Card>
        <Card icon={<Palette size={13}/>} title="Colours">
          <div className="mt-1.5 flex flex-col gap-1">
            {bp.colorScheme && Object.entries(bp.colorScheme).map(([k,v])=>(
              <div key={k} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded border border-white/10" style={{background:v as string}} />
                  <span className="text-[11px] text-b-muted capitalize">{k}</span>
                </div>
                <span className="text-[10px] font-mono text-b-dim">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="flex flex-col gap-3">
          <Card icon={<Globe size={13}/>} title="Domain">
            <p className="text-[12px] font-mono text-b-blue mt-1">{bp.domain}.orinai.app</p>
          </Card>
          <Card icon={<Users size={13}/>} title="Audience">
            <p className="text-[11px] text-b-muted mt-1 leading-snug">{bp.audience}</p>
          </Card>
        </div>
      </div>

      {/* Sections */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-b-dim mb-2">Page Structure</p>
        {bp.sections?.map((s,i)=>(
          <div key={i} className="flex items-center gap-2.5 bg-b-surf border border-b-border rounded-lg px-3 py-2 mb-1.5">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{background:sectionColor[s.type]??'#686b7e'}} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-white">{s.name}</span>
                <span className="text-[10px] text-b-dim font-mono">{s.type}</span>
                {s.hasAnimation && <span className="text-[9px] bg-purple-950/40 border border-purple-800/30 text-purple-300 rounded px-1">✦ anim</span>}
              </div>
              <p className="text-[11px] text-b-muted truncate">{s.purpose}</p>
            </div>
            <span className="text-[10px] text-b-dim flex-shrink-0">#{i+1}</span>
          </div>
        ))}
      </div>

      {/* Risk flags */}
      {bp.risk_flags?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-b-dim mb-2">Risk Flags</p>
          {bp.risk_flags.map((f,i)=>(
            <div key={i} className="flex items-start gap-2 py-1">
              <AlertTriangle size={11} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-amber-300/80">{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* Validation */}
      {(bundle?.validation?.warnings?.length ?? 0) > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-1">Validation Warnings</p>
          {bundle?.validation?.warnings?.map((w: string, i: number)=>(
            <p key={i} className="text-[11px] text-amber-300/80">{w}</p>
          ))}
        </div>
      )}
      {bundle?.status === 'complete' && (
        <div className="flex items-center gap-2 bg-b-accent/10 border border-b-accent/25 rounded-xl px-3 py-2">
          <CheckCircle2 size={13} className="text-b-accent" />
          <span className="text-[12px] text-b-accent font-medium">Build validated and complete</span>
        </div>
      )}

      {/* SEO keywords */}
      {bp.seoKeywords?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-b-dim mb-1.5">SEO Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {bp.seoKeywords.map((k,i)=>(
              <span key={i} className="flex items-center gap-1 text-[11px] bg-b-elev border border-b-border text-b-muted rounded-full px-2.5 py-0.5">
                <TagIcon size={9}/>{k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TagChip: React.FC<{name:string}> = ({name}) => (
  <span className="text-[11px] bg-b-bg border border-b-border text-b-muted rounded-md px-2 py-0.5">{name}</span>
);
const Card: React.FC<{icon:React.ReactNode;title:string;children:React.ReactNode}> = ({icon,title,children}) => (
  <div className="bg-b-surf border border-b-border rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-b-muted">
      {icon}<span className="text-[10px] font-semibold uppercase tracking-widest">{title}</span>
    </div>
    {children}
  </div>
);
const Empty: React.FC<{text:string}> = ({text}) => (
  <div className="flex h-full items-center justify-center text-b-dim text-sm">{text}</div>
);

export default BlueprintPanel;
