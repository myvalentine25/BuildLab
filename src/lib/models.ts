export type Language = "vi" | "en";
export type DiagramId = "overview" | "cutting" | "pivots" | "circuit" | "mapping" | "actuators";

export interface Material {
  id: string;
  name: string;
  quantity: string;
  notes: string;
  category: "material" | "tool";
}

export interface Concept {
  id: string;
  name: string;
  explanation: string;
  formula?: string;
}

export interface BuildStep {
  id: string;
  phase: string;
  title: string;
  objective: string;
  minutes: number;
  required: string[];
  diagram: DiagramId;
  actions: string[];
  dimensions?: string;
  why: string;
  theory: string;
  concepts: string[];
  expected: string;
  checkpoint: string;
  mistakes: { issue: string; remedy: string }[];
  question: string;
}

export interface TroubleshootingEntry {
  id: string;
  symptoms: string[];
  checks: string[];
}

export interface ProjectGuide {
  id: string;
  version: string;
  title: string;
  validationStatus: string;
  designAssumptions: string[];
  movements: string[];
  materials: Material[];
  parts: { id: string; description: string; dimensions: string; quantity: string }[];
  circuits: { id: string; label: string; controller: string; actuator: string; joint: string }[];
  concepts: Concept[];
  steps: BuildStep[];
  troubleshooting: TroubleshootingEntry[];
}

export interface StudentContext {
  grade: string;
  language: Language;
  workMode: "individual" | "group";
  timeAvailable: string;
  materialsAvailable: string[];
  toolsAvailable: string[];
  teacherInstructions: string;
  adultHelp: boolean;
}

export interface ChatMessage {
  id: string;
  role: "student" | "tutor";
  text: string;
}

export interface TestResults {
  object: string;
  mass: string;
  start: string;
  target: string;
  successfulAttempts: string;
  totalAttempts: string;
  problems: string;
  changes: string;
  afterChange: string;
}

export interface StudentWork {
  schemaVersion: 1;
  context: StudentContext;
  currentStep: string;
  completedSteps: string[];
  checkedMaterials: string[];
  observations: Record<string, string>;
  notes: string;
  chat: ChatMessage[];
  testResults: TestResults;
  reflection: Record<string, string>;
}
