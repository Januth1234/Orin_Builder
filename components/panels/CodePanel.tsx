import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Download, WrapText } from 'lucide-react';
import { useBuilderStore } from '../../services/builderStore';
import type { ArtifactFile } from '../../types';

type RuntimeArtifactFile = ArtifactFile & { contentPreview?: string };

const CodePanel: React.FC = () => {
  const { currentProject } = useBuilderStore();
  const files = ((currentProject?.bundle?.files ?? []) as RuntimeArtifactFile[]).map((file) => ({
    ...file,
    content: file.content ?? '',
  }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setCopied(false);
  }, [currentProject?.id, files.length]);

  useEffect(() => {
    if (activeIndex < files.length) return;
    setActiveIndex(0);
  }, [activeIndex, files.length]);

  const activeFile = files[activeIndex];
  const fileContent = activeFile?.content ?? '';
  const fallbackContent = activeFile?.contentPreview ?? '';
  const hasFullContent = Boolean(fileContent.trim());
  const displayContent = hasFullContent ? fileContent : fallbackContent;

  const lineCount = useMemo(() => {
    if (!displayContent) return 0;
    return displayContent.split('\n').length;
  }, [displayContent]);

  const copy = useCallback(async () => {
    if (!displayContent) return;
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [displayContent]);

  const download = () => {
    if (!hasFullContent || !activeFile) return;
    const mime = activeFile.language === 'html' ? 'text/html' : 'text/plain';
    const blob = new Blob([activeFile.content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = activeFile.path;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!files.length) {
    return <div className="flex h-full items-center justify-center text-sm text-b-dim">Generated files will appear here.</div>;
  }

  return (
    <div className="flex h-full flex-col bg-b-bg">
      <div className="no-scrollbar flex items-center gap-0 overflow-x-auto border-b border-b-border bg-b-surf px-1">
        {files.map((file, index) => {
          const metadataOnly = !(file.content ?? '').trim() && Boolean(file.contentPreview);
          return (
            <button
              key={`${file.path}-${index}`}
              onClick={() => setActiveIndex(index)}
              className={`flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[11px] font-mono transition-colors ${
                activeIndex === index ? 'border-b-accent text-white' : 'border-transparent text-b-muted hover:text-white'
              }`}
            >
              <FileDot language={file.language} />
              <span>{file.path}</span>
              {metadataOnly && <span className="rounded bg-amber-950/40 px-1 py-0.5 text-[9px] text-amber-300">cached</span>}
            </button>
          );
        })}

        <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5">
          <span className="font-mono text-[10px] text-b-dim">
            {lineCount}L - {(displayContent.length / 1024).toFixed(1)}KB
          </span>
          <button
            onClick={() => setWrap((previous) => !previous)}
            className={`rounded p-1 transition-colors ${wrap ? 'text-b-accent' : 'text-b-muted hover:text-white'}`}
            title="Word wrap"
          >
            <WrapText size={12} />
          </button>
          <button
            onClick={copy}
            disabled={!displayContent}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-b-muted transition-colors hover:text-white disabled:opacity-30"
          >
            {copied ? <Check size={11} className="text-b-accent" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={download}
            disabled={!hasFullContent}
            className="flex items-center gap-1 rounded-lg bg-b-accent px-2 py-1 text-[11px] font-medium text-black transition-colors hover:bg-green-400 disabled:opacity-30"
          >
            <Download size={11} />
            Download
          </button>
        </div>
      </div>

      {!hasFullContent && activeFile && (
        <div className="flex items-start gap-2 border-b border-amber-800/40 bg-amber-950/25 px-3 py-2 text-[11px] text-amber-200">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
          <span>
            Full file content is unavailable for this saved project. Displaying a short preview only. Rebuild the project to
            restore editable artifacts.
          </span>
        </div>
      )}

      <div className="custom-scrollbar flex-1 overflow-auto">
        {activeFile ? (
          displayContent ? (
            <pre
              className={`min-h-full p-4 font-mono text-[11.5px] leading-relaxed ${
                wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
              } ${
                activeFile.language === 'html'
                  ? 'text-gray-300'
                  : activeFile.language === 'sql'
                  ? 'text-green-300/90'
                  : 'text-blue-200/85'
              }`}
              dangerouslySetInnerHTML={{ __html: highlight(displayContent, activeFile.language ?? 'html') }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-b-dim">
              No readable content available for this artifact.
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-b-dim">Select a file above.</div>
        )}
      </div>
    </div>
  );
};

const FileDot: React.FC<{ language?: string }> = ({ language }) => {
  const colors: Record<string, string> = {
    html: '#f1b982',
    sql: '#22c892',
    markdown: '#4d9fff',
    typescript: '#7dd3fc',
  };

  return <span style={{ color: colors[language ?? ''] ?? '#686b7e', fontSize: 9 }}>●</span>;
};

function highlight(code: string, language: string): string {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (language === 'sql') {
    return escaped
      .replace(
        /\b(CREATE|TABLE|PRIMARY|KEY|NOT|NULL|DEFAULT|IF|EXISTS|UNIQUE|INDEX|ON|REFERENCES|UUID|VARCHAR|TEXT|INTEGER|BOOLEAN|TIMESTAMP|JSONB|FLOAT|ENUM|INSERT|SELECT|FROM|WHERE|JOIN|ALTER|DROP)\b/g,
        '<span style="color:#22c892;font-weight:600">$1</span>',
      )
      .replace(/('.*?')/g, '<span style="color:#f1b982">$1</span>')
      .replace(/(--.*)/g, '<span style="color:#4a4d5e;font-style:italic">$1</span>');
  }

  if (language === 'markdown') {
    return escaped
      .replace(/^(#{1,3} .+)$/gm, '<span style="color:#4d9fff;font-weight:600">$1</span>')
      .replace(/(`[^`]+`)/g, '<span style="color:#22c892">$1</span>')
      .replace(/^(- .+)$/gm, '<span style="color:#b47edc">$1</span>');
  }

  return escaped
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#4a4d5e;font-style:italic">$1</span>')
    .replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span style="color:#c77edc">$1</span>')
    .replace(/(&lt;\/[\w-]+&gt;)/g, '<span style="color:#7ee8c8">$1</span>')
    .replace(/(&lt;[\w-]+)((?:\s[^&])*?)(\/?&gt;)/g, (_, tag, attrs, close) => {
      const parsedAttrs = attrs.replace(
        /([\w-]+)(=)(".*?")/g,
        '<span style="color:#9ecbff">$1</span>$2<span style="color:#f1b982">$3</span>',
      );
      return `<span style="color:#7ee8c8">${tag}</span>${parsedAttrs}<span style="color:#7ee8c8">${close}</span>`;
    });
}

export default CodePanel;
