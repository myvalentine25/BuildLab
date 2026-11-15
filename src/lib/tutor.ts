import { project } from "./project";
import type { Language, Message, StudentContext } from "./types";

export type TutorRequest = {
  context: StudentContext; stepId: string; completed: string[]; notes: Record<string, string>;
  messages: Message[]; question: string;
};
export function buildTutorContext(input: TutorRequest) {
  const step = project.steps.find(s => s.id === input.stepId) ?? project.steps[0];
  return {
    project: { id: project.id, version: project.version, validation: project.validation, assumptions: project.assumptions, summary: project.summary },
    student: input.context, currentStep: step,
    completed: input.completed.filter(id => project.steps.some(s => s.id === id)),
    notes: input.notes,
    materials: project.materials, parts: project.parts, diagrams: project.diagrams,
    concepts: project.concepts, troubleshooting: project.troubleshooting,
  };
}
export function validateTutorRequest(value: unknown): value is TutorRequest {
  if (!value || typeof value !== "object") return false;
  const x = value as TutorRequest;
  const context = x.context;
  const fields = ["age", "work", "time", "available", "objectives", "adult"] as const;
  return !!context && ["vi", "en"].includes(context.language) && fields.every(k => typeof context[k] === "string" && context[k].length <= 1000) &&
    typeof x.question === "string" && x.question.trim().length > 0 && x.question.length <= 2000 &&
    typeof x.stepId === "string" && project.steps.some(s => s.id === x.stepId) &&
    Array.isArray(x.completed) && x.completed.length <= 100 && x.completed.every(id => typeof id === "string" && id.length <= 100) &&
    !!x.notes && typeof x.notes === "object" && !Array.isArray(x.notes) && Object.keys(x.notes).length <= 20 && Object.values(x.notes).every(n => typeof n === "string" && n.length <= 2000) &&
    Array.isArray(x.messages) && x.messages.length <= 12 && x.messages.every(m => m && ["user", "assistant"].includes(m.role) && typeof m.text === "string" && m.text.length <= 2000);
}
export function demoReply(input: TutorRequest): string {
  const lang: Language = input.context.language;
  const step = project.steps.find(s => s.id === input.stepId) ?? project.steps[0];
  const q = input.question.toLowerCase();
  if (/bọt|bubbles|air|không khí/.test(q)) return lang === "vi" ? "Kịch bản demo: Bạn thấy bọt ở đâu? Bọt có thể làm điều khiển mềm vì không khí nén được. Kiểm tra rò rỉ và nạp lại theo bước 6, sơ đồ mạch. Đó là giả thuyết, không phải kết quả đã xác nhận." : "Scripted demo: Where do you see bubbles? Air can make control spongy because it compresses. Check for leaks and refill using step 6 and the circuit diagram. This is a hypothesis, not a confirmed result.";
  if (/troubleshoot|khắc phục|kẹt|jam|lift|nâng|tip|lật/.test(q)) return `${lang === "vi" ? "Kịch bản demo" : "Scripted demo"}: ${project.troubleshooting[3].check[lang]} ${lang === "vi" ? "Bạn quan sát thấy gì trước khi dừng?" : "What did you observe before stopping?"}`;
  if (/theory|lý thuyết|why|vì sao/.test(q)) return `${lang === "vi" ? "Kịch bản demo" : "Scripted demo"} · ${step.number}: ${project.concepts.find(c => step.conceptIds.includes(c.id))?.explanation[lang] ?? step.why[lang]}`;
  return `${lang === "vi" ? "Kịch bản demo" : "Scripted demo"} · ${lang === "vi" ? "Bước" : "Step"} ${step.number} · ${project.diagrams.find(d => d.id === step.diagramId)?.title[lang]}: ${step.actions[0][lang]} ${step.question[lang]} ${lang === "vi" ? "Demo chỉ phản hồi theo kịch bản; hãy dùng hướng dẫn để biết đầy đủ." : "Demo replies are scripted; use the guide for full details."}`;
}
