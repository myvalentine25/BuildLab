import { test } from "node:test";
import assert from "node:assert/strict";
import { project, validateProject } from "../src/lib/project";
import { newWork, parseWork, progress, setCompleted } from "../src/lib/state";
import { buildTutorContext, demoReply, validateTutorRequest } from "../src/lib/tutor";
import { GET, POST } from "../src/app/api/tutor/route";

test("guide has ten ordered phases and valid cross references", () => {
  assert.deepEqual(validateProject(project), []);
  assert.equal(project.steps.length, 10);
  assert.deepEqual(project.parts.map(p => [p.id, p.quantity]), [["B1",1],["S1",2],["A1",2],["J1",1],["J2",1],["G1",6]]);
  assert.match(project.materials.find(m => m.id === "syringe")!.quantity.en, /4:/);
  assert.match(project.diagrams.find(d => d.id === "circuit")!.description.en, /C1.*H1.*X1.*C2.*H2.*X2/);
  assert.ok(project.steps.every(s => s.actions.length && s.checkpoint.en && s.question.vi));
  const broken = structuredClone(project);
  broken.steps[0].partIds.push("unknown");
  assert.match(validateProject(broken).join(), /Unknown part/);
});

test("completion is explicit, reversible and ignores invalid IDs", () => {
  const original = newWork();
  assert.equal(progress(original), 0);
  const done = setCompleted(original, "s1", true);
  assert.equal(progress(done), 10);
  assert.equal(progress(setCompleted(done, "s1", true)), 10);
  assert.equal(progress(setCompleted(done, "s1", false)), 0);
  assert.equal(setCompleted(done, "invalid", true), done);
  assert.deepEqual(original.completed, []);
});

test("work round trips and corrupted or outdated data is rejected", () => {
  const work = newWork();
  work.context.age = "Grade 8";
  work.notes.s6 = "Bubbles";
  work.results.success = "2";
  work.messages.push({ role: "user", text: "Why?" });
  assert.deepEqual(parseWork(JSON.stringify(work)), work);
  assert.equal(parseWork("{broken"), null);
  assert.equal(parseWork(JSON.stringify({ ...work, version: 99 })), null);
  assert.equal(parseWork(JSON.stringify({ ...work, messages: "bad" })), null);
  assert.deepEqual(parseWork(JSON.stringify({ ...work, completed: ["s1", "s1", "bad"] }))?.completed, ["s1"]);
});

const request = () => {
  const work = newWork();
  return { context: work.context, stepId: "s6", completed: ["s1"], notes: { s6: "bọt" }, messages: [], question: "Tôi thấy bọt khí" };
};
test("tutor context includes student observations and trusted guide references", () => {
  const input = request();
  assert.equal(validateTutorRequest(input), true);
  const context = buildTutorContext(input);
  assert.equal(context.project.version, project.version);
  assert.equal(context.currentStep.id, "s6");
  assert.equal(context.notes.s6, "bọt");
  assert.deepEqual(context.completed, ["s1"]);
  assert.equal(validateTutorRequest({ ...input, question: "x".repeat(2001) }), false);
  assert.equal(validateTutorRequest({ ...input, messages: Array(13).fill({ role: "user", text: "x" }) }), false);
});

test("demo is explicitly scripted and API rejects bad input", async () => {
  const previous = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    assert.match(demoReply(request()), /Kịch bản demo.*bước 6/i);
    assert.equal((await (await GET()).json()).mode, "demo");
    const response = await POST(new Request("http://localhost/api/tutor", { method: "POST", body: JSON.stringify(request()) }));
    assert.equal((await response.json()).mode, "demo");
    const invalid = await POST(new Request("http://localhost/api/tutor", { method: "POST", body: "{}" }));
    assert.equal(invalid.status, 400);
  } finally { if (previous !== undefined) process.env.AI_API_KEY = previous; }
});

test("provider rate limits and invalid responses produce safe errors", async () => {
  const previous = { key: process.env.AI_API_KEY, base: process.env.AI_BASE_URL, model: process.env.AI_MODEL, fetch: globalThis.fetch };
  process.env.AI_API_KEY = "test-key"; process.env.AI_BASE_URL = "https://example.invalid"; process.env.AI_MODEL = "test-model";
  try {
    globalThis.fetch = async () => new Response("", { status: 429 });
    const call = () => POST(new Request("http://localhost/api/tutor", { method: "POST", body: JSON.stringify(request()) }));
    assert.equal((await call()).status, 429);
    globalThis.fetch = async () => Response.json({ choices: [] });
    assert.equal((await call()).status, 502);
    globalThis.fetch = async () => { throw new Error("timeout"); };
    assert.equal((await call()).status, 504);
  } finally {
    globalThis.fetch = previous.fetch;
    for (const [key, value] of Object.entries({ AI_API_KEY: previous.key, AI_BASE_URL: previous.base, AI_MODEL: previous.model })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
