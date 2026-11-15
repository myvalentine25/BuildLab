export type Language = "vi" | "en";
export type Text = Record<Language, string>;
export type StudentContext = {
  language: Language;
  age: string;
  work: string;
  time: string;
  available: string;
  objectives: string;
  adult: string;
};
export type Material = { id: string; name: Text; quantity: Text; kind: "material" | "tool" };
export type Part = { id: string; name: Text; dimensions: string; quantity: number };
export type Diagram = { id: string; title: Text; description: Text };
export type Concept = { id: string; title: Text; explanation: Text };
export type Step = {
  id: string; number: number; title: Text; objective: Text; minutes: number;
  materialIds: string[]; partIds: string[]; diagramId: string; actions: Text[];
  why: Text; conceptIds: string[]; expected: Text; checkpoint: Text;
  mistake: Text; question: Text;
};
export type Troubleshooting = { id: string; title: Text; check: Text; stepIds: string[] };
export type Project = {
  id: string; version: string; title: Text; summary: Text; assumptions: Text;
  validation: Text; materials: Material[]; parts: Part[]; diagrams: Diagram[];
  concepts: Concept[]; steps: Step[]; troubleshooting: Troubleshooting[];
};
export type Message = { role: "user" | "assistant"; text: string };
export type Results = {
  object: string; mass: string; start: string; target: string; success: string;
  total: string; problems: string; changes: string; after: string; reflection: string;
};
export type Work = {
  version: 1; context: StudentContext; currentStep: string; completed: string[];
  checkedMaterials: string[]; notes: Record<string, string>; messages: Message[];
  results: Results; suggestion: string;
};
