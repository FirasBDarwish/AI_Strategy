import React, { useEffect, useMemo, useState } from "react";
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

export const READINESS: {
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
                <TabsList className="flex w-full flex-wrap justify-start gap-2" style={{ minHeight: "13.5rem" }}>
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

const demoReadinessScores = {
  dataMaturity: 3,
  peopleSkills: 4,
  processesWorkflows: 3,
  governanceRisk: 2,
  resourcesBudget: 1,
  techInfra: 3,
  changeReadiness: 4,
  leadershipAlignment: 4,
  partnerships: 3,
  citizenOrientation: 4,
  ethicsTrust: 3,
  notes: "",
};

export const demoUseCases: UseCase[] = [
  {
    id: 0,
    name: "Smart Visitor Forecasting",
    description: "AI models predict visitor flows to museums, parks, and cultural sites to optimize staffing and avoid overcrowding.",
    visible: true,
    scores: {
      dataReady: 8,
      techMature: 8,
      lowImplementationCost: 7,
      reusable: 6,
      increasesProductivity: 9,
      reducesCosts: 7,
      benefitsPublic: 9,
      noRisk: 7,
      increaseRevenue: 2,
      strategicImpact: 7, 
    },
  },
  {
    id: 1,
    name: "Personalized Itineraries",
    description: "Recommender systems suggest tailored itineraries based on visitor preferences and historical data.",
    visible: true,
    scores: {
      dataReady: 7,
      techMature: 8,
      lowImplementationCost: 6,
      reusable: 8,
      increasesProductivity: 7,
      reducesCosts: 6,
      benefitsPublic: 9,
      noRisk: 6,
      increaseRevenue: 9,
      strategicImpact: 7, 
    },
  },
  {
    id: 2,
    name: "Heritage Preservation AI",
    description: "Computer vision detects early signs of degradation in monuments/artifacts from photos and drone scans.",
    visible: true,
    scores: {
      dataReady: 5,
      techMature: 6,
      lowImplementationCost: 4,
      reusable: 5,
      increasesProductivity: 7,
      reducesCosts: 6,
      benefitsPublic: 8,
      noRisk: 5,
      increaseRevenue: 2,
      strategicImpact: 8, 
    },
  },
  {
    id: 3,
    name: "Tourist Query Assistant",
    description: "Multilingual chatbot answers FAQs for tourists, reducing strain on call centers.",
    visible: true,
    scores: {
      dataReady: 8,
      techMature: 9,
      lowImplementationCost: 8,
      reusable: 7,
      increasesProductivity: 8,
      reducesCosts: 7,
      benefitsPublic: 9,
      noRisk: 7,
      increaseRevenue: 2,
      strategicImpact: 7, 
    },
  },
  {
    id: 4,
    name: "Sentiment Analysis",
    description: "Natural language processing of social media posts and reviews to gauge tourist satisfaction.",
    visible: true,
    scores: {
      dataReady: 7,
      techMature: 8,
      lowImplementationCost: 7,
      reusable: 6,
      increasesProductivity: 7,
      reducesCosts: 6,
      benefitsPublic: 8,
      noRisk: 7,
      increaseRevenue: 6,
      strategicImpact: 3, 
    },
  },
  {
    id: 5,
    name: "Fraud Detection",
    description: "AI detects unusual booking/payment patterns to prevent fraud.",
    visible: true,
    scores: {
      dataReady: 7,
      techMature: 8,
      lowImplementationCost: 7,
      reusable: 8,
      increasesProductivity: 8,
      reducesCosts: 9,
      benefitsPublic: 6,
      noRisk: 7,
      increaseRevenue: 1,
      strategicImpact: 7, 
    },
  },
  {
    id: 6,
    name: "AR/VR Experiences",
    description: "Immersive AI-powered VR tours for sites under renovation or with limited accessibility.",
    visible: true,
    scores: {
      dataReady: 4,
      techMature: 6,
      lowImplementationCost: 4,
      reusable: 6,
      increasesProductivity: 7,
      reducesCosts: 5,
      benefitsPublic: 9,
      noRisk: 4,
      increaseRevenue: 8,
      strategicImpact: 3, 
    },
  },
  {
    id: 7,
    name: "Dynamic Pricing",
    description: "AI optimizes ticket pricing based on demand, seasonality, and visitor demographics.",
    visible: true,
    scores: {
      dataReady: 6,
      techMature: 7,
      lowImplementationCost: 5,
      reusable: 7,
      increasesProductivity: 7,
      reducesCosts: 8,
      benefitsPublic: 6,
      noRisk: 6,
      increaseRevenue: 9,
      strategicImpact: 2, 
    },
  },
];

export const demoPlacements = {
  0: { x: 0.80, y: 0.70 }, // Smart Visitor Forecasting
  3: { x: 0.85, y: 0.70 }, // Tourist Query Assistant
  1: { x: 0.50, y: 0.80 }, // Personalized Itineraries
  2: { x: 0.25, y: 0.90 }, // Heritage AI
  6: { x: 0.20, y: 0.90 }, // AR/VR
  4: { x: 0.80, y: 0.40 }, // Sentiment Analysis
  5: { x: 0.85, y: 0.40 }, // Fraud Detection
  7: { x: 0.40, y: 0.40 }, // Dynamic Pricing
}


export default function AIReadinessAndScoring() {
    const params = new URLSearchParams(window.location.search);

    const [step, setStep] = useState<"readiness" | "scoring">("readiness");
  
    const [scores, setScores] = useState<ReadinessScores>(defaultReadiness());
    const [useCases, setUseCases] = useState<UseCase[]>(defaultUseCases);
    const [placements, setPlacements] = useState<Record<number, { x: number; y: number }>>({});

    
  // 👇 ADD THIS useEffect block
  if (params.get("mode") == "demo") {
    useEffect(() => {
      setScores(demoReadinessScores);
      setUseCases(demoUseCases);
      setPlacements(demoPlacements);
    }, []);
  }

  function clamp1to5(n: any) {
    const num = Math.round(Number(n));
    if (Number.isNaN(num)) return 1;
    return Math.max(1, Math.min(5, num));
  }

  function clamp1to10(n: any) {
    const num = Math.round(Number(n));
    if (Number.isNaN(num)) return 1;
    return Math.max(1, Math.min(10, num));
  }

  function exportProject() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      scores,
      useCases,
      placements,
    };
    const data = JSON.stringify(payload, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-project-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProject(payload: any) {
    try {
      // --- Scores ---
      const nextScores: ReadinessScores = { ...defaultReadiness() };
      if (payload?.scores && typeof payload.scores === "object") {
        // Coerce each readiness key to 1..5 (use the READINESS keys we already have)
        READINESS.forEach((r) => {
          nextScores[r.key] = clamp1to5(payload.scores[r.key]);
        });
        // Preserve notes if present (optional in your type)
        if (typeof payload.scores.notes === "string") {
          nextScores.notes = payload.scores.notes;
        }
      }

      // --- Use cases (expect 8; fill/repair if needed) ---
      let incomingUC = Array.isArray(payload?.useCases) ? payload.useCases : [];
      if (incomingUC.length < 8) {
        incomingUC = [
          ...incomingUC,
          ...new Array(8 - incomingUC.length).fill(null).map((_, i) => ({
            id: i,
            name: `Use Case ${i + 1}`,
            description: "",
            visible: true,
            scores: {
              dataReady: 5,
              techMature: 5,
              lowImplementationCost: 5,
              reusable: 5,
              increasesProductivity: 5,
              reducesCosts: 5,
              benefitsPublic: 5,
              noRisk: 5,
            },
          })),
        ];
      } else if (incomingUC.length > 8) {
        incomingUC = incomingUC.slice(0, 8);
      }

      const nextUseCases = incomingUC.map((u: any, i: number) => ({
        id: i,
        name: typeof u?.name === "string" ? u.name : `Use Case ${i + 1}`,
        description: typeof u?.description === "string" ? u.description : "",
        visible: typeof u?.visible === "boolean" ? u.visible : true,
        scores: {
          dataReady: clamp1to10(u?.scores?.dataReady),
          techMature: clamp1to10(u?.scores?.techMature),
          lowImplementationCost: clamp1to10(u?.scores?.lowImplementationCost),
          reusable: clamp1to10(u?.scores?.reusable),
          increasesProductivity: clamp1to10(u?.scores?.increasesProductivity),
          reducesCosts: clamp1to10(u?.scores?.reducesCosts),
          benefitsPublic: clamp1to10(u?.scores?.benefitsPublic),
          noRisk: clamp1to10(u?.scores?.noRisk),
        },
      }));

      // --- Placements (x,y in 0..1) ---
      const nextPlacements: Record<number, { x: number; y: number }> = {};
      if (payload?.placements && typeof payload.placements === "object") {
        Object.keys(payload.placements).forEach((k) => {
          const id = Number(k);
          const p = payload.placements[k];
          if (Number.isInteger(id) && p && typeof p === "object") {
            const x = Math.max(0, Math.min(1, Number(p.x)));
            const y = Math.max(0, Math.min(1, Number(p.y)));
            if (!Number.isNaN(x) && !Number.isNaN(y)) {
              nextPlacements[id] = { x, y };
            }
          }
        });
      }

      // --- Apply in one shot ---
      setScores(nextScores);
      setUseCases(nextUseCases);
      setPlacements(nextPlacements);

      // Optional: jump user to the Prioritization view they’re working in
      // setStep("prioritization");
      alert("Project imported successfully.");
    } catch (e) {
      console.error(e);
      alert("Import failed. Please check the JSON structure.");
    }
  }

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
                  onExportAll={exportProject}
                  onImportAll={importProject}
                  readinessScores={scores}
                />
              )}
            </div>
            <footer className="mt-12 border-t pt-6 text-center text-sm text-slate-600">
              <p>Designed by <span className="font-medium">Firas Darwish</span> & <span className="font-medium">Dhiyaa Al Jorf</span></p>
              <p className="mt-1">
                <span >Hosted on </span>
                <a 
                  href="https://firasdarwish.com" 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                firasdarwish.com
                </a>
              </p>
            </footer>
          </div>
        </TooltipProvider>
      );
    }