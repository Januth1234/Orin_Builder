// ─── Shared with Orin AI main app ───────────────────────────────────────────
export type UserTier = 'Free' | 'Basic' | 'Pro (BYO-Google)' | 'Verified Member';
export type UserRole = 'visitor' | 'training' | 'devops' | 'owner';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  tier: UserTier;
  plan?: string;
  role?: UserRole;
  approved?: boolean;
  dailyUsage: { text: number; images: number; videos: number };
}

// ─── Builder Domain Types ────────────────────────────────────────────────────
export type BuildStage =
  | 'idle' | 'parsing' | 'blueprint' | 'database'
  | 'backend' | 'frontend' | 'assembling' | 'checks' | 'done' | 'error';

export type BuilderTab = 'preview' | 'code' | 'blueprint' | 'database';

export interface ColorScheme {
  primary: string; secondary: string; accent: string;
  background: string; text: string; surface: string;
}

export interface BlueprintSection {
  name: string;
  type: 'hero'|'features'|'pricing'|'testimonials'|'cta'|'footer'|'navbar'|'contact'|'gallery'|'blog'|'team'|'faq'|'custom';
  purpose: string;
  hasAnimation: boolean;
}

export interface SiteBlueprint {
  siteName: string;
  tagline: string;
  domain: string;
  pages: string[];
  sections: BlueprintSection[];
  colorScheme: ColorScheme;
  fonts: { heading: string; body: string };
  stack: string[];
  tone: 'professional'|'playful'|'minimal'|'bold'|'elegant';
  targetAudience: string;
  seoKeywords: string[];
}

export interface DbField {
  name: string;
  type: 'UUID'|'VARCHAR'|'TEXT'|'INTEGER'|'BOOLEAN'|'TIMESTAMP'|'JSONB'|'FLOAT'|'ENUM';
  note: string;
  nullable?: boolean;
}

export interface DbTable {
  table: string;
  purpose: string;
  fields: DbField[];
  relations?: string[];
}

export interface GeneratedComponent {
  name: string;
  type: 'navigation'|'section'|'layout'|'form'|'card'|'modal'|'widget';
  description: string;
}

export interface GenerationResult {
  blueprint: SiteBlueprint;
  dbSchema: DbTable[];
  components: GeneratedComponent[];
  html: string;
  promptUsed: string;
  generatedAt: string;
  modelUsed: string;
}

export interface BuilderProject {
  id: string;
  userId: string;
  prompt: string;
  result: GenerationResult | null;
  stage: BuildStage;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

export interface PipelineStep {
  id: BuildStage;
  label: string;
  description: string;
}

export const PIPELINE: PipelineStep[] = [
  { id: 'parsing',    label: 'Parsing Prompt',      description: 'Extracting intent & constraints' },
  { id: 'blueprint',  label: 'Site Blueprint',       description: 'Architecture, pages & colour scheme' },
  { id: 'database',   label: 'Database Design',      description: 'Schema, tables & relationships' },
  { id: 'backend',    label: 'Backend Logic',        description: 'API routes & business logic' },
  { id: 'frontend',   label: 'Frontend Components',  description: 'UI components & layout' },
  { id: 'assembling', label: 'Assembling Output',    description: 'Combining into a single HTML file' },
  { id: 'checks',     label: 'Consistency Check',    description: 'Validating structure & completeness' },
];
