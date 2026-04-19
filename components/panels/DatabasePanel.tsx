import React, { useState } from 'react';
import { Database, Key, Link2, ChevronDown, ChevronRight } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';
import { DbTable, DbField } from '../../types';

const TYPE_COLORS: Record<string, string> = {
  UUID:      'text-amber-400',
  VARCHAR:   'text-blue-400',
  TEXT:      'text-blue-300',
  INTEGER:   'text-green-400',
  BOOLEAN:   'text-purple-400',
  TIMESTAMP: 'text-rose-400',
  JSONB:     'text-orange-400',
  FLOAT:     'text-green-300',
  ENUM:      'text-pink-400',
};

const DatabasePanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const schema = currentProject?.result?.dbSchema ?? [];
  const [expanded, setExpanded] = useState<Set<string>>(new Set(schema.map(t => t.table)));

  if (schema.length === 0) return (
    <div className="flex h-full items-center justify-center text-b-dim text-sm">
      Database schema will appear after generation.
    </div>
  );

  const toggle = (table: string) =>
    setExpanded(s => { const n = new Set(s); n.has(table) ? n.delete(table) : n.add(table); return n; });

  const allRelations = schema.flatMap(t => (t.relations ?? []).map(r => ({ table: t.table, rel: r })));

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">

      {/* Summary bar */}
      <div className="flex items-center gap-4 bg-b-surf border border-b-border rounded-xl px-4 py-3">
        <Stat label="Tables"    value={schema.length} />
        <div className="w-px h-8 bg-b-border" />
        <Stat label="Fields"    value={schema.reduce((s, t) => s + t.fields.length, 0)} />
        <div className="w-px h-8 bg-b-border" />
        <Stat label="Relations" value={allRelations.length} />
      </div>

      {/* ER diagram text hint */}
      <div className="flex items-start gap-2 bg-b-elev/50 border border-b-border rounded-lg px-3 py-2">
        <Database size={13} className="text-b-muted mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-b-muted leading-relaxed">
          This schema is AI-generated for your site concept. Use it as a starting point for your actual database (PostgreSQL, Supabase, PlanetScale, etc.)
        </p>
      </div>

      {/* Tables */}
      {schema.map((table) => (
        <TableCard
          key={table.table}
          table={table}
          open={expanded.has(table.table)}
          onToggle={() => toggle(table.table)}
        />
      ))}

      {/* Relations */}
      {allRelations.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-b-dim mb-2">Relations</p>
          <div className="flex flex-col gap-1.5">
            {allRelations.map(({ rel }, i) => (
              <div key={i} className="flex items-center gap-2 bg-b-surf border border-b-border rounded-lg px-3 py-2">
                <Link2 size={11} className="text-b-muted flex-shrink-0" />
                <span className="text-[12px] font-mono text-b-muted">{rel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TableCard: React.FC<{ table: DbTable; open: boolean; onToggle: () => void }> = ({ table, open, onToggle }) => (
  <div className="bg-b-surf border border-b-border rounded-xl overflow-hidden">
    {/* Table header */}
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-b-elev transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <Database size={13} className="text-b-blue" />
        <span className="text-[13px] font-semibold font-mono text-b-blue">{table.table}</span>
        <span className="text-[10px] bg-b-bg border border-b-border rounded px-1.5 py-0.5 text-b-dim">
          {table.fields.length} fields
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-b-dim hidden sm:block">{table.purpose}</span>
        {open ? <ChevronDown size={13} className="text-b-muted" /> : <ChevronRight size={13} className="text-b-muted" />}
      </div>
    </button>

    {/* Fields */}
    {open && (
      <div className="border-t border-b-border">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_100px_1fr] gap-x-3 px-4 py-1.5 bg-b-bg/50">
          {['Field', 'Type', 'Note'].map(h => (
            <span key={h} className="text-[9px] font-semibold uppercase tracking-widest text-b-dim">{h}</span>
          ))}
        </div>
        {/* Field rows */}
        {table.fields.map((f, i) => (
          <FieldRow key={i} field={f} last={i === table.fields.length - 1} />
        ))}
        {/* Purpose footer */}
        <div className="px-4 py-2 bg-b-bg/30 border-t border-b-border">
          <p className="text-[11px] text-b-dim">{table.purpose}</p>
        </div>
      </div>
    )}
  </div>
);

const FieldRow: React.FC<{ field: DbField; last: boolean }> = ({ field, last }) => {
  const isPk = field.note?.toLowerCase().includes('primary') || field.note?.toLowerCase().includes('pk');
  return (
    <div className={`grid grid-cols-[1fr_100px_1fr] gap-x-3 px-4 py-2 items-center ${!last ? 'border-b border-b-border/50' : ''} hover:bg-b-elev/30 transition-colors`}>
      <div className="flex items-center gap-1.5 min-w-0">
        {isPk && <Key size={10} className="text-amber-400 flex-shrink-0" />}
        <span className="text-[12px] font-mono text-white truncate">{field.name}</span>
        {field.nullable === false && (
          <span className="text-[9px] text-red-400/70 flex-shrink-0">NOT NULL</span>
        )}
      </div>
      <span className={`text-[11px] font-mono font-semibold ${TYPE_COLORS[field.type] ?? 'text-b-muted'}`}>
        {field.type}
      </span>
      <span className="text-[11px] text-b-dim truncate">{field.note}</span>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex flex-col items-center">
    <span className="text-xl font-bold text-white">{value}</span>
    <span className="text-[10px] text-b-muted">{label}</span>
  </div>
);

export default DatabasePanel;
