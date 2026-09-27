import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FilePlus2, Ruler, Box, Activity, BarChart3,
  GitCompare, FileText, FolderOpen, Settings as SettingsIcon, Snowflake,
  Map,
} from 'lucide-react'
import clsx from 'clsx'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/new-project', label: 'New Project', icon: FilePlus2 },
  { to: '/map', label: 'Map Explorer', icon: Map },
  { to: '/designer', label: '2D / 3D Designer', icon: Box },
  { to: '/simulation', label: 'Simulation', icon: Activity },
  { to: '/results', label: 'Results', icon: BarChart3 },
  { to: '/comparison', label: 'Comparison', icon: GitCompare },
  { to: '/report', label: 'Report', icon: FileText },
  { to: '/projects', label: 'Saved Projects', icon: FolderOpen },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Nav() {
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-panel2/60 backdrop-blur-sm h-screen sticky top-0 flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-line">
        <Snowflake className="text-ice" size={22} strokeWidth={2} />
        <div>
          <div className="font-display font-700 text-lg tracking-tight leading-none">MESH</div>
          <div className="text-[10px] text-slate mt-0.5 tracking-wide">THERMAL SHELTER</div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                isActive ? 'bg-ice/10 text-ice2 border border-ice/25' : 'text-slate hover:text-frost hover:bg-panel',
              )
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-line text-[11px] text-slate leading-relaxed">
        Physics engine: client-side 5R1C-style model.<br />ANSYS Validation: Pending.
      </div>
    </aside>
  )
}
