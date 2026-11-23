import type {
  ImpactWeights,
  ManualPlacement,
  OrganizationalFunction,
  OrganizationalProblem,
  PortfolioDecision,
  ReadinessKey,
  ReadinessScores,
  RiskKey,
  RiskRating,
  StrategyProject,
  UseCase,
  UseCaseScores,
} from "@/types/strategy";

export const PROJECT_STORAGE_KEY = "ai-strategy-studio-project-v2";

export const READINESS_KEYS: ReadinessKey[] = [
  "dataMaturity",
  "peopleSkills",
  "processesWorkflows",
  "governanceRisk",
  "resourcesBudget",
  "techInfra",
  "changeReadiness",
  "leadershipAlignment",
  "partnerships",
  "citizenOrientation",
  "ethicsTrust",
];

export const RISK_KEYS: RiskKey[] = [
  "dataLeakage",
  "cybersecurity",
  "modelReliability",
  "modelMisalignment",
  "biasFairness",
  "legalCompliance",
  "safetyHumanOversight",
  "operationalReputation",
];

export const defaultRiskRatings = (): Record<RiskKey, RiskRating> => Object.fromEntries(
  RISK_KEYS.map((key) => [key, "medium"]),
) as Record<RiskKey, RiskRating>;

export const defaultReadinessScores = (): ReadinessScores => ({
  dataMaturity: 3,
  peopleSkills: 3,
  processesWorkflows: 3,
  governanceRisk: 3,
  resourcesBudget: 3,
  techInfra: 3,
  changeReadiness: 3,
  leadershipAlignment: 3,
  partnerships: 3,
  citizenOrientation: 3,
  ethicsTrust: 3,
  notes: "",
});

export const defaultImpactWeights = (): ImpactWeights => ({
  increasesProductivity: 20,
  reducesCosts: 20,
  benefitsPublic: 20,
  increaseRevenue: 20,
  strategicImpact: 20,
});

export const defaultUseCaseScores = (): UseCaseScores => ({
  increasesProductivity: 5,
  reducesCosts: 5,
  benefitsPublic: 5,
  increaseRevenue: 5,
  strategicImpact: 5,
  dataReady: 5,
  techMature: 5,
  organizationalReadiness: 5,
  implementationEase: 5,
  integrationEase: 5,
});

export function createId(prefix: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

export function createUseCase(name = ""): UseCase {
  return {
    id: createId("use-case"),
    name,
    description: "",
    visible: true,
    scores: defaultUseCaseScores(),
    risk: { ratings: defaultRiskRatings() },
    problemStatement: "",
    processAffected: "",
    affectedStakeholders: "",
    problemImportance: 3,
    linkedProblemIds: [],
  };
}

const TEMPLATE_USE_CASES = [
  {
    name: "Resident Enquiry Resolution Agent",
    description: "An agent that receives routine resident enquiries, retrieves approved information from connected service systems, drafts a clear response, and routes uncertain or sensitive cases to the right employee for review before anything is sent.",
    problemStatement: "Residents wait too long for answers because staff repeatedly search across fragmented guidance and service systems.",
    processAffected: "Resident enquiry intake, research, response drafting, and escalation",
    affectedStakeholders: "Residents, contact-centre staff, and service owners",
  },
  {
    name: "Case Review Preparation Agent",
    description: "An agent that assembles the relevant case history, checks submissions for missing information, summarizes applicable policy, and prepares a structured review pack while leaving recommendations and final decisions with an authorized employee.",
    problemStatement: "Case officers spend significant time assembling information and checking completeness before substantive review can begin.",
    processAffected: "Case intake, completeness checks, document review, and review-pack preparation",
    affectedStakeholders: "Case officers, applicants, reviewers, and operational managers",
  },
] as const;

function createTemplateUseCase(index: number): UseCase {
  const template = TEMPLATE_USE_CASES[index];
  if (!template) return createUseCase(`Agentic Solution ${index + 1}`);
  return { ...createUseCase(template.name), ...template };
}

export function createDefaultProject(useCaseCount = 2): StrategyProject {
  const useCases = Array.from({ length: useCaseCount }, (_, index) => createTemplateUseCase(index));
  return {
    version: 2,
    readinessScores: defaultReadinessScores(),
    impactWeights: defaultImpactWeights(),
    functions: [],
    problems: [],
    useCases,
    manualPlacements: {},
    portfolioDecisions: Object.fromEntries(
      useCases.map((useCase) => [useCase.id, { status: "deferred", horizon: null } satisfies PortfolioDecision]),
    ),
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function numberInRange(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function migrateUseCase(value: unknown, index: number, usedIds: Set<string>): UseCase {
  const source = record(value) ?? {};
  const scoreSource = record(source.scores) ?? {};
  const rawId = typeof source.id === "string" ? source.id : `legacy-use-case-${String(source.id ?? index)}`;
  let id = rawId;
  while (usedIds.has(id)) id = `${rawId}-${index}`;
  usedIds.add(id);
  const migrationSource = record(source.migrationMetadata);
  const legacyNoRisk = Number.isFinite(Number(scoreSource.noRisk))
    ? Number(scoreSource.noRisk)
    : Number.isFinite(Number(migrationSource?.legacyNoRiskScore)) ? Number(migrationSource?.legacyNoRiskScore) : undefined;
  const legacyReusable = Number.isFinite(Number(scoreSource.reusable))
    ? Number(scoreSource.reusable)
    : Number.isFinite(Number(migrationSource?.legacyReusableScore)) ? Number(migrationSource?.legacyReusableScore) : undefined;
  const riskSource = record(source.risk);
  const riskRatingsSource = record(riskSource?.ratings);
  const legacyRiskLevel = riskSource?.legacyOverallLevel ?? riskSource?.level;

  return {
    id,
    name: stringValue(source.name, `Use Case ${index + 1}`),
    description: stringValue(source.description),
    visible: typeof source.visible === "boolean" ? source.visible : true,
    scores: {
      increasesProductivity: numberInRange(scoreSource.increasesProductivity || 5, 5, 1, 10),
      reducesCosts: numberInRange(scoreSource.reducesCosts || 5, 5, 1, 10),
      benefitsPublic: numberInRange(scoreSource.benefitsPublic || 5, 5, 1, 10),
      increaseRevenue: numberInRange(scoreSource.increaseRevenue || 5, 5, 1, 10),
      strategicImpact: numberInRange(scoreSource.strategicImpact || 5, 5, 1, 10),
      dataReady: numberInRange(scoreSource.dataReady || 5, 5, 1, 10),
      techMature: numberInRange(scoreSource.techMature || 5, 5, 1, 10),
      organizationalReadiness: numberInRange(scoreSource.organizationalReadiness || 5, 5, 1, 10),
      implementationEase: numberInRange(
        scoreSource.implementationEase || scoreSource.lowImplementationCost || 5,
        5,
        1,
        10,
      ),
      integrationEase: numberInRange(scoreSource.integrationEase || 5, 5, 1, 10),
    },
    risk: {
      ratings: Object.fromEntries(RISK_KEYS.map((key) => {
        const value = riskRatingsSource?.[key];
        return [key, ["low", "medium", "high"].includes(String(value)) ? value : "medium"];
      })) as UseCase["risk"]["ratings"],
      ...(!riskSource || !["low", "medium", "high"].includes(String(legacyRiskLevel))
        ? {}
        : { legacyOverallLevel: legacyRiskLevel as UseCase["risk"]["legacyOverallLevel"] }),
    },
    problemStatement: stringValue(source.problemStatement),
    processAffected: stringValue(source.processAffected),
    affectedStakeholders: stringValue(source.affectedStakeholders),
    problemImportance: Number.isFinite(Number(source.problemImportance))
      ? numberInRange(source.problemImportance || 3, 3, 1, 5) as UseCase["problemImportance"]
      : source.problemImportance === "low" ? 2 : source.problemImportance === "medium" ? 3 : source.problemImportance === "high" ? 5 : 3,
    linkedProblemIds: Array.isArray(source.linkedProblemIds)
      ? source.linkedProblemIds.filter((item): item is string => typeof item === "string")
      : [],
    ...(legacyNoRisk === undefined && legacyReusable === undefined ? {} : { migrationMetadata: {
      ...(legacyNoRisk === undefined ? {} : { legacyNoRiskScore: legacyNoRisk }),
      ...(legacyReusable === undefined ? {} : { legacyReusableScore: legacyReusable }),
    } }),
  };
}

export function migrateProject(input: unknown): StrategyProject {
  const source = record(input);
  if (!source) throw new Error("The selected file does not contain a project object.");
  const rawUseCases = Array.isArray(source.useCases) ? source.useCases : null;
  if (!rawUseCases) throw new Error("The project is missing a valid useCases array.");

  const readinessSource = record(source.readinessScores) ?? record(source.scores) ?? {};
  const readinessScores = defaultReadinessScores();
  for (const key of READINESS_KEYS) readinessScores[key] = numberInRange(readinessSource[key], 3, 1, 5);
  readinessScores.notes = stringValue(readinessSource.notes);

  const weightSource = record(source.impactWeights);
  const impactWeights = defaultImpactWeights();
  if (weightSource) {
    for (const key of Object.keys(impactWeights) as (keyof ImpactWeights)[]) {
      impactWeights[key] = numberInRange(weightSource[key], 20, 0, 100);
    }
  }
  if (Object.values(impactWeights).reduce((sum, value) => sum + value, 0) !== 100) {
    Object.assign(impactWeights, defaultImpactWeights());
  }

  const usedIds = new Set<string>();
  const useCases = rawUseCases.length > 0
    ? rawUseCases.map((useCase, index) => migrateUseCase(useCase, index, usedIds))
    : [createTemplateUseCase(0), createTemplateUseCase(1)];
  const idByLegacyIndex = new Map(useCases.map((useCase, index) => [String(index), useCase.id]));

  const rawFunctions = Array.isArray(source.functions) ? source.functions : [];
  const functions: OrganizationalFunction[] = rawFunctions.flatMap((value, index) => {
    const item = record(value);
    if (!item) return [];
    return [{
      id: stringValue(item.id, `legacy-function-${index}`),
      name: stringValue(item.name, `Function ${index + 1}`),
      description: stringValue(item.description),
    }];
  });
  const functionIds = new Set(functions.map((item) => item.id));
  const rawProblems = Array.isArray(source.problems) ? source.problems : [];
  const needsRecoveredFunction = rawProblems.some((value) => {
    const item = record(value);
    return item && !functionIds.has(stringValue(item.functionId));
  });
  const recoveredFunctionId = "recovered-legacy-problems";
  if (needsRecoveredFunction && !functionIds.has(recoveredFunctionId)) {
    functions.push({ id: recoveredFunctionId, name: "Recovered Problems", description: "Problems recovered from an imported project without a valid function association." });
    functionIds.add(recoveredFunctionId);
  }
  const useCaseIds = new Set(useCases.map((item) => item.id));
  const problems: OrganizationalProblem[] = rawProblems.flatMap((value, index) => {
    const item = record(value);
    if (!item) return [];
    const process = record(item.process);
    const steps = process && Array.isArray(process.steps)
      ? process.steps.flatMap((stepValue, stepIndex) => {
          const step = record(stepValue);
          return step ? [{
            id: stringValue(step.id, `legacy-process-step-${index}-${stepIndex}`),
            name: stringValue(step.name),
            bottleneck: step.bottleneck === true,
            bottleneckNotes: stringValue(step.bottleneckNotes),
          }] : [];
        })
      : [];
    const functionId = stringValue(item.functionId);
    return [{
      id: stringValue(item.id, `legacy-problem-${index}`),
      functionId: functionIds.has(functionId) ? functionId : recoveredFunctionId,
      title: stringValue(item.title, `Problem ${index + 1}`),
      description: stringValue(item.description),
      affectedStakeholders: stringValue(item.affectedStakeholders),
      importance: ["low", "medium", "high"].includes(String(item.importance))
        ? item.importance as OrganizationalProblem["importance"]
        : null,
      ...(process ? { process: { name: stringValue(process.name), steps } } : {}),
      linkedUseCaseIds: Array.isArray(item.linkedUseCaseIds)
        ? item.linkedUseCaseIds.filter((id): id is string => typeof id === "string" && useCaseIds.has(id))
        : [],
    }];
  });
  const problemIds = new Set(problems.map((item) => item.id));
  const synchronizedUseCases = useCases.map((useCase) => {
    const linkedProblemIds = useCase.linkedProblemIds.filter((id) => problemIds.has(id));
    const legacyProblem = problems.find((problem) => linkedProblemIds.includes(problem.id));
    return {
      ...useCase,
      linkedProblemIds,
      problemStatement: useCase.problemStatement || legacyProblem?.description || legacyProblem?.title || "",
      processAffected: useCase.processAffected || legacyProblem?.process?.name || "",
      affectedStakeholders: useCase.affectedStakeholders || legacyProblem?.affectedStakeholders || "",
      problemImportance: useCase.problemImportance !== 0
        ? useCase.problemImportance
        : (legacyProblem?.importance === "low" ? 2 : legacyProblem?.importance === "medium" ? 3 : legacyProblem?.importance === "high" ? 5 : 3) as UseCase["problemImportance"],
    };
  });
  for (const problem of problems) {
    for (const useCaseId of problem.linkedUseCaseIds) {
      const useCase = synchronizedUseCases.find((item) => item.id === useCaseId);
      if (useCase && !useCase.linkedProblemIds.includes(problem.id)) useCase.linkedProblemIds.push(problem.id);
    }
  }

  const placementSource = record(source.manualPlacements) ?? record(source.placements) ?? {};
  const manualPlacements: Record<string, ManualPlacement> = {};
  for (const [rawId, value] of Object.entries(placementSource)) {
    const placement = record(value);
    if (!placement) continue;
    const id = useCases.some((useCase) => useCase.id === rawId) ? rawId : idByLegacyIndex.get(rawId);
    if (!id) continue;
    manualPlacements[id] = {
      x: numberInRange(placement.x, 0.5, 0, 1),
      y: numberInRange(placement.y, 0.5, 0, 1),
      manuallyAdjusted: true,
    };
  }

  const decisionsSource = record(source.portfolioDecisions) ?? {};
  const portfolioDecisions: Record<string, PortfolioDecision> = {};
  for (const useCase of useCases) {
    const decision = record(decisionsSource[useCase.id]);
    const status = decision && ["prioritized", "deferred", "not_pursuing"].includes(String(decision.status))
      ? decision.status as PortfolioDecision["status"]
      : "deferred";
    const horizon = decision && [1, 2, 3].includes(Number(decision.horizon))
      ? Number(decision.horizon) as PortfolioDecision["horizon"]
      : null;
    portfolioDecisions[useCase.id] = { status, horizon: status === "prioritized" ? horizon : null };
  }

  return {
    version: 2,
    readinessScores,
    impactWeights,
    functions,
    problems,
    useCases: synchronizedUseCases,
    manualPlacements,
    portfolioDecisions,
  };
}

export function loadStoredProject(): StrategyProject | null {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    return raw ? migrateProject(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn("Could not restore the locally saved AI strategy project.", error);
    return null;
  }
}

export function saveStoredProject(project: StrategyProject): boolean {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch (error) {
    console.warn("Could not save the AI strategy project locally.", error);
    return false;
  }
}

export function clearStoredProject(): void {
  try {
    localStorage.removeItem(PROJECT_STORAGE_KEY);
  } catch (error) {
    console.warn("Could not clear the locally saved AI strategy project.", error);
  }
}
