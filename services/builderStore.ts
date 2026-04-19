import { create } from 'zustand';
import { UserAccount, BuilderProject, GenerationResult, BuildStage, BuilderTab } from '../types';
import { firebaseService } from './firebaseService';
import { geminiBuilderService } from './geminiBuilderService';

interface BuilderStore {
  // Auth
  user: UserAccount | null;
  authLoading: boolean;
  setUser: (u: UserAccount | null) => void;
  setAuthLoading: (v: boolean) => void;

  // Projects
  projects: BuilderProject[];
  currentProject: BuilderProject | null;
  setCurrentProject: (p: BuilderProject | null) => void;
  loadProjects: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Build state
  stage: BuildStage;
  stageDetail: string;
  error: string | null;
  prompt: string;
  refinePrompt: string;
  setPrompt: (p: string) => void;
  setRefinePrompt: (p: string) => void;

  // Actions
  generate: () => Promise<void>;
  refine: () => Promise<void>;
  newProject: () => void;

  // UI
  activeTab: BuilderTab;
  sidebarOpen: boolean;
  setActiveTab: (t: BuilderTab) => void;
  setSidebarOpen: (v: boolean) => void;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  authLoading: true,
  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),

  // ── Projects ──────────────────────────────────────────────────────────────
  projects: [],
  currentProject: null,
  setCurrentProject: (currentProject) => set({ currentProject }),

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

  // ── Build ─────────────────────────────────────────────────────────────────
  stage: 'idle',
  stageDetail: '',
  error: null,
  prompt: '',
  refinePrompt: '',
  setPrompt: (prompt) => set({ prompt }),
  setRefinePrompt: (refinePrompt) => set({ refinePrompt }),

  generate: async () => {
    const { prompt, user } = get();
    if (!prompt.trim() || !['idle','done','error'].includes(get().stage)) return;

    set({ stage: 'parsing', stageDetail: 'Starting pipeline…', error: null, activeTab: 'preview' });

    try {
      const result: GenerationResult = await geminiBuilderService.generateWebsite(
        prompt, user,
        (stage, detail = '') => set({ stage, stageDetail: detail }),
      );

      const now = new Date().toISOString();
      const project: BuilderProject = {
        id: '',
        userId: user?.id ?? 'guest',
        prompt,
        result,
        stage: 'done',
        title: result.blueprint.siteName,
        createdAt: now,
        updatedAt: now,
        isPublished: false,
      };

      if (user) {
        const savedId = await firebaseService.saveProject(project);
        project.id = savedId;
        await get().loadProjects();
      }

      set({ currentProject: project, stage: 'done', stageDetail: '' });
    } catch (err: any) {
      console.error('[store] generate:', err);
      set({ stage: 'error', error: err?.message ?? 'Generation failed', stageDetail: '' });
    }
  },

  refine: async () => {
    const { refinePrompt, currentProject, user } = get();
    if (!refinePrompt.trim() || !currentProject?.result?.html) return;

    set({ stage: 'assembling', stageDetail: 'Applying refinements…', error: null });

    try {
      const html = await geminiBuilderService.refineWebsite(
        currentProject.result.html, refinePrompt, user,
        (stage, detail = '') => set({ stage, stageDetail: detail }),
      );

      const updated: BuilderProject = {
        ...currentProject,
        result: { ...currentProject.result, html },
        updatedAt: new Date().toISOString(),
      };

      if (user && updated.id) await firebaseService.saveProject(updated);

      set({ currentProject: updated, stage: 'done', stageDetail: '', refinePrompt: '' });
    } catch (err: any) {
      set({ stage: 'error', error: err?.message ?? 'Refinement failed', stageDetail: '' });
    }
  },

  newProject: () => set({
    stage: 'idle', stageDetail: '', error: null,
    prompt: '', refinePrompt: '', currentProject: null, activeTab: 'preview',
  }),

  // ── UI ────────────────────────────────────────────────────────────────────
  activeTab: 'preview',
  sidebarOpen: true,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
