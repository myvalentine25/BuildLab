import assert from "node:assert/strict";
import test from "node:test";
import { GUIDE } from "../src/lib/guide.ts";
import { createWork, markStep, progressPercent, restoreWork, saveWork } from "../src/lib/progress.ts";

test("progress counts unique valid completed steps and updates only explicit steps", () => {
  const work = createWork();
  assert.equal(progressPercent([]), 0);
  const complete = markStep(work, GUIDE.steps[0].id, true);
  assert.equal(progressPercent(complete.completedSteps), 10);
  assert.equal(progressPercent([GUIDE.steps[0].id, GUIDE.steps[0].id, "not-a-step"]), 10);
  assert.deepEqual(markStep(complete, GUIDE.steps[0].id, false).completedSteps, []);
  assert.equal(markStep(work, "not-a-step", true), work);
});

test("saved student work restores context, observations, chat, and test results safely", () => {
  const work = createWork();
  const changed = {
    ...work,
    currentStep: "step-06",
    completedSteps: ["step-01", "stale-step"],
    context: { ...work.context, grade: "Grade 8", language: "vi" as const, teacherInstructions: "Measure movement" },
    observations: { "step-06": "I see a bubble" },
    chat: [{ id: "m1", role: "student" as const, text: "Why bubbles?" }],
    testResults: { ...work.testResults, object: "paper ball", successfulAttempts: "2" },
  };
  const restored = restoreWork(JSON.stringify(changed));
  assert.equal(restored.currentStep, "step-06");
  assert.deepEqual(restored.completedSteps, ["step-01"]);
  assert.equal(restored.context.teacherInstructions, "Measure movement");
  assert.equal(restored.observations["step-06"], "I see a bubble");
  assert.equal(restored.chat[0].text, "Why bubbles?");
  assert.equal(restored.testResults.successfulAttempts, "2");
});

test("saving to local storage and restoring retains a student's work", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const work = { ...createWork(), notes: "Ask about the shoulder linkage", currentStep: "step-07" };
  saveWork(work, storage);
  const restored = restoreWork(storage.getItem("buildlab-hydraulic-arm-v1"));
  assert.equal(restored.notes, work.notes);
  assert.equal(restored.currentStep, "step-07");
});

test("corrupted, outdated, and unrecognized saved data falls back to fresh work", () => {
  assert.equal(restoreWork("{").currentStep, GUIDE.steps[0].id);
  assert.equal(restoreWork(JSON.stringify({ schemaVersion: 0 })).completedSteps.length, 0);
  const work = createWork();
  const invalidStep = restoreWork(JSON.stringify({ ...work, currentStep: "missing" }));
  assert.equal(invalidStep.currentStep, GUIDE.steps[0].id);
  const malformed = restoreWork(JSON.stringify({ ...work, context: { grade: {}, language: "unknown" }, notes: {}, observations: { "step-01": {} } }));
  assert.equal(malformed.context.grade, "Grade 8");
  assert.equal(malformed.context.language, "vi");
  assert.equal(malformed.notes, "");
  assert.deepEqual(malformed.observations, {});
});
