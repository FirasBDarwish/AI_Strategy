import type {
  FeasibilityKey,
  Horizon,
  ImpactKey,
  ImpactWeights,
  ManualPlacement,
  ReadinessScores,
  ReadinessKey,
  RiskRating,
  UseCase,
} from "@/types/strategy";

export const IMPACT_KEYS: ImpactKey[] = [
  "increasesProductivity",
  "reducesCosts",
  "benefitsPublic",
  "increaseRevenue",
  "strategicImpact",
];

export const FEASIBILITY_KEYS: FeasibilityKey[] = [
  "dataReady",
  "techMature",
  "organizationalReadiness",
  "implementationEase",
  "integrationEase",
];

export const HORIZON_THRESHOLDS = {
  highImpact: 6,
  highFeasibility: 7,
  mediumFeasibility: 4,
} as const;

const FEASIBILITY_READINESS_MAGNITUDE_POWER = 0.35;

const RISK_VALUES: Record<Exclude<RiskRating, "not_set">, number> = { low: 1, medium: 2, high: 3 };
const LEGACY_RISK_VALUES = { low: 1, medium: 2, high: 3, unknown: 0 } as const;

const READINESS_LABELS: Record<ReadinessKey, string> = {
  dataMaturity: "Data Maturity",
  peopleSkills: "People & Skills",
  processesWorkflows: "Processes & Workflows",
  governanceRisk: "Governance & Risk",
  resourcesBudget: "Resources & Budget",
  techInfra: "Technology Infrastructure",
  changeReadiness: "Change Readiness",
  leadershipAlignment: "Leadership Alignment",
  partnerships: "Partnerships & Ecosystem",
  citizenOrientation: "Citizen Orientation",
  ethicsTrust: "Ethics & Public Trust",
};

export function isValidImpactWeights(weights: ImpactWeights): boolean {
  return IMPACT_KEYS.every((key) => Number.isFinite(weights[key]) && weights[key] >= 0)
    && IMPACT_KEYS.reduce((total, key) => total + weights[key], 0) === 100;
}

export function calculateRiskScore(useCase: UseCase): number | null {
  const ratings = Object.values(useCase.risk.ratings);
  const rated = ratings.filter((rating): rating is Exclude<RiskRating, "not_set"> => rating !== "not_set");
  if (rated.length === ratings.length) return rated.reduce((sum, rating) => sum + RISK_VALUES[rating], 0) / rated.length;
  if (rated.length > 0) return null;
  const legacy = useCase.risk.legacyOverallLevel;
  return legacy && LEGACY_RISK_VALUES[legacy] > 0 ? LEGACY_RISK_VALUES[legacy] : null;
}

export function calculateRiskImpactPenalty(useCase: UseCase): number {
  const riskScore = calculateRiskScore(useCase);
  return riskScore === null ? 0 : (riskScore - 1) * 0.75;
}

export function getRiskBand(useCase: UseCase): "Not rated" | "Incomplete" | "Low" | "Medium" | "High" {
  const ratings = Object.values(useCase.risk.ratings);
  const ratedCount = ratings.filter((rating) => rating !== "not_set").length;
  if (ratedCount === 0 && !useCase.risk.legacyOverallLevel) return "Not rated";
  if (ratedCount > 0 && ratedCount < ratings.length) return "Incomplete";
  const score = calculateRiskScore(useCase);
  if (score === null) return "Not rated";
  return score < 1.5 ? "Low" : score < 2.5 ? "Medium" : "High";
}

export function getProblemImportanceMultiplier(importance: UseCase["problemImportance"]): number {
  return importance === 0 ? 1 : 0.925 + importance * 0.025;
}

export function calculateRawImpactScore(useCase: UseCase): number {
  return IMPACT_KEYS.reduce((total, key) => total + useCase.scores[key], 0) / IMPACT_KEYS.length;
}

export function calculateStrategicWeightedImpactScore(useCase: UseCase, weights: ImpactWeights): number | null {
  if (!isValidImpactWeights(weights)) return null;
  return IMPACT_KEYS.reduce(
    (total, key) => total + useCase.scores[key] * (weights[key] / 100),
    0,
  ) * getProblemImportanceMultiplier(useCase.problemImportance);
}

export function calculateImpactScore(useCase: UseCase, weights: ImpactWeights): number | null {
  const weightedImpact = calculateStrategicWeightedImpactScore(useCase, weights);
  return weightedImpact === null ? null : Math.max(0, Math.min(10, weightedImpact - calculateRiskImpactPenalty(useCase)));
}

export function calculateRawFeasibilityScore(useCase: UseCase): number {
  return FEASIBILITY_KEYS.reduce((total, key) => total + useCase.scores[key], 0)
    / FEASIBILITY_KEYS.length;
}

function averageReadiness(readiness: ReadinessScores, keys: ReadinessKey[]): number {
  return keys.reduce((total, key) => total + readiness[key], 0) / keys.length / 5;
}

export function getFeasibilityReadinessFactors(readiness: ReadinessScores): Record<FeasibilityKey, number> {
  return {
    dataReady: averageReadiness(readiness, ["dataMaturity", "governanceRisk"]),
    techMature: averageReadiness(readiness, ["techInfra", "partnerships"]),
    organizationalReadiness: averageReadiness(readiness, ["processesWorkflows", "governanceRisk", "peopleSkills"]),
    implementationEase: averageReadiness(readiness, ["resourcesBudget", "peopleSkills", "partnerships"]),
    integrationEase: averageReadiness(readiness, ["techInfra", "governanceRisk", "partnerships"]),
  };
}

export function adjustFeasibilityMetricScore(score: number, readinessFactor: number): number {
  const boundedScore = Math.max(1, Math.min(10, score));
  const boundedReadiness = Math.max(0, Math.min(1, readinessFactor));
  const normalizedScore = (boundedScore - 1) / 9;
  const weaknessExponent = 1 + (1 - boundedReadiness);
  // Weak readiness reduces every score, while the exponent compounds the penalty
  // when the use case is already weak on this particular feasibility metric.
  const readinessMagnitude = Math.pow(boundedReadiness, FEASIBILITY_READINESS_MAGNITUDE_POWER);
  return 1 + 9 * Math.pow(normalizedScore, weaknessExponent) * readinessMagnitude;
}

export function calculateReadinessAdjustedFeasibilityScore(useCase: UseCase, readiness: ReadinessScores): number {
  const factors = getFeasibilityReadinessFactors(readiness);
  return FEASIBILITY_KEYS.reduce(
    (total, key) => total + adjustFeasibilityMetricScore(useCase.scores[key], factors[key]),
    0,
  ) / FEASIBILITY_KEYS.length;
}

export function calculateFeasibilityScore(useCase: UseCase, readiness: ReadinessScores): number {
  return calculateReadinessAdjustedFeasibilityScore(useCase, readiness);
}

export function scoreToCoordinate(score: number): number {
  return Math.max(0, Math.min(1, (score - 1) / 9));
}

export function calculatePosition(useCase: UseCase, weights: ImpactWeights, readiness: ReadinessScores) {
  const impact = calculateImpactScore(useCase, weights);
  return {
    x: scoreToCoordinate(calculateFeasibilityScore(useCase, readiness)),
    y: scoreToCoordinate(impact ?? 1),
  };
}

export function resolvePosition(
  useCase: UseCase,
  weights: ImpactWeights,
  readiness: ReadinessScores,
  manualPlacement?: ManualPlacement,
) {
  return manualPlacement ?? calculatePosition(useCase, weights, readiness);
}

export function getHorizonFromPosition(position: { x: number; y: number }): Horizon | null {
  if (position.y < scoreToCoordinate(HORIZON_THRESHOLDS.highImpact)) return null;
  if (position.x >= scoreToCoordinate(HORIZON_THRESHOLDS.highFeasibility)) return 1;
  if (position.x >= scoreToCoordinate(HORIZON_THRESHOLDS.mediumFeasibility)) return 2;
  return 3;
}

export type ReadinessBottleneck = {
  key: ReadinessKey;
  label: string;
  current: number;
  affectedUseCases: number;
  highImpactUseCases: number;
  currentAchievableImpact: number;
  improvedAchievableImpact: number;
  untappedImpact: number;
};

export function analyzeReadinessBottlenecks(
  useCases: UseCase[],
  weights: ImpactWeights,
  readiness: ReadinessScores,
): ReadinessBottleneck[] {
  const highImpactUseCases = useCases.filter((useCase) => (calculateImpactScore(useCase, weights) ?? 0) >= HORIZON_THRESHOLDS.highImpact);
  return (Object.keys(READINESS_LABELS) as ReadinessKey[]).map((key) => {
    const improvedReadiness = { ...readiness, [key]: 5 };
    const changes = highImpactUseCases.map((useCase) => {
      const before = calculateFeasibilityScore(useCase, readiness);
      const after = calculateFeasibilityScore(useCase, improvedReadiness);
      const lift = Math.max(0, after - before);
      const impact = calculateImpactScore(useCase, weights) ?? 0;
      return { lift, impact, before, after };
    });
    const affected = changes.filter((item) => item.lift >= 0.05);
    const currentAchievableImpact = changes.reduce((total, item) => total + item.impact * item.before / 10, 0);
    const improvedAchievableImpact = changes.reduce((total, item) => total + item.impact * item.after / 10, 0);
    return {
      key,
      label: READINESS_LABELS[key],
      current: readiness[key],
      affectedUseCases: affected.length,
      highImpactUseCases: highImpactUseCases.length,
      currentAchievableImpact,
      improvedAchievableImpact,
      untappedImpact: improvedAchievableImpact - currentAchievableImpact,
    };
  }).filter((item) => item.untappedImpact > 0.01).sort((a, b) => b.untappedImpact - a.untappedImpact);
}

