import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UseCase, CRITERIA } from "./AISpiderCharts";
import { READINESS, ReadinessScores } from "./Scoring_Readiness";
import { Download, Upload } from "lucide-react";

type Placements = Record<number, { x: number; y: number }> & { __activeId?: number }; // x: feasibility (0..1), y: impact (0..1)

const COLORS = [
  "#e6194B", // Red
  "#3cb44b", // Green
  "#808000", // Olive
  "#4363d8", // Blue
  "#f58231", // Orange
  "#911eb4", // Purple
  "#42d4f4", // Cyan
  "#f032e6", // Magenta
  "#469990", // Teal
  "#9A6324", // Brown
];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function useDragPlace(boardRef: React.RefObject<HTMLDivElement>, onPos: (x: number, y: number) => void) {
  const dragging = React.useRef(false);

  React.useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current || !boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const x = clamp01((clientX - rect.left) / rect.width);
      const y = clamp01(1 - (clientY - rect.top) / rect.height); // invert so up = higher impact
      onPos(x, y);
    };
    const stop = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, [boardRef, onPos]);

  return {
    start: () => (dragging.current = true),
  };
}

export default function ImpactFeasibility({
  useCases,
  placements,
  setPlacements,
  onDownloadPDF,
  onExportAll,
  onImportAll,
  readinessScores,
}: {
  useCases: UseCase[];
  placements: Placements;
  setPlacements: React.Dispatch<React.SetStateAction<Placements>>;
  onDownloadPDF?: () => void;
  onExportAll?: () => void;
  onImportAll?: (data: any) => void;
  readinessScores: ReadinessScores;
}) {
  const boardRef = React.useRef<HTMLDivElement>(null);
  const [selectedDetail, setSelectedDetail] = React.useState<UseCase | null>(null);

  const { start } = useDragPlace(boardRef, (x, y) => {
    setPlacements((prev) => {
      if (!prev.__activeId && prev.__activeId !== 0) return prev as any;
      return { ...prev, [prev.__activeId!]: { x, y } } as any;
    });
  });

  const beginDrag = (id: number) =>
    setPlacements((p: any) => ({ ...p, __activeId: id }));

  // Default any missing placement to center
  const getPos = (id: number) => placements[id] ?? { x: 0.5, y: 0.5 };

  // --- 3 Horizons split (only high-impact items) ---
  const horizonBuckets = React.useMemo(() => {
    const hi = useCases
      .filter((u) => (placements[u.id]?.y ?? 0.5) >= 0.5) // high impact
      .map((u) => ({ u, p: getPos(u.id) }));

    const H1 = hi.filter(({ p }) => p.x >= 2 / 3).map(({ u }) => u); // high feasibility
    const H2 = hi.filter(({ p }) => p.x >= 1 / 3 && p.x < 2 / 3).map(({ u }) => u);
    const H3 = hi.filter(({ p }) => p.x < 1 / 3).map(({ u }) => u);

    return { H1, H2, H3 };
  }, [useCases, placements]);

  function handleImportJSON(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        onImportAll?.(parsed);
      } catch (e) {
        alert("Could not parse project JSON.");
      }
    };
    reader.readAsText(file);
    // reset the input so the same file can be re-imported if needed
    evt.currentTarget.value = "";
  }

  return (
    <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Step 3: AI Use Case Prioritization</h1>
            <p className="text-slate-600">Organize the use cases based on their expected impact and feasibility and then create a 3-horizon strategy based on those placements.</p>
        </div>
        </header>

      {/* --- Impact vs Feasibility --- */}
      <Card>
        <CardHeader>
          <CardTitle>Impact vs Feasibility Chart</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            At this stage, you have enough information to gauge the feasibility of each AI use case.
            Think of the following questions as you decide how impactful the use case is, and then write
            each use case’s number into the correct spot on the Impact–Feasibility chart.
          </p>
          <ul className="list-disc pl-6 text-sm text-slate-700 space-y-1">
            <li>What problem does the AI integration opportunity solve?</li>
            <li>Who is impacted?</li>
            <li>How will we measure success?</li>
            <li>What’s the biggest risk?</li>
          </ul>

            {/* How to use */}
            <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
            <div className="font-medium mb-1">How to use</div>
            <ol className="list-decimal pl-5 space-y-1">
                <li>Each use case is a numbered token (1–8). Drag a token onto the grid.</li>
                <li>Up = higher <span className="font-medium">Impact</span>. Right = higher <span className="font-medium">Feasibility</span>.</li>
                <li>As you place tokens, the <span className="font-medium">3 Horizons</span> below fills in automatically.</li>
            </ol>
            </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr,320px]">
            {/* Board */}
            <div className="relative">
              <div
                ref={boardRef}
                className="relative aspect-square w-full rounded-xl border border-slate-300 bg-white"
              >

                {/* Quadrant coloring */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden">
                  {/* Top-left: High Impact, Low Feasibility */}
                  <div className="bg-gradient-to-br from-amber-100/40 to-transparent" />
                  {/* Top-right: High Impact, High Feasibility */}
                  <div className="bg-gradient-to-bl from-emerald-100/40 to-transparent" />
                  {/* Bottom-left: Low Impact, Low Feasibility */}
                  <div className="bg-gradient-to-tr from-rose-100/40 to-transparent" />
                  {/* Bottom-right: Low Impact, High Feasibility */}
                  <div className="bg-gradient-to-tl from-sky-100/40 to-transparent" />
                </div>

                {/* Axes */}
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-400" />
                <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-400" />

                {/* Axis labels */}
                <div className="absolute left-1/2 -translate-x-1/2 top-2 text-sm sm:text-base font-bold tracking-wider text-slate-700">
                  IMPACT ↑
                </div>
                <div className="absolute right-2 bottom-2 text-sm sm:text-base font-bold tracking-wider text-slate-700">
                  FEASIBILITY →
                </div>

                {/* Quadrant hints */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute left-3 top-10 text-xs text-slate-500 cursor-help">
                        High impact<br />Low feasibility
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Likely transformational, but hard to implement</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute right-3 top-10 text-xs text-slate-500 text-right cursor-help">
                        High impact<br />High feasibility
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Best candidates: high-value and achievable</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute left-3 bottom-10 text-xs text-slate-500 cursor-help">
                        Low impact<br />Low feasibility
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Avoid: costly with little return</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute right-3 bottom-10 text-xs text-slate-500 text-right cursor-help">
                        Low impact<br />High feasibility
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Easy wins, but limited payoff</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Draggable tokens */}
                {useCases.map((u) => {
                  const pos = getPos(u.id);
                  return (
                    <TooltipProvider key={u.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onMouseDown={() => { beginDrag(u.id); start(); }}
                            onTouchStart={(e) => { e.preventDefault(); beginDrag(u.id); start(); }}
                            className="absolute -translate-x-1/2 translate-y-1/2 select-none"
                            style={{
                              left: `${pos.x * 100}%`,
                              bottom: `${pos.y * 100}%`,
                            }}
                          >
                        <span
                          className="inline-block rounded-full px-3 py-1 text-sm sm:text-base font-semibold shadow-sm border-2 transition-transform hover:scale-110 hover:shadow-md"
                          style={{
                            color: COLORS[u.id % COLORS.length],
                            borderColor: COLORS[u.id % COLORS.length],
                            backgroundColor: `${COLORS[u.id % COLORS.length]}33`,
                          }}
                        >
                          {u.id + 1}
                        </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="text-sm max-w-xs">
                          <div className="font-medium mb-1">{u.name || `Use Case ${u.id + 1}`}</div>
                          <div className="text-slate-600">{u.description || "No description"}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>

            {/* Legend / list of use cases with numbers */}
            <div className="rounded-xl border p-3 space-y-2">
            <div className="text-sm font-medium text-slate-700">Use Case Numbers</div>
            <Separator />
            <div className="space-y-1">
              {useCases.map((u) => {
                const isSelected = selectedDetail?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 text-sm cursor-pointer rounded-md px-2 py-1 transition-colors`}
                    onClick={() =>
                      setSelectedDetail((prev) => (prev?.id === u.id ? null : u))
                    }
                    style={{
                      backgroundColor: isSelected
                        ? `${COLORS[u.id % COLORS.length]}22` // soft highlight when selected
                        : "transparent",
                      border: isSelected ? `2px solid ${COLORS[u.id % COLORS.length]}` : "2px solid transparent",
                    }}
                  >
                    <span
                      className="inline-block w-7 h-7 shrink-0 rounded-full grid place-items-center text-sm font-semibold border-2"
                      style={{
                        color: COLORS[u.id % COLORS.length],
                        borderColor: COLORS[u.id % COLORS.length],
                        backgroundColor: `${COLORS[u.id % COLORS.length]}33`,
                      }}
                    >
                      {u.id + 1}
                    </span>
                    <span
                      className="truncate font-medium"
                      style={{ color: COLORS[u.id % COLORS.length] }}
                    >
                      {u.name || `Use Case ${u.id + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
            <Separator />
            {selectedDetail && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">
                  {selectedDetail.name} — Detailed Evaluation
                </div>
                <table className="min-w-full text-sm border">
                  <tbody>
                    {CRITERIA.map(({ key, label, group, descriptions }) => (
                      <tr
                        key={key}
                        className="border-b last:border-0"
                        style={{
                          backgroundColor:
                            group === "Impact" ? "rgba(251,191,36,0.1)" : "rgba(56,189,248,0.1)",
                        }}
                      >
                        <td
                          className="py-2 px-3 font-medium border-r"
                          style={{
                            color: group === "Impact" ? "#b45309" : "#0369a1",
                            borderColor: group === "Impact" ? "#b45309" : "#0369a1",
                          }}
                        >
                          {label}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <TooltipProvider delayDuration={500}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help font-semibold">
                                  {selectedDetail.scores[key]}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                <p><strong>0:</strong> {descriptions[0]}</p>
                                <p><strong>5:</strong> {descriptions[5]}</p>
                                <p><strong>10:</strong> {descriptions[10]}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Separator />
            {/* --- Department Readiness Breakdown --- */}
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Department Readiness Breakdown</div>
              <table className="min-w-full text-sm border">
                <tbody>
                  {READINESS.map((r) => (
                    <tr key={r.key} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium border-r text-slate-700">
                        {r.label}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <TooltipProvider delayDuration={500}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help font-semibold">
                                {readinessScores[r.key]}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              <p><strong>1:</strong> {r.help.one}</p>
                              <p><strong>3:</strong> {r.help.three}</p>
                              <p><strong>5:</strong> {r.help.five}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Three Horizons --- */}
      <Card>
        <CardHeader>
          <CardTitle>3 Horizons Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            The 3 Horizons framework is a common tool in strategic planning, where each horizon
            represents a different stage of maturity in AI adoption.
          </p>
          <ul className="list-disc pl-6 text-sm text-slate-700 space-y-1 mb-6">
            <li>Horizon 1: Immediate Opportunities — short-term, low-risk, mature tech and data available.</li>
            <li>Horizon 2: Emerging Innovations — medium-term; needs some investment in data, workflows, or change management.</li>
            <li>Horizon 3: Transformative Possibilities — longer-term; depends on less mature tech or substantial new data infrastructure and higher uncertainty/risk.</li>
          </ul>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HorizonColumn
              title="Horizon 1 (High Feasibility)"
              items={horizonBuckets.H1}
              horizon={1}
            />
            <HorizonColumn
              title="Horizon 2 (Medium Feasibility)"
              items={horizonBuckets.H2}
              horizon={2}
            />
            <HorizonColumn
              title="Horizon 3 (Low Feasibility)"
              items={horizonBuckets.H3}
              horizon={3}
            />
          </div>

        </CardContent>
      </Card>

      {/* --- Project Save/Load --- */}
      <div className="flex justify-center mt-8 gap-3">
        <Button onClick={() => onExportAll?.()}>
          <Download className="mr-2 h-4 w-4" />
          Export Project (.json)
        </Button>

        <label className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium bg-white hover:bg-slate-50 cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />
          Import Project (.json)
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={handleImportJSON}
          />
        </label>
      </div>
    </div>
  );
}

function HorizonColumn({
  title,
  items,
  horizon,
}: {
  title: string;
  items: UseCase[];
  horizon: 1 | 2 | 3;
}) {
  // horizon-specific colors
  const styles =
    horizon === 1
      ? {
          bg: "bg-emerald-50 border-emerald-200",
          title: "text-emerald-700",
        }
      : horizon === 2
      ? {
          bg: "bg-amber-50 border-amber-200",
          title: "text-amber-700",
        }
      : {
          bg: "bg-rose-50 border-rose-200",
          title: "text-rose-700",
        };

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${styles.bg}`}>
      <div className={`text-sm font-semibold ${styles.title}`}>{title}</div>
      {items.length === 0 && (
        <div className="text-sm text-slate-500">No items yet.</div>
      )}
      <div className="flex flex-wrap gap-2">
        {items.map((u) => (
          <span
            key={u.id}
            className="inline-block rounded-md px-2 py-1 text-sm font-semibold border-2"
            style={{
              color: COLORS[u.id % COLORS.length],
              borderColor: COLORS[u.id % COLORS.length],
              backgroundColor: `${COLORS[u.id % COLORS.length]}33`,
            }}
          >
            {u.id + 1}. {u.name || `Use Case ${u.id + 1}`}
          </span>
        ))}
      </div>
    </div>
  );
}


  
