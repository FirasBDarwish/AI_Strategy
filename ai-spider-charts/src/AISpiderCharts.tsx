import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createUseCase, RISK_KEYS } from "@/lib/project";
import { calculateFeasibilityScore, calculateImpactScore, calculateRawFeasibilityScore, calculateRawImpactScore, calculateRiskImpactPenalty, getRiskBand } from "@/lib/scoring";
import type { FeasibilityKey, ImpactKey, RiskKey, RiskRating, StrategyProject, UseCase } from "@/types/strategy";
import html2canvas from "html2canvas";
import { BarChart2, Download, Eye, EyeOff, Lightbulb, Plus, ShieldAlert, Target, Trash2, Wrench } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

type Criterion = {
  key: ImpactKey | FeasibilityKey;
  label: string;
  group: "Impact" | "Feasibility";
  descriptions: { 1: string; 5: string; 10: string };
};

const IMPACT_CRITERIA: Criterion[] = [
  { key: "increasesProductivity", label: "Increases Productivity", group: "Impact", descriptions: { 1: "Little or no productivity improvement.", 5: "Meaningful improvement in selected work.", 10: "Transformative productivity gains across the organization." } },
  { key: "reducesCosts", label: "Reduces Costs", group: "Impact", descriptions: { 1: "Little or no cost reduction.", 5: "Moderate savings in selected processes.", 10: "Major, sustainable operating cost reductions." } },
  { key: "benefitsPublic", label: "Benefits the Public", group: "Impact", descriptions: { 1: "Little or no public benefit.", 5: "Clear benefit for some stakeholder groups.", 10: "Substantial, wide-reaching improvement in public outcomes." } },
  { key: "increaseRevenue", label: "Increases Revenue", group: "Impact", descriptions: { 1: "Little or no revenue effect.", 5: "Plausible revenue contribution in selected areas.", 10: "Strong potential for material, sustainable revenue growth." } },
  { key: "strategicImpact", label: "Strategic Alignment", group: "Impact", descriptions: { 1: "Weak connection to stated priorities.", 5: "Supports one or more strategic objectives.", 10: "Directly advances major organizational priorities." } },
];

const FEASIBILITY_CRITERIA: Criterion[] = [
  { key: "dataReady", label: "Data & Tool Access", group: "Feasibility", descriptions: { 1: "The agent cannot reliably access the data, tools, or permissions it needs.", 5: "Relevant access exists but needs preparation, controls, or new interfaces.", 10: "The agent has secure, reliable access to suitable data and tools." } },
  { key: "techMature", label: "Agent & Model Maturity", group: "Feasibility", descriptions: { 1: "The required agent behavior is experimental or unreliable.", 5: "The models and agent tools exist but need meaningful validation or adaptation.", 10: "Mature models and agent patterns can reliably perform the work." } },
  { key: "organizationalReadiness", label: "Process Readiness", group: "Feasibility", descriptions: { 1: "The workflow is largely undocumented, highly variable, or dependent on tacit knowledge.", 5: "The main workflow is understood, but rules, exceptions, or human handoffs need clarification.", 10: "Inputs, outputs, decisions, rules, exceptions, and human intervention points are clearly structured." } },
  { key: "implementationEase", label: "Implementation Ease", group: "Feasibility", descriptions: { 1: "The agent requires substantial resources, specialist development, and redesign.", 5: "Moderate implementation and agent configuration effort is required.", 10: "The agent can be implemented with manageable effort and existing capabilities." } },
  { key: "integrationEase", label: "Systems Integration", group: "Feasibility", descriptions: { 1: "Required systems lack usable interfaces, permissions, or compatible deployment options.", 5: "Core integrations appear possible, but APIs, permissions, infrastructure, or third-party dependencies need work.", 10: "Required systems provide compatible interfaces, appropriate permissions, and a viable deployment path." } },
];

const RISK_CONSIDERATIONS: Record<RiskKey, { label: string; description: string }> = {
  dataLeakage: { label: "Data leakage & privacy", description: "The agent may expose sensitive information through its context, memory, outputs, or connected tools." },
  cybersecurity: { label: "Cybersecurity & tool permissions", description: "Agent access to systems and tools could create attack paths, excessive permissions, or unsafe actions." },
  modelReliability: { label: "Reliability & incorrect action", description: "The agent may hallucinate, fail unpredictably, or take an incorrect action based on unreliable output." },
  modelMisalignment: { label: "Agent misalignment", description: "The agent may pursue the wrong goal, interpret instructions poorly, or behave differently from organizational intent." },
  biasFairness: { label: "Bias & fairness", description: "Agent decisions or recommendations may disadvantage groups or reproduce inequities in data and policy." },
  legalCompliance: { label: "Legal & regulatory compliance", description: "Agent actions may conflict with laws, regulations, record-keeping duties, or accountability requirements." },
  safetyHumanOversight: { label: "Safety & human oversight", description: "The agent may act without appropriate approval, escalation, intervention, or a reliable human override." },
  operationalReputation: { label: "Operational & reputational impact", description: "An incorrect agent action could disrupt services, propagate across systems, or reduce public trust." },
};

const COLORS = ["#5d7565", "#8a6f5a", "#6f7e80", "#9a754f", "#7b6862", "#66705d", "#8a665b", "#65767b", "#7c705b", "#6f675f"];

type ComparisonDatum = { criterion: string } & Record<string, string | number>;
const comparisonDataKey = (id: string) => `use-case-${id}`;
const clampScore = (value: number) => Number.isFinite(value) ? Math.max(1, Math.min(10, Math.round(value))) : 5;

function radarData(useCase: UseCase, criteria: Criterion[]) {
  return criteria.map((criterion) => ({ criterion: criterion.label, value: useCase.scores[criterion.key] }));
}

function ScoreEditor({ useCase, criteria, onChange }: { useCase: UseCase; criteria: Criterion[]; onChange: (key: Criterion["key"], value: number) => void }) {
  const [expandedKey, setExpandedKey] = useState<Criterion["key"] | null>(null);
  const toggle = (key: Criterion["key"]) => setExpandedKey((current) => current === key ? null : key);
  return <div className="grid items-start gap-5 sm:grid-cols-2">{criteria.map((criterion) => {
    const expanded = expandedKey === criterion.key;
    return <div key={criterion.key} role="button" tabIndex={0} aria-expanded={expanded} onClick={() => toggle(criterion.key)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(criterion.key); } }} className={`cursor-pointer border-l-4 p-5 transition-[background-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#71867a] ${criterion.group === "Impact" ? "border-[#b97843] bg-[#fff8ef]" : "border-[#4f8074] bg-[#f2f8f5]"}`}>
      <div className="mb-3 flex items-center justify-between gap-3"><div><Label htmlFor={`${useCase.id}-${criterion.key}`} className="text-base">{criterion.label}</Label><div className="mt-1 text-sm text-stone-500">{expanded ? "Hide scoring guidance" : "Show scoring guidance"}</div></div><div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><Input id={`${useCase.id}-${criterion.key}`} type="number" min={1} max={10} className="h-10 w-20 bg-white text-center text-base font-semibold" value={useCase.scores[criterion.key]} onChange={(event) => onChange(criterion.key, Number(event.target.value))} /></div></div>
      <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><input type="range" min={1} max={10} className={`w-full ${criterion.group === "Impact" ? "accent-[#a86634]" : "accent-[#47766b]"}`} value={useCase.scores[criterion.key]} onChange={(event) => onChange(criterion.key, Number(event.target.value))} /></div>
      <div className={`grid transition-[grid-template-rows,opacity,margin] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${expanded ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden"><div className="space-y-2 border-t border-stone-300/70 pt-4 text-sm leading-6 text-stone-600"><p><strong>1:</strong> {criterion.descriptions[1]}</p><p><strong>5:</strong> {criterion.descriptions[5]}</p><p><strong>10:</strong> {criterion.descriptions[10]}</p></div></div></div>
    </div>;
  })}</div>;
}

export default function AISpiderCharts({ project, onChange, section }: { project: StrategyProject; onChange: (project: StrategyProject) => void; section: "problems" | "evaluation" }) {
  const [selectedId, setSelectedId] = useState(project.useCases[0]?.id ?? "");
  const [comparisonGroup, setComparisonGroup] = useState<"Impact" | "Feasibility">("Impact");
  const chartRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const active = project.useCases.find((useCase) => useCase.id === selectedId) ?? project.useCases[0];

  useEffect(() => {
    if (!project.useCases.some((useCase) => useCase.id === selectedId)) setSelectedId(project.useCases[0]?.id ?? "");
  }, [project.useCases, selectedId]);

  const updateUseCase = (id: string, update: (useCase: UseCase) => UseCase) => onChange({ ...project, useCases: project.useCases.map((useCase) => useCase.id === id ? update(useCase) : useCase) });
  const addUseCase = () => {
    const useCase = createUseCase();
    onChange({ ...project, useCases: [...project.useCases, useCase] });
    setSelectedId(useCase.id);
  };
  const removeUseCase = (id: string) => {
    if (!window.confirm("Delete this use case? Its saved matrix position will also be removed.")) return;
    const manualPlacements = { ...project.manualPlacements };
    const portfolioDecisions = { ...project.portfolioDecisions };
    delete manualPlacements[id];
    delete portfolioDecisions[id];
    onChange({ ...project, useCases: project.useCases.filter((useCase) => useCase.id !== id), problems: project.problems.map((problem) => ({ ...problem, linkedUseCaseIds: problem.linkedUseCaseIds.filter((useCaseId) => useCaseId !== id) })), manualPlacements, portfolioDecisions });
  };
  const download = async (element: HTMLDivElement | null, filename: string) => {
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 3, backgroundColor: "#ffffff" });
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = filename;
    anchor.click();
  };

  const comparisonCriteria = comparisonGroup === "Impact" ? IMPACT_CRITERIA : FEASIBILITY_CRITERIA;
  const comparisonData = useMemo(() => comparisonCriteria.map((criterion) => {
    const row: ComparisonDatum = { criterion: criterion.label };
    project.useCases.forEach((useCase) => { row[comparisonDataKey(useCase.id)] = useCase.scores[criterion.key]; });
    return row;
  }), [comparisonCriteria, project.useCases]);
  const rankings = useMemo(() => project.useCases.map((useCase) => ({ useCase, impact: calculateImpactScore(useCase, project.impactWeights), feasibility: calculateFeasibilityScore(useCase, project.readinessScores), risk: getRiskBand(useCase) })), [project.useCases, project.impactWeights, project.readinessScores]);

  if (section === "problems") return <UseCaseDefinitionWorkspace project={project} active={active} selectedId={selectedId} setSelectedId={setSelectedId} addUseCase={addUseCase} removeUseCase={removeUseCase} updateUseCase={updateUseCase} />;

  return <div className="space-y-8">
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-5 border-b border-stone-300 pb-7 sm:flex-row sm:items-end"><h2 className="text-4xl font-semibold tracking-tight text-stone-950">Evaluate Agentic Solutions</h2><Button className="bg-[#4f6156] hover:bg-[#405047]" onClick={addUseCase}><Plus className="mr-2 h-4 w-4" /> Add agentic solution</Button></header>
      <Alert className="border-[#d7c4aa] bg-[#fff7e9] p-5"><AlertTitle>How scores are adjusted</AlertTitle><AlertDescription>The <strong>raw impact score</strong> is the simple average of the five impact ratings. The <strong>adjusted impact score</strong> applies your strategic priorities, the problem’s importance, and the overall risk penalty. Feasibility uses a nonlinear compound adjustment: when a solution is weak on a metric and the department is also weak on the readiness capabilities supporting it, that metric is reduced much more sharply.</AlertDescription></Alert>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <Card className="border-stone-300 bg-[#fffdf9] shadow-sm"><CardHeader className="space-y-4 border-b border-stone-200 bg-[#f8f5ee]"><CardTitle>Agentic Solutions</CardTitle><div className="flex gap-3 overflow-x-auto pb-2">{project.useCases.map((useCase, index) => <Button key={useCase.id} variant={active?.id === useCase.id ? "default" : "outline"} onClick={() => setSelectedId(useCase.id)} className="h-auto shrink-0 px-4 py-3">{index + 1}. {useCase.name || "Untitled"}</Button>)}</div></CardHeader><CardContent className="pt-7">{!active ? <p className="py-12 text-center text-sm text-stone-500">Add an agentic solution to begin.</p> : <div className="space-y-10">
          <div className="flex flex-wrap justify-end gap-2"><Button variant={active.visible ? "secondary" : "outline"} onClick={() => updateUseCase(active.id, (value) => ({ ...value, visible: !value.visible }))}>{active.visible ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}{active.visible ? "Shown in comparison" : "Hidden from comparison"}</Button><Button variant="outline" onClick={() => removeUseCase(active.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete use case</Button></div>
          <div><div className="mb-5 flex items-center gap-3 border-b-2 border-[#e6c89f] bg-[#fff9ef] p-5"><span className="grid h-10 w-10 shrink-0 place-items-center bg-white text-[#956436]"><Target className="h-5 w-5" /></span><div><h3 className="text-xl font-semibold text-stone-900">Use-case impact</h3><p className="mt-1 text-sm text-stone-600">Raw impact <strong>{calculateRawImpactScore(active).toFixed(1)}</strong> · after strategic priorities, problem importance, and risk <strong>{calculateImpactScore(active, project.impactWeights)?.toFixed(1) ?? "—"}</strong></p></div></div><ScoreEditor useCase={active} criteria={IMPACT_CRITERIA} onChange={(key, value) => updateUseCase(active.id, (item) => ({ ...item, scores: { ...item.scores, [key]: clampScore(value) } }))} /></div>
          <div><div className="mb-5 flex items-center gap-3 border-b-2 border-[#bdd4cc] bg-[#f3f9f6] p-5"><span className="grid h-10 w-10 shrink-0 place-items-center bg-white text-[#4f766d]"><Wrench className="h-5 w-5" /></span><div><h3 className="text-xl font-semibold text-stone-900">Use-case feasibility</h3><p className="mt-1 text-sm text-stone-600">Raw feasibility <strong>{calculateRawFeasibilityScore(active).toFixed(1)}</strong> · after nonlinear readiness adjustment <strong>{calculateFeasibilityScore(active, project.readinessScores).toFixed(1)}</strong></p></div></div><ScoreEditor useCase={active} criteria={FEASIBILITY_CRITERIA} onChange={(key, value) => updateUseCase(active.id, (item) => ({ ...item, scores: { ...item.scores, [key]: clampScore(value) } }))} /></div>
          <RiskAssessmentEditor useCase={active} update={(update) => updateUseCase(active.id, update)} />
        </div>}</CardContent></Card>
        <div className="space-y-6">
          <ComparisonChart project={project} group={comparisonGroup} setGroup={setComparisonGroup} data={comparisonData} chartRef={chartRef} download={download} />
          <DetailCharts active={active} project={project} detailRef={detailRef} download={download} />
          <Card><CardHeader><CardTitle>Agentic Solution Ranking</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-stone-500"><th className="py-2">Agentic solution</th><th>Impact</th><th>Feasibility</th><th>Overall risk</th></tr></thead><tbody>{[...rankings].sort((a,b) => (b.impact ?? -1) - (a.impact ?? -1)).map(({useCase,impact,feasibility,risk}) => <tr key={useCase.id} className="border-b last:border-0"><td className="py-2 pr-3 font-medium">{useCase.name}</td><td>{impact?.toFixed(1) ?? "—"}</td><td>{feasibility.toFixed(1)}</td><td>{risk}</td></tr>)}</tbody></table></div></CardContent></Card>
        </div>
      </div>
    </section>
  </div>;
}

function UseCaseDefinitionWorkspace({
  project,
  active,
  selectedId,
  setSelectedId,
  addUseCase,
  removeUseCase,
  updateUseCase,
}: {
  project: StrategyProject;
  active: UseCase | undefined;
  selectedId: string;
  setSelectedId: (id: string) => void;
  addUseCase: () => void;
  removeUseCase: (id: string) => void;
  updateUseCase: (id: string, update: (useCase: UseCase) => UseCase) => void;
}) {
  return <div className="space-y-8">
    <header className="border-b border-stone-300 pb-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="text-4xl font-semibold tracking-tight text-stone-950">Define Agentic Solutions</h2>
        <Button className="bg-[#4f6156] hover:bg-[#405047]" onClick={addUseCase}><Plus className="mr-2 h-4 w-4" /> Add agentic solution</Button>
      </div>
    </header>

    {!active ? <section className="border border-dashed border-stone-300 bg-[#fffdf9] p-12 text-center"><Lightbulb className="mx-auto h-9 w-9 text-stone-500" /><h3 className="mt-3 text-lg font-semibold text-stone-900">No agentic solutions yet</h3><p className="mt-2 text-stone-600">Add a solution; its evaluation will begin at a neutral midpoint.</p><Button className="mt-5 bg-[#4f6156] hover:bg-[#405047]" onClick={addUseCase}><Plus className="mr-2 h-4 w-4" /> Add first agentic solution</Button></section> : <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="self-start border-t-4 border-[#a8c4b8] bg-[#f3f9f6] p-4 lg:sticky lg:top-32"><div className="px-2 pb-3 text-sm font-semibold uppercase tracking-wider text-[#4b665a]">Agentic solutions</div><div className="space-y-2">{project.useCases.map((useCase, index) => <button key={useCase.id} type="button" onClick={() => setSelectedId(useCase.id)} className={`w-full border-l-4 px-4 py-4 text-left transition ${selectedId === useCase.id ? "border-[#789b8c] bg-white" : "border-transparent bg-white/50 hover:bg-white"}`}><span className="block text-xs font-medium uppercase tracking-wider text-stone-500">Solution {index + 1}</span><span className="mt-1 block font-medium leading-5 text-stone-900">{useCase.name || "Untitled solution"}</span></button>)}</div></aside>
      <Card className="border-stone-200 bg-[#fffdf9]"><CardHeader className="flex flex-row items-start justify-between border-b border-stone-200"><div><CardTitle>Agentic solution details</CardTitle><p className="mt-1 text-sm text-stone-500">These answers travel with this solution into evaluation and prioritization.</p></div><Button variant="outline" onClick={() => removeUseCase(active.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button></CardHeader><CardContent className="space-y-6 pt-6">
        <div className="space-y-4"><div><Label>Agentic solution name</Label><Input placeholder="e.g. Permit review agent" value={active.name} onChange={(event) => updateUseCase(active.id, (item) => ({ ...item, name: event.target.value }))} /></div><div><Label>What would the agent do?</Label><Textarea rows={6} placeholder="Describe the agent in a short paragraph: the goal it would pursue, the tasks and decisions it would handle, the data and tools it would use, where a person would review its work, and what outcome it should improve." value={active.description} onChange={(event) => updateUseCase(active.id, (item) => ({ ...item, description: event.target.value }))} /></div></div>
        <div className="rounded-xl border border-stone-200 bg-[#f6f2eb] p-5"><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eee4d8] text-[#876949]"><Lightbulb className="h-4 w-4" /></span><div><h3 className="font-semibold text-stone-900">Organizational problem</h3><p className="text-sm text-stone-500">Describe the need without turning it into a process-mapping exercise.</p></div></div><div className="space-y-4"><div><Label>What problem does this agentic solution solve?</Label><Textarea rows={3} placeholder="What is slow, costly, inconsistent, inaccessible, or currently missed?" value={active.problemStatement} onChange={(event) => updateUseCase(active.id, (item) => ({ ...item, problemStatement: event.target.value }))} /></div><div><Label>What process would it improve or replace?</Label><Input placeholder="Name the process or workflow, if there is one" value={active.processAffected} onChange={(event) => updateUseCase(active.id, (item) => ({ ...item, processAffected: event.target.value }))} /></div><div><Label>Who is affected by this problem?</Label><Input placeholder="Residents, staff, businesses, partners…" value={active.affectedStakeholders} onChange={(event) => updateUseCase(active.id, (item) => ({ ...item, affectedStakeholders: event.target.value }))} /></div><div><Label>How important is the problem? <span className="font-normal text-stone-500">{active.problemImportance === 0 ? "Not rated" : `${active.problemImportance}/5`}</span></Label><div className="mt-2 grid grid-cols-5 gap-2">{([1,2,3,4,5] as const).map((value) => <Button key={value} type="button" variant={active.problemImportance === value ? "default" : "outline"} className={active.problemImportance === value ? "bg-[#655e55] hover:bg-[#554f48]" : "border-stone-300 bg-white"} onClick={() => updateUseCase(active.id, (item) => ({ ...item, problemImportance: value }))}>{value}</Button>)}</div><div className="mt-2 flex justify-between text-xs text-stone-500"><span>1 · Limited</span><span>3 · Important</span><span>5 · Critical</span></div><p className="mt-3 text-sm leading-6 text-stone-500">Yes—every level affects adjusted impact slightly: 1/5 = −5%, 2/5 = −2.5%, 3/5 = no change, 4/5 = +2.5%, and 5/5 = +5%. The detailed impact ratings remain the main driver.</p></div></div></div>
      </CardContent></Card>
    </div>}
  </div>;
}

function RiskAssessmentEditor({ useCase, update }: { useCase: UseCase; update: (fn: (useCase: UseCase) => UseCase) => void }) {
  const penalty = calculateRiskImpactPenalty(useCase);
  const ratedCount = Object.values(useCase.risk.ratings).filter((rating) => rating !== "not_set").length;
  const overall = getRiskBand(useCase);
  const options: { value: Exclude<RiskRating, "not_set">; label: string; selected: string }[] = [
    { value: "low", label: "Low", selected: "border-[#7c9583] bg-[#e8efe9] text-[#41594a]" },
    { value: "medium", label: "Medium", selected: "border-[#c49a62] bg-[#f5ead9] text-[#785b36]" },
    { value: "high", label: "High", selected: "border-[#b87a70] bg-[#f3e3e0] text-[#7b443d]" },
  ];
  return <section className="border border-[#e1c4bd] bg-[#fffaf8]">
    <div className="flex flex-col justify-between gap-5 border-b-2 border-[#e6c3bd] bg-[#fff3f0] p-5 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center bg-white text-[#8b5148]"><ShieldAlert className="h-5 w-5" /></span><div><h3 className="text-xl font-semibold text-stone-900">Risk assessment</h3><p className="mt-1 text-sm text-stone-600">Rate all eight considerations. Their average creates one overall risk penalty that reduces adjusted impact.</p></div></div><div className="border border-[#e5c5bf] bg-white px-4 py-3 text-sm"><div><strong>{overall}</strong> overall risk · {ratedCount}/8 rated</div><div className="mt-1 text-stone-500">Impact reduction: <strong>{penalty.toFixed(2)} points</strong></div></div></div>
    <div className="grid gap-5 p-5 lg:grid-cols-2">{RISK_KEYS.map((key) => { const consideration = RISK_CONSIDERATIONS[key]; const rating = useCase.risk.ratings[key]; return <div key={key} className="border-l-4 border-[#d7aaa2] bg-white p-5"><h4 className="font-medium text-stone-900">{consideration.label}</h4><p className="mt-2 min-h-12 text-sm leading-6 text-stone-500">{consideration.description}</p><div className="mt-4 grid grid-cols-3 gap-2">{options.map((option) => <button key={option.value} type="button" onClick={() => update((item) => ({ ...item, risk: { ratings: { ...item.risk.ratings, [key]: option.value }, legacyOverallLevel: undefined } }))} className={`border px-2 py-2.5 text-sm font-medium transition ${rating === option.value ? option.selected : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}>{option.label}</button>)}</div></div>; })}</div>
    <div className="border-t border-stone-200 px-4 py-3 text-sm leading-6 text-stone-500">Complete all eight ratings to calculate an overall agent risk penalty. Until then, no aggregate penalty is applied and you can continue to any workshop stage. Low = 1, Medium = 2, High = 3; the completed average reduces adjusted impact by up to 1.5 points. Risk does not change feasibility.</div>
  </section>;
}

function ComparisonChart({ project, group, setGroup, data, chartRef, download }: { project: StrategyProject; group: "Impact" | "Feasibility"; setGroup: (group: "Impact" | "Feasibility") => void; data: ComparisonDatum[]; chartRef: React.RefObject<HTMLDivElement | null>; download: (element: HTMLDivElement | null, filename: string) => void }) {
  return <Card><CardHeader className="flex flex-row items-start justify-between"><div><CardTitle>Comparison Radar</CardTitle><div className="mt-3 flex gap-2"><Button variant={group === "Impact" ? "default" : "outline"} onClick={() => setGroup("Impact")}>Compare Impact</Button><Button variant={group === "Feasibility" ? "default" : "outline"} onClick={() => setGroup("Feasibility")}>Compare Feasibility</Button></div></div><Button variant="outline" onClick={() => download(chartRef.current, `${group.toLowerCase()}-comparison.png`)}><Download className="mr-2 h-4 w-4" /> PNG</Button></CardHeader><CardContent><div ref={chartRef} className="min-h-[460px] w-full bg-white"><ResponsiveContainer width="100%" height={380}><RadarChart data={data} outerRadius="70%"><PolarGrid /><PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} /><PolarRadiusAxis domain={[0,10]} tickCount={6} />{project.useCases.map((useCase, index) => useCase.visible && <Radar key={useCase.id} name={useCase.name || `Use Case ${index + 1}`} dataKey={comparisonDataKey(useCase.id)} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.12} />)}<RechartsTooltip /></RadarChart></ResponsiveContainer><div className="flex flex-wrap justify-center gap-3">{project.useCases.map((useCase, index) => useCase.visible && <span key={useCase.id} className="flex items-center gap-2 text-xs"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{useCase.name}</span>)}</div></div></CardContent></Card>;
}

function DetailCharts({ active, project, detailRef, download }: { active: UseCase | undefined; project: StrategyProject; detailRef: React.RefObject<HTMLDivElement | null>; download: (element: HTMLDivElement | null, filename: string) => void }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="inline-flex items-center gap-2"><BarChart2 className="h-5 w-5" />{active?.name || "Use Case"} — Detail</CardTitle><Button variant="outline" disabled={!active} onClick={() => download(detailRef.current, `${active?.name || "use-case"}-detail.png`)}><Download className="mr-2 h-4 w-4" /> PNG</Button></CardHeader><CardContent ref={detailRef} className="bg-white">{active && <div className="space-y-5"><div className="grid gap-3 rounded-lg bg-[#f6f2eb] p-4 text-sm sm:grid-cols-2"><span>Raw impact: <strong>{calculateRawImpactScore(active).toFixed(1)}</strong></span><span>Adjusted impact: <strong>{calculateImpactScore(active, project.impactWeights)?.toFixed(1) ?? "—"}</strong></span><span>Raw feasibility: <strong>{calculateRawFeasibilityScore(active).toFixed(1)}</strong></span><span>Adjusted feasibility: <strong>{calculateFeasibilityScore(active, project.readinessScores).toFixed(1)}</strong></span></div><div className="grid gap-4 md:grid-cols-2"><div><h4 className="text-center text-sm font-semibold text-stone-800">Raw Impact Ratings</h4><ResponsiveContainer width="100%" height={280}><RadarChart data={radarData(active, IMPACT_CRITERIA)} outerRadius="65%"><PolarGrid /><PolarAngleAxis dataKey="criterion" tick={{fontSize:10}} /><PolarRadiusAxis domain={[0,10]} /><Radar dataKey="value" stroke="#8a6847" fill="#b88a5d" fillOpacity={0.16} /><RechartsTooltip /></RadarChart></ResponsiveContainer></div><div><h4 className="text-center text-sm font-semibold text-stone-800">Raw Feasibility Ratings</h4><ResponsiveContainer width="100%" height={280}><RadarChart data={radarData(active, FEASIBILITY_CRITERIA)} outerRadius="65%"><PolarGrid /><PolarAngleAxis dataKey="criterion" tick={{fontSize:10}} /><PolarRadiusAxis domain={[0,10]} /><Radar dataKey="value" stroke="#58706b" fill="#78918b" fillOpacity={0.16} /><RechartsTooltip /></RadarChart></ResponsiveContainer></div></div></div>}</CardContent></Card>;
}
