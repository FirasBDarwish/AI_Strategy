import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, ChevronRight, ChevronLeft } from "lucide-react";
import AISpiderCharts, { UseCase, defaultUseCases } from "./AISpiderCharts";
import ImpactFeasibility from "./ImpactFeasibility";

// -----------------------------
// Department Readiness Self‑Assessment
// -----------------------------

type ReadinessKey =
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

const READINESS: {
  key: ReadinessKey;
  label: string;
  help: { one: string; three: string; five: string };
}[] = [
  {
    key: "dataMaturity",
    label: "Data Maturity",
    help: {
      one: "Most information is trapped in PDFs, spreadsheets, or siloed systems",
      three: "Some structured data available, but inconsistent or fragmented",
      five: "Clean, accessible, and interoperable datasets readily usable for AI",
    },
  },
  {
    key: "peopleSkills",
    label: "People & Skills",
    help: {
      one: "Little to no AI awareness among staff",
      three: "Basic literacy in some teams, but limited expertise",
      five: "Strong champions with dedicated expertise inside the department",
    },
  },
  {
    key: "processesWorkflows",
    label: "Processes & Workflows",
    help: {
      one: "Highly ad‑hoc, undocumented ways of working",
      three: "Some consistency, but gaps or bottlenecks exist",
      five: "Clearly defined, standardised workflows",
    },
  },
  {
    key: "governanceRisk",
    label: "Governance & Risk",
    help: {
      one: "No oversight or policies for AI use",
      three: "Draft or informal policies in place",
      five: "Clear guardrails, accountability mechanisms, and risk frameworks",
    },
  },
  {
    key: "resourcesBudget",
    label: "Resources & Budget",
    help: {
      one: "No funds, staff time, or executive support available",
      three: "Some resources identified but not dedicated",
      five: "Dedicated funding and leadership support for AI pilots",
    },
  },
  {
    key: "techInfra",
    label: "Technology Infrastructure",
    help: {
      one: "Outdated systems, low integration",
      three: "Some modern systems but with interoperability challenges",
      five: "Robust, modern, well‑integrated IT environment",
    },
  },
  {
    key: "changeReadiness",
    label: "Change Readiness / Culture",
    help: {
      one: "Resistant to new ways of working",
      three: "Some openness, but skepticism or silos remain",
      five: "Strong culture of experimentation, improvement, and adaptation",
    },
  },
  {
    key: "leadershipAlignment",
    label: "Leadership & Strategic Alignment",
    help: {
      one: "No AI strategy, leadership not engaged",
      three: "Some leaders show interest, but limited strategic alignment",
      five: "Clear vision from leadership, AI explicitly tied to departmental strategy",
    },
  },
  {
    key: "partnerships",
    label: "Partnerships & External Ecosystem",
    help: {
      one: "No collaborations with external actors (academia, vendors, peers)",
      three: "Some ad‑hoc relationships but not formalized",
      five: "Active partnerships that provide expertise, resources, or benchmarking",
    },
  },
  {
    key: "citizenOrientation",
    label: "Citizen/Stakeholder Orientation",
    help: {
      one: "No structured approach to understanding citizen needs in digital services",
      three: "Some consultation but limited feedback loops",
      five: "Continuous citizen/stakeholder feedback integrated into design and evaluation",
    },
  },
  {
    key: "ethicsTrust",
    label: "Ethics & Public Trust",
    help: {
      one: "Little/no consideration of ethical implications of AI use",
      three: "Ethical concerns raised occasionally, not systematic",
      five: "Active attention to fairness, bias, transparency, and building public trust",
    },
  },
];

export type ReadinessScores = Record<ReadinessKey, number> & { notes?: string };

export const defaultReadiness = (): ReadinessScores => ({
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

function band(n: number) {
  if (n < 2.5) return { label: "Foundational", tone: "bg-red-100 text-red-700 border-red-200" };
  if (n < 3.75) return { label: "Emerging", tone: "bg-amber-100 text-amber-800 border-amber-200" };
  return { label: "Ready", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" };
}

function clamp15(n: number) {
  if (Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function ReadinessSummary({ scores }: { scores: ReadinessScores }) {
  const values = READINESS.map(r => scores[r.key]);
  const avg = useMemo(() => (values.reduce((a, b) => a + b, 0) / values.length), [values]);
  const { label, tone } = band(avg);
  const pct = Math.round(((avg - 1) / 4) * 100); // 1..5 → 0..100%

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Score</span>
          <span className={`rounded-full border px-2 py-0.5 ${tone}`}>{label}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-slate-600">Average: <strong className="font-mono">{avg.toFixed(2)}</strong> / 5</p>
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li><span className="font-medium">Foundational</span> (≤ 2.4): begin with data plumbing, policy basics, and pilot literacy.</li>
          <li><span className="font-medium">Emerging</span> (2.5–3.7): formalize workflows, governance, and partnerships.</li>
          <li><span className="font-medium">Ready</span> (≥ 3.8): proceed with scoped AI pilots tied to strategy.</li>
        </ul>
      </CardContent>
    </Card>
  );
}

function DepartmentReadiness({scores, setScores,}: {scores: ReadinessScores; setScores: React.Dispatch<React.SetStateAction<ReadinessScores>>;}) {
    const update = (k: ReadinessKey, v: number) =>
      setScores((s) => ({ ...s, [k]: clamp15(v) }));

  const exportJSON = () => {
    const data = JSON.stringify(scores, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "department-readiness.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const next: ReadinessScores = { ...defaultReadiness(), ...parsed };
        // Coerce to 1..5
        READINESS.forEach((r) => (next[r.key] = clamp15(Number(next[r.key]))));
        setScores(next);
      } catch (e) {
        alert("Could not parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Step 1: Department Readiness Self‑Assessment</h1>
          <p className="text-slate-600">Rate each area from 1–5. Keep it simple and honest — this frames where to start.</p>
        </div>
      </header>

      <Alert>
        <AlertTitle>How to score</AlertTitle>
        <AlertDescription>
          Use 1, 3, or 5 as anchors — 2 and 4 are fine for “between” states. Hover the numbers for the anchor descriptions.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <CardTitle>Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue={READINESS[0].key}>
                {/* Wrap the TabsList so it occupies full block flow and pushes content down */}
                <div className="w-full min-h-[200px]"> 
                <TabsList className="flex w-full flex-wrap justify-start gap-2">
                    {READINESS.map((r) => (
                    <TabsTrigger
                        key={r.key}
                        value={r.key}
                        className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                    >
                        {r.label}
                    </TabsTrigger>
                    ))}
                </TabsList>
                </div>

                {READINESS.map((r) => (
                <TabsContent key={r.key} value={r.key} className="mt-6">
                    <div className="rounded-2xl border p-4 space-y-4">
                    <Label className="text-sm">{r.label}</Label>

                    {/* Score buttons */}
                    <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                        <TooltipProvider key={n}>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant={scores[r.key] === n ? "default" : "outline"}
                                className="w-full"
                                onClick={() => update(r.key, n)}
                                >
                                {n}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-sm">
                                {n === 1 && <span>{r.help.one}</span>}
                                {n === 3 && <span>{r.help.three}</span>}
                                {n === 5 && <span>{r.help.five}</span>}
                                {(n === 2 || n === 4) && (
                                <span>
                                    Between {n === 2 ? "1 and 3" : "3 and 5"} — pick what feels right.
                                </span>
                                )}
                            </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        ))}
                    </div>

                    {/* Anchors description */}
                    <div className="text-xs text-slate-600 space-y-1">
                    <div><span className="font-medium">Anchors:</span></div>
                    <div>1 — {r.help.one}</div>
                    <div>3 — {r.help.three}</div>
                    <div>5 — {r.help.five}</div>
                    </div>
                    </div>
                </TabsContent>
                ))}
            </Tabs>

            {/* ⬇️ REMOVE the Notes section entirely (was here before) */}
            </CardContent>

        </Card>

        {/* Right: Summary */}
        <div className="order-1 space-y-6 lg:order-2">
          <ReadinessSummary scores={scores} />

          <Card>
            <CardHeader>
              <CardTitle>Dimension Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {READINESS.map((r) => {
                const val = scores[r.key];
                const pct = Math.round(((val - 1) / 4) * 100);
                return (
                  <div key={r.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{r.label}</span>
                      <span className="font-mono text-slate-600">{val}/5</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

// -----------------------------
// Wrapper: Step 1 (Readiness) → Step 2 (Use Case Scoring)
// -----------------------------

// export default function AIReadinessAndScoring() {
//   const [step, setStep] = useState<"readiness" | "scoring">("readiness");

//   return (
//     <TooltipProvider>
//       <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white p-6">
//         <div className="mx-auto max-w-7xl space-y-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2 text-slate-700 text-sm">
//               <span className={`inline-flex items-center gap-1 ${step === "readiness" ? "font-semibold" : "opacity-60"}`}>
//                 <ChevronRight className="-ml-1 h-4 w-4"/> Readiness
//               </span>
//               <span className="opacity-40">/</span>
//               <span className={`inline-flex items-center gap-1 ${step === "scoring" ? "font-semibold" : "opacity-60"}`}>
//                 <ChevronRight className="-ml-1 h-4 w-4"/> Use Case Scoring
//               </span>
//             </div>
//             <div className="flex items-center gap-2">
//               {step === "scoring" && (
//                 <Button variant="outline" onClick={() => setStep("readiness")}> <ChevronLeft className="mr-2 h-4 w-4"/> Back to Readiness</Button>
//               )}
//               {step === "readiness" && (
//                 <Button onClick={() => setStep("scoring")}>Continue to Use Case Scoring <ChevronRight className="ml-2 h-4 w-4"/></Button>
//               )}
//             </div>
//           </div>

//           {step === "readiness" ? <DepartmentReadiness /> : <AISpiderCharts />}
//         </div>
//       </div>
//     </TooltipProvider>
//   );
// }


export default function AIReadinessAndScoring() {
    const [step, setStep] = useState<"readiness" | "scoring">("readiness");
  
    const [scores, setScores] = useState<ReadinessScores>(defaultReadiness());
    const [useCases, setUseCases] = useState<UseCase[]>(defaultUseCases);
    const [placements, setPlacements] = useState<Record<number, { x: number; y: number }>>({});

    return (
        <TooltipProvider>
          <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Breadcrumbs / nav */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 text-sm">
                  <span className={step === "readiness" ? "font-semibold" : "opacity-60"}>Readiness</span>
                  <span className="opacity-40">/</span>
                  <span className={step === "scoring" ? "font-semibold" : "opacity-60"}>Use Case Scoring</span>
                  <span className="opacity-40">/</span>
                  <span className={step === "prioritization" ? "font-semibold" : "opacity-60"}>Prioritization</span>
                </div>
                <div className="flex items-center gap-2">
                  {step !== "readiness" && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step === "prioritization" ? "scoring" : "readiness")}
                    >
                      Back
                    </Button>
                  )}
                  {step !== "prioritization" && (
                    <Button
                      onClick={() => setStep(step === "readiness" ? "scoring" : "prioritization")}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
    
              {step === "readiness" && (
                <DepartmentReadiness scores={scores} setScores={setScores} />
              )}
              {step === "scoring" && (
                <AISpiderCharts useCases={useCases} setUseCases={setUseCases} />
              )}
              {step === "prioritization" && (
                <ImpactFeasibility
                  useCases={useCases}
                  placements={placements}
                  setPlacements={setPlacements}
                />
              )}
            </div>
          </div>
        </TooltipProvider>
      );
    }