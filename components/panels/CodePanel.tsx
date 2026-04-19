import React, { useState, useCallback } from 'react';
import { Copy, Check, Download, WrapText, ChevronDown } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';
import type { ArtifactFile } from '../../types';

const LANG_LABEL: Record<string, string> = { html:'HTML', sql:'SQL', markdown:'Markdown', typescript:'TypeScript' };

const CodePanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const files: ArtifactFile[] = currentProject?.bundle?.files ?? [];
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  const file = files[active];

  const copy = useCallback(async () => {
    if (!file) return;
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [file]);

  const download = () => {
    if (!file) return;
    const mime = file.language === 'html' ? 'text/html' : 'text/plain';
    const blob = new Blob([file.content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.path;
    a.click();
  };

  if (!files.length) return (
    <div className="flex h-full items-center justify-center text-b-dim text-sm">
      Generated files will appear here.
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-b-bg">
      {/* File tabs */}
      <div className="flex items-center gap-0 border-b border-b-border bg-b-surf flex-shrink-0 px-1 overflow-x-auto no-scrollbar">
        {files.map((f, i) => (
          <button key={f.path} onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-mono border-b-2 transition-colors flex-shrink-0 ${
              active === i ? 'border-b-accent text-white' : 'border-transparent text-b-muted hover:text-white'
            }`}>
            <FileIcon lang={f.language} />
            {f.path}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0">
          {file && (
            <span className="text-[10px] text-b-dim font-mono">
              {file.content.split('\n').length}L · {(file.content.length/1024).toFixed(1)}KB
            </span>
          )}
          <button onClick={() => setWrap(w => !w)}
            className={`p-1 rounded transition-colors ${wrap ? 'text-b-accent' : 'text-b-muted hover:text-white'}`} title="Word wrap">
            <WrapText size={12}/>
          </button>
          <button onClick={copy} disabled={!file}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-b-muted hover:text-white transition-colors disabled:opacity-30">
            {copied ? <Check size={11} className="text-b-accent"/> : <Copy size={11}/>}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button onClick={download} disabled={!file}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-b-accent text-black hover:bg-green-400 disabled:opacity-30 transition-colors">
            ↓ Download
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {file ? (
          <pre className={`p-4 text-[11.5px] leading-relaxed font-mono min-h-full ${
            wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
          } ${file.language === 'html' ? 'text-gray-300' : file.language === 'sql' ? 'text-green-300/90' : 'text-blue-200/80'}`}
          dangerouslySetInnerHTML={{ __html: highlight(file.content, file.language ?? 'html') }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-b-dim text-sm">Select a file above.</div>
        )}
      </div>
    </div>
  );
};

const FileIcon: React.FC<{lang?: string}> = ({ lang }) => {
  const colors: Record<string, string> = { html:'#f1b982', sql:'#22c892', markdown:'#4d9fff' };
  return <span style={{ color: colors[lang ?? ''] ?? '#686b7e', fontSize: 9 }}>●</span>;
};

function highlight(code: string, lang: string): string {
  const esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  if (lang === 'sql') {
    return esc
      .replace(/\b(CREATE|TABLE|PRIMARY|KEY|NOT|NULL|DEFAULT|IF|EXISTS|UNIQUE|INDEX|ON|REFERENCES|UUID|VARCHAR|TEXT|INTEGER|BOOLEAN|TIMESTAMP|JSONB|FLOAT|ENUM|INSERT|SELECT|FROM|WHERE|JOIN)\b/g,
        '<span style="color:#22c892;font-weight:600">$1</span>')
      .replace(/('.*?')/g, '<span style="color:#f1b982">$1</span>')
      .replace(/(--.*)/g, '<span style="color:#4a4d5e;font-style:italic">$1</span>');
  }
  if (lang === 'markdown') {
    return esc
      .replace(/^(#{1,3} .+)$/gm, '<span style="color:#4d9fff;font-weight:600">$1</span>')
      .replace(/(`[^`]+`)/g, '<span style="color:#22c892">$1</span>')
      .replace(/^(- .+)$/gm, '<span style="color:#b47edc">$1</span>');
  }
  // HTML highlight
  return esc
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g,'<span style="color:#4a4d5e;font-style:italic">$1</span>')
    .replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi,'<span style="color:#c77edc">$1</span>')
    .replace(/(&lt;\/[\w-]+&gt;)/g,'<span style="color:#7ee8c8">$1</span>')
    .replace(/(&lt;[\w-]+)((?:\s[^&])*?)(\/?&gt;)/g,(_,tag,attrs,close)=>{
      const a=attrs.replace(/([\w-]+)(=)(".*?")/g,
        '<span style="color:#9ecbff">$1</span>$2<span style="color:#f1b982">$3</span>');
      return `<span style="color:#7ee8c8">${tag}</span>${a}<span style="color:#7ee8c8">${close}</span>`;
    });
}

export default CodePanel;
