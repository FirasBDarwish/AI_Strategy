import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function importTypeScript(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const scoring = await importTypeScript("../src/lib/scoring.ts");
const projectLib = await importTypeScript("../src/lib/project.ts");

function useCase(overrides = {}) {
  return {
    id: "use-case-1",
    name: "Test",
    description: "",
    visible: true,
    scores: {
      increasesProductivity: 1,
      reducesCosts: 2,
      benefitsPublic: 3,
      increaseRevenue: 4,
      strategicImpact: 5,
      dataReady: 2,
      techMature: 4,
      organizationalReadiness: 6,
      implementationEase: 8,
      integrationEase: 10,
    },
    risk: { ratings: Object.fromEntries(projectLib.RISK_KEYS.map((key) => [key, "not_set"])) },
    problemStatement: "",
    processAffected: "",
    affectedStakeholders: "",
    problemImportance: 0,
    linkedProblemIds: [],
    ...overrides,
  };
}

function readinessAt(score) {
  return Object.fromEntries(projectLib.READINESS_KEYS.map((key) => [key, score]));
}

function riskRatingsAt(rating) {
  return Object.fromEntries(projectLib.RISK_KEYS.map((key) => [key, rating]));
}

test("new projects include two editable templates and neutral scoring defaults", () => {
  const project = projectLib.createDefaultProject();
  assert.equal(project.useCases.length, 2);
  assert.equal(project.useCases.every((item) => item.name.length > 0 && item.description.length > 100), true);
  const neutralUseCase = projectLib.createUseCase();
  assert.equal(neutralUseCase.name, "");
  assert.equal(Object.values(neutralUseCase.scores).every((score) => score === 5), true);
  assert.equal(Object.values(neutralUseCase.risk.ratings).every((rating) => rating === "medium"), true);
  assert.equal(neutralUseCase.problemImportance, 3);
  const restoredEmptyProject = projectLib.migrateProject({ version: 2, useCases: [] });
  assert.equal(restoredEmptyProject.useCases.length, 2);
});

test("equal impact weights produce the arithmetic mean", () => {
  assert.equal(scoring.calculateImpactScore(useCase(), projectLib.defaultImpactWeights()), 3);
  assert.equal(scoring.calculateRawImpactScore(useCase()), 3);
});

test("problem importance only makes a subtle impact adjustment", () => {
  const somewhatImportant = useCase({ problemImportance: 2 });
  const normal = useCase({ problemImportance: 3 });
  const veryImportant = useCase({ problemImportance: 4 });
  const important = useCase({ problemImportance: 5 });
  assert.ok(Math.abs(scoring.calculateImpactScore(somewhatImportant, projectLib.defaultImpactWeights()) - 2.925) < 1e-9);
  assert.ok(Math.abs(scoring.calculateImpactScore(veryImportant, projectLib.defaultImpactWeights()) - 3.075) < 1e-9);
  assert.ok(Math.abs(scoring.calculateImpactScore(important, projectLib.defaultImpactWeights()) - 3.15) < 1e-9);
  assert.ok(scoring.calculateImpactScore(important, projectLib.defaultImpactWeights()) > scoring.calculateImpactScore(normal, projectLib.defaultImpactWeights()));
});

test("unequal impact weights produce the expected weighted score", () => {
  const weights = { increasesProductivity: 100, reducesCosts: 0, benefitsPublic: 0, increaseRevenue: 0, strategicImpact: 0 };
  assert.equal(scoring.calculateImpactScore(useCase(), weights), 1);
});

test("invalid impact allocations are rejected", () => {
  const weights = { increasesProductivity: 10, reducesCosts: 10, benefitsPublic: 10, increaseRevenue: 10, strategicImpact: 10 };
  assert.equal(scoring.isValidImpactWeights(weights), false);
  assert.equal(scoring.calculateImpactScore(useCase(), weights), null);
});

test("raw feasibility is the average of five feasibility dimensions", () => {
  assert.equal(scoring.calculateRawFeasibilityScore(useCase()), 6);
});

test("department readiness moderates feasibility", () => {
  const item = useCase();
  assert.equal(scoring.calculateFeasibilityScore(item, readinessAt(5)), 6);
  assert.ok(scoring.calculateFeasibilityScore(item, readinessAt(2)) < 6);
});

test("weak readiness compounds a low feasibility metric more severely", () => {
  assert.equal(scoring.adjustFeasibilityMetricScore(6, 1), 6);
  const lowMetric = scoring.adjustFeasibilityMetricScore(2, 0.4);
  const strongMetric = scoring.adjustFeasibilityMetricScore(8, 0.4);
  const lowRetention = (lowMetric - 1) / (2 - 1);
  const strongRetention = (strongMetric - 1) / (8 - 1);
  assert.ok(lowMetric < 2);
  assert.ok(strongMetric < 8);
  assert.ok(lowRetention < strongRetention);
});

test("readiness bottlenecks report summed untapped impact across high-impact use cases", () => {
  const first = useCase();
  const second = useCase({ id: "use-case-2" });
  for (const item of [first, second]) {
    for (const key of scoring.IMPACT_KEYS) item.scores[key] = 8;
  }
  const analysis = scoring.analyzeReadinessBottlenecks([first, second], projectLib.defaultImpactWeights(), readinessAt(2));
  assert.ok(analysis.length > 0);
  assert.equal(analysis[0].highImpactUseCases, 2);
  assert.ok(analysis[0].untappedImpact > 0);
  assert.ok(Math.abs(analysis[0].untappedImpact - (analysis[0].improvedAchievableImpact - analysis[0].currentAchievableImpact)) < 1e-9);
});

test("eight-factor risk reduces impact without changing feasibility", () => {
  const low = useCase({ risk: { ratings: riskRatingsAt("low") } });
  const high = useCase({ risk: { ratings: riskRatingsAt("high") } });
  const partial = useCase();
  partial.risk.ratings.dataLeakage = "high";
  assert.equal(scoring.calculateRiskScore(partial), null);
  assert.equal(scoring.calculateRiskImpactPenalty(partial), 0);
  assert.equal(scoring.calculateRiskScore(low), 1);
  assert.equal(scoring.calculateRiskScore(high), 3);
  assert.equal(scoring.calculateRiskImpactPenalty(high), 1.5);
  assert.ok(scoring.calculateImpactScore(high, projectLib.defaultImpactWeights()) < scoring.calculateImpactScore(low, projectLib.defaultImpactWeights()));
  assert.equal(scoring.calculateFeasibilityScore(high, readinessAt(5)), scoring.calculateFeasibilityScore(low, readinessAt(5)));
});

test("score endpoints map to matrix endpoints", () => {
  assert.equal(scoring.scoreToCoordinate(1), 0);
  assert.equal(scoring.scoreToCoordinate(10), 1);
});

test("manual placement overrides and calculated placement can be restored", () => {
  const item = useCase();
  const weights = projectLib.defaultImpactWeights();
  const readiness = readinessAt(5);
  const calculated = scoring.resolvePosition(item, weights, readiness);
  const manual = { x: 0.9, y: 0.1, manuallyAdjusted: true };
  assert.deepEqual(scoring.resolvePosition(item, weights, readiness, manual), manual);
  assert.deepEqual(scoring.resolvePosition(item, weights, readiness), calculated);
});

test("changing impact weights moves calculated positions without changing raw scores", () => {
  const item = useCase();
  const before = structuredClone(item.scores);
  const readiness = readinessAt(5);
  const equal = scoring.calculatePosition(item, projectLib.defaultImpactWeights(), readiness);
  const focused = scoring.calculatePosition(item, { increasesProductivity: 100, reducesCosts: 0, benefitsPublic: 0, increaseRevenue: 0, strategicImpact: 0 }, readiness);
  assert.notEqual(equal.y, focused.y);
  assert.deepEqual(item.scores, before);
});

test("roadmap horizons are derived from the current matrix position", () => {
  assert.equal(scoring.getHorizonFromPosition({ x: scoring.scoreToCoordinate(9), y: scoring.scoreToCoordinate(5.9) }), null);
  assert.equal(scoring.getHorizonFromPosition({ x: scoring.scoreToCoordinate(8), y: scoring.scoreToCoordinate(8) }), 1);
  assert.equal(scoring.getHorizonFromPosition({ x: scoring.scoreToCoordinate(5), y: scoring.scoreToCoordinate(8) }), 2);
  assert.equal(scoring.getHorizonFromPosition({ x: scoring.scoreToCoordinate(3), y: scoring.scoreToCoordinate(8) }), 3);
  assert.equal(scoring.getHorizonFromPosition(scoring.resolvePosition(useCase(), projectLib.defaultImpactWeights(), readinessAt(5), { x: 0.9, y: 0.9, manuallyAdjusted: true })), 1);
});

test("version 1 projects migrate every use case and legacy scoring fields", () => {
  const legacyCases = Array.from({ length: 11 }, (_, index) => ({
    id: index,
    name: "Duplicate name",
    description: `Case ${index}`,
    scores: { increasesProductivity: 7, reducesCosts: 6, benefitsPublic: 8, increaseRevenue: 9, strategicImpact: 10, dataReady: 4, techMature: 5, lowImplementationCost: 6, reusable: 7, noRisk: 8 },
  }));
  const migrated = projectLib.migrateProject({ version: 1, scores: projectLib.defaultReadinessScores(), useCases: legacyCases, placements: { 0: { x: 0.2, y: 0.8 } } });
  assert.equal(migrated.useCases.length, 11);
  assert.equal(new Set(migrated.useCases.map((item) => item.id)).size, 11);
  assert.equal(migrated.useCases[0].scores.implementationEase, 6);
  assert.equal(migrated.useCases[0].scores.increaseRevenue, 9);
  assert.equal(migrated.useCases[0].migrationMetadata.legacyNoRiskScore, 8);
  assert.equal(migrated.useCases[0].migrationMetadata.legacyReusableScore, 7);
  const restoredAgain = projectLib.migrateProject(JSON.parse(JSON.stringify(migrated)));
  assert.equal(restoredAgain.useCases[0].migrationMetadata.legacyNoRiskScore, 8);
  assert.equal(restoredAgain.useCases[0].migrationMetadata.legacyReusableScore, 7);
  assert.equal(Object.keys(migrated.manualPlacements).length, 1);
});

test("version 2 projects round-trip without losing linked data", () => {
  const original = projectLib.createDefaultProject(3);
  const restored = projectLib.migrateProject(JSON.parse(JSON.stringify(original)));
  assert.deepEqual(restored, original);
});
