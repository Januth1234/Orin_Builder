import { create } from 'zustand';
import {
  UserAccount, BuilderProject, BuildState, BuilderTab,
  StreamEvent, ArtifactFile,
} from '../types';
import { firebaseService } from './firebaseService';
import { createOrchestrator, Orchestrator } from './orchestrator';
import { refineHtml } from './geminiBuilderService';

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

  _orchestrator: Orchestrator | null;
}

let _eventLog: StreamEvent[] = [];

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  user: null,
  authLoading: true,
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
      set({ projects });
    } catch (e) { console.error('[store] loadProjects:', e); }
  },

  deleteProject: async (id) => {
    await firebaseService.deleteProject(id);
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
      const result = await orchestrator.run(
        prompt,
        user,
        undefined,
        async (questions: string[]) =>
          new Promise<Record<string, string> | null>((resolve) => {
            set({ clarificationQuestions: questions, clarificationAnswers: {}, _clarificationResolve: resolve });
          }),
      );

      const now = new Date().toISOString();
      const project: BuilderProject = {
        id: '',
        userId: user?.id ?? 'guest',
        prompt,
        // Store ALL plan outputs so DatabasePanel, BlueprintPanel, CodePanel have full data
        analysis:    result.analysis,
        blueprint:   result.blueprint,
        backendPlan: result.backendPlan,
        databasePlan:result.databasePlan,
        frontendPlan:result.frontendPlan,
        bundle:      result.bundle,
        state:       result.state ?? 'complete',
        title:       result.title ?? result.blueprint?.siteName ?? 'Untitled',
        events:      _eventLog,
        clarifications: result.clarifications,
        createdAt: now,
        updatedAt: now,
        isPublished: false,
      };

      if (user) {
        const savedId = await firebaseService.saveProject(project);
        project.id = savedId;
        await get().loadProjects();
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
      if (user && updated.id) await firebaseService.saveProject(updated);
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
      state: 'queued', progress: 0, currentTask: '', error: null,
      prompt: '', refinePrompt: '', currentProject: null,
      events: [], clarificationQuestions: null, clarificationAnswers: {},
      activeTab: 'preview', _orchestrator: null,
    });
  },

  activeTab: 'preview',
  sidebarOpen: true,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  _orchestrator: null,
}));
