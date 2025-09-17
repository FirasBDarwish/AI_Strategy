import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Download, RefreshCw, Eye, EyeOff, BarChart2 } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import html2canvas from "html2canvas";

/**
 * AI Use Case Spider Chart Generator
 * - Fill 8 use cases (name, description, and 8 criteria scored 1-10)
 * - Toggle visibility per use case on the overlay radar chart
 * - See per-use-case spider chart & a comparison overlay
 * - Export PNG of the comparison chart; export/import JSON
 */

export const CRITERIA: {
  key: keyof UseCase["scores"];
  label: string;
  group: "Impact" | "Feasibility";
  descriptions: { 0: string; 5: string; 10: string };
}[] = [
  {
    key: "increasesProductivity",
    label: "Increases Productivity",
    group: "Impact",
    descriptions: {
      0: "Use case offers no measurable productivity improvement",
      5: "Moderate improvement in productivity",
      10: "Use case could offer significant productivity boost across organization",
    },
  },
  {
    key: "reducesCosts",
    label: "Reduces Costs",
    group: "Impact",
    descriptions: {
      0: "Use case offers no cost savings",
      5: "Moderate savings in some processes",
      10: "Use case offers major cost reductions across operations",
    },
  },
  {
    key: "benefitsPublic",
    label: "Benefits Public",
    group: "Impact",
    descriptions: {
      0: "Use case offers no public benefit",
      5: "Some benefit for limited groups",
      10: "Use case offers wide-reaching public benefit",
    },
  },
  {
    key: "dataReady",
    label: "Data Ready",
    group: "Feasibility",
    descriptions: {
      0: "Use case does not require much clean, structured, ready-to-use data",
      5: "Partial / incomplete data requirements",
      10: "Use case requires high-quality, ready-to-use data",
    },
  },
  {
    key: "techMature",
    label: "Technology Mature",
    group: "Feasibility",
    descriptions: {
      0: "Use case needs technology that is immature or still experimental and not ready to use",
      5: "Use case requires technology that is semi-reliable but requires adaptation",
      10: "Use case requires technology that is fully mature and reliable",
    },
  },
  {
    key: "lowImplementationCost",
    label: "Resource-Efficient",
    group: "Feasibility",
    descriptions: {
      0: "Extremely costly to implement use case",
      5: "Moderate resources required",
      10: "Very low implementation cost of use case",
    },
  },
  {
    key: "reusable",
    label: "Reusable",
    group: "Feasibility",
    descriptions: {
      0: "Use case is not reusable",
      5: "Use case is reusable with modifications",
      10: "Use case is highly reusable across multiple contexts",
    },
  },
  {
    key: "noRisk",
    label: "No Risk",
    group: "Feasibility",
    descriptions: {
      0: "High risks (legal, ethical, reputational) associated with developing and deploying use case",
      5: "Some risks associated with developing and deploying use case but are overall manageable",
      10: "Minimal or no risks associated with developing and deploying use case",
    },
  },
];

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

export type UseCase = {
  id: number;
  name: string;
  description: string;
  visible: boolean;
  scores: {
    dataReady: number;
    techMature: number;
    lowImplementationCost: number;
    reusable: number;
    increasesProductivity: number;
    reducesCosts: number;
    benefitsPublic: number;
    noRisk: number;
  };
};

const emptyScores = () => ({
  dataReady: 5,
  techMature: 5,
  lowImplementationCost: 5,
  reusable: 5,
  increasesProductivity: 5,
  reducesCosts: 5,
  benefitsPublic: 5,
  noRisk: 5,
});

export const defaultUseCases: UseCase[] = new Array(8).fill(null).map((_, i) => ({
  id: i,
  name: `Use Case ${i + 1}`,
  description: "",
  visible: true,
  scores: emptyScores(),
}));

function clamp01to10(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(1, Math.min(10, Math.round(n)));
}

function toRadarData(useCase: UseCase) {
  return CRITERIA.map((c) => ({ criterion: c.label, value: useCase.scores[c.key] }));
}

function averageScore(u: UseCase) {
  const vals = Object.values(u.scores);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function rank(useCases: UseCase[]) {
  return [...useCases]
    .map((u) => ({ ...u, avg: averageScore(u) }))
    .sort((a, b) => b.avg - a.avg)
    .map((u, idx) => ({ rank: idx + 1, name: u.name || `Use Case ${u.id + 1}` , avg: u.avg }));
}

export default function AISpiderCharts({useCases, setUseCases,}: {useCases: UseCase[];setUseCases: React.Dispatch<React.SetStateAction<UseCase[]>>;ß}) {
  const [selected, setSelected] = useState<number>(0); // local UI-only state is fine
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null); // state for selected dimension

  const chartRef = useRef<HTMLDivElement>(null);

  // Add use case
  function addUseCase() {
    if (useCases.length >= 10) return;
    setUseCases((prev) => {
      const next = [
        ...prev,
        {
          id: prev.length,
          name: `Use Case ${prev.length + 1}`,
          description: "",
          visible: true,
          scores: emptyScores(),
        },
      ];
      return next;
    });
    setSelected(useCases.length); // select new tab
  }

  // Remove use case
  function removeUseCase() {
    if (useCases.length <= 2) return;
    setUseCases((prev) => {
      const next = prev.slice(0, -1);
      return next.map((u, i) => ({ ...u, id: i })); // reindex IDs
    });
    setSelected((s) => Math.min(s, useCases.length - 2)); // keep valid tab selected
  }

  const comparisonData = useMemo(() => {
    // Build an array of objects keyed by criterion for the overlay chart
    return CRITERIA.map(({ label, key }) => {
      const row: any = { criterion: label };
      useCases.forEach((u) => {
        row[u.name || `Use Case ${u.id + 1}`] = u.scores[key];
      });
      return row;
    });
  }, [useCases]);

  const ranks = useMemo(() => rank(useCases), [useCases]);

  function updateScore(idx: number, key: keyof UseCase["scores"], value: number) {
    setUseCases((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        scores: { ...next[idx].scores, [key]: clamp01to10(value) },
      };
      return next;
    });
  }

  function updateMeta(idx: number, field: "name" | "description", value: string) {
    setUseCases((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as UseCase;
      return next;
    });
  }

  function toggleVisible(idx: number) {
    setUseCases((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], visible: !next[idx].visible };
      return next;
    });
  }

  async function downloadPNG() {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, {
      scale: 3, // 🔥 super sharp
      backgroundColor: "#ffffff",
    });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-use-cases-spider-chart.png";
    a.click();
  }

  function exportJSON() {
    const data = JSON.stringify(useCases, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-use-cases.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed) && parsed.length === 8) {
          // Basic shape guard
          setUseCases(parsed.map((u, i) => ({
            id: i,
            name: u.name ?? `Use Case ${i + 1}`,
            description: u.description ?? "",
            visible: typeof u.visible === "boolean" ? u.visible : true,
            scores: { ...emptyScores(), ...(u.scores ?? {}) },
          })));
        } else {
          alert("Expected an array of 8 use cases in the file.");
        }
      } catch (e) {
        alert("Could not parse JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function randomize() {
    setUseCases((prev) => prev.map((u) => ({
      ...u,
      scores: Object.fromEntries(Object.keys(u.scores).map((k) => [k, Math.floor(20 + Math.random()*80)])) as UseCase["scores"],
    })));
  }

  async function downloadDetailPNG(useCase: UseCase, rank: number) {
    if (!detailRef.current) return;
  
    // Hide all buttons with class "no-print" before capture
    const hiddenEls = Array.from(
      detailRef.current.querySelectorAll(".no-print")
    ) as HTMLElement[];
  
    hiddenEls.forEach((el) => (el.style.display = "none"));
  
    const canvas = await html2canvas(detailRef.current, {
      scale: 3, // 🔥 super sharp
      backgroundColor: "#ffffff",
    });
  
    // Restore button visibility
    hiddenEls.forEach((el) => (el.style.display = ""));
  
    const url = canvas.toDataURL("image/png", 1.0);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${useCase.name || `Use Case ${useCase.id + 1}`} (Rank ${rank}).png`;
    a.click();
  }
  
  const renderLegend = ({ payload }) => (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          className="flex items-center gap-2 max-w-[250px]"
        >
          <span
            className="block h-3 w-3 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm break-words">{entry.value}</span>
        </div>
      ))}
    </div>
  );
  
// Create a new payload based on your useCases data
const legendPayload = useCases.map((u, i) => ({
  value: u.name || `Use Case ${u.id + 1}`,
  color: COLORS[i % COLORS.length],
  // You might need other properties like 'id' and 'type' for advanced customization
}));

  const active = useCases[selected];
  const detailRef = useRef<HTMLDivElement>(null);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Step 2: AI Use Case Ideation and Evaluation</h1>
              <p className="text-slate-600">Enter and describe up to eight use cases, rate them on eight criteria (1-10), and visualize the results as spider charts.</p>
            </div>
          </header>

          <Alert>
            <AlertTitle>Scoring Guide</AlertTitle>
            <AlertDescription>
              Each criterion must be scored between <strong>1</strong> and <strong>10</strong>. Higher is better. For example, a higher
              score in <em>Low Implementation Cost</em> means the use case is cheaper to build.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: Data Entry */}
            <Card className="order-2 lg:order-1">
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={removeUseCase}
                    disabled={useCases.length <= 2}
                  >
                    –
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addUseCase}
                    disabled={useCases.length >= 10}
                  >
                    +
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={String(selected)} onValueChange={(v) => setSelected(Number(v))}>
                  <TabsList className="flex w-full flex-wrap justify-center gap-2 mb-10" style={{minHeight: "18rem" }}>
                    {useCases.map((u, i) => (
                          <TabsTrigger
                            key={u.id}
                            value={String(i)}
                            className={`
                              whitespace-normal break-words text-center px-3 py-2 max-w-[10rem]
                              border-2 
                              ${selected === i 
                                ? "bg-opacity-20" 
                                : "bg-transparent"}
                            `}
                            style={{
                              color: COLORS[i % COLORS.length],                                // hard text color
                              borderColor: selected === i ? COLORS[i % COLORS.length] : "transparent",
                              backgroundColor: selected === i ? `${COLORS[i % COLORS.length]}33` : "transparent", 
                              // ^ 33 = ~20% opacity hex for softer fill
                            }}
                          >
                            {u.name || `Use Case ${i + 1}`}
                          </TabsTrigger>
                    ))}
                  </TabsList>
                  {useCases.map((u, i) => (
                    <TabsContent key={u.id} value={String(i)} className="space-y-4">
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 md:grid-cols-2 md:items-start">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${i}`}>Name</Label>
                          <Input
                            id={`name-${i}`}
                            value={u.name}
                            onChange={(e) => updateMeta(i, "name", e.target.value)}
                            placeholder={`Use Case ${i + 1}`}
                            maxLength={30}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Label className="text-sm font-medium">Visible in Comparison</Label>
                          <Button
                            type="button"
                            variant={u.visible ? "secondary" : "outline"}
                            onClick={() => toggleVisible(i)}
                            className="w-full"
                          >
                            {u.visible ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                            {u.visible ? "Shown" : "Hidden"}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`desc-${i}`}>Short Description (2–3 sentences)</Label>
                        <Textarea id={`desc-${i}`} value={u.description} onChange={(e) => updateMeta(i, "description", e.target.value)} rows={3} />
                      </div>

                      <Separator />

                      {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {CRITERIA.map(({ key, label }) => (
                          <div key={key} className="rounded-2xl border p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <Label htmlFor={`${key}-${i}`} className="text-sm font-medium">{label}</Label>
                              <Input
                                id={`${key}-${i}`}
                                type="number"
                                className="h-8 w-20"
                                min={1}
                                max={10}
                                value={u.scores[key]}
                                onChange={(e) => updateScore(i, key, Number(e.target.value))}
                              />
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={u.scores[key]}
                              onChange={(e) => updateScore(i, key, Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div> */}
                      {["Impact", "Feasibility"].map((group) => (
                        <div key={group} className="space-y-4">
                          <h3
                            className={`text-lg font-semibold`}
                          >
                            {group}
                          </h3>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {CRITERIA.filter((c) => c.group === group).map(({ key, label, descriptions }) => {
                            const isSelected = selectedDimension === key;

                            return (
                              <div
                                key={key}
                                onClick={() => setSelectedDimension(isSelected ? null : key)}
                                className={`rounded-2xl border p-3 cursor-pointer transition-colors ${
                                  group === "Impact"
                                    ? "bg-amber-50 border-amber-700"
                                    : "bg-sky-50 border-sky-700"
                                }`}
                              >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <Label
                                    htmlFor={`${key}-${i}`}
                                    className="text-sm font-medium select-none"
                                  >
                                    {label}
                                  </Label>
                                  <Input
                                    id={`${key}-${i}`}
                                    type="number"
                                    className="h-8 w-20"
                                    min={1}
                                    max={10}
                                    value={u.scores[key]}
                                    onChange={(e) => updateScore(i, key, Number(e.target.value))}
                                    // prevent clicks on input from toggling description
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>

                                <input
                                  type="range"
                                  min={1}
                                  max={10}
                                  value={u.scores[key]}
                                  onChange={(e) => updateScore(i, key, Number(e.target.value))}
                                  onClick={(e) => e.stopPropagation()} // prevent slider clicks from toggling
                                  className="w-full accent-indigo-600"
                                />

                                {/* Animated description panel */}
                                <div
                                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    isSelected ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
                                  } text-xs text-slate-600 space-y-1`}
                                >
                                  <p>
                                    <strong>0:</strong> {descriptions[0]}
                                  </p>
                                  <p>
                                    <strong>5:</strong> {descriptions[5]}
                                  </p>
                                  <p>
                                    <strong>10:</strong> {descriptions[10]}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Right: Visualizations */}
            <div className="order-1 space-y-6 lg:order-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Comparison Spider Chart</CardTitle>
                    <p className="text-sm text-slate-600">Toggle visibility per use case to declutter the view. Download PNG for slides.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={downloadPNG}><Download className="mr-2 h-4 w-4"/> PNG</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div ref={chartRef} className="h-600px] w-full min-h-700">
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={comparisonData} outerRadius={160}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="criterion" />
                        <PolarRadiusAxis domain={[0, 10]} tickCount={6} />
                        {useCases.map(
                          (u, i) =>
                            u.visible && (
                              <Radar
                                key={u.id}
                                name={u.name || `Use Case ${i + 1}`}
                                dataKey={u.name || `Use Case ${i + 1}`}
                                stroke={COLORS[i % COLORS.length]}
                                fill={COLORS[i % COLORS.length]}
                                fillOpacity={0.2}
                              />
                            )
                        )}
                        <RechartsTooltip />
                      </RadarChart>
                    </ResponsiveContainer>

                    {/* Custom legend in DOM flow with flex-wrap for better wrapping */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
                      {useCases.map((u, i) =>
                        u.visible && (
                          <div
                            key={u.id}
                            className="flex items-center gap-2 max-w-[250px]"
                          >
                            <span
                              className="block h-3 w-3 rounded-sm shrink-0"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="text-sm break-words">{u.name || `Use Case ${u.id + 1}`}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    <span className="inline-flex items-center gap-2">
                      <BarChart2 className="h-5 w-5" />
                      {active?.name || `Use Case ${selected + 1}`} — Detail
                    </span>
                  </CardTitle>
                  {/* Download button OUTSIDE the ref area */}
                  {active && (
                    <Button
                    variant="outline"
                    onClick={() => {
                      const r = ranks.find(r => r.name === active.name);
                      downloadDetailPNG(active, r?.rank ?? 0);
                    }}
                    className="no-print"
                  >
                      <Download className="mr-2 h-4 w-4" /> PNG
                    </Button>
                  )}
                </CardHeader>

                {/* ✅ Only this part is inside detailRef */}
                <CardContent ref={detailRef}>
                  <div className="mb-4 text-slate-700">
                    {active?.description || (
                      <span className="italic text-slate-400">No description yet.</span>
                    )}
                  </div>
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={toRadarData(active)} outerRadius={130}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="criterion" />
                        <PolarRadiusAxis domain={[0, 10]} tickCount={6} />
                        <Radar
                          name={active?.name || `Use Case ${selected + 1}`}
                          dataKey="value"
                          stroke={COLORS[active?.id % COLORS.length]}   // hard color
                          fill={COLORS[active?.id % COLORS.length]}     // same base
                          fillOpacity={0.25}
                        />
                        <RechartsTooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  {active && (
                    <p className="mt-4 text-sm text-slate-600">
                      Ranking:{" "}
                      <strong>
                        #{ranks.find(r => r.name === active.name)?.rank ?? "?"}
                      </strong>{" "}
                      (Avg score:{" "}
                      {ranks.find(r => r.name === active.name)?.avg ?? "?"})
                    </p>
                  )}
                </CardContent>
              </Card>



              <Card>
                <CardHeader>
                  <CardTitle>Ranking (by average score)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b text-slate-600">
                          <th className="py-2 pr-4">#</th>
                          <th className="py-2 pr-4">Use Case</th>
                          <th className="py-2">Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranks.map((r, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-mono">{r.rank}</td>
                            <td className="py-2 pr-4">{r.name}</td>
                            <td className="py-2">{r.avg}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
}
