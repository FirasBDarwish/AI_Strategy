import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultImpactWeights } from "@/lib/project";
import { IMPACT_KEYS } from "@/lib/scoring";
import type { ImpactKey, ImpactWeights } from "@/types/strategy";
import { Building2, CircleDollarSign, Gauge, Scale, Target, Users } from "lucide-react";

const PRIORITIES: Record<ImpactKey, {
  label: string;
  description: string;
  bar: string;
  iconSurface: string;
  icon: typeof Target;
}> = {
  increasesProductivity: { label: "Productivity", description: "Increase staff capacity and service efficiency.", bar: "bg-[#65796b]", iconSurface: "bg-[#e8ede8] text-[#536458]", icon: Gauge },
  reducesCosts: { label: "Cost Reduction", description: "Reduce operating or service-delivery costs.", bar: "bg-[#8a7868]", iconSurface: "bg-[#eee8e1] text-[#756456]", icon: Scale },
  benefitsPublic: { label: "Public Benefit", description: "Improve outcomes and experiences for the public.", bar: "bg-[#6c8580]", iconSurface: "bg-[#e5ecea] text-[#58706b]", icon: Users },
  increaseRevenue: { label: "Revenue Generation", description: "Create or protect sustainable revenue.", bar: "bg-[#aa8053]", iconSurface: "bg-[#f2e9dd] text-[#8a6847]", icon: CircleDollarSign },
  strategicImpact: { label: "Strategic Alignment", description: "Advance the organization’s stated priorities.", bar: "bg-[#7c6860]", iconSurface: "bg-[#eee7e4] text-[#695650]", icon: Building2 },
};

export function StrategicWeights({ weights, onChange }: { weights: ImpactWeights; onChange: (weights: ImpactWeights) => void }) {
  const total = IMPACT_KEYS.reduce((sum, key) => sum + weights[key], 0);
  const difference = 100 - total;

  return <div className="space-y-5">
    <section className="rounded-xl border border-stone-200 bg-[#fffdf9] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-stone-600"><Target className="h-4 w-4" /> Strategic outcomes</div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Decide what kind of value matters most</h2>
          <p className="mt-2 leading-7 text-stone-600">Type any combination you want. The five values should add to exactly 100% before the weighted impact score is used.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right"><div className="text-2xl font-semibold tabular-nums text-stone-900">{total}</div><div className="text-sm text-stone-500">points allocated</div></div>
          <Button variant="outline" onClick={() => onChange(defaultImpactWeights())}>Reset equally</Button>
        </div>
      </div>
      <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-stone-100" aria-label="Strategic priority distribution">
        {IMPACT_KEYS.map((key) => <div key={key} className={`${PRIORITIES[key].bar} shrink-0 transition-[width] duration-200`} style={{ width: `${weights[key]}%` }} title={`${PRIORITIES[key].label}: ${weights[key]} points`} />)}
      </div>
      {difference !== 0 && <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${difference < 0 ? "border-red-300 bg-red-50 text-red-800" : "border-amber-300 bg-amber-50 text-amber-900"}`}><strong>{difference < 0 ? `${Math.abs(difference)}% over the limit.` : `${difference}% still available.`}</strong> {difference < 0 ? "Reduce one or more priorities until the total returns to 100%." : "Add the remaining percentage to any priorities you choose."}</div>}
    </section>

    <section className="grid gap-3 lg:grid-cols-5">
      {IMPACT_KEYS.map((key) => {
        const item = PRIORITIES[key];
        const Icon = item.icon;
        return <div key={key} className="rounded-xl border border-stone-200 bg-[#fffdf9] p-4">
          <div className="flex items-start justify-between gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${item.iconSurface}`}><Icon className="h-4 w-4" /></span>
            <div className="relative w-24"><Input aria-label={`${item.label} weight`} type="number" min={0} max={100} step={1} value={weights[key]} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onChange({ ...weights, [key]: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })} className="h-10 pr-8 text-right text-lg font-semibold tabular-nums" /><span className="pointer-events-none absolute right-3 top-2.5 text-sm text-stone-500">%</span></div>
          </div>
          <h3 className="mt-4 font-semibold text-stone-900">{item.label}</h3>
          <p className="mt-1 min-h-12 text-sm leading-5 text-stone-500">{item.description}</p>
        </div>;
      })}
    </section>
  </div>;
}
