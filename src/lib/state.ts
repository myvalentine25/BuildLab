import { project } from "./project";
import type { Work, StudentContext } from "./types";

export const STORAGE_KEY = "buildlab-work-v1";
export const emptyContext: StudentContext = { language: "vi", age: "", work: "individual", time: "", available: "", objectives: "", adult: "" };
export const newWork = (): Work => ({
  version: 1, context: { ...emptyContext }, currentStep: project.steps[0].id, completed: [], checkedMaterials: [], notes: {}, messages: [],
  results: { object: "", mass: "", start: "", target: "", success: "", total: "", problems: "", changes: "", after: "", reflection: "" }, suggestion: "",
});

export function setCompleted(work: Work, id: string, complete: boolean): Work {
  if (!project.steps.some(s => s.id === id)) return work;
  return { ...work, completed: complete ? [...new Set([...work.completed, id])] : work.completed.filter(x => x !== id) };
}
export function progress(work: Work): number {
  return Math.round(project.steps.filter(s => work.completed.includes(s.id)).length / project.steps.length * 100);
}
export function parseWork(raw: string | null): Work | null {
  if (!raw) return null;
  try {
    const x = JSON.parse(raw);
    const base = newWork();
    const strings = (v: unknown) => Array.isArray(v) && v.every(y => typeof y === "string");
    const record = (v: unknown) => v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(y => typeof y === "string");
    if (x?.version !== 1 || !x.context || !record(x.context) || !["vi", "en"].includes(x.context.language) ||
      typeof x.currentStep !== "string" || !strings(x.completed) || !strings(x.checkedMaterials) || !record(x.notes) ||
      !Array.isArray(x.messages) || !x.messages.every((m: { role: string; text: string }) => m && ["user", "assistant"].includes(m.role) && typeof m.text === "string") ||
      !record(x.results) || typeof x.suggestion !== "string") return null;
    return {
      ...base, ...x, context: { ...base.context, ...x.context },
      currentStep: project.steps.some(s => s.id === x.currentStep) ? x.currentStep : base.currentStep,
      completed: [...new Set<string>(x.completed.filter((id: string) => project.steps.some(s => s.id === id)))],
      checkedMaterials: [...new Set<string>(x.checkedMaterials.filter((id: string) => project.materials.some(m => m.id === id)))],
      results: { ...base.results, ...x.results },
    };
  } catch { return null; }
}
