import assert from "node:assert/strict";
import test from "node:test";
import { GUIDE } from "../src/lib/guide.ts";

test("guide uses stable unique IDs and complete step references", () => {
  const allIds = [
    ...GUIDE.parts.map((part) => part.id),
    ...GUIDE.materials.map((material) => material.id),
    ...GUIDE.circuits.map((circuit) => circuit.id),
    ...GUIDE.steps.map((step) => step.id),
    ...GUIDE.concepts.map((concept) => concept.id),
  ];
  assert.equal(new Set(allIds).size, allIds.length);
  assert.equal(GUIDE.steps.length, 10);
  for (const step of GUIDE.steps) {
    assert.ok(step.title && step.objective && step.actions.length > 0);
    assert.ok(step.required.length > 0 && step.why && step.theory && step.expected && step.checkpoint && step.question);
    assert.ok(step.mistakes.length > 0);
    assert.ok(step.concepts.every((id) => GUIDE.concepts.some((concept) => concept.id === id)));
  }
  assert.match(GUIDE.validationStatus, /physical build validation required/i);
  for (const id of ["B1", "B2", "A1", "A2", "G1", "P1", "P2", "P3"]) assert.ok(GUIDE.parts.some((part) => part.id === id));
  assert.deepEqual(GUIDE.circuits.map(({ controller, actuator, joint }) => [controller, actuator, joint]), [
    ["S1", "S2", "P1 shoulder"], ["S3", "S4", "P2 elbow"], ["S5", "S6", "P3 gripper"],
  ]);
});

test("all build steps point to available diagrams and the three circuits use six unique syringes", () => {
  const diagramIds = new Set(["overview", "cutting", "pivots", "circuit", "mapping", "actuators"]);
  assert.ok(GUIDE.steps.every((step) => diagramIds.has(step.diagram)));
  const syringes = GUIDE.circuits.flatMap((circuit) => [circuit.controller, circuit.actuator]);
  assert.equal(new Set(syringes).size, 6);
  assert.ok(GUIDE.materials.find((material) => material.id === "syringes")?.quantity.includes("6"));
});
