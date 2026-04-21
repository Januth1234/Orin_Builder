// ─── Orin AI shared types (keep in sync with main app) ───────────────────────
export type UserTier = 'Free' | 'Basic' | 'Pro (BYO-Google)' | 'Verified Member';
export type UserRole = 'visitor' | 'training' | 'devops' | 'owner';

export interface UserAccount {
  id: string; name: string; email: string; avatar?: string;
  tier: UserTier; plan?: string; role?: UserRole; approved?: boolean;
  dailyUsage: { text: number; images: number; videos: number };
}

export type BuildState =
  | 'queued' | 'analyzing' | 'planning' | 'clarification_needed'
  | 'generating_backend' | 'generating_database' | 'generating_frontend'
  | 'generating_content' | 'assembling_preview' | 'validating'
  | 'complete' | 'failed';

export const VALID_TRANSITIONS: Partial<Record<BuildState, BuildState[]>> = {
  queued:               ['analyzing','failed'],
  analyzing:            ['planning','clarification_needed','failed'],
  planning:             ['clarification_needed','generating_backend','failed'],
  clarification_needed: ['generating_backend','failed'],
  generating_backend:   ['generating_database','generating_frontend','failed'],
  generating_database:  ['generating_frontend','failed'],
  generating_frontend:  ['generating_content','assembling_preview','failed'],
  generating_content:   ['assembling_preview','failed'],
  assembling_preview:   ['validating','failed'],
  validating:           ['complete','failed'],
  complete:             [],
  failed:               [],
};

export function canTransition(from: BuildState, to: BuildState): boolean {
  if (to === 'failed') return true;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export type BuilderTab = 'preview' | 'code' | 'blueprint' | 'database';

export type StreamEventType =
  | 'state_changed' | 'tool_call_started' | 'tool_call_completed'
  | 'artifact_created' | 'artifact_updated' | 'clarification_requested'
  | 'validation_warning' | 'validation_error' | 'build_complete'
  | 'retry_attempt' | 'partial_result';

export interface StreamEvent {
  type: StreamEventType;
  project_id: string;
  state: BuildState;
  timestamp: string;
  message?: string;
  progress?: number;
  current_task?: string;
  artifact_path?: string;
  tool_name?: string;
  tool_call_id?: string;
  attempt?: number;
}

export type ToolName =
  | 'analyze_prompt' | 'create_blueprint' | 'request_clarification'
  | 'generate_backend_plan' | 'generate_frontend_plan' | 'generate_database_plan'
  | 'assemble_artifacts' | 'validate_bundle';

export interface PromptAnalysis {
  intent: string; constraints: string[]; pages: string[];
  features: string[]; ambiguities: string[]; audience: string;
}

export interface ColorScheme {
  primary: string; secondary: string; accent: string;
  background: string; text: string; surface: string;
}

export interface BlueprintSection {
  name: string;
  type: 'hero'|'features'|'pricing'|'testimonials'|'cta'|'footer'
       |'navbar'|'contact'|'gallery'|'blog'|'team'|'faq'|'custom';
  purpose: string;
  hasAnimation: boolean;
}

export interface DataModel {
  name: string; fields: DbField[]; relations?: string[]; indexes?: string[];
}

export interface DbField {
  name: string;
  type: 'UUID'|'VARCHAR'|'TEXT'|'INTEGER'|'BIGINT'|'BOOLEAN'|'TIMESTAMP'
       |'JSONB'|'FLOAT'|'DECIMAL'|'ENUM';
  note: string; nullable?: boolean; defaultValue?: string;
}

export interface SiteBlueprint {
  project_type: string; siteName: string; tagline: string; domain: string;
  audience: string; pages: string[]; sections: BlueprintSection[];
  components: string[]; data_models: DataModel[]; integrations: string[];
  content_requirements: string[]; preview_requirements: string[];
  risk_flags: string[]; colorScheme: ColorScheme;
  fonts: { heading: string; body: string };
  tone: 'professional'|'playful'|'minimal'|'bold'|'elegant';
  seoKeywords: string[];
}

export interface BackendPlan {
  backend_tasks: string[]; api_routes: ApiRoute[]; auth_strategy: string;
  middleware: string[]; environment_vars: string[]; execution_order: string[];
}

export interface ApiRoute {
  method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';
  path: string; description: string; auth: boolean; body?: string; response?: string;
}

export interface DatabasePlan {
  database_tasks: string[]; tables: DbTable[]; sql: string; indexes?: string[];
}

export interface FrontendPlan {
  frontend_tasks: string[]; components: ComponentSpec[];
  layout_strategy: string; animation_strategy: string;
  responsive_breakpoints: string[];
}

export interface ComponentSpec {
  name: string;
  type: 'navigation'|'section'|'layout'|'form'|'card'|'modal'|'widget';
  description: string; hasAnimation?: boolean;
}

export type DbTable = DataModel & { table: string; purpose: string };

export interface ArtifactFile {
  path: string; content: string;
  language: 'html'|'sql'|'markdown'|'typescript'|'json';
  sizeBytes?: number;
}

export interface ValidationResult {
  valid: boolean; warnings: string[]; errors: string[]; checks: ValidationCheck[];
}

export interface ValidationCheck { name: string; passed: boolean; message: string; }

export interface ArtifactBundle {
  files: ArtifactFile[]; preview_entry: string; db_schema: string;
  api_contracts: string[];
  status: 'assembling'|'complete'|'invalid'|'partial';
  validation?: ValidationResult;
  validation_warnings?: string[];
  validation_errors?: string[];
  assembled_at?: string;
}

export interface ClarificationRequest  { questions: string[] }
export interface ClarificationResponse { answers: Record<string, string> }

export interface BuilderProject {
  id: string; userId: string; prompt: string;
  analysis?:      PromptAnalysis;
  blueprint?:     SiteBlueprint;
  backendPlan?:   BackendPlan;
  databasePlan?:  DatabasePlan;
  frontendPlan?:  FrontendPlan;
  bundle?:        ArtifactBundle;
  state:          BuildState;
  title:          string;
  events:         StreamEvent[];
  clarifications?: ClarificationResponse;
  error?:         string;
  progressAtSave?: number;
  createdAt:      string;
  updatedAt:      string;
  isPublished:    boolean;
}

export interface PipelineStep {
  id: BuildState; label: string; description: string;
  toolName?: ToolName; progressAt: number;
}

export const PIPELINE: PipelineStep[] = [
  { id: 'analyzing',           label: 'Analyzing Prompt',   description: 'Extracting intent, pages & constraints',       toolName: 'analyze_prompt',         progressAt: 8  },
  { id: 'planning',            label: 'Blueprint',          description: 'Architecture, pages, sections & colour scheme', toolName: 'create_blueprint',        progressAt: 18 },
  { id: 'generating_backend',  label: 'Backend Logic',      description: 'API routes, auth & business logic',             toolName: 'generate_backend_plan',   progressAt: 35 },
  { id: 'generating_database', label: 'Database Design',    description: 'Schema, tables & relationships',                toolName: 'generate_database_plan',  progressAt: 50 },
  { id: 'generating_frontend', label: 'Frontend Plan',      description: 'UI components, sections & layout',              toolName: 'generate_frontend_plan',  progressAt: 62 },
  { id: 'generating_content',  label: 'Content Pass',       description: 'Page copy, labels & structured content',        toolName: undefined,                 progressAt: 72 },
  { id: 'assembling_preview',  label: 'Assembling Preview', description: 'Bundling into previewable HTML/CSS/JS',          toolName: 'assemble_artifacts',      progressAt: 85 },
  { id: 'validating',          label: 'Validation',         description: 'Checking for errors & broken contracts',         toolName: 'validate_bundle',         progressAt: 95 },
];

export const BUILD_STATE_META: Record<BuildState, { label: string; message: string; progressAt: number }> = {
  queued:               { label: 'Queued',             message: 'Your build is waiting to start.',                    progressAt: 0   },
  analyzing:            { label: 'Analyzing prompt',   message: 'Understanding the request and user context.',        progressAt: 8   },
  planning:             { label: 'Building blueprint', message: 'Creating the structured plan for all layers.',       progressAt: 18  },
  clarification_needed: { label: 'Need input',         message: 'One or more details are needed before continuing.',  progressAt: 18  },
  generating_backend:   { label: 'Backend logic',      message: 'Creating APIs, schema, and server logic first.',     progressAt: 35  },
  generating_database:  { label: 'Database design',    message: 'Creating tables, collections, and relationships.',   progressAt: 50  },
  generating_frontend:  { label: 'Frontend plan',      message: 'Creating the website UI and page structure.',        progressAt: 62  },
  generating_content:   { label: 'Content pass',       message: 'Writing page copy, labels, and structured content.', progressAt: 72  },
  assembling_preview:   { label: 'Assembling preview', message: 'Bundling the latest output into the live preview.',  progressAt: 85  },
  validating:           { label: 'Validating build',   message: 'Checking consistency and completeness.',             progressAt: 95  },
  complete:             { label: 'Complete',           message: 'The build is ready for review.',                     progressAt: 100 },
  failed:               { label: 'Failed',             message: 'The build hit an error and needs attention.',        progressAt: 0   },
};

export type AppRoute = '/' | '/home';
