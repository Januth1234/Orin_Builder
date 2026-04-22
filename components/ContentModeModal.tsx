import React, { useState } from 'react';
import { Bot, FileText, Sparkles, Upload, X } from 'lucide-react';
import { ContentMode, ContentUpload } from '../types';

interface Props {
  prompt: string;
  onConfirm: (mode: ContentMode, upload?: ContentUpload) => void;
  onCancel: () => void;
}

const ContentModeModal: React.FC<Props> = ({ prompt, onConfirm, onCancel }) => {
  const [mode, setMode] = useState<ContentMode | null>(null);
  const [upload, setUpload] = useState<ContentUpload>({});
  const [step, setStep] = useState<'choose' | 'upload'>('choose');

  const handleChoose = (m: ContentMode) => {
    setMode(m);
    if (m === 'ai') {
      onConfirm('ai');
    } else {
      setStep('upload');
    }
  };

  const handleUploadSubmit = () => {
    onConfirm('upload', upload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur px-4">
      <div className="w-full max-w-lg rounded-2xl border border-b-border bg-b-surf shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-b-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Content for your website</h2>
            <p className="mt-0.5 text-[11px] text-b-muted line-clamp-1">"{prompt.slice(0, 60)}{prompt.length > 60 ? '…' : ''}"</p>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-b-dim hover:bg-b-elev hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {step === 'choose' && (
          <div className="p-5">
            <p className="mb-4 text-xs text-b-muted">Should Orin Builder write all the copy and content, or would you like to provide your own?</p>

            <div className="grid grid-cols-2 gap-3">
              {/* AI Generate */}
              <button
                onClick={() => handleChoose('ai')}
                className="group flex flex-col items-center gap-3 rounded-xl border border-b-border bg-b-elev p-5 text-center transition-all hover:border-b-accent/50 hover:bg-b-accent/8"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-b-accent/15 border border-b-accent/25">
                  <Bot size={20} className="text-b-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Generate</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-b-muted">
                    Let Orin AI write all headlines, copy, descriptions, and content automatically.
                  </p>
                </div>
                <span className="rounded-full border border-b-accent/30 bg-b-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-b-accent">
                  Recommended
                </span>
              </button>

              {/* Upload / Provide */}
              <button
                onClick={() => handleChoose('upload')}
                className="group flex flex-col items-center gap-3 rounded-xl border border-b-border bg-b-elev p-5 text-center transition-all hover:border-b-blue/50 hover:bg-b-blue/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-b-blue/15 border border-b-blue/25">
                  <FileText size={20} className="text-b-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">I'll Provide</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-b-muted">
                    Enter your own headlines, taglines, and copy for a more personalised result.
                  </p>
                </div>
                <span className="rounded-full border border-b-border bg-b-elev px-2.5 py-0.5 text-[10px] font-medium text-b-dim">
                  Custom
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="p-5">
            <p className="mb-4 text-xs text-b-muted">Fill in what you have — leave anything blank and AI will fill it in.</p>
            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
              {[
                { key: 'companyName',   label: 'Company / Product Name',   placeholder: 'e.g. Orin AI' },
                { key: 'tagline',       label: 'Tagline',                  placeholder: 'e.g. Build smarter, faster.' },
                { key: 'heroHeadline',  label: 'Hero Headline',            placeholder: 'e.g. The AI platform for modern teams' },
                { key: 'heroSubtext',   label: 'Hero Subtext',             placeholder: 'e.g. Automate your workflow...' },
                { key: 'aboutText',     label: 'About / Mission',          placeholder: 'e.g. We started in 2024...' },
                { key: 'ctaText',       label: 'Primary CTA Button Text',  placeholder: 'e.g. Get Started Free' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] font-medium text-b-muted">{label}</label>
                  <input
                    className="w-full rounded-lg border border-b-border bg-b-elev px-3 py-2 text-xs text-white placeholder-b-dim outline-none focus:border-b-blue/50 transition-colors"
                    placeholder={placeholder}
                    value={(upload as any)[key] ?? ''}
                    onChange={e => setUpload((prev: ContentUpload) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-[11px] font-medium text-b-muted">Features (one per line: Title | Description)</label>
                <textarea
                  className="w-full rounded-lg border border-b-border bg-b-elev px-3 py-2 text-xs text-white placeholder-b-dim outline-none focus:border-b-blue/50 transition-colors resize-none"
                  rows={3}
                  placeholder={"Fast Builds | Generate a full site in seconds\nAI-powered | Gemini writes all the code"}
                  onChange={e => {
                    const features = e.target.value.split('\n')
                      .map(line => { const [title, desc] = line.split('|'); return { title: title?.trim(), description: desc?.trim() }; })
                      .filter(f => f.title);
                    setUpload((prev: ContentUpload) => ({ ...prev, features }));
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setStep('choose')}
                className="rounded-lg border border-b-border px-3 py-2 text-xs text-b-muted transition-colors hover:border-b-muted hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleUploadSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-b-accent py-2 text-xs font-semibold text-black transition-all hover:bg-green-400"
              >
                <Sparkles size={12} />
                Build with my content
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentModeModal;
