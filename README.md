# BuildLab

BuildLab is a bilingual (Vietnamese-first) learning workspace for building a **hydraulic cardboard robotic arm**. It combines a complete, versioned reference guide with a step-aware tutor. The guide works without AI.

## What is included

- Ten guided phases, from planning and construction through hydraulic testing, troubleshooting, and a pick-and-place reflection challenge.
- Structured reference content and stable IDs for parts (`B1`, `A1`, `P1`), steps, concepts, and hydraulic circuits (`C1`–`C3`) in `src/lib/guide.ts`.
- Schematic SVG diagrams for the assembly, cut list, pivots, water circuits, joint mapping, and actuator attachment.
- Student setup for grade/age, language, work mode, time, available materials/tools, teacher objectives, and adult help.
- Explicit step completion, observations, notes, materials checks, chat, test data, and reflections saved in browser local storage.
- Scripted, clearly labeled demo tutor when no provider key is configured; optional server-side OpenAI-compatible chat-completions provider.
- English and Vietnamese interface and project steps; Vietnamese is the default.
- Print-friendly guide and project report.

The model has **three manual movements**: shoulder raise/lower (C1), elbow bend/straighten (C2), and gripper open/close (C3). The gripper has one finger fixed to the forearm and one finger that pivots at P3 under C3 control. Its base does not rotate. It has no motors, electronics, or autonomous control.

## Local setup

Requirements: Node.js 22 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Leaving `TUTOR_API_KEY` blank keeps the scripted demo tutor enabled. The complete guide, diagrams, materials list, progress tracking, and report do not depend on AI.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `TUTOR_API_KEY` | Optional provider credential. Keep it in `.env.local` or the server environment; never put it in a `NEXT_PUBLIC_*` variable. |
| `TUTOR_API_URL` | Optional OpenAI-compatible chat-completions endpoint. Defaults to `https://api.openai.com/v1/chat/completions`. |
| `TUTOR_MODEL` | Optional provider model name. Defaults to `gpt-4o-mini`. |

The server tutor bounds question size, history, response length, and request time. AI-provider requests are also limited to 30 per rolling minute per Node server process; a `429` response includes `Retry-After`. This in-memory limit is a basic deployment safeguard, not a shared quota across multiple server instances. The tutor passes the selected step, design assumptions, relevant guide excerpts, student context, available materials, observations, and completed step IDs to the provider. Provider errors are shown without hiding the guide. Student content is treated as untrusted reference data; tutor replies render as text, not HTML. Demo mode only recognizes a few scripted question patterns and does not claim to understand arbitrary prompts.

## Verify

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Tests cover guide IDs and cross-references, the fixed/moving gripper design, three circuit mappings, explicit progress updates, corrupted/outdated local saves, demo labeling, bounded tutor requests, guide/context construction, and provider/server rate-limit handling.

## Reference design and safety

The project is labeled **“Prototype guide — physical build validation required.”** Dimensions and attachment distances are starting points, and diagrams are schematic, not to scale. The reference uses two corrugated-cardboard sheets (at least 40 × 30 cm each), six matching needleless 10 mL syringes, three snug-fitting water-filled tubing pieces, and three loose pivots. Syringe volume is not used to infer piston area; no lifting capacity or physical test result is claimed.

Use water only and needleless syringes. Protect the work surface, keep fingers clear of joints, and get adult help for craft knives, hole-making, and hot glue. Stop if tubing detaches, cardboard tears, the base tips, or a joint jams; do not force a syringe to overcome resistance. If tubing and syringe nozzle sizes do not fit securely, stop and find a compatible pair rather than silently substituting sizes. Corrugated packaging can replace the cardboard if doubled and pivot fit is rechecked; a short bolt with washers can replace split pins with adult help.

The reusable workspace/progress/tutor models live in `src/lib/models.ts` and `src/lib/progress.ts`; project-specific content is separate from the UI. Progress is stored only in this browser on this device. There is no account, cloud sync, teacher dashboard, or project marketplace. Before using the guide as a classroom build specification, physically validate its dimensions, fittings, link geometry, and safe operation with adult supervision.