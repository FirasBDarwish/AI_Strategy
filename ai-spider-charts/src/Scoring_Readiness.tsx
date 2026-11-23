import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StrategicWeights } from "@/features/strategy/StrategicWeights";
import { clearStoredProject, createDefaultProject, loadStoredProject, migrateProject, saveStoredProject } from "@/lib/project";
import { isValidImpactWeights } from "@/lib/scoring";
import type { ReadinessKey, ReadinessScores, StrategyProject, WorkshopStep } from "@/types/strategy";
import AISpiderCharts from "./AISpiderCharts";
import ImpactFeasibility from "./ImpactFeasibility";
import { BarChart3, ClipboardCheck, Compass, Lightbulb, Route, RotateCcw, Target } from "lucide-react";

const READINESS: { key: ReadinessKey; label: string; help: { one: string; three: string; five: string } }[] = [
  { key: "dataMaturity", label: "Data Maturity", help: { one: "Most information is trapped in PDFs, spreadsheets, or siloed systems", three: "Some structured data is available, but inconsistent or fragmented", five: "Clean, accessible, interoperable datasets are readily usable for AI" } },
  { key: "peopleSkills", label: "People & Skills", help: { one: "Little to no AI awareness among staff", three: "Basic literacy in some teams, but limited expertise", five: "Strong champions with dedicated expertise inside the department" } },
  { key: "processesWorkflows", label: "Processes & Workflows", help: { one: "Highly ad-hoc, undocumented ways of working", three: "Some consistency, but gaps or bottlenecks exist", five: "Clearly defined, standardized workflows" } },
  { key: "governanceRisk", label: "Governance & Risk", help: { one: "No oversight or policies for AI use", three: "Draft or informal policies are in place", five: "Clear guardrails, accountability mechanisms, and risk frameworks" } },
  { key: "resourcesBudget", label: "Resources & Budget", help: { one: "No funds, staff time, or executive support available", three: "Some resources are identified but not dedicated", five: "Dedicated funding and leadership support for AI pilots" } },
  { key: "techInfra", label: "Technology Infrastructure", help: { one: "Outdated systems with low integration", three: "Some modern systems with interoperability challenges", five: "Robust, modern, well-integrated IT environment" } },
  { key: "changeReadiness", label: "Change Readiness / Culture", help: { one: "Resistance to new ways of working", three: "Some openness, but skepticism or silos remain", five: "Strong culture of experimentation, improvement, and adaptation" } },
  { key: "leadershipAlignment", label: "Leadership & Strategic Alignment", help: { one: "No AI strategy and leadership is not engaged", three: "Some leaders show interest, but strategic alignment is limited", five: "Clear leadership vision explicitly ties AI to department strategy" } },
  { key: "partnerships", label: "Partnerships & External Ecosystem", help: { one: "No collaboration with academia, vendors, or peers", three: "Some ad-hoc relationships but few formal partnerships", five: "Active partnerships provide expertise, resources, or benchmarking" } },
  { key: "citizenOrientation", label: "Citizen/Stakeholder Orientation", help: { one: "No structured approach to understanding user needs", three: "Some consultation but limited feedback loops", five: "Continuous stakeholder feedback informs design and evaluation" } },
  { key: "ethicsTrust", label: "Ethics & Public Trust", help: { one: "Little consideration of ethical implications", three: "Ethical concerns arise occasionally but not systematically", five: "Fairness, bias, transparency, and public trust are actively addressed" } },
];

function clampReadiness(value: number) {
  return Number.isFinite(value) ? Math.max(1, Math.min(5, Math.round(value))) : 1;
}

function readinessBand(score: number) {
  if (score < 2.5) return { label: "Foundational", classes: "border-red-200 bg-red-100 text-red-700" };
  if (score < 3.75) return { label: "Emerging", classes: "border-amber-200 bg-amber-100 text-amber-800" };
  return { label: "Ready", classes: "border-emerald-200 bg-emerald-100 text-emerald-800" };
}

function ReadinessSummary({ scores }: { scores: ReadinessScores }) {
  const average = READINESS.reduce((sum, item) => sum + scores[item.key], 0) / READINESS.length;
  const band = readinessBand(average);
  return <Card className="border-stone-200 bg-[#fffdf9]"><CardHeader><CardTitle>Overall Readiness</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between text-sm text-stone-600"><span>Score</span><span className={`rounded-full border px-2 py-0.5 ${band.classes}`}>{band.label}</span></div><div className="h-3 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-[#596a5f]" style={{ width: `${((average - 1) / 4) * 100}%` }} /></div><p className="text-sm text-stone-600">Average: <strong>{average.toFixed(2)}</strong> / 5</p><p className="text-sm leading-6 text-stone-500">These scores moderate the related feasibility criteria. Stage 3 then shows which readiness improvements could help the most valuable use cases become more achievable.</p></CardContent></Card>;
}

function DepartmentReadiness({ project, onChange, section }: { project: StrategyProject; onChange: (project: StrategyProject) => void; section: "assessment" | "priorities" }) {
  const scores = project.readinessScores;
  const update = (key: ReadinessKey, value: number) => onChange({ ...project, readinessScores: { ...scores, [key]: clampReadiness(value) } });
  return <div className="space-y-6">
    {section === "assessment" ? <>
      <header className="border-b border-stone-300 pb-7"><h1 className="text-4xl font-semibold tracking-tight text-stone-950">Readiness Assessment</h1><p className="mt-3 max-w-4xl text-base leading-7 text-stone-600">Score the capabilities available today. These ratings directly affect use-case feasibility.</p></header>
      <Alert className="border-stone-200 bg-[#fffdf9]"><AlertTitle>How to score</AlertTitle><AlertDescription>Use 1, 3, or 5 as anchors. Scores 2 and 4 are appropriate for states between those anchors.</AlertDescription></Alert>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="border-stone-200 bg-[#fffdf9]"><CardHeader className="border-b border-stone-200 bg-[#f6f2eb]"><CardTitle>Capability assessment</CardTitle></CardHeader><CardContent className="pt-6">
          <Tabs defaultValue={READINESS[0].key}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-stone-100 p-2">{READINESS.map((item) => <TabsTrigger key={item.key} value={item.key} className="whitespace-normal data-[state=active]:bg-[#596a5f] data-[state=active]:text-white">{item.label}</TabsTrigger>)}</TabsList>
            {READINESS.map((item) => <TabsContent key={item.key} value={item.key} className="mt-5"><div className="space-y-4 rounded-xl border border-stone-200 bg-[#f6f2eb] p-5"><Label className="text-lg font-semibold text-stone-900">{item.label}</Label><div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map((number) => <TooltipProvider key={number}><Tooltip><TooltipTrigger asChild><Button variant={scores[item.key] === number ? "default" : "outline"} className={scores[item.key] === number ? "bg-[#596a5f] hover:bg-[#49584f]" : "border-stone-300 bg-[#fffdf9]"} onClick={() => update(item.key, number)}>{number}</Button></TooltipTrigger><TooltipContent className="max-w-xs">{number === 1 ? item.help.one : number === 3 ? item.help.three : number === 5 ? item.help.five : `Between ${number === 2 ? "1 and 3" : "3 and 5"}.`}</TooltipContent></Tooltip></TooltipProvider>)}</div><div className="grid gap-2 text-sm text-stone-600 sm:grid-cols-3"><p className="rounded-lg border border-stone-200 bg-[#fffdf9] p-3"><strong>1 · Starting:</strong><br />{item.help.one}</p><p className="rounded-lg border border-stone-200 bg-[#fffdf9] p-3"><strong>3 · Developing:</strong><br />{item.help.three}</p><p className="rounded-lg border border-stone-200 bg-[#fffdf9] p-3"><strong>5 · Strong:</strong><br />{item.help.five}</p></div></div></TabsContent>)}
          </Tabs>
        </CardContent></Card>
        <div className="space-y-6"><ReadinessSummary scores={scores} /><Card className="border-stone-200 bg-[#fffdf9]"><CardHeader><CardTitle>Dimension Breakdown</CardTitle></CardHeader><CardContent className="space-y-3">{READINESS.map((item) => <div key={item.key}><div className="mb-1 flex justify-between text-sm text-stone-700"><span>{item.label}</span><strong>{scores[item.key]}/5</strong></div><div className="h-2.5 rounded bg-stone-100"><div className="h-2.5 rounded bg-[#7b877d]" style={{ width: `${scores[item.key] * 20}%` }} /></div></div>)}</CardContent></Card></div>
      </div>
    </> : <><header className="border-b border-stone-300 pb-7"><h1 className="text-4xl font-semibold tracking-tight text-stone-950">Strategic Priorities</h1><p className="mt-3 max-w-4xl text-base leading-7 text-stone-600">Set how much each outcome influences use-case impact.</p></header><StrategicWeights weights={project.impactWeights} onChange={(impactWeights) => onChange({ ...project, impactWeights })} /></>}
  </div>;
}

type SubsectionKey = "assessment" | "priorities" | "problems" | "evaluation" | "matrix" | "roadmap";

const SUBSECTIONS: Record<WorkshopStep, { key: SubsectionKey; label: string; icon: typeof Target; colors: string }[]> = {
  readiness: [
    { key: "assessment", label: "Readiness Assessment", icon: ClipboardCheck, colors: "border-[#ddb77e] bg-[#fff9ef] text-stone-900" },
    { key: "priorities", label: "Strategic Priorities", icon: Target, colors: "border-[#ddb77e] bg-[#fff9ef] text-stone-900" },
  ],
  scoring: [
    { key: "problems", label: "Define Agentic Solutions", icon: Lightbulb, colors: "border-[#9bbbad] bg-[#f3f9f6] text-stone-900" },
    { key: "evaluation", label: "Evaluate Agentic Solutions", icon: BarChart3, colors: "border-[#9bbbad] bg-[#f3f9f6] text-stone-900" },
  ],
  prioritization: [
    { key: "matrix", label: "Portfolio Matrix", icon: Compass, colors: "border-[#9db8c9] bg-[#f3f8fb] text-stone-900" },
    { key: "roadmap", label: "Three Horizons Roadmap", icon: Route, colors: "border-[#9db8c9] bg-[#f3f8fb] text-stone-900" },
  ],
};

function StageSubnav({ step, active, onChange }: { step: WorkshopStep; active: SubsectionKey; onChange: (key: SubsectionKey) => void }) {
  return <nav aria-label="Stage activities" className="mt-8 border-t border-stone-200 pt-6"><div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">In this stage</div><div className="space-y-2">{SUBSECTIONS[step].map((item) => { const Icon = item.icon; const selected = active === item.key; return <button key={item.key} type="button" onClick={() => onChange(item.key)} className={`flex w-full items-center gap-3 border-l-4 px-4 py-4 text-left text-sm font-semibold transition-[background-color,border-color,transform] duration-300 ease-out hover:translate-x-1 ${selected ? item.colors : "border-transparent bg-transparent text-stone-600 hover:bg-white"}`}><Icon className="h-5 w-5 shrink-0" /><span>{item.label}</span></button>; })}</div></nav>;
}

function WorkshopJourney({ step, onChange, weightsValid }: { step: WorkshopStep; onChange: (step: WorkshopStep) => void; weightsValid: boolean }) {
  const stages: { key: WorkshopStep; title: string; icon: typeof Target; selected: string }[] = [
    { key: "readiness", title: "Understand", icon: ClipboardCheck, selected: "border-[#ddb77e] bg-[#fff9ef]" },
    { key: "scoring", title: "Define & Evaluate", icon: Lightbulb, selected: "border-[#9bbbad] bg-[#f3f9f6]" },
    { key: "prioritization", title: "Prioritize & Roadmap", icon: Compass, selected: "border-[#9db8c9] bg-[#f3f8fb]" },
  ];
  return <nav aria-label="Workshop pathway"><div className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Workshop pathway</div><div className="space-y-2">{stages.map((item, index) => { const Icon = item.icon; const selected = step === item.key; return <button key={item.key} type="button" onClick={() => onChange(item.key)} className={`flex w-full items-center gap-4 border-l-4 px-4 py-5 text-left transition-[background-color,border-color,transform] duration-300 ease-out hover:translate-x-1 ${selected ? `${item.selected} text-stone-900` : "border-transparent text-stone-600 hover:bg-white"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm"><Icon className="h-5 w-5" /></span><span><span className="block text-xs font-semibold uppercase tracking-wider text-stone-500">Stage {index + 1}</span><span className="mt-1 block text-base font-semibold">{item.title}</span></span></button>; })}</div>{!weightsValid && <p className="mt-4 border-l-2 border-amber-400 pl-3 text-sm leading-5 text-amber-800">Strategic priorities must total 100% for adjusted impact scores.</p>}</nav>;
}

export default function AIReadinessAndScoring() {
  const demoMode = useMemo(() => new URLSearchParams(window.location.search).get("mode") === "demo", []);
  const [step, setStep] = useState<WorkshopStep>("readiness");
  const [subsections, setSubsections] = useState<Record<WorkshopStep, SubsectionKey>>({ readiness: "assessment", scoring: "problems", prioritization: "matrix" });
  const [project, setProject] = useState<StrategyProject>(() => demoMode ? createDefaultProject() : loadStoredProject() ?? createDefaultProject());
  const [saveStatus, setSaveStatus] = useState<"saved" | "error">("saved");
  const initialized = useRef(false);

  useEffect(() => {
    if (demoMode) return;
    if (!initialized.current) initialized.current = true;
    const timeout = window.setTimeout(() => setSaveStatus(saveStoredProject(project) ? "saved" : "error"), 300);
    return () => window.clearTimeout(timeout);
  }, [demoMode, project]);

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ ...project, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ai-strategy-project-v2.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importProject = (payload: unknown) => {
    try {
      const migrated = migrateProject(payload);
      setProject(migrated);
      window.alert("Project imported successfully.");
    } catch (error) {
      window.alert(error instanceof Error ? `Import failed: ${error.message}` : "Import failed. The existing project was not changed.");
    }
  };

  const resetProject = () => {
    if (!window.confirm("Reset the entire project? Export first if you want to keep a copy.")) return;
    clearStoredProject();
    setProject(createDefaultProject());
    setStep("readiness");
    setSubsections({ readiness: "assessment", scoring: "problems", prioritization: "matrix" });
  };

  const weightsValid = isValidImpactWeights(project.impactWeights);
  const steps: { key: WorkshopStep; label: string; short: string }[] = [
    { key: "readiness", label: "Readiness & Priorities", short: "Understand" },
    { key: "scoring", label: "Agentic Solutions", short: "Define" },
    { key: "prioritization", label: "Prioritize & Roadmap", short: "Decide" },
  ];

  const navigateStep = (nextStep: WorkshopStep) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return <TooltipProvider><div className="min-h-screen bg-[#f6f3ec] px-4 py-6 sm:px-8 sm:py-10"><div className="mx-auto max-w-[1600px]">
    <header className="flex flex-col justify-between gap-6 border-b border-stone-300 pb-8 sm:flex-row sm:items-end"><div><div className="flex items-center gap-4"><img src={`${import.meta.env.BASE_URL}uae_flag.png`} alt="United Arab Emirates flag" className="h-14 w-14 rounded-lg border border-stone-200 object-cover shadow-sm" /><h1 className="text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">AI Strategy Workshop</h1></div><div className={`mt-3 pl-[4.5rem] text-sm font-medium ${saveStatus === "saved" ? "text-stone-500" : "text-red-700"}`}>{demoMode ? "Demo mode · changes are not saved" : saveStatus === "saved" ? "Saved locally" : "Local save unavailable · export a backup"}</div></div><Button variant="outline" className="border-stone-300 bg-white" onClick={resetProject}><RotateCcw className="mr-2 h-4 w-4" /> Reset project</Button></header>
    <div className="mt-10 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-16">
      <aside className="self-start border-r border-stone-300 pr-6 lg:sticky lg:top-8"><WorkshopJourney step={step} onChange={navigateStep} weightsValid={weightsValid} /><StageSubnav step={step} active={subsections[step]} onChange={(key) => { setSubsections((current) => ({ ...current, [step]: key })); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></aside>
      <main key={`${step}-${subsections[step]}`} className="workshop-panel min-w-0 space-y-10"><header className="border-b border-stone-300 pb-7"><span className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Stage {steps.findIndex((item) => item.key === step) + 1}</span><h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">{steps.find((item) => item.key === step)?.label}</h2></header>
        {step === "readiness" && <DepartmentReadiness project={project} onChange={setProject} section={subsections.readiness as "assessment" | "priorities"} />}
        {step === "scoring" && <AISpiderCharts project={project} onChange={setProject} section={subsections.scoring as "problems" | "evaluation"} />}
        {step === "prioritization" && <ImpactFeasibility project={project} onChange={setProject} onExport={exportProject} onImport={importProject} section={subsections.prioritization as "matrix" | "roadmap"} />}
      </main>
    </div>
    <footer className="mt-16 border-t border-stone-300 pt-6 text-center text-sm text-stone-600"><p>Designed by <span className="font-medium">Firas Darwish</span> &amp; <span className="font-medium">Dhiyaa Al Jorf</span></p></footer>
  </div></div></TooltipProvider>;
}
