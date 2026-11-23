# AI Strategy Studio — Implementation Specification

## 0. Your Role and Working Principles

You are a senior full-stack engineer and product-minded frontend developer working on an existing React/TypeScript application called **AI Strategy Studio**.

Your assignment is to improve the application into a more rigorous, engaging, and coherent AI strategy workshop tool.

**This is an improvement to an existing application, NOT a complete redesign or rewrite.**

Read this specification carefully before changing code.

### Core objective

The tool should help government departments and other organizations:

1. Assess their organizational readiness for AI.
2. Identify a diverse set of organizational problems and potential AI use cases.
3. Evaluate the impact and feasibility of those opportunities using structured criteria.
4. Prioritize initiatives and organize them into a practical three-horizon strategy.

We want to improve the **quality of strategic thinking**, not simply introduce more questionnaires or visualizations.

The application should remain intuitive for nontechnical participants in a facilitated workshop.

### Non-negotiable constraints

1. **Preserve the existing three-step structure.** Do not turn the application into a new five-, six-, or ten-step process.
2. Preserve all existing functionality unless explicitly superseded by this specification.
3. Retain the existing spider/radar visualizations, readiness assessment, impact–feasibility chart, and three-horizon roadmap.
4. Keep the application lightweight and client-side. Do not introduce a backend, authentication, database, or external AI API.
5. Maintain compatibility with the existing GitHub Pages deployment.
6. Do not change the meaning of existing readiness scores or corrupt previously exported projects.
7. Make functionality accessible through clear labels, instructions, and contextual explanations.
8. Keep the workshop efficient. New activities should encourage good thinking without forcing users to complete unnecessary forms.
9. Prefer modifications to existing components and targeted extraction of reusable logic over wholesale architectural changes.
10. Do not introduce unrelated features, additional application stages, or large visual redesigns.

### Engineering expectations

- TypeScript must pass type checking.
- The production build must succeed.
- Existing functionality must remain operational.
- State should remain consistent across stages.
- All data must survive project JSON export/import.
- Reloading the browser should not silently discard work.
- Handle incomplete user input gracefully.
- Do not leave placeholder functionality, broken buttons, or mock interactions in the final application.
- Do not silently replace users' manually entered information.

---

# 1. Understand the Existing Application

## Repository structure

The React application lives in:

`AI_Strategy/ai-spider-charts/`

Important files:

| File | Responsibility |
|---|---|
| `src/Scoring_Readiness.tsx` | Main application, readiness assessment, shared state, navigation, project import/export |
| `src/AISpiderCharts.tsx` | AI use-case scoring, spider charts, ranking |
| `src/ImpactFeasibility.tsx` | Interactive prioritization matrix and three-horizon roadmap |
| `src/App.tsx` | Application entry component |
| `src/index.css` | Global styles and Tailwind configuration |
| `src/components/ui/` | Existing shadcn-style UI components |
| `vite.config.ts` | Vite configuration, including GitHub Pages base URL |
| `.github/workflows/deploy.yml` | GitHub Pages deployment |

The application currently has three stages:

### Step 1 — Department Readiness Self-Assessment

Users score eleven organizational readiness dimensions on a 1–5 scale.

The application calculates an overall readiness score and displays a breakdown.

### Step 2 — AI Use Case Ideation and Evaluation

Users create use cases, describe them, and score them against ten criteria on a 1–10 scale.

The application displays:

- Per-use-case radar charts.
- A combined comparison radar chart.
- Average scores and rankings.
- PNG chart exports.

### Step 3 — AI Use Case Prioritization

Users manually position use cases on an impact–feasibility matrix.

The application groups high-impact use cases into three strategic horizons based on feasibility.

It also supports project JSON import/export.

### Preserve this narrative

The user experience must remain:

**Step 1: Understand organizational readiness and priorities**

↓

**Step 2: Discover problems, define AI opportunities, and evaluate them**

↓

**Step 3: Prioritize initiatives and construct a strategic roadmap**

Do not alter this conceptual structure.

---

# 2. Implementation Scope and Order

Implement the following improvements.

## Required features

### Step 1

- Preserve the existing eleven-dimensional readiness assessment.
- Add strategic outcome weighting.
- Allow users to distribute 100 percentage points across five impact objectives.
- Persist the weights and use them in subsequent scoring.

### Step 2

- Add organizational function mapping.
- Add problem identification within functions.
- Support optional process modeling for individual problems.
- Allow problems to link to one or more AI use cases.
- Preserve the ability to create use cases directly without first defining a problem.
- Revise the use-case evaluation criteria.
- Introduce weighted impact scoring.
- Introduce distinct feasibility scoring.
- Separate risk and reusability from feasibility.
- Introduce lightweight optional evidence/confidence annotations.
- Preserve and improve the existing radar charts.

### Step 3

- Automatically derive initial impact–feasibility positions from Step 2 scores.
- Preserve manual repositioning.
- Clearly distinguish calculated positions from manually adjusted positions.
- Introduce lightweight capability-gap indicators.
- Improve three-horizon assignment logic.
- Allow use cases to be prioritized, deferred, or excluded.
- Preserve the existing interactive matrix and roadmap.

### Cross-cutting requirements

- Reliable state management.
- Persistent browser storage.
- Complete project export/import.
- Backward compatibility with existing project data.
- Responsive interface.
- Clear visual continuity across all three stages.
- Working local build and GitHub Pages deployment.

## Explicitly out of scope

Do NOT implement:

- AI chatbot or strategy copilot.
- External LLM integration.
- User accounts.
- Multi-user collaboration.
- Live stakeholder voting.
- Backend services.
- Automatic internet research.
- Complex portfolio optimization.
- Investment budget simulation.
- Complex dependency graphs.
- New strategy stages.
- Automated recommendation engines that invent AI use cases.
- A complete visual redesign.
- Heavy workflow automation.
- External integrations requiring API keys.

These can be considered for future versions.

---

# 3. First: Fix Existing Technical Problems

Before implementing new functionality, inspect the current source code and resolve existing compilation and functionality problems.

Known issues include the following.

## 3.1 Incorrect component typing

In `AISpiderCharts.tsx`, remove the invalid `ß` from the component prop type.

Ensure the component accepts correctly typed `useCases` and `setUseCases` props.

## 3.2 Missing component imports

`AISpiderCharts.tsx` imports `Checkbox`, but no corresponding component exists in the provided directory structure.

Remove unused imports or properly implement required components.

## 3.3 Incorrect navigation type

In `Scoring_Readiness.tsx`, the `step` state type currently excludes `"prioritization"` even though the application uses it.

Correct the type:

```typescript
type WorkshopStep =
  | "readiness"
  | "scoring"
  | "prioritization";
```

## 3.4 Conditional hook invocation

A `useEffect` currently runs conditionally when the URL contains `?mode=demo`.

This violates React's Rules of Hooks.

Move the condition inside an unconditional effect, or initialize the appropriate state from the URL mode.

Demo mode should initialize data once, without repeatedly resetting user edits.

## 3.5 Broken project import behavior

The existing project importer expects exactly eight use cases and silently discards some scoring dimensions.

It also fails to preserve:

- Revenue impact.
- Strategic impact.
- Use cases beyond eight.
- Some other user-entered information.

Replace this logic with schema-aware import validation and migration.

See Section 10.

## 3.6 Incorrect score randomization

The current randomizer produces numbers outside the allowed 1–10 range.

Correct or remove the feature.

## 3.7 Duplicate radar chart keys

The comparison chart uses use-case names as data keys.

Duplicate names can cause collisions.

Use stable use-case IDs or unique internal keys.

## 3.8 Dragging behavior

The impact–feasibility chart currently coordinates dragging using React state and mouse/touch listeners.

Improve the implementation using pointer events and stable references.

Ensure that dragging works reliably on desktop and touch devices.

## 3.9 Additional code quality problems

Resolve:

- Invalid or unused imports.
- Unused variables.
- TypeScript errors.
- Unsafe uses of `any`.
- Invalid Tailwind classes.
- Potential undefined values.
- Broken chart sizing.
- Invalid input handling.

Ensure all existing visualizations remain functional.

### Build commands

After fixing the baseline:

```bash
npm install
npm run build
```

Introduce a dedicated type-checking script if useful.

Do not begin large feature changes before establishing a working baseline.

---

# 4. Step 1: Strategic Outcome Weighting

## Objective

Make organizational strategic priorities explicit and use them to determine the relative importance of different forms of AI impact.

This should complement—not replace—the existing readiness assessment.

## Placement in the UI

Within Step 1, retain:

1. Existing readiness questionnaire.
2. Existing readiness summary.
3. Existing dimension breakdown.

Add a new section below the readiness assessment:

**Strategic Priorities**

Suggested description:

> Different organizations pursue AI for different reasons. Allocate 100 points across the outcomes that matter most to your department. These priorities will influence how AI use cases are evaluated later.

## Five dimensions

Use the same five impact dimensions already present in Step 2:

1. Increases Productivity
2. Reduces Costs
3. Benefits the Public
4. Increases Revenue
5. Strategic Alignment

Preserve the underlying scoring keys where practical.

However, make the displayed terminology consistent.

### Suggested weighting interface

Display five horizontal sliders or numeric inputs.

Each criterion has:

- Name.
- Short explanation.
- Current weight.
- Interactive slider.
- Optional anchor tooltip.

Example:

| Priority | Weight |
|---|---:|
| Productivity | 25% |
| Cost Reduction | 15% |
| Public Benefit | 35% |
| Revenue Generation | 5% |
| Strategic Alignment | 20% |
| TOTAL | 100% |

### Interaction requirements

The total allocation must equal 100 points for the weights to be considered valid.

Use one of these approaches:

**Preferred:** Allow participants to freely adjust individual weights while displaying the remaining unallocated points.

For example:

> 15 points remaining.

When allocation exceeds 100, show a clear warning and prevent the user from proceeding with invalid weights.

Alternatively, automatically constrain the modified slider to the remaining available allocation.

Do not unexpectedly modify other weights.

The default values should be equal:

```typescript
const defaultImpactWeights = {
  increasesProductivity: 20,
  reducesCosts: 20,
  benefitsPublic: 20,
  increaseRevenue: 20,
  strategicImpact: 20,
};
```

### Visual design

Keep the interface simple.

Suggested layout:

- Card containing the five sliders.
- Small horizontal stacked bar showing weight distribution.
- Total allocation indicator.
- Reset to Equal Weights button.

Use colors consistent with the existing application.

Avoid excessive animations.

### Scoring mathematics

Let the five impact scores for use case \(u\) be:

\[
I_u=(I_{u,1},\ldots,I_{u,5})
\]

with each criterion scored between 1 and 10.

Let the strategic weights be \(w_i\), where:

\[
\sum_{i=1}^{5}w_i=1.
\]

Calculate:

\[
\boxed{
\operatorname{Impact}(u)=
\sum_{i=1}^{5}w_iI_{u,i}
}
\]

If weights are stored as percentages, divide by 100.

The result must remain on the 1–10 scale.

Do not round the underlying score prematurely.

Display one or two decimal places.

### Important

Changing strategic weights must update:

- Weighted impact scores.
- Use-case impact rankings.
- Automatically calculated matrix positions.
- Any other derived impact visualizations.

It must NOT erase or overwrite the underlying criterion scores.

### Invalid weights

If the weights do not sum to 100:

- Show a clear validation message.
- Do not calculate misleading normalized scores.
- Do not silently renormalize.
- Preserve the last valid values for calculations or prevent navigation until the allocation is corrected.

Choose a predictable interaction pattern and use it consistently.

---

# 5. Step 2A: Organizational Function Mapping

## Objective

Encourage participants to identify problems across a diverse range of organizational responsibilities before proposing AI solutions.

Avoid assuming that every department has a single linear workflow.

An organization may have multiple functions, each with different processes.

## Conceptual hierarchy

Use the following structure:

```text
Organization / Department
│
├── Function A
│   ├── Problem 1
│   ├── Problem 2
│   └── Problem 3
│
├── Function B
│   ├── Problem 4
│   └── Problem 5
│
└── Function C
    ├── Problem 6
    └── Problem 7
```

A function represents a major organizational responsibility or service area.

A problem represents a specific challenge, inefficiency, unmet need, or missed opportunity.

Processes can optionally be associated with problems but should not be mandatory.

## Placement

At the beginning of Step 2, before the existing use-case scoring interface.

Use a subsection heading:

**Identify Organizational Problems**

Suggested instructions:

> Start by identifying the main responsibilities of your department. Then consider where challenges, inefficiencies, service gaps, or missed opportunities exist across these functions. Focus on the problems before deciding how AI might help.

## Function creation

Allow users to:

- Add a function.
- Rename a function.
- Add an optional short description.
- Delete a function, subject to explicit confirmation when it contains linked information.
- Reorder functions if straightforward.

Do not force users to use predefined categories.

Provide optional examples appropriate for government departments:

- Public Service Delivery
- Policy and Strategy
- Regulatory Oversight
- Operations
- Data and Analytics
- Infrastructure and Assets
- Communications and Engagement
- Internal Administration

These should be examples, not fixed categories.

Consider a lightweight template selection or suggested functions, but it must remain optional.

## Function visualizations

Display functions as cards arranged in a responsive grid.

Each card should contain:

- Function name.
- Optional description.
- Number of identified problems.
- Number of linked AI use cases.
- Add Problem button.
- Expand/collapse functionality.

Maintain a clean and compact interface.

## Organizational Coverage Overview

Add a small coverage summary.

For example:

```text
Organizational Coverage

Tourism Development       4 Problems
Cultural Heritage         3 Problems
Public Services           5 Problems
Policy & Strategy         0 Problems
Internal Operations       2 Problems
```

Consider horizontal bars or simple colored indicators.

The purpose is to highlight potentially overlooked functions.

Do not frame equal distribution as a goal.

If a function has no identified problems, optionally show:

> No problems identified in this function yet.

Do not automatically assume this is a strategic weakness.

## Diversity of ideation

The UI should encourage broad exploration before participants narrow down to their final set of AI use cases.

Do not cap the number of problems at eight.

Do not cap the number of functions at eight.

Practical UI performance should be considered, but avoid arbitrary limits unless justified.

---

# 6. Step 2B: Problem Identification

## Objective

Create a lightweight, structured representation of important organizational problems.

Avoid turning this into a detailed business process modeling application.

## Problem data model

Each problem should contain:

```typescript
type OrganizationalProblem = {
  id: string;

  functionId: string | null;

  title: string;
  description: string;

  affectedStakeholders: string;

  importance: "low" | "medium" | "high" | null;

  process?: {
    name: string;
    steps: ProcessStep[];
  };

  linkedUseCaseIds: string[];
};
```

The exact implementation can differ, but preserve these concepts.

Use stable string IDs.

Do not use array positions as identifiers.

## Required user inputs

A problem card should ask:

**What is the problem?**

Short title.

**Why does this problem matter?**

Short free-text description.

**Who is affected?**

Optional free-text input.

**How important is this problem?**

Optional Low / Medium / High selection.

**Which organizational function does it belong to?**

Select from the functions defined earlier.

Avoid adding too many mandatory fields.

The minimum required information should be a problem title and valid function association.

## Interaction

Participants can:

- Add problems.
- Edit problems.
- Delete problems.
- Move problems between functions.
- Expand/collapse details.
- Link problems to AI use cases.
- Create a new AI use case from an identified problem.

## Creating AI use cases from problems

Add a button:

**Explore AI Solution**

or:

**Create AI Use Case**

Clicking it should create a use case linked to the selected problem.

The use case should initially contain:

- Default editable name.
- Empty solution description.
- Link to its originating problem.
- Default scoring values.

Do not automatically generate a solution name or technical approach using AI.

Participants should make the strategic decision themselves.

### Many-to-many relationships

Allow:

- One problem to have multiple proposed AI use cases.
- One AI use case to address multiple problems.

Do not impose a one-to-one relationship.

This matters because organizations may compare different solutions to one problem or propose a shared solution addressing several problems.

## Preserve direct use-case creation

Users must still be able to create an AI use case without first creating or linking a problem.

For example, some participants may have an existing AI initiative they want to evaluate.

Provide a clear option:

**Add Use Case Directly**

However, for unlinked use cases, show a subtle reminder:

> Consider linking this opportunity to an organizational problem or strategic need.

This should not block progress.

---

# 7. Step 2C: Optional Process Modeling

## Objective

Allow users to examine the operational workflow associated with an important problem.

This must remain optional.

Do not require detailed workflow mapping for every problem.

## Concept

A department may have multiple functions, each containing multiple processes.

A process is a sequence of operational activities, not a universal set of organizational stages.

Example:

```text
Function: Regulatory Services

Process: License Approval

Application Received
        ↓
Document Review
        ↓
Eligibility Verification
        ↓
Decision
        ↓
Notification
```

## Interaction

Within an expanded problem card, add:

**Map Process (Optional)**

Users can define:

- Process name.
- Ordered list of steps.
- Optional bottleneck notes for each step.

Start with a simple list-based editor.

Allow participants to:

- Add steps.
- Rename steps.
- Delete steps.
- Reorder steps.
- Mark steps as bottlenecks.

### Visualization

Render the steps as a compact horizontal or vertical process flow using connected cards.

Example:

```text
[Receive]
    ↓
[Review Documents] ⚠
    ↓
[Verify]
    ↓
[Decide]
    ↓
[Notify]
```

Use a simple responsive design.

Do not introduce BPMN, complex process editors, edge-routing libraries, or detailed workflow simulation.

### Important

Process modeling is a supporting activity.

The main objective remains identifying diverse organizational problems and AI opportunities.

It must not dominate Step 2.

---

# 8. Step 2D: Revise the Use-Case Evaluation Model

## Objective

Improve the conceptual validity of the existing scoring system without changing the overall radar-chart-based workflow.

Currently, the system mixes impact, feasibility, risk, and reusability into one average score.

Replace that structure with:

1. Impact.
2. Feasibility.
3. Risk.
4. Reusability.

Impact and feasibility remain numerical scores.

Risk and reusability remain visible, but separate from the main feasibility calculation.

## Impact dimensions

Preserve the five existing criteria:

| Key | Label |
|---|---|
| `increasesProductivity` | Increases Productivity |
| `reducesCosts` | Reduces Costs |
| `benefitsPublic` | Benefits the Public |
| `increaseRevenue` | Increases Revenue |
| `strategicImpact` | Strategic Alignment |

Scores remain 1–10.

Use the weights defined in Step 1.

Calculate:

\[
\operatorname{Impact}(u)=
\sum_i w_iI_{u,i}
\]

Use the same scoring function everywhere.

Do not duplicate this calculation across components.

## Feasibility dimensions

Replace the existing feasibility criteria with:

| Key | Label |
|---|---|
| `dataReady` | Data Readiness |
| `techMature` | Technology Maturity |
| `organizationalReadiness` | Organizational Readiness |
| `implementationEase` | Implementation Ease |
| `integrationEase` | Integration Ease |

All scores must have the same orientation:

**1 = Low feasibility / difficult**

**10 = High feasibility / easy**

### Detailed definitions

**Data Readiness**

1: Required data is largely unavailable, inaccessible, or unsuitable.

5: Some relevant data exists but requires meaningful preparation.

10: Suitable, accessible, high-quality data is available.

**Technology Maturity**

1: Required technology is experimental or cannot reliably meet the task requirements.

5: Relevant technology exists but needs significant validation or adaptation.

10: Mature technology can reliably perform the required task.

**Organizational Readiness**

1: Required skills, operational ownership, governance, or workflows are largely absent.

5: Some capabilities exist but meaningful changes are required.

10: The organization has strong capabilities to implement and operate the solution.

**Implementation Ease**

1: Implementation requires substantial resources, time, or specialized development.

5: Moderate implementation effort.

10: Implementation is relatively straightforward and resource-efficient.

**Integration Ease**

1: Major integration difficulties with systems or workflows.

5: Some integration work is necessary.

10: Integration into existing systems and workflows is straightforward.

### Feasibility equation

Initially use equal weights:

\[
\boxed{
\operatorname{Feasibility}(u)=
\frac{1}{5}
\sum_{j=1}^{5}F_{u,j}
}
\]

Scores remain on the 1–10 scale.

Keep feasibility weights fixed for this iteration.

Do not expose another weighting questionnaire.

## Risk assessment

Separate risk from feasibility.

Replace the existing `noRisk` scoring dimension with a simple risk assessment.

Suggested model:

```typescript
type RiskAssessment = {
  level: "low" | "medium" | "high" | "unknown";

  concerns: string[];

  mitigationNotes: string;

  blockingIssue: boolean;
};
```

Use categories such as:

- Privacy and data protection.
- Legal or regulatory compliance.
- Safety.
- Bias and fairness.
- Reliability.
- Reputational risk.
- Operational risk.

### Interface

Show:

**Risk Level**

Low / Medium / High / Unknown.

**Relevant Risks**

Optional selectable categories.

**Mitigation Notes**

Optional short text.

**Blocking Concern**

Checkbox:

> Is there an unresolved issue that currently prevents implementation?

Do not calculate risk as a negative contribution to a general weighted average.

High-risk or blocked projects should be clearly marked in prioritization.

Do not automatically declare a project safe or compliant based on questionnaire answers.

## Reusability

Preserve the existing `reusable` concept.

Keep a 1–10 score with clear anchors.

Display it separately as:

**Reusability / Cross-Department Potential**

This measures whether the solution or its underlying components could be reused across multiple processes or functions.

Do not include reusability directly in the core feasibility score.

### Why

A project can be technically feasible and valuable even if it is highly specialized.

Reusability is a portfolio consideration, not intrinsic implementation feasibility.

---

# 9. Step 2E: Improve Scoring Visualizations

## Preserve the radar charts

Retain:

- Individual use-case radar charts.
- Comparison radar chart.
- Visibility toggles.
- PNG export functionality.
- Rankings.

However, update the visualization to reflect the revised scoring model.

## Recommended design

Create three distinct visual sections.

### A. Impact Radar Chart

Five axes:

- Productivity
- Cost Reduction
- Public Benefit
- Revenue
- Strategic Alignment

Show weighted impact as a separate numerical summary.

The radar geometry should display the raw criterion scores rather than modifying axis values according to the weights.

This distinction matters: strategic weights affect the aggregate impact score, not the underlying ratings.

### B. Feasibility Radar Chart

Five axes:

- Data Readiness
- Technology Maturity
- Organizational Readiness
- Implementation Ease
- Integration Ease

Show aggregate feasibility separately.

### C. Comparison

Provide a simple switch:

**Compare Impact | Compare Feasibility**

The selected view determines which five dimensions are shown on the comparison radar.

Preserve per-use-case colors and visibility toggles.

This should reduce visual clutter compared with overlaying ten dimensions simultaneously.

## Ranking

Replace the current single average ranking with two clear rankings:

**Highest Impact**

Rank by weighted impact score.

**Highest Feasibility**

Rank by feasibility score.

A compact combined table is also acceptable:

| Use Case | Impact | Feasibility | Risk |
|---|---:|---:|---|
| Use Case A | 8.7 | 6.1 | Medium |
| Use Case B | 7.5 | 9.0 | Low |

Do not invent a single composite score unless there is a clear strategic reason to do so.

The prioritization matrix already provides a natural two-dimensional comparison.

## Scoring tooltips

Every criterion must have short descriptions for:

- 1
- 5
- 10

Ensure descriptions match the actual meaning of the criterion.

Some current descriptions are inconsistent with score direction.

Correct them.

## Confidence annotations

Add a lightweight optional confidence field for impact and feasibility.

Suggested values:

- Low confidence.
- Medium confidence.
- High confidence.

Participants should be able to indicate whether their assessment is supported by evidence.

Example:

```typescript
type EvaluationConfidence = {
  impact: "low" | "medium" | "high" | "unknown";
  feasibility: "low" | "medium" | "high" | "unknown";

  evidenceNotes: string;
};
```

Do not use confidence to automatically modify impact or feasibility scores.

Simply display it as contextual information.

For example:

> Impact: 8.5 / 10 — Low confidence.

### Why

The tool should distinguish subjective expectations from evidence-supported assessments.

Keep this feature small and optional.

---

# 10. Connect Department Readiness to Use-Case Feasibility

## Objective

Make Step 1 inform Step 2 without forcing invalid mathematical relationships.

Organizational readiness is relevant to feasibility, but it is not identical to feasibility.

For example, an organization with limited internal AI capabilities may still deploy a mature commercial AI product through a suitable external partner.

Therefore:

**Do not multiply feasibility scores directly by the overall departmental readiness score.**

Instead, use readiness information to provide contextual warnings.

## Suggested implementation

When a participant evaluates a use case, show a compact:

**Organizational Readiness Context**

For example:

```text
Organizational Readiness Context

Data Maturity: 2/5
People & Skills: 3/5
Technology Infrastructure: 4/5
Governance: 2/5

Consider whether these capabilities are sufficient
for the proposed implementation approach.
```

Show the relevant readiness dimensions from Step 1.

For this version, use simple predetermined mappings rather than an elaborate requirements engine.

### Optional capability requirements

Allow users to select which organizational capabilities are particularly important for a use case.

For example:

```typescript
requiredCapabilities: [
  "dataMaturity",
  "peopleSkills",
  "techInfra",
  "governanceRisk"
]
```

For each selected capability, optionally collect required maturity on the same 1–5 scale as Step 1.

Then define:

\[
G_{u,k}=\max(0,R_{u,k}-C_k)
\]

Where:

- \(R_{u,k}\): Required capability maturity.
- \(C_k\): Current department maturity.
- \(G_{u,k}\): Capability gap.

A requirement must be explicitly provided by the participant to calculate a numerical gap.

Do not invent requirements.

If required maturity is unknown, simply display the organization's existing readiness score.

### Visual design

Use a small expandable panel or compact capability summary.

Avoid introducing another large scoring questionnaire.

### Important

Capability gaps should:

- Help users understand potential blockers.
- Inform feasibility discussions.
- Appear as context in Step 3.

They should NOT automatically override the participant's feasibility assessment.

---

# 11. Step 3A: Automatically Initialize Impact–Feasibility Placements

## Objective

Make the prioritization chart a direct consequence of the evaluations completed in Step 2.

Currently, users position use cases manually without a formal connection to previous scores.

Change this.

## Coordinate mapping

For use case \(u\):

\[
x_u=\frac{\operatorname{Feasibility}(u)-1}{9}
\]

\[
y_u=\frac{\operatorname{Impact}(u)-1}{9}
\]

Where:

- X-axis represents feasibility.
- Y-axis represents impact.
- Both coordinates are normalized to 0–1.

This maps score 1 to coordinate 0 and score 10 to coordinate 1.

## Initial behavior

When a use case has not been manually repositioned:

- Calculate its position automatically.
- Display it at that calculated position.

The chart should update automatically when scores or strategic weights change.

## Manual adjustment

Users must still be able to drag use-case tokens.

When a participant drags a token:

- Store its position as a manual override.
- Preserve the manually chosen position.
- Do not overwrite it automatically when scores change.

However, clearly indicate that the position has been adjusted.

For example:

> Manually adjusted from calculated position.

Provide a button:

**Reset to Calculated Position**

This removes the manual override and restores the score-derived coordinates.

Optionally provide:

**Reset All Positions**

Require confirmation if this would discard multiple manual placements.

## Data model

Represent manual overrides separately from calculated positions.

For example:

```typescript
type ManualPlacement = {
  x: number;
  y: number;
  manuallyAdjusted: true;
};
```

The calculated position should be derived from scores.

Do not store duplicate derived state unnecessarily.

## Important behavior

If strategic weights change:

- Automatically positioned use cases move accordingly.
- Manually positioned use cases remain where participants placed them.
- Users can reset any manual position.

If a use case is deleted, remove any associated placement override.

If a use case is added, calculate its initial position automatically.

## Visual design

Retain your existing impact–feasibility matrix and colored tokens.

Improve:

- Axis labels.
- Responsiveness.
- Draggable token accessibility.
- Tooltip clarity.
- Position visibility.
- Mobile interaction.

Avoid major visual redesigns.

### Optional visual improvement

When Step 3 first opens, use a subtle animation showing use-case tokens appearing at their calculated positions.

Do not make the animation essential to understanding the chart.

Respect reduced-motion preferences.

---

# 12. Step 3B: Improve the Prioritization Matrix

## Preserve the core visualization

The impact–feasibility matrix remains the central visualization in Step 3.

Use these interpretations:

| Region | Meaning |
|---|---|
| High Impact / High Feasibility | Strong immediate candidates |
| High Impact / Low Feasibility | Potential strategic investments requiring preparation |
| Low Impact / High Feasibility | Possible quick wins, but limited strategic value |
| Low Impact / Low Feasibility | Generally weak candidates |

These are decision-support categories, not automatic investment instructions.

## Improve token interaction

Users should be able to:

- Drag a token.
- Hover for details.
- Click to inspect its use case.
- Reset an adjusted position.
- View impact and feasibility scores.
- View risk level.
- View capability gaps.

### Collision and overlap

Multiple use cases may have similar scores and positions.

Avoid having tokens become impossible to select.

Implement a simple display-level solution:

- Slightly offset overlapping tokens visually.
- Preserve the actual underlying coordinates.
- Provide a corresponding use-case list for selection.

Do not change scores or saved placements merely to avoid graphical overlap.

## Capability gap display

When a user selects a token, display a compact summary.

Example:

```text
Use Case: Heritage Preservation AI

Impact: 8.7
Feasibility: 4.3
Risk: Medium
Confidence: Low

Potential Capability Gaps:
- Data Maturity
- Technical Expertise

Suggested consideration:
Further validation may be needed before implementation.
```

Use neutral wording.

Do not generate definitive recommendations without sufficient evidence.

---

# 13. Step 3C: Refine the Three Horizons Roadmap

## Objective

Preserve the familiar three-horizon framework but avoid mechanically placing every idea into a horizon.

## Three horizons

Use the following labels.

### Horizon 1 — Deploy or Pilot Now

Initiatives that can realistically be pursued using currently available capabilities.

Examples:

- Mature technology.
- Accessible data.
- Manageable integration.
- Clear operational ownership.

### Horizon 2 — Build and Enable

Promising initiatives that require meaningful capability development or validation.

Examples:

- Data improvement.
- New workflows.
- Additional technical expertise.
- Organizational preparation.

### Horizon 3 — Explore and Prepare

Potentially transformative or strategically important initiatives requiring substantial investigation, experimentation, or capability development.

Examples:

- Immature technology.
- Significant uncertainty.
- Major infrastructure dependencies.
- Long-term organizational transformation.

## Important conceptual rule

These horizons are strategic implementation judgments.

They should NOT be determined exclusively by feasibility scores.

Low feasibility does not automatically mean Horizon 3.

A low-value, low-feasibility project may simply be unsuitable for investment.

## Portfolio status

Give each use case a status:

```typescript
type PortfolioStatus =
  | "prioritized"
  | "deferred"
  | "not_pursuing";
```

Default newly created use cases to `"deferred"` until explicitly prioritized.

Use cases marked `"not_pursuing"` should not appear in any horizon.

Deferred use cases remain visible in a separate section.

## Horizon assignment

For prioritized use cases, allow:

```typescript
type Horizon = 1 | 2 | 3;
```

Provide automatic suggestions only where useful.

Suggested heuristic:

- High-impact, high-feasibility: Horizon 1.
- High-impact, medium-feasibility: Horizon 2.
- High-impact, low-feasibility: Horizon 3.

However:

- Suggestions should not automatically commit projects to the roadmap.
- Users must explicitly prioritize projects.
- Users must be able to override suggested horizons.
- Low-impact projects should not automatically become Horizon 3.
- Projects with unresolved blocking risks should be visibly flagged and not recommended for immediate deployment.

For initial suggestions, use:

- Impact ≥ 6 as a high-impact threshold.
- Feasibility ≥ 7 for high feasibility.
- Feasibility ≥ 4 and < 7 for medium feasibility.
- Feasibility < 4 for low feasibility.

These thresholds are practical defaults, not scientific boundaries.

Keep the thresholds centralized in configuration.

Do not duplicate constants across components.

## Roadmap visualization

Preserve the existing three-column layout.

Improve each column to show:

- Horizon name.
- Short description.
- Selected initiatives.
- Risk indicator where applicable.
- Optional capability gaps.
- Number of initiatives.

Allow users to reassign initiatives between horizons using clear controls.

Drag-and-drop is optional if implementing it would substantially increase complexity.

A simple dropdown may be more reliable and intuitive.

## Deferred and excluded projects

Below the three horizons, include a compact section:

**Other Opportunities**

With two groups:

- Deferred.
- Not Pursuing.

Participants should be able to change project status.

Do not delete use cases simply because they were not prioritized.

---

# 14. State Management and Data Integrity

## Objective

Ensure all three stages operate on one consistent project model.

Do not maintain disconnected copies of information that should be shared.

## Recommended structure

Introduce shared TypeScript types for:

```typescript
type StrategyProject = {
  version: number;

  readinessScores: ReadinessScores;

  impactWeights: ImpactWeights;

  functions: OrganizationalFunction[];

  problems: OrganizationalProblem[];

  useCases: UseCase[];

  manualPlacements: Record<string, ManualPlacement>;

  portfolioDecisions: Record<string, PortfolioDecision>;
};
```

The exact structure may vary.

However, the following must remain consistent:

- Function IDs.
- Problem IDs.
- Use-case IDs.
- Problem-to-use-case links.
- Score data.
- Manual placements.
- Portfolio decisions.
- Strategic weights.

Use stable string IDs.

## State-management approach

The existing application keeps shared state in `Scoring_Readiness.tsx`.

You may:

- Retain lifted state with well-defined update helpers, or
- Introduce a lightweight Zustand store if this materially simplifies implementation.

Do not introduce Redux or another heavyweight state-management system.

Keep derived scores in pure reusable functions.

Example:

```typescript
calculateImpactScore(...)
calculateFeasibilityScore(...)
calculateCalculatedPlacement(...)
getCapabilityGaps(...)
getSuggestedHorizon(...)
```

These functions should be independently testable.

---

# 15. Project Persistence and Compatibility

## Browser persistence

Implement automatic local persistence.

Requirements:

- Changes are saved locally.
- Refreshing the page restores the project.
- Returning to the tool restores the previous workshop state.
- Users can explicitly reset the project.
- Demo mode does not overwrite saved user work unexpectedly.

`localStorage` is sufficient for this version.

Handle storage errors gracefully.

Do not save continuously during every intermediate pointer movement if it would cause excessive writes.

## Export/import

Preserve the existing project JSON export/import functionality.

Update it to include all new information:

- Readiness scores.
- Strategic weights.
- Organizational functions.
- Problems.
- Process steps.
- Use-case associations.
- Use-case evaluations.
- Risk assessments.
- Reusability.
- Confidence annotations.
- Manual matrix placements.
- Portfolio status.
- Horizon assignments.

Use a versioned schema.

For example:

```typescript
{
  version: 2,
  exportedAt: "...",
  ...
}
```

## Backward compatibility

Existing version 1 JSON exports must remain importable where possible.

Implement a migration function.

Important requirements:

1. Preserve all existing use cases.
2. Preserve existing names and descriptions.
3. Preserve existing readiness values.
4. Preserve all existing impact criteria.
5. Preserve existing supported feasibility values.
6. Convert `lowImplementationCost` to the new `implementationEase` criterion without reversing its score direction.
7. Convert `noRisk` into a legacy risk assessment conservatively.
8. Preserve `reusable` separately.
9. Initialize new feasibility criteria with neutral defaults.
10. Initialize strategic weights equally.
11. Preserve legacy placements as manual placements.
12. Initialize new fields without corrupting existing data.

Do not infer detailed risk categories from a legacy numerical `noRisk` score.

Preserve the original value in migration metadata if necessary.

Use explicit migration code rather than loosely merging arbitrary objects.

### Import validation

Validate imported JSON before mutating application state.

If required fields are invalid:

- Show a meaningful error.
- Leave the existing project unchanged.

Avoid partially importing corrupted data.

Do not silently discard valid use cases because the array contains more or fewer than eight entries.

## Use-case count

The current application defaults to eight use cases and allows up to ten.

For this version:

- Preserve eight default use cases in demo mode.
- Do not require exactly eight use cases.
- Allow users to add or remove use cases.
- Support at least ten use cases.
- Prefer allowing more than ten if the UI remains usable.
- Ensure all visualizations support variable-length use-case arrays.

The user interface should not claim that exactly eight use cases are required.

---

# 16. UI and Visual Design Requirements

## Preserve the existing visual language

The application currently uses:

- Tailwind CSS.
- shadcn-style cards.
- Radix UI components.
- Recharts.
- Light backgrounds.
- Simple colored charts.

Retain this overall aesthetic.

The objective is a more professional and coherent experience, not a visual reinvention.

## Make the three-stage journey visible

Keep the existing navigation:

**Readiness → Use Case Evaluation → Prioritization**

Improve the progress indicator if useful.

The user should always know which stage they are in.

Within Step 2, introduce lightweight subsections:

1. Identify Problems.
2. Define AI Use Cases.
3. Evaluate Opportunities.

These are subsections, not new top-level stages.

A small internal navigation or accordion is acceptable.

Do not introduce a second complicated wizard.

## Avoid overwhelming participants

Use progressive disclosure:

- Show essential information initially.
- Hide advanced details behind expandable panels.
- Make process modeling optional.
- Make evidence notes optional.
- Keep risk inputs lightweight.
- Avoid giant forms.

## Improve current layout issues

The existing tabs have unusually large fixed heights.

Replace brittle fixed-height layouts with responsive wrapping or scrolling behavior.

Ensure:

- Labels do not overlap.
- Charts remain legible.
- Use-case names can wrap.
- The interface works on laptop screens.
- The application remains usable on mobile.
- Tooltips are readable and accessible.
- Controls have sufficient spacing.
- Buttons have clear labels.

## Color and semantics

Use consistent color conventions:

- Impact: warm accent.
- Feasibility: cool accent.
- Risk: amber/red indicators.
- Readiness: neutral or existing readiness color scale.

Do not rely on color alone.

Always include labels or accessible indicators.

## Chart export

Preserve existing PNG exports.

Ensure:

- Exported charts have readable labels.
- The background is correct.
- Text is not clipped.
- The selected data is accurate.
- Charts export reliably.

---

# 17. Suggested Component Organization

You may extract new components as needed.

Avoid a full repository rewrite.

A reasonable structure would be:

```text
src/
├── App.tsx
├── Scoring_Readiness.tsx
├── AISpiderCharts.tsx
├── ImpactFeasibility.tsx
│
├── features/
│   ├── strategy/
│   │   └── StrategicWeights.tsx
│   │
│   ├── discovery/
│   │   ├── OrganizationMap.tsx
│   │   ├── FunctionCard.tsx
│   │   ├── ProblemCard.tsx
│   │   └── ProcessFlow.tsx
│   │
│   ├── evaluation/
│   │   ├── RiskAssessment.tsx
│   │   ├── ConfidenceAssessment.tsx
│   │   └── CapabilityContext.tsx
│   │
│   └── prioritization/
│       ├── PrioritizationDetails.tsx
│       └── HorizonAssignment.tsx
│
├── lib/
│   ├── scoring.ts
│   ├── projectStorage.ts
│   ├── migrations.ts
│   └── prioritization.ts
│
├── types/
│   └── strategy.ts
│
└── components/
    └── ui/
```

This is a suggestion, not a mandatory architecture.

Keep components reasonably small and avoid unnecessary abstraction.

Do not reorganize unrelated files.

---

# 18. Testing Requirements

Add meaningful tests for the core logic.

If no test framework exists, introduce a lightweight TypeScript-compatible testing setup such as Vitest.

## Scoring tests

Verify that:

1. Equal weights produce the arithmetic mean of five impact scores.
2. Unequal weights produce the correct weighted impact.
3. Valid weights total 100.
4. Invalid allocations are rejected or handled explicitly.
5. Feasibility is the average of five feasibility dimensions.
6. Scores remain within expected bounds.
7. Changes to strategic weights update impact without changing raw scores.

## Prioritization tests

Verify that:

1. Impact score 1 maps to Y = 0.
2. Impact score 10 maps to Y = 1.
3. Feasibility score 1 maps to X = 0.
4. Feasibility score 10 maps to X = 1.
5. Manual placements override calculated placements.
6. Resetting a manual placement restores the calculated position.
7. Automatically positioned use cases move when scores change.
8. Manually positioned use cases do not move automatically.
9. Deleting a use case removes associated placements.
10. Deferred or excluded use cases are not automatically added to a horizon.

## Data integrity tests

Verify that:

1. Project export/import preserves all current data.
2. Version 1 projects migrate correctly.
3. Version 2 projects round-trip correctly.
4. Duplicate use-case names do not cause data collisions.
5. Missing optional fields are handled.
6. Invalid JSON does not destroy existing state.
7. Problem-to-use-case links remain consistent.
8. Deleting a problem does not unexpectedly delete linked use cases.
9. Deleting a function handles associated problems safely.
10. Browser persistence restores the correct state.

## Manual interaction checks

Verify:

- All three stages can be navigated.
- Strategic weights can be changed.
- Functions can be created and edited.
- Problems can be added and linked.
- Processes can be modeled optionally.
- Use cases can be scored.
- Radar charts update correctly.
- Impact–feasibility placements work.
- Tokens can be dragged on desktop and touch devices.
- Manual placement resets work.
- Horizon assignments work.
- JSON export/import works.
- Demo mode still works.
- PNG export works.
- GitHub Pages production build succeeds.

---

# 19. Implementation Sequence

Do not attempt to change every major component simultaneously.

Work in the following order.

## Phase 0 — Baseline Stabilization

Tasks:

- Inspect the repository.
- Identify existing TypeScript and build failures.
- Fix the baseline.
- Verify the existing app can build.
- Introduce tests for existing scoring and persistence logic where appropriate.

Deliverable:

A functioning baseline with existing features preserved.

## Phase 1 — Shared Data Model and Scoring

Tasks:

- Define shared project types.
- Implement stable IDs.
- Implement impact weights.
- Implement weighted impact calculation.
- Implement revised feasibility criteria.
- Separate risk and reusability.
- Implement pure scoring functions.
- Implement project versioning and migration.
- Add browser persistence.

Deliverable:

A consistent, testable data model and reliable scoring logic.

## Phase 2 — Step 1 Enhancement

Tasks:

- Add strategic weighting interface.
- Add allocation validation.
- Add stacked weight visualization.
- Connect weights to use-case impact calculations.

Deliverable:

Working strategic priorities section in Step 1.

## Phase 3 — Step 2 Problem Discovery

Tasks:

- Add organizational function map.
- Add problem cards.
- Add problem editing.
- Add optional process modeling.
- Add problem-to-use-case linking.
- Preserve direct use-case creation.
- Add organizational coverage visualization.

Deliverable:

Working problem identification experience integrated into Step 2.

## Phase 4 — Step 2 Evaluation Improvements

Tasks:

- Implement revised impact and feasibility criteria.
- Add separate risk and reusability displays.
- Add confidence annotations.
- Add readiness context.
- Update radar charts.
- Update rankings.
- Ensure calculated scores respond to strategic weights.

Deliverable:

Improved use-case evaluation and visualizations.

## Phase 5 — Step 3 Prioritization

Tasks:

- Derive calculated positions.
- Implement manual overrides.
- Improve dragging.
- Add reset controls.
- Add capability-gap indicators.
- Add portfolio status.
- Improve horizon suggestions and assignments.
- Improve three-horizon visualization.

Deliverable:

A coherent prioritization workflow grounded in previous assessments.

## Phase 6 — Validation and Polish

Tasks:

- Run type checking.
- Run tests.
- Run production build.
- Verify demo mode.
- Verify import/export.
- Verify browser persistence.
- Test responsive layouts.
- Review accessibility.
- Remove dead code.
- Fix chart clipping.
- Update documentation.

Deliverable:

A stable, usable workshop application.

---

# 20. Context and Execution Management

This section is important.

You may be working in an environment with a limited context window.

Implement changes carefully and avoid losing track of the specification.

## Before making changes

1. Inspect the existing files.
2. Identify the relevant components and shared state.
3. Create a concise implementation checklist.
4. Identify dependencies between phases.
5. Avoid modifying unrelated code.

## During implementation

Work incrementally.

After completing each phase:

1. Run appropriate checks.
2. Fix any errors introduced by the phase.
3. Verify relevant existing functionality.
4. Record what was completed.
5. Record any important design decisions.
6. Continue to the next phase.

Do not repeatedly reread the entire repository without reason.

Prefer targeted inspection of affected files.

Do not leave the application in a broken intermediate state.

## Context preservation

Maintain a small implementation progress file:

`IMPLEMENTATION_PROGRESS.md`

Include:

- Completed phases.
- Remaining tasks.
- Important architectural decisions.
- Known issues.
- Files modified.
- Tests completed.
- Next implementation action.

Keep it concise and update it after meaningful milestones.

This file is for continuity across coding sessions.

## Code changes

Prefer small, reviewable changes.

Avoid:

- Large speculative abstractions.
- Complete component rewrites without justification.
- Introducing multiple dependencies for simple features.
- Replacing working implementations solely for stylistic reasons.
- Large quantities of duplicated code.
- Unnecessary changes to existing APIs.

Keep the Git history and code easy to review.

Do not create unrelated branches, delete user data, or modify unrelated assets.

## Autonomy

You are authorized to make ordinary implementation decisions necessary to fulfill the specification.

Do not ask for clarification about minor implementation choices.

When a requirement is underspecified, choose the simplest solution consistent with the product objectives.

If a major choice would contradict the three-stage structure or materially change product behavior, preserve the existing behavior and document the concern rather than inventing a new direction.

---

# 21. Acceptance Criteria

The implementation is complete when all the following are true.

### Step 1

- The original readiness assessment still works.
- Users can allocate 100 strategic priority points.
- Strategic weights are persisted.
- Weighted impact scores update correctly.

### Step 2

- Users can define organizational functions.
- Users can identify multiple problems under each function.
- The application provides a coverage overview.
- Users can optionally model individual processes.
- Problems can link to multiple AI use cases.
- AI use cases can link to multiple problems.
- Users can still create independent use cases.
- All five impact criteria remain available.
- Impact is calculated using strategic weights.
- All five revised feasibility criteria are available.
- Risk and reusability are separate.
- Confidence annotations are available.
- Radar charts and rankings work correctly.

### Step 3

- Matrix positions are initially calculated from impact and feasibility.
- Users can manually move projects.
- Manual overrides remain stable.
- Users can restore calculated positions.
- Capability context is visible.
- Users can prioritize, defer, or exclude projects.
- Prioritized projects can be assigned to any horizon.
- The roadmap does not automatically include all proposed ideas.
- Existing interactive visualizations remain functional.

### Cross-cutting

- Browser refresh preserves project data.
- Export/import preserves all project information.
- Legacy project files remain importable.
- Demo mode works.
- TypeScript checks pass.
- Tests pass.
- Production build succeeds.
- GitHub Pages compatibility is preserved.
- The application remains visually coherent.
- No unnecessary new application stages have been introduced.

---

# 22. Final Product Philosophy

The final application should not feel like a collection of disconnected scoring questionnaires.

It should tell one coherent story.

### Step 1 — Understand

What are our organizational capabilities, and which strategic outcomes matter most?

### Step 2 — Discover and Evaluate

What problems exist across our organization? Where could AI help? How valuable and feasible are the proposed interventions?

### Step 3 — Decide

Which opportunities should we prioritize? What is achievable now? What requires preparation? What should we defer or reject?

Every stage should build on information from the previous stage.

The additional interactions should make strategic thinking more structured and engaging—not more burdensome.

**The ultimate objective is to help workshop participants move from organizational challenges to defensible AI investment priorities, with a clear understanding of the assumptions, constraints, and trade-offs involved.**

Implement this specification carefully, incrementally, and with particular attention to preserving the simplicity and functionality of the existing application.