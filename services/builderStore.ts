import { create } from 'zustand';
import {
  UserAccount, BuilderProject, BuildState, BuilderTab,
  StreamEvent, ArtifactFile,
} from '../types';
import { firebaseService } from './firebaseService';
import { createOrchestrator, Orchestrator } from './orchestrator';
import { refineHtml } from './geminiBuilderService';
import { buildCache } from './buildCache';
import type { ContentMode, ContentUpload, SiteTemplate } from '../types';

interface BuilderStore {
  user: UserAccount | null;
  authLoading: boolean;
  setUser: (u: UserAccount | null) => void;
  setAuthLoading: (v: boolean) => void;

  projects: BuilderProject[];
  currentProject: BuilderProject | null;
  setCurrentProject: (p: BuilderProject | null) => void;
  loadProjects: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  state: BuildState;
  progress: number;
  currentTask: string;
  events: StreamEvent[];
  error: string | null;

  prompt: string;
  refinePrompt: string;
  setPrompt: (p: string) => void;
  setRefinePrompt: (p: string) => void;

  clarificationQuestions: string[] | null;
  clarificationAnswers: Record<string, string>;
  setClarificationAnswer: (q: string, a: string) => void;
  submitClarification: () => void;
  _clarificationResolve: ((answers: Record<string, string> | null) => void) | null;

  generate: () => Promise<void>;
  refine: () => Promise<void>;
  abort: () => void;
  newProject: () => void;

  activeTab: BuilderTab;
  sidebarOpen: boolean;
  setActiveTab: (t: BuilderTab) => void;
  setSidebarOpen: (v: boolean) => void;

  preferences: Record<string, any>;
  _orchestrator: Orchestrator | null;

  // ── Content mode ─────────────────────────────────────────────────────────
  contentMode: ContentMode | null;
  contentUpload: ContentUpload | null;
  showContentModal: boolean;
  showTemplateGallery: boolean;
  setContentMode: (m: ContentMode | null) => void;
  setContentUpload: (u: ContentUpload | null) => void;
  setShowContentModal: (v: boolean) => void;
  setShowTemplateGallery: (v: boolean) => void;
  applyTemplate: (t: SiteTemplate) => void;
  startGenerateWithContent: (mode: ContentMode, upload?: ContentUpload) => Promise<void>;
}

let _eventLog: StreamEvent[] = [];

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  user: null,
  authLoading: true,
  preferences: {} as Record<string, any>,
  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),

  projects: [],
  currentProject: null,
  setCurrentProject: (currentProject) => {
    set({ currentProject, state: currentProject?.state ?? 'complete', events: currentProject?.events ?? [] });
  },

  loadProjects: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const projects = await firebaseService.getUserProjects(user.id);
      // Hydrate projects with cached HTML content
      const hydrated = await Promise.all(projects.map(p => buildCache.hydrate(p).catch(() => p)));
      set({ projects: hydrated });
    } catch (e: any) {
      console.warn('[store] loadProjects Firestore error, falling back to localStorage:', e?.message);
      // Fallback: load from localStorage when Firestore rules are not yet deployed
      try {
        const local = JSON.parse(localStorage.getItem('orin_local_projects') ?? '[]') as any[];
        const hydrated = await Promise.all(local.map((p: any) => buildCache.hydrate(p).catch(() => p)));
        set({ projects: hydrated });
      } catch { /* ignore */ }
    }
  },

  deleteProject: async (id) => {
    try { await firebaseService.deleteProject(id); } catch { /* ignore if no Firestore access */ }
    await buildCache.delete(id).catch(() => {});
    // Also remove from localStorage fallback
    try {
      const local = JSON.parse(localStorage.getItem('orin_local_projects') ?? '[]') as any[];
      localStorage.setItem('orin_local_projects', JSON.stringify(local.filter((p: any) => p.id !== id)));
    } catch { /* ignore */ }
    const { projects, currentProject } = get();
    set({
      projects: projects.filter(p => p.id !== id),
      currentProject: currentProject?.id === id ? null : currentProject,
    });
  },

  state: 'queued',
  progress: 0,
  currentTask: '',
  events: [],
  error: null,

  prompt: '',
  refinePrompt: '',
  setPrompt: (prompt) => set({ prompt }),
  setRefinePrompt: (refinePrompt) => set({ refinePrompt }),

  clarificationQuestions: null,
  clarificationAnswers: {},
  setClarificationAnswer: (q, a) => set(s => ({ clarificationAnswers: { ...s.clarificationAnswers, [q]: a } })),
  submitClarification: () => {
    const { clarificationAnswers, _clarificationResolve } = get();
    _clarificationResolve?.(clarificationAnswers);
    set({ clarificationQuestions: null, _clarificationResolve: null });
  },
  _clarificationResolve: null,

  generate: async () => {
    const { prompt, user, state } = get();
    if (!prompt.trim()) return;
    if (!['queued', 'complete', 'failed'].includes(state)) return;

    _eventLog = [];
    set({
      state: 'queued', progress: 0, currentTask: '', error: null,
      events: [], activeTab: 'preview', clarificationQuestions: null, clarificationAnswers: {},
    });

    const projectId = `proj_${Date.now()}`;
    const orchestrator = createOrchestrator(projectId, user, (event) => {
      _eventLog = [..._eventLog, event];
      set(s => ({
        events:      [...s.events, event],
        state:       event.state,
        progress:    event.progress    ?? s.progress,
        currentTask: event.current_task ?? event.message ?? s.currentTask,
      }));
      if (event.type === 'build_complete' && event.state === 'complete') {
        set({ activeTab: 'preview' });
      }
    });

    set({ _orchestrator: orchestrator });

    try {
      const { contentUpload: cu } = get();
      const result = await orchestrator.run(
        prompt,
        user,
        undefined,
        async (questions: string[]) =>
          new Promise<Record<string, string> | null>((resolve) => {
            set({ clarificationQuestions: questions, clarificationAnswers: {}, _clarificationResolve: resolve });
          }),
        cu ?? undefined,
      );

      const now = new Date().toISOString();
      // Sanitize: replace undefined with null so Firestore doesn't reject
      const safe = <T,>(v: T): T | null => (v === undefined ? null : v) as T | null;
      const project: BuilderProject = {
        id: '',
        userId: user?.id ?? 'guest',
        prompt,
        analysis:     safe(result.analysis)     ?? undefined,
        blueprint:    safe(result.blueprint)    ?? undefined,
        backendPlan:  safe(result.backendPlan)  ?? undefined,
        databasePlan: safe(result.databasePlan) ?? undefined,
        frontendPlan: safe(result.frontendPlan) ?? undefined,
        bundle:       safe(result.bundle)       ?? undefined,
        state:        result.state ?? 'complete',
        title:        result.title ?? result.blueprint?.siteName ?? 'Untitled',
        // Strip events that have undefined fields — Firestore rejects them
        events:       (_eventLog ?? []).map(e => Object.fromEntries(
          Object.entries(e).filter(([, v]) => v !== undefined)
        )) as any,
        clarifications: result.clarifications ?? undefined,
        createdAt: now,
        updatedAt: now,
        isPublished: false,
      };

      if (user) {
        // Non-fatal: if Firestore write fails (e.g. rules not deployed yet),
        // the generated result is still shown to the user via local state + cache.
        try {
          const savedId = await firebaseService.saveProject(project);
          project.id = savedId;
          // Cache heavy content locally for instant revisit
          if (project.bundle?.files?.length) {
            await buildCache.set(project).catch(() => {});
          }
          await get().loadProjects();
        } catch (saveErr: any) {
          console.warn('[store] saveProject failed (non-fatal):', saveErr?.message);
          // Still show the result even if save failed
        }
      }

      set({ currentProject: project, state: project.state, _orchestrator: null });
    } catch (err: any) {
      console.error('[store] generate:', err);
      set({ state: 'failed', error: err?.message ?? 'Generation failed', _orchestrator: null });
    }
  },

  refine: async () => {
    const { refinePrompt, currentProject, user } = get();
    const html = currentProject?.bundle?.files?.find(f => f.path === 'index.html')?.content;
    if (!refinePrompt.trim() || !html) return;

    set({ state: 'assembling_preview', currentTask: 'Applying refinement…', error: null });

    try {
      const refined = await refineHtml(html, refinePrompt, user, (msg) => set({ currentTask: msg }));
      const updatedFiles = (currentProject!.bundle!.files ?? []).map((f: ArtifactFile) =>
        f.path === 'index.html' ? { ...f, content: refined, sizeBytes: refined.length } : f
      );
      const updated: BuilderProject = {
        ...currentProject!,
        bundle: { ...currentProject!.bundle!, files: updatedFiles },
        updatedAt: new Date().toISOString(),
      };
      if (user && updated.id) await firebaseService.saveProject(updated).catch(() => {});
      set({ currentProject: updated, state: 'complete', currentTask: '', refinePrompt: '' });
    } catch (err: any) {
      set({ state: 'failed', error: err?.message ?? 'Refinement failed', currentTask: '' });
    }
  },

  abort: () => {
    get()._orchestrator?.abort();
    set({ state: 'failed', error: 'Aborted by user', _orchestrator: null });
  },

  newProject: () => {
    get()._orchestrator?.abort();
    set({
      state: 'queued', progress: 0, currentTask: '', error: null, contentMode: null, contentUpload: null,
      prompt: '', refinePrompt: '', currentProject: null, showContentModal: false,
      events: [], clarificationQuestions: null, clarificationAnswers: {},
      activeTab: 'preview', _orchestrator: null,
    });
  },

  activeTab: 'preview',
  sidebarOpen: true,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  _orchestrator: null,

  // ── Content mode defaults ─────────────────────────────────────────────────
  contentMode: null,
  contentUpload: null,
  showContentModal: false,
  showTemplateGallery: false,
  setContentMode: (contentMode) => set({ contentMode }),
  setContentUpload: (contentUpload) => set({ contentUpload }),
  setShowContentModal: (showContentModal) => set({ showContentModal }),
  setShowTemplateGallery: (showTemplateGallery) => set({ showTemplateGallery }),
  applyTemplate: (template) => set({ prompt: template.prompt, showTemplateGallery: false }),
  startGenerateWithContent: async (mode, upload) => {
    set({ contentMode: mode, contentUpload: upload ?? null, showContentModal: false });
    await get().generate();
  },
}));
