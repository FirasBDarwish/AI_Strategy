import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeReadinessBottlenecks, calculateFeasibilityScore, calculateImpactScore, calculateRiskScore, getHorizonFromPosition, getRiskBand, resolvePosition } from "@/lib/scoring";
import type { Horizon, StrategyProject, UseCase } from "@/types/strategy";
import { Download, RotateCcw, TrendingUp, Upload } from "lucide-react";

const COLORS = ["#5d7565", "#8a6f5a", "#6f7e80", "#9a754f", "#7b6862", "#66705d", "#8a665b", "#65767b", "#7c705b", "#6f675f"];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function ImpactFeasibility({
  project,
  onChange,
  onExport,
  onImport,
  section,
}: {
  project: StrategyProject;
  onChange: (project: StrategyProject) => void;
  onExport: () => void;
  onImport: (payload: unknown) => void;
  section: "matrix" | "roadmap";
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const draftRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<{ id: string; x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(project.useCases[0]?.id ?? null);
  const selected = project.useCases.find((useCase) => useCase.id === selectedId) ?? null;

  const basePositions = useMemo(() => Object.fromEntries(project.useCases.map((useCase) => [useCase.id, resolvePosition(useCase, project.impactWeights, project.readinessScores, project.manualPlacements[useCase.id])])), [project.useCases, project.manualPlacements, project.impactWeights, project.readinessScores]);
  const displayOffsets = useMemo(() => {
    const seen = new Map<string, number>();
    return Object.fromEntries(project.useCases.map((useCase) => {
      const position = basePositions[useCase.id];
      const bucket = `${Math.round(position.x * 20)}-${Math.round(position.y * 20)}`;
      const count = seen.get(bucket) ?? 0;
      seen.set(bucket, count + 1);
      const angle = count * 2.4;
      const radius = count === 0 ? 0 : 10 + count * 3;
      return [useCase.id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }];
    }));
  }, [basePositions, project.useCases]);

  const updateDraft = (event: React.PointerEvent) => {
    const id = activeIdRef.current;
    const board = boardRef.current;
    if (!id || !board) return;
    const rect = board.getBoundingClientRect();
    const next = { id, x: clamp01((event.clientX - rect.left) / rect.width), y: clamp01(1 - (event.clientY - rect.top) / rect.height) };
    draftRef.current = next;
    setDraft(next);
  };

  const finishDrag = () => {
    const current = draftRef.current;
    activeIdRef.current = null;
    draftRef.current = null;
    setDraft(null);
    if (!current) return;
    onChange({ ...project, manualPlacements: { ...project.manualPlacements, [current.id]: { x: current.x, y: current.y, manuallyAdjusted: true } } });
  };

  const resetPlacement = (id: string) => {
    const placements = { ...project.manualPlacements };
    delete placements[id];
    onChange({ ...project, manualPlacements: placements });
  };

  const horizonBuckets = ([1, 2, 3] as Horizon[]).map((horizon) => ({
    horizon,
    items: project.useCases.filter((useCase) => getHorizonFromPosition(basePositions[useCase.id]) === horizon),
  }));
  const bottlenecks = useMemo(() => analyzeReadinessBottlenecks(project.useCases, project.impactWeights, project.readinessScores), [project.useCases, project.impactWeights, project.readinessScores]);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { onImport(JSON.parse(String(reader.result))); }
      catch { window.alert("Could not parse the selected project JSON file."); }
    };
    reader.readAsText(file);
    event.currentTarget.value = "";
  };

  return <div className="space-y-6">
    {section === "matrix" ? <><header className="border-b border-stone-300 pb-7"><h2 className="text-4xl font-semibold tracking-tight text-stone-950">Portfolio Matrix</h2><p className="mt-3 max-w-4xl text-base leading-7 text-stone-600">Impact reflects strategic priorities, problem importance, and risk. Feasibility reflects use-case ratings and department readiness. Drag a point only to override its calculated position.</p></header>
    <FeasibilityInsights bottlenecks={bottlenecks} />
    <Card className="overflow-hidden border-slate-200"><CardHeader className="border-b bg-slate-50"><CardTitle>Impact vs Feasibility</CardTitle></CardHeader><CardContent className="space-y-4 pt-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative"><div ref={boardRef} onPointerMove={updateDraft} onPointerUp={finishDrag} onPointerCancel={finishDrag} className="relative aspect-square w-full touch-none overflow-hidden rounded-xl border border-slate-300 bg-white">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2"><div className="bg-[#f4ecdf]" /><div className="bg-[#edf1eb]" /><div className="bg-[#f1eeea]" /><div className="bg-[#f0f1ec]" /></div>
          <div className="absolute left-1/2 top-0 h-full w-px bg-slate-400" /><div className="absolute left-0 top-1/2 h-px w-full bg-slate-400" />
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-sm font-bold">IMPACT ↑</span><span className="absolute bottom-2 right-2 text-sm font-bold">FEASIBILITY →</span>
          <span className="absolute left-3 top-10 text-xs text-slate-500">Strategic investment</span><span className="absolute right-3 top-10 text-xs text-slate-500">Strong candidate</span><span className="absolute bottom-10 left-3 text-xs text-slate-500">Weak candidate</span><span className="absolute bottom-10 right-3 text-xs text-slate-500">Possible quick win</span>
          {project.useCases.map((useCase, index) => {
            const stored = basePositions[useCase.id];
            const position = draft?.id === useCase.id ? draft : stored;
            const offset = displayOffsets[useCase.id];
            const manual = Boolean(project.manualPlacements[useCase.id]);
            return <button key={useCase.id} type="button" aria-label={`${useCase.name}, ${manual ? "manually adjusted" : "calculated position"}`} onClick={() => setSelectedId(useCase.id)} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); activeIdRef.current = useCase.id; draftRef.current = { id: useCase.id, x: position.x, y: position.y }; setSelectedId(useCase.id); }} className={`absolute grid h-9 w-9 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full border-2 text-sm font-bold shadow-sm ${manual ? "ring-2 ring-slate-500 ring-offset-1" : "border-dashed"}`} style={{ left: `${position.x * 100}%`, bottom: `${position.y * 100}%`, marginLeft: offset.x, marginBottom: offset.y, color: COLORS[index % COLORS.length], borderColor: COLORS[index % COLORS.length], backgroundColor: `${COLORS[index % COLORS.length]}25` }}>{index + 1}</button>;
          })}
        </div></div>
        <div className="space-y-3 rounded-xl border border-[#dce8ed] bg-[#f7fbfc] p-4"><h3 className="font-medium">Agentic Solutions</h3>{project.useCases.map((useCase, index) => { const impact = calculateImpactScore(useCase, project.impactWeights); const feasibility = calculateFeasibilityScore(useCase, project.readinessScores); const riskScore = calculateRiskScore(useCase); const riskBand = getRiskBand(useCase); return <button key={useCase.id} type="button" onClick={() => setSelectedId(useCase.id)} className={`w-full rounded-lg border p-3 text-left text-sm ${selectedId === useCase.id ? "border-[#a9c4d1] bg-[#eef6f9]" : "border-stone-200 bg-white"}`}><div className="flex items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 font-bold" style={{ color: COLORS[index % COLORS.length], borderColor: COLORS[index % COLORS.length] }}>{index + 1}</span><span className="truncate font-medium">{useCase.name}</span></div><div className="mt-2 pl-9 text-xs leading-5 text-stone-500">Impact {impact?.toFixed(1) ?? "—"} · Feasibility {feasibility.toFixed(1)}<br />Risk {riskScore?.toFixed(1) ?? "—"}/3 · {riskBand}</div></button>; })}</div>
      </div>
      {selected && <SelectionDetails useCase={selected} project={project} resetPlacement={resetPlacement} />}
    </CardContent></Card></> : <><header className="border-b border-stone-300 pb-7"><h2 className="text-4xl font-semibold tracking-tight text-stone-950">Three Horizons Roadmap</h2><p className="mt-3 max-w-4xl text-base leading-7 text-stone-600">High-impact opportunities are assigned automatically from their current matrix position.</p></header>
    <Card className="overflow-hidden border-slate-200"><CardHeader className="border-b bg-slate-50"><CardTitle>Automatically derived roadmap</CardTitle><p className="text-sm text-slate-600">H1: feasibility ≥ 7 · H2: feasibility 4–6.9 · H3: feasibility &lt; 4. Use cases below impact 6 remain off the roadmap.</p></CardHeader><CardContent className="pt-6"><div className="grid gap-4 md:grid-cols-3">{horizonBuckets.map(({ horizon, items }) => <HorizonColumn key={horizon} horizon={horizon} items={items} project={project} />)}</div></CardContent></Card></>}

    <div className="flex flex-wrap justify-center gap-3"><Button onClick={onExport}><Download className="mr-2 h-4 w-4" /> Export Project (.json)</Button><label className="inline-flex cursor-pointer items-center rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"><Upload className="mr-2 h-4 w-4" /> Import Project (.json)<input type="file" accept="application/json" className="sr-only" onChange={handleImport} /></label></div>
  </div>;
}

function FeasibilityInsights({ bottlenecks }: { bottlenecks: ReturnType<typeof analyzeReadinessBottlenecks> }) {
  const top = bottlenecks.slice(0, 3);
  return <Card className="border-stone-200 bg-[#fffdf9]"><CardHeader><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e6ece7] text-[#536458]"><TrendingUp className="h-5 w-5" /></span><div><CardTitle>Untapped impact caused by low readiness</CardTitle><p className="mt-1 max-w-4xl text-sm leading-6 text-stone-600">For each readiness area, the model raises that one score to 5/5 and recalculates every high-impact use case. Portfolio impact points are summed across use cases as <strong>adjusted impact × feasibility ÷ 10</strong>. The difference shows how much impact is currently constrained by that readiness area.</p></div></div></CardHeader><CardContent>{top.length === 0 ? <p className="rounded-lg bg-[#f6f2eb] p-4 text-sm text-stone-600">No readiness area is currently causing a meaningful reduction in the feasibility of high-impact use cases.</p> : <div className="grid gap-3 md:grid-cols-3">{top.map((item, index) => <div key={item.key} className="rounded-xl border border-stone-200 bg-white/60 p-4"><div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Readiness priority {index + 1}</div><h3 className="mt-2 font-semibold text-stone-900">{item.label}: {item.current}/5 today</h3><p className="mt-3 text-sm leading-6 text-stone-600">Across all {item.highImpactUseCases} high-impact use case{item.highImpactUseCases === 1 ? "" : "s"}, the current achievable impact totals <strong>{item.currentAchievableImpact.toFixed(1)} points</strong>.</p><p className="mt-2 text-sm leading-6 text-stone-600">If {item.label.toLowerCase()} improved to <strong>5/5</strong>, that total would rise to <strong>{item.improvedAchievableImpact.toFixed(1)} points</strong>.</p><div className="mt-4 rounded-lg bg-[#f2ece3] p-3"><div className="text-2xl font-semibold text-stone-900">+{item.untappedImpact.toFixed(1)}</div><div className="mt-1 text-sm leading-5 text-stone-600">additional portfolio impact points currently constrained by {item.label.toLowerCase()}</div></div><p className="mt-3 text-xs leading-5 text-stone-500">{item.affectedUseCases} of the {item.highImpactUseCases} use cases would improve in this scenario.</p></div>)}</div>}</CardContent></Card>;
}

function SelectionDetails({ useCase, project, resetPlacement }: { useCase: UseCase; project: StrategyProject; resetPlacement: (id: string) => void }) {
  const impact = calculateImpactScore(useCase, project.impactWeights);
  const feasibility = calculateFeasibilityScore(useCase, project.readinessScores);
  const risk = getRiskBand(useCase);
  const riskScore = calculateRiskScore(useCase);
  const manual = Boolean(project.manualPlacements[useCase.id]);
  return <div className="border-l-4 border-[#9db9c8] bg-[#f4f9fb] p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><h3 className="text-lg font-semibold text-slate-950">{useCase.name}</h3><div className="mt-3 flex flex-wrap gap-2 text-sm"><span className="border border-[#e7c9a6] bg-[#fffaf3] px-3 py-1.5 font-medium">Impact {impact?.toFixed(1) ?? "—"}</span><span className="border border-[#b9d4cc] bg-[#f6fbf8] px-3 py-1.5 font-medium">Feasibility {feasibility.toFixed(1)}</span><span className="border border-[#e5c2bc] bg-[#fff8f6] px-3 py-1.5 font-medium">Risk {riskScore?.toFixed(1) ?? "—"}/3 · {risk}</span></div><p className="mt-3 text-sm text-slate-500">{manual ? "Manually adjusted from calculated position; the roadmap follows this position." : "Calculated from strategic priorities, readiness, use-case ratings, problem importance, and risk."}</p></div>{manual && <Button variant="outline" onClick={() => resetPlacement(useCase.id)}><RotateCcw className="mr-2 h-4 w-4" /> Reset position</Button>}</div>
  </div>;
}

const HORIZON_CONTENT: Record<Horizon, { title: string; description: string; classes: string }> = {
  1: { title: "Horizon 1 — Deploy or Pilot Now", description: "High impact with feasibility at or above 7.", classes: "border-emerald-300 bg-white" },
  2: { title: "Horizon 2 — Build and Enable", description: "High impact with feasibility between 4 and 6.9.", classes: "border-amber-300 bg-white" },
  3: { title: "Horizon 3 — Explore and Prepare", description: "High impact with feasibility below 4.", classes: "border-slate-300 bg-white" },
};

function HorizonColumn({ horizon, items, project }: { horizon: Horizon; items: UseCase[]; project: StrategyProject }) {
  const content = HORIZON_CONTENT[horizon];
  return <div className={`rounded-xl border-t-4 p-5 shadow-sm ${content.classes}`}><h3 className="font-semibold">{content.title} <span className="text-slate-400">({items.length})</span></h3><p className="mt-2 text-sm leading-6 text-slate-600">{content.description}</p><div className="mt-5 space-y-3">{items.length === 0 && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-slate-500">No use cases currently fall in this horizon.</p>}{items.map((useCase) => { const riskScore = calculateRiskScore(useCase); return <div key={useCase.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="font-medium">{useCase.name}</div><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded border bg-white px-2 py-1">Impact {calculateImpactScore(useCase, project.impactWeights)?.toFixed(1) ?? "—"}</span><span className="rounded border bg-white px-2 py-1">Feasibility {calculateFeasibilityScore(useCase, project.readinessScores).toFixed(1)}</span><span className="rounded border border-[#ead0cb] bg-[#fff8f6] px-2 py-1">Risk {riskScore?.toFixed(1) ?? "—"}/3 · {getRiskBand(useCase)}</span></div></div>; })}</div></div>;
}
