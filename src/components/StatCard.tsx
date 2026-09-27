import clsx from 'clsx'

export default function StatCard({
  label, value, unit, accent = 'ice', hint,
}: {
  label: string
  value: string | number
  unit?: string
  accent?: 'ice' | 'ember' | 'frost'
  hint?: string
}) {
  const accentClass = { ice: 'text-ice2', ember: 'text-ember2', frost: 'text-frost' }[accent]
  return (
    <div className="border border-line bg-panel rounded-md px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-wide text-slate mb-1.5">{label}</div>
      <div className={clsx('data-num text-2xl font-500', accentClass)}>
        {value}
        {unit && <span className="text-sm text-slate ml-1">{unit}</span>}
      </div>
      {hint && <div className="text-[11px] text-slate mt-1">{hint}</div>}
    </div>
  )
}
