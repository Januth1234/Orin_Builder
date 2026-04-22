import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { SITE_TEMPLATES, TEMPLATE_CATEGORIES } from '../data/templates';
import { SiteTemplate } from '../types';

interface Props {
  onSelect: (template: SiteTemplate) => void;
  onClose: () => void;
}

const TemplateGallery: React.FC<Props> = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all'
    ? SITE_TEMPLATES
    : SITE_TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-b-border bg-b-surf shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-b-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Start from a template</h2>
            <p className="mt-0.5 text-[11px] text-b-muted">Pick a starting point — we'll remix it to match your prompt.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-b-dim hover:bg-b-elev hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Category filter */}
        <div className="no-scrollbar flex flex-shrink-0 gap-1.5 overflow-x-auto border-b border-b-border px-5 py-2.5">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-b-accent text-black'
                  : 'border border-b-border bg-b-elev text-b-muted hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(template => (
              <TemplateCard key={template.id} template={template} onSelect={onSelect} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{ template: SiteTemplate; onSelect: (t: SiteTemplate) => void }> = ({ template, onSelect }) => (
  <button
    onClick={() => onSelect(template)}
    className="group flex flex-col overflow-hidden rounded-xl border border-b-border bg-b-elev text-left transition-all hover:-translate-y-0.5 hover:border-b-muted hover:shadow-lg hover:shadow-black/30"
  >
    {/* Preview swatch */}
    <div
      className="relative h-28 w-full overflow-hidden"
      style={{ background: template.bgColor }}
    >
      {/* Simulated page preview */}
      <div className="absolute inset-0 p-3">
        <div className="mb-2 h-1.5 w-16 rounded-full opacity-60" style={{ background: template.accentColor }} />
        <div className="mb-1 h-3 w-3/4 rounded-sm bg-white/30" />
        <div className="mb-1 h-2 w-1/2 rounded-sm bg-white/15" />
        <div className="mt-2 flex gap-1.5">
          <div className="h-5 w-14 rounded-md" style={{ background: template.accentColor, opacity: 0.9 }} />
          <div className="h-5 w-14 rounded-md border border-white/20" />
        </div>
        <div className="absolute bottom-3 right-3 grid grid-cols-3 gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 w-full rounded-sm bg-white/10" />
          ))}
        </div>
      </div>
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        style={{ background: `${template.bgColor}cc` }}
      >
        <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: template.accentColor }}>
          <Sparkles size={11} /> Use Template
        </span>
      </div>
    </div>

    {/* Info */}
    <div className="flex flex-1 flex-col gap-1.5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{template.name}</p>
        <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: template.accentColor }} />
      </div>
      <p className="text-[11px] leading-relaxed text-b-muted">{template.description}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {template.tags.slice(0, 3).map((tag: string) => (
          <span key={tag} className="rounded border border-b-border bg-b-bg px-1.5 py-0.5 text-[9px] text-b-dim">{tag}</span>
        ))}
      </div>
    </div>
  </button>
);

export default TemplateGallery;
