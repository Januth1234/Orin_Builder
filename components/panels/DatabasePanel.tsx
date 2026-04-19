import React, { useState } from 'react';
import { Database, Key, Link2, ChevronDown, ChevronRight, FileCode2 } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';

const TYPE_COLORS: Record<string, string> = {
  UUID:'text-amber-400',VARCHAR:'text-blue-400',TEXT:'text-blue-300',
  INTEGER:'text-green-400',BOOLEAN:'text-purple-400',TIMESTAMP:'text-rose-400',
  JSONB:'text-orange-400',FLOAT:'text-green-300',ENUM:'text-pink-400',
};

const DatabasePanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const bundle = currentProject?.bundle;
  const bp = currentProject?.blueprint;
  const tables = bp?.data_models ?? [];
  const sql = bundle?.db_schema ?? '';
  const [mode, setMode] = useState<'visual'|'sql'>('visual');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(tables.map(t => t.name)));

  if (!tables.length && !sql) return (
    <div className="flex h-full items-center justify-center text-b-dim text-sm">
      Database schema will appear after generation.
    </div>
  );

  const toggle = (name: string) =>
    setExpanded(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });

  return (
    <div className="flex flex-col h-full">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-b-border bg-b-surf flex-shrink-0">
        {(['visual','sql'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${mode === m ? 'bg-b-elev text-white border border-b-border' : 'text-b-muted hover:text-white'}`}>
            {m === 'visual' ? '⊞ Visual' : '{ } SQL'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-b-dim">
          <span>{tables.length} tables</span>
          <span>{tables.reduce((s,t) => s + (t.fields?.length ?? 0), 0)} fields</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {mode === 'sql' ? (
          <pre className="p-4 text-[11px] font-mono text-green-300/80 leading-relaxed whitespace-pre-wrap break-all">
            {sql || '-- Schema will appear here after generation'}
          </pre>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            {tables.length === 0 && sql && (
              <div className="text-center py-8 text-b-dim text-sm">
                <p>Switch to SQL view to see the raw schema.</p>
              </div>
            )}
            {tables.map(t => (
              <div key={t.name} className="bg-b-surf border border-b-border rounded-xl overflow-hidden">
                <button onClick={() => toggle(t.name)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-b-elev transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Database size={13} className="text-b-blue" />
                    <span className="text-[13px] font-semibold font-mono text-b-blue">{t.name}</span>
                    <span className="text-[10px] bg-b-bg border border-b-border rounded px-1.5 py-0.5 text-b-dim">{t.fields?.length ?? 0} fields</span>
                  </div>
                  {expanded.has(t.name) ? <ChevronDown size={13} className="text-b-muted"/> : <ChevronRight size={13} className="text-b-muted"/>}
                </button>
                {expanded.has(t.name) && (
                  <div className="border-t border-b-border">
                    <div className="grid grid-cols-[1fr_90px_1fr] px-4 py-1.5 bg-b-bg/50">
                      {['Field','Type','Note'].map(h=><span key={h} className="text-[9px] font-semibold uppercase tracking-widest text-b-dim">{h}</span>)}
                    </div>
                    {(t.fields ?? []).map((f,i)=>(
                      <div key={i} className={`grid grid-cols-[1fr_90px_1fr] px-4 py-2 items-center ${i < (t.fields?.length??0)-1 ? 'border-b border-b-border/40' : ''} hover:bg-b-elev/20`}>
                        <div className="flex items-center gap-1.5">
                          {(f.note?.toLowerCase().includes('primary')||f.note?.toLowerCase().includes('pk')) && <Key size={10} className="text-amber-400 flex-shrink-0"/>}
                          <span className="text-[12px] font-mono text-white truncate">{f.name}</span>
                          {f.nullable===false && <span className="text-[9px] text-red-400/60 flex-shrink-0">NN</span>}
                        </div>
                        <span className={`text-[11px] font-mono font-semibold ${TYPE_COLORS[f.type]??'text-b-muted'}`}>{f.type}</span>
                        <span className="text-[11px] text-b-dim truncate">{f.note}</span>
                      </div>
                    ))}
                    {(t.relations?.length ?? 0) > 0 && (
                      <div className="px-4 py-2 border-t border-b-border/40">
                        {t.relations!.map((r,i)=>(
                          <div key={i} className="flex items-center gap-1.5">
                            <Link2 size={10} className="text-b-muted flex-shrink-0"/>
                            <span className="text-[10px] font-mono text-b-muted">{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* API contracts */}
            {(bundle?.api_contracts?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-b-dim mb-2 mt-2">API Contracts</p>
                {bundle!.api_contracts.map((c,i)=>(
                  <div key={i} className="flex items-center gap-2 bg-b-surf border border-b-border rounded-lg px-3 py-2 mb-1.5">
                    <FileCode2 size={11} className="text-b-muted flex-shrink-0"/>
                    <span className="text-[11px] font-mono text-b-muted">{c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabasePanel;
