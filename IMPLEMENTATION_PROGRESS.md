# AI Strategy Workshop implementation progress

## Current status

- Phase 0: complete. Baseline defects and invalid types/imports were corrected.
- Phase 1: complete. Shared schema, stable IDs, pure scoring, migration, and local persistence are implemented.
- Phase 2: complete. Strategic weighting with allocation validation is connected to impact scoring.
- Phase 3: complete. Function mapping, problems, many-to-many links, coverage, and optional process modeling are implemented.
- Phase 4: complete. Strategic-priority-weighted impact, readiness-weighted feasibility, integrated risk, radar comparisons, and rankings are implemented.
- Phase 5: complete. Calculated positions, pointer dragging, manual resets, capability gaps, automatic matrix-derived horizons, and readiness bottleneck analysis are implemented.
- Phase 6: complete for automated validation and documentation. Browser UI automation was unavailable in the execution environment.

## UX refinement pass

- Added two explicit subsections inside every main stage.
- Replaced the long organizational form with a connected Function → Problem → Process mapping board.
- Reworked strategic weighting into direct numeric allocation controls with a live 100-point total and clear under/over-allocation warnings.
- Replaced decorative gradients and saturated panel fills with a restrained warm-stone foundation and muted semantic accents.
- Removed the legacy blocker workflow and replaced the single risk dropdown with a structured eight-factor risk assessment that adjusts impact only.
- Made roadmap assignment automatic from the current matrix position, including manual matrix overrides; removed defer/not-pursuing controls and separate horizon selection.
- Added ranked department feasibility constraints with current achievable impact, improved achievable impact, and summed untapped portfolio impact.

## Warm-neutral simplification pass

- Removed starter strategy profiles and the downstream explanation panel.
- Replaced strategic-priority sliders with five direct numeric inputs. Participants can type any combination; the interface clearly warns above or below 100%, and adjusted impact is calculated when the total is exactly 100%.
- Replaced the separate function/problem/process mapper with direct problem, process, affected-people, and importance fields on every use case.
- Added a disclosed 1–5 problem-importance adjustment ranging from −5% to +5%.
- Removed evidence, confidence, and per-use-case organizational-readiness-context controls.
- Separated raw impact (simple mean) from adjusted impact (strategic weights, problem importance, and risk).
- Rewrote readiness bottleneck insights as full, direct scenario explanations using summed portfolio impact points.
- New projects and newly added solutions use neutral midpoint defaults; the later neutral-defaults pass adds two editable examples to new projects.
- Adopted warm stone backgrounds, muted organic accents, restrained icon use, and the existing UAE flag favicon as the application logo.

## Risk and portfolio-value clarification

- Expanded the use-case solution field to a paragraph-sized description and removed definition fields from the evaluation subsection.
- Replaced categorical problem importance with a 1–5 scale; its impact adjustment ranges from −5% to +5%.
- Added eight Low/Medium/High risk considerations covering privacy, cybersecurity, reliability, misalignment, fairness, compliance, safety/oversight, and operational/reputational risk.
- The average risk assessment now reduces adjusted impact by 0–1.5 points and does not reduce feasibility.
- Replaced the readiness percentage explanation with summed portfolio impact points: current achievable impact, improved achievable impact, and the untapped difference across all high-impact use cases.

## Navigation and agentic-language pass

- Reframed solution definition, feasibility criteria, and the eight risk considerations around agentic solutions, connected tools, permissions, actions, escalation, and human oversight.
- Made the complete three-stage pathway prominent and added Previous/Next controls across all six activities.
- Removed risk-completion and allocation-completion navigation locks. All three stages remain accessible; incomplete risk simply applies no aggregate penalty, while invalid strategic totals show adjusted impact as unavailable.
- Made the full problem-importance adjustment explicit: 1/5 = −5%, 2/5 = −2.5%, 3/5 = no change, 4/5 = +2.5%, and 5/5 = +5%.

## Neutral defaults and visual hierarchy pass

- New projects now include two editable example agents instead of opening empty.
- All new evaluations begin at a neutral midpoint: readiness and problem importance at 3/5, impact and feasibility at 5/10, and all eight risk factors at Medium.
- Removed reusability from the active schema, evaluation interface, matrix details, and roadmap because it did not affect scoring. Imported legacy values remain available in migration metadata.
- Added stage-specific ochre, sage, and blue color families, increased page and control spacing, and replaced repetitive card styling with stronger bands, borders, and section hierarchy.
- Softened those families into lighter pastel surfaces and removed the dark pathway treatment so color remains a subtle navigation aid.
- Added the numeric overall risk score and risk band to the prioritization side list, selected-solution summary, and every roadmap initiative card.

## Feasibility model refinement

- Replaced Operating Model Readiness with Process Readiness, focused on workflow structure, rules, exceptions, decisions, and human intervention.
- Replaced System & Workflow Integration with Systems Integration, focused on APIs, enterprise compatibility, permissions, infrastructure, and third-party dependencies.
- Changed readiness adjustment from a linear moderator to a bounded nonlinear compound formula. Weak supporting readiness now penalizes an already-low use-case metric disproportionately, allowing readiness constraints to change relative portfolio rankings rather than acting like a uniform discount.

## Navigation and motion refinement

- Renamed the product to AI Strategy Workshop and increased the product, stage, and activity heading hierarchy.
- Moved the three-stage pathway and current-stage activities into a persistent vertical left navigation rail; removed the redundant bottom activity counter and Previous/Next controls.
- Removed decorative title containers and reduced introductory copy so static headings read as content rather than controls.
- Replaced small scoring-guide disclosure buttons with whole-card expansion using smooth height, opacity, hover, and stage-entry transitions, including reduced-motion support.
- Standardized every impact and feasibility card on the same scoring-guidance structure; removed the additional Process Readiness and Systems Integration instruction lists.

## Ministry workshop example

- Added a complete importable Ministry of Tourism and Cultural Heritage strategy with four orthogonal, fully assessed agentic use cases, 5/5 People & Skills readiness, strategic weights totaling 100%, linked organizational problems, all impact and feasibility ratings, and all eight risk considerations.
- Rebalanced the example for an honest portfolio rather than an optimistic cluster. Production scoring places exactly one use case in each impact–feasibility quadrant: Multilingual City Companion (top-right), Tourism Licensing and Inspection (top-left), Approved Event Content Publishing (bottom-right), and Heritage Site Conservation Digital Twin (bottom-left).

## Decisions

- Keep the existing three top-level workshop steps.
- Use one versioned `StrategyProject` model owned by the main application component.
- Use stable string IDs for functions, problems, and use cases.
- Store only manual matrix overrides; derive calculated positions from scores.
- Derive roadmap horizons from matrix coordinates so roadmap and prioritization cannot diverge.
- Moderate each feasibility dimension with a transparent mapping to related department readiness dimensions.
- Keep legacy portfolio/risk fields in the versioned project schema for backward-compatible imports, but do not expose superseded blocker/status controls.
- Preserve legacy numerical risk scores as migration metadata rather than inferring compliance or safety.

## Files modified

- `ai-spider-charts/src/AISpiderCharts.tsx`
- `ai-spider-charts/src/ImpactFeasibility.tsx`
- `ai-spider-charts/src/Scoring_Readiness.tsx`
- `ai-spider-charts/src/types/strategy.ts`
- `ai-spider-charts/src/lib/scoring.ts`
- `ai-spider-charts/src/lib/project.ts`
- `ai-spider-charts/src/features/strategy/StrategicWeights.tsx`
- `ai-spider-charts/src/features/discovery/OrganizationMap.tsx`
- `ai-spider-charts/tests/core.test.mjs`
- `ai-spider-charts/README.md`

## Validation

- `npm run typecheck` passes.
- `npm test` passes: 16/16 tests.
- `npm run build` passes (Vite 7.1.4).
- ESLint passes for changed application files; the pre-existing `button.tsx` fast-refresh error remains outside the changed surface.

## Known issues / next action

- Vite reports a non-blocking bundle-size warning for the existing chart/export dependency bundle.
- Perform final hands-on desktop and touch-device interaction checks when a browser surface is available.
