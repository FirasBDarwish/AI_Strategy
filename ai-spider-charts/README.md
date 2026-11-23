# AI Strategy Workshop

AI Strategy Workshop is a client-side tool for moving from organizational readiness and strategic priorities to evaluated agentic solutions and a practical three-horizon roadmap.

## Workshop flow

1. **Understand** — assess eleven readiness dimensions and allocate 100 strategic priority points.
2. **Define and evaluate** — refine the two editable example agents or add your own, describe the problem each solves, and assess impact, agent feasibility, and eight agent-focused risk considerations.
3. **Decide** — review calculated impact–feasibility positions, inspect the readiness constraints suppressing high-value ideas, and use the automatically derived three-horizon roadmap. Manual matrix overrides remain available for workshop judgment.

Strategic priorities use direct numeric entry so participants can type any allocation. The interface shows the running total and warns when it is below or above 100%; adjusted impact is calculated only when the total is exactly 100. Problem importance applies a disclosed adjustment from −5% to +5% (2/5 is −2.5% and 4/5 is +2.5%). Department readiness moderates the related agent-feasibility criteria. The eight-factor risk average reduces adjusted impact by up to 1.5 points but does not change feasibility or block navigation. The roadmap follows the current matrix position, so calculated and manually adjusted placements stay in sync with horizon assignment.

Feasibility uses metric-specific, nonlinear readiness adjustment. Process Readiness is supported by Processes & Workflows, Governance & Risk, and People & Skills. Systems Integration is supported by Technology Infrastructure, Governance & Risk, and Partnerships & Ecosystem. Implementation Ease continues to use Resources & Budget, People & Skills, and Partnerships & Ecosystem. For each metric, readiness is normalized to `r = 0–1` and the entered score to `s = (rating − 1) ÷ 9`; the adjusted metric is `1 + 9 × s^(2 − r) × r^0.35`. This leaves a metric unchanged at 5/5 readiness but compounds the penalty when both the use-case metric and its supporting readiness are weak.

New projects contain two broadly applicable, fully editable example agents. Readiness and problem importance begin at 3/5, impact and feasibility criteria begin at 5/10, and risk factors begin at Medium. New solutions use the same neutral defaults. Legacy reusability values remain preserved during import but are no longer shown or used because they did not affect the scoring model.

Projects are automatically persisted in local browser storage. Versioned JSON export/import supports the current schema and migrates legacy version 1 projects.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

The Vite base path remains `/AI_Strategy/` for GitHub Pages deployment.

## Architecture

- `src/types/strategy.ts` — shared project schema.
- `src/lib/scoring.ts` — pure scoring and prioritization calculations.
- `src/lib/project.ts` — defaults, persistence, validation, and migrations.
- `src/features/` — strategic weighting and organizational discovery UI.
- `src/Scoring_Readiness.tsx` — application state, readiness UI, navigation, import/export.
- `src/AISpiderCharts.tsx` — use-case evaluation and radar visualizations.
- `src/ImpactFeasibility.tsx` — prioritization matrix and roadmap.

## Original Vite template notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
