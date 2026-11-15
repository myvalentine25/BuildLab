import { GUIDE } from "./guide.ts";
import type { StudentContext, StudentWork } from "./models.ts";

export const STORAGE_KEY = "buildlab-hydraulic-arm-v1";
type WorkStorage = Pick<Storage, "getItem" | "setItem">;

export const defaultContext: StudentContext = {
  grade: "Grade 8",
  language: "vi",
  workMode: "individual",
  timeAvailable: "2–3 hours",
  materialsAvailable: [],
  toolsAvailable: [],
  teacherInstructions: "",
  adultHelp: false,
};

export function createWork(): StudentWork {
  return {
    schemaVersion: 1,
    context: defaultContext,
    currentStep: GUIDE.steps[0].id,
    completedSteps: [],
    checkedMaterials: [],
    observations: {},
    notes: "",
    chat: [],
    testResults: { object: "", mass: "", start: "", target: "", successfulAttempts: "", totalAttempts: "", problems: "", changes: "", afterChange: "" },
    reflection: {},
  };
}

export function progressPercent(completed: string[]): number {
  const valid = new Set(GUIDE.steps.map((step) => step.id));
  const unique = new Set(completed.filter((id) => valid.has(id)));
  return Math.round((unique.size / GUIDE.steps.length) * 100);
}

export function markStep(work: StudentWork, stepId: string, complete: boolean): StudentWork {
  if (!GUIDE.steps.some((step) => step.id === stepId)) return work;
  const completedSteps = new Set(work.completedSteps);
  if (complete) completedSteps.add(stepId);
  else completedSteps.delete(stepId);
  return { ...work, completedSteps: [...completedSteps] };
}

export function saveWork(work: StudentWork, storage: WorkStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(work));
}

export function restoreWork(value: string | null): StudentWork {
  if (!value) return createWork();
  try {
    const saved = JSON.parse(value) as Partial<StudentWork>;
    if (saved.schemaVersion !== 1 || typeof saved.currentStep !== "string" || !GUIDE.steps.some((step) => step.id === saved.currentStep)) return createWork();
    const fresh = createWork();
    const context = (saved.context && typeof saved.context === "object" ? saved.context : {}) as Partial<StudentContext>;
    const validIds = new Set(GUIDE.steps.map((step) => step.id));
    const strings = (record: unknown, allowed?: Set<string>): Record<string, string> => {
      if (!record || typeof record !== "object" || Array.isArray(record)) return {};
      return Object.fromEntries(Object.entries(record)
        .filter(([key, item]) => typeof item === "string" && (!allowed || allowed.has(key)))
        .map(([key, item]) => [key, (item as string).slice(0, 4000)]));
    };
    const resultFields = Object.keys(fresh.testResults) as (keyof StudentWork["testResults"])[];
    const testResults = { ...fresh.testResults };
    for (const key of resultFields) {
      const savedValue = saved.testResults?.[key];
      testResults[key] = typeof savedValue === "string" ? savedValue.slice(0, 2000) : "";
    }
    return {
      ...fresh,
      ...saved,
      context: {
        grade: typeof context.grade === "string" ? context.grade.slice(0, 40) : fresh.context.grade,
        language: context.language === "en" ? "en" : "vi",
        workMode: context.workMode === "group" ? "group" : "individual",
        timeAvailable: typeof context.timeAvailable === "string" && ["1 hour", "2–3 hours", "More than 3 hours"].includes(context.timeAvailable) ? context.timeAvailable : fresh.context.timeAvailable,
        materialsAvailable: Array.isArray(context.materialsAvailable) ? context.materialsAvailable.filter((id): id is string => typeof id === "string" && GUIDE.materials.some((item) => item.category === "material" && item.id === id)) : [],
        toolsAvailable: Array.isArray(context.toolsAvailable) ? context.toolsAvailable.filter((id): id is string => typeof id === "string" && GUIDE.materials.some((item) => item.category === "tool" && item.id === id)) : [],
        teacherInstructions: typeof context.teacherInstructions === "string" ? context.teacherInstructions.slice(0, 500) : "",
        adultHelp: typeof context.adultHelp === "boolean" ? context.adultHelp : false,
      },
      completedSteps: Array.isArray(saved.completedSteps) ? saved.completedSteps.filter((id): id is string => typeof id === "string" && GUIDE.steps.some((step) => step.id === id)) : [],
      checkedMaterials: Array.isArray(saved.checkedMaterials) ? saved.checkedMaterials.filter((id): id is string => typeof id === "string" && GUIDE.materials.some((item) => item.id === id)) : [],
      observations: strings(saved.observations, validIds),
      chat: Array.isArray(saved.chat) ? saved.chat.filter((item) => item && (item.role === "student" || item.role === "tutor") && typeof item.text === "string").slice(-40).map((item, index) => ({ id: typeof item.id === "string" ? item.id : `restored-${index}`, role: item.role, text: item.text.slice(0, 6000) })) : [],
      notes: typeof saved.notes === "string" ? saved.notes.slice(0, 2000) : "",
      testResults,
      reflection: strings(saved.reflection),
    };
  } catch {
    return createWork();
  }
}
