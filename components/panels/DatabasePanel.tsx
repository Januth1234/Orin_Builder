import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Database, FileCode2, Key, Link2 } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';

const TYPE_COLORS: Record<string, string> = {
  UUID: 'text-amber-400',
  VARCHAR: 'text-blue-400',
  TEXT: 'text-blue-300',
  INTEGER: 'text-green-400',
  BOOLEAN: 'text-purple-400',
  TIMESTAMP: 'text-rose-400',
  JSONB: 'text-orange-400',
  FLOAT: 'text-green-300',
  ENUM: 'text-pink-400',
  BIGINT: 'text-green-400',
  DECIMAL: 'text-emerald-300',
};

const DatabasePanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const bundle = currentProject?.bundle;
  const blueprint = currentProject?.blueprint;

  const tables = blueprint?.data_models ?? [];
  const sql = bundle?.db_schema ?? '';
  const metadataOnly = Boolean(tables.length) && !sql.trim();

  const [mode, setMode] = useState<'visual' | 'sql'>('visual');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(tables.map((table) => table.name)));

  const fieldCount = useMemo(() => tables.reduce((count, table) => count + (table.fields?.length ?? 0), 0), [tables]);

  if (!tables.length && !sql.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-b-dim">
        Database schema will appear after generation.
      </div>
    );
  }

  const toggle = (name: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-b-border bg-b-surf px-4 py-2.5">
        {(['visual', 'sql'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setMode(item)}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${
              mode === item ? 'border border-b-border bg-b-elev text-white' : 'text-b-muted hover:text-white'
            }`}
          >
            {item === 'visual' ? 'Visual' : 'SQL'}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3 text-[10px] text-b-dim">
          <span>{tables.length} tables</span>
          <span>{fieldCount} fields</span>
        </div>
      </div>

      {metadataOnly && (
        <div className="border-b border-amber-800/40 bg-amber-950/20 px-4 py-2 text-[11px] text-amber-200">
          SQL output is unavailable for this saved project snapshot. Rebuild to regenerate full schema text.
        </div>
      )}

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {mode === 'sql' ? (
          <pre className="whitespace-pre-wrap break-all p-4 font-mono text-[11px] leading-relaxed text-green-300/85">
            {sql || '-- SQL schema not available for this snapshot.'}
          </pre>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {tables.length === 0 && (
              <div className="rounded-xl border border-b-border bg-b-surf/70 px-4 py-6 text-center text-sm text-b-dim">
                No structured table definitions found. Switch to SQL view for raw schema output.
              </div>
            )}

            {tables.map((table) => {
              const fields = table.fields ?? [];
              const relations = table.relations ?? [];
              const open = expanded.has(table.name);

              return (
                <div key={table.name} className="overflow-hidden rounded-xl border border-b-border bg-b-surf">
                  <button
                    onClick={() => toggle(table.name)}
                    className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-b-elev"
                  >
                    <div className="flex items-center gap-2.5">
                      <Database size={13} className="text-b-blue" />
                      <span className="font-mono text-[13px] font-semibold text-b-blue">{table.name}</span>
                      <span className="rounded border border-b-border bg-b-bg px-1.5 py-0.5 text-[10px] text-b-dim">
                        {fields.length} fields
                      </span>
                    </div>
                    {open ? <ChevronDown size={13} className="text-b-muted" /> : <ChevronRight size={13} className="text-b-muted" />}
                  </button>

                  {open && (
                    <div className="border-t border-b-border">
                      <div className="grid grid-cols-[1fr_94px_1fr] bg-b-bg/50 px-4 py-1.5">
                        {['Field', 'Type', 'Notes'].map((header) => (
                          <span key={header} className="text-[9px] font-semibold uppercase tracking-widest text-b-dim">
                            {header}
                          </span>
                        ))}
                      </div>

                      {fields.length > 0 ? (
                        fields.map((field, index) => {
                          const note = field.note ?? 'No description';
                          const isPrimary = /primary|pk/i.test(note);
                          return (
                            <div
                              key={`${table.name}-${field.name}-${index}`}
                              className={`grid grid-cols-[1fr_94px_1fr] items-center px-4 py-2 hover:bg-b-elev/25 ${
                                index < fields.length - 1 ? 'border-b border-b-border/40' : ''
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {isPrimary && <Key size={10} className="flex-shrink-0 text-amber-400" />}
                                <span className="truncate font-mono text-[12px] text-white">{field.name}</span>
                                {field.nullable === false && <span className="text-[9px] text-red-400/70">NN</span>}
                              </div>
                              <span className={`font-mono text-[11px] font-semibold ${TYPE_COLORS[field.type] ?? 'text-b-muted'}`}>
                                {field.type}
                              </span>
                              <span className="truncate text-[11px] text-b-dim">{note}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="px-4 py-3 text-xs text-b-dim">No fields provided for this table.</p>
                      )}

                      {relations.length > 0 && (
                        <div className="border-t border-b-border/40 px-4 py-2">
                          {relations.map((relation, index) => (
                            <div key={`${table.name}-relation-${index}`} className="flex items-center gap-1.5">
                              <Link2 size={10} className="flex-shrink-0 text-b-muted" />
                              <span className="font-mono text-[10px] text-b-muted">{relation}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(bundle?.api_contracts?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 mt-2 text-[10px] font-semibold uppercase tracking-widest text-b-dim">API Contracts</p>
                {(bundle?.api_contracts ?? []).map((contract, index) => (
                  <div
                    key={`${contract}-${index}`}
                    className="mb-1.5 flex items-center gap-2 rounded-lg border border-b-border bg-b-surf px-3 py-2"
                  >
                    <FileCode2 size={11} className="flex-shrink-0 text-b-muted" />
                    <span className="font-mono text-[11px] text-b-muted">{contract}</span>
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
