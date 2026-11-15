# BuildLab

BuildLab is a Vietnamese-first (English-toggle) hands-on learning workspace for a **cardboard hydraulic robotic arm**. The guide, diagrams, materials checklist, notes, explicit step completion, troubleshooting, challenge and printable report work without an AI provider. A tutor can use the current step, student context, notes and explicitly completed steps; chat never completes a step.

## Local setup

Requires Node.js 20.9 or newer and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Leave the variables blank to use the clearly labeled **scripted demo**. Demo responses are deterministic examples, not general language understanding. The guide remains available if the tutor is unavailable.

### Optional AI provider

The server-side adapter uses an OpenAI-compatible `POST /chat/completions` endpoint:

| Variable | Purpose |
| --- | --- |
| `AI_BASE_URL` | Provider API base URL, e.g. `https://provider.example/v1` (without `/chat/completions`) |
| `AI_MODEL` | Provider model identifier |
| `AI_API_KEY` | Server-side provider credential; never put it in client code |

Set all three in `.env.local` and restart the server to enable AI. Do not commit credentials. When using AI, the current project guide, student context, notes and bounded conversation history are sent to the configured provider; obtain appropriate consent and avoid entering sensitive personal information. The API bounds input and history, treats student text as untrusted, times out after 20 seconds, and reports provider errors. A public deployment needs its own authentication, server-side abuse/rate controls and privacy review; the client duplicate-request guard is not a server rate limiter.

## Using the workspace

Enter only the learning context requested, choose a phase, check materials and explicitly mark steps complete. Edits are automatically stored in browser `localStorage`; **Save** writes again, **Resume** reads the saved copy, **Reset** replaces it with a blank project, and **Delete data** removes it from this browser. Reset and delete require confirmation. Corrupt or incompatible saved data is ignored with a notice. Browser storage is device- and browser-specific, can be cleared or unavailable, and is not a backup. Print report includes progress, notes and challenge entries.

## Reference design and safety

**Prototype guide — physical build validation required.** This is an instructional starting concept, not a tested or production-ready template. No physical build, lifting capacity, load rating or performance has been verified. Dimensions, mounting locations and syringe travel are assumptions; actual syringe geometry, hinge alignment, tubing fit, structural stability, grip and reach must be checked and refined in a supervised physical build before classroom use.

The concept uses B1 base, two S1 supports, two A1 arm plates, fixed jaw J1, pivoted jaw J2 and six G1 spacer/tab pieces, plus scrap braces and a mounting bracket. P1 lifts the arm and P2 opens/closes the gripper. C1 connects hand controller H1 to actuator X1 at P1; C2 connects H2 to X2 at P2. The two water circuits are independent. There are no motors, electronics or autonomous movements. Diagrams are schematic, not to scale.

Use **needleless syringes and water only**. Check actual tubing fit; never assume compatibility from a nominal size. Adults handle craft knives, awls and hot glue; protect the work surface. Keep fingers clear, use a lightweight nonbreakable object, and stop for leaks, detached tubing, tears or jams. Never force a jam or pull plungers out. Piston area for calculations must come from measured bore diameter, not nominal syringe volume.

## Verification

The following were run in this environment:

```sh
npm test             # 6 tests passed
npm run typecheck    # passed
npm run lint         # passed
npm run build        # passed
npm audit --omit=dev # 0 vulnerabilities
```

A browser walkthrough entered a Grade 8 context, checked materials, marked a step, asked the scripted tutor about air bubbles, entered **example UI-only** challenge data and an observation, then reloaded and confirmed restoration. This was not a physical build or a measurement. `npm audit` also reported eight moderate advisories in the development-only ESLint/TypeScript-ESLint minimatch dependency chain; no production dependency advisory was reported. Review dependency updates before deployment.

## Limitations

- One reference project and an OpenAI-compatible provider adapter are included. AI output can be inaccurate and must be checked against the guide and adult supervision; no live provider was verified here.
- Scripted demo has a small set of matching responses and does not understand arbitrary questions. A future-project suggestion is stored locally, not submitted.
- Guide schema and cross-reference tests check data integrity, not physical feasibility. In particular actuator mount geometry, travel, secure joints, stability and gripper performance require physical validation.
- No accounts, synchronization, server-side persistence or multi-user collaboration are provided.