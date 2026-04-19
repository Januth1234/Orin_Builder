import React, { useState, useCallback } from 'react';
import { Copy, Check, Download, WrapText } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';

const CodePanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const html = currentProject?.result?.html ?? '';
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap]     = useState(false);

  const copy = useCallback(async () => {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const download = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${currentProject?.title ?? 'website'}.html`;
    a.click();
  };

  // Simple token-based syntax highlight (no external lib)
  const highlighted = highlightHtml(html);

  return (
    <div className="flex flex-col h-full bg-b-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-b-border bg-b-surf flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-b-dim">HTML Output</span>
          {html && (
            <span className="text-[10px] bg-b-elev border border-b-border rounded px-1.5 py-0.5 text-b-muted">
              {html.split('\n').length} lines · {(html.length / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWrap(w => !w)}
            className={`p-1.5 rounded-md transition-colors ${wrap ? 'text-b-accent bg-b-elev' : 'text-b-muted hover:text-white hover:bg-b-elev'}`}
            title="Toggle word wrap"
          >
            <WrapText size={12} />
          </button>
          <button onClick={copy} disabled={!html} className="flex items-center gap-1 p-1.5 rounded-md text-b-muted hover:text-white hover:bg-b-elev transition-colors disabled:opacity-30 text-[11px]">
            {copied ? <Check size={12} className="text-b-accent" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button onClick={download} disabled={!html} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-b-accent text-black hover:bg-green-400 disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <Download size={11} />
            Download
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {!html ? (
          <div className="flex h-full items-center justify-center text-b-dim text-sm">
            Generated code will appear here.
          </div>
        ) : (
          <pre
            className={`p-4 text-[11.5px] leading-relaxed font-mono text-gray-300 min-h-full ${wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        )}
      </div>
    </div>
  );
};

// ── Lightweight HTML syntax highlighter ──────────────────────────────────────
function highlightHtml(code: string): string {
  if (!code) return '';
  const esc = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return esc
    // Comments
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
    // DOCTYPE
    .replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="hl-doctype">$1</span>')
    // Closing tags
    .replace(/(&lt;\/[\w-]+&gt;)/g, '<span class="hl-tag">$1</span>')
    // Opening tags with attributes
    .replace(/(&lt;[\w-]+)((?:\s[^&])*?)(\/?&gt;)/g, (_, tag, attrs, close) => {
      const a = attrs.replace(/([\w-]+)(=)(".*?")/g,
        '<span class="hl-attr">$1</span><span class="hl-eq">$2</span><span class="hl-val">$3</span>');
      return `<span class="hl-tag">${tag}</span>${a}<span class="hl-tag">${close}</span>`;
    })
    // CSS properties inside style blocks (simple)
    .replace(/([\w-]+)(\s*:\s*)([^;{}\n]+)/g,
      '<span class="hl-prop">$1</span>$2<span class="hl-val2">$3</span>');
}

// Inject highlight styles once
if (typeof document !== 'undefined' && !document.getElementById('hl-style')) {
  const s = document.createElement('style');
  s.id = 'hl-style';
  s.textContent = `
    .hl-tag     { color: #7ee8c8; }
    .hl-attr    { color: #9ecbff; }
    .hl-val     { color: #f1b982; }
    .hl-val2    { color: #a5d6a7; }
    .hl-eq      { color: #888; }
    .hl-comment { color: #5c6370; font-style: italic; }
    .hl-doctype { color: #c678dd; }
    .hl-prop    { color: #61afef; }
  `;
  document.head.appendChild(s);
}

export default CodePanel;
