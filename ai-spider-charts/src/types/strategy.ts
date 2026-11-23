export type WorkshopStep = "readiness" | "scoring" | "prioritization";

export type ReadinessKey =
  | "dataMaturity"
  | "peopleSkills"
  | "processesWorkflows"
  | "governanceRisk"
  | "resourcesBudget"
  | "techInfra"
  | "changeReadiness"
  | "leadershipAlignment"
  | "partnerships"
  | "citizenOrientation"
  | "ethicsTrust";

export type ReadinessScores = Record<ReadinessKey, number> & { notes?: string };

export type ImpactKey =
  | "increasesProductivity"
  | "reducesCosts"
  | "benefitsPublic"
  | "increaseRevenue"
  | "strategicImpact";

export type FeasibilityKey =
  | "dataReady"
  | "techMature"
  | "organizationalReadiness"
  | "implementationEase"
  | "integrationEase";

export type ImpactWeights = Record<ImpactKey, number>;
export type UseCaseScores = Record<ImpactKey | FeasibilityKey, number>;

export type RiskLevel = "low" | "medium" | "high" | "unknown";
export type RiskRating = "not_set" | "low" | "medium" | "high";
export type RiskKey =
  | "dataLeakage"
  | "cybersecurity"
  | "modelReliability"
  | "modelMisalignment"
  | "biasFairness"
  | "legalCompliance"
  | "safetyHumanOversight"
  | "operationalReputation";
export type ProblemImportance = 0 | 1 | 2 | 3 | 4 | 5;

export type RiskAssessment = {
  ratings: Record<RiskKey, RiskRating>;
  legacyOverallLevel?: RiskLevel;
};

export type UseCase = {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  scores: UseCaseScores;
  risk: RiskAssessment;
  problemStatement: string;
  processAffected: string;
  affectedStakeholders: string;
  problemImportance: ProblemImportance;
  linkedProblemIds: string[];
  migrationMetadata?: { legacyNoRiskScore?: number; legacyReusableScore?: number };
};

export type OrganizationalFunction = {
  id: string;
  name: string;
  description: string;
};

export type ProcessStep = {
  id: string;
  name: string;
  bottleneck: boolean;
  bottleneckNotes: string;
};

export type ProblemProcess = {
  name: string;
  steps: ProcessStep[];
};

export type OrganizationalProblem = {
  id: string;
  functionId: string;
  title: string;
  description: string;
  affectedStakeholders: string;
  importance: "low" | "medium" | "high" | null;
  process?: ProblemProcess;
  linkedUseCaseIds: string[];
};

export type ManualPlacement = {
  x: number;
  y: number;
  manuallyAdjusted: true;
};

export type PortfolioStatus = "prioritized" | "deferred" | "not_pursuing";
export type Horizon = 1 | 2 | 3;

export type PortfolioDecision = {
  status: PortfolioStatus;
  horizon: Horizon | null;
};

export type StrategyProject = {
  version: 2;
  readinessScores: ReadinessScores;
  impactWeights: ImpactWeights;
  functions: OrganizationalFunction[];
  problems: OrganizationalProblem[];
  useCases: UseCase[];
  manualPlacements: Record<string, ManualPlacement>;
  portfolioDecisions: Record<string, PortfolioDecision>;
};
