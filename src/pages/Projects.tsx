import { useNavigate } from 'react-router-dom'
import { useProject } from '../store/ProjectContext'
import { deleteProject, duplicateProject } from '../lib/storage'
import { Copy, Trash2, FolderOpen } from 'lucide-react'

export default function Projects() {
  const { projects, refreshProjects, load } = useProject()
  const nav = useNavigate()

  function open(id: string) {
    const p = projects.find((x) => x.id === id)
    if (p) { load(p); nav('/designer') }
  }

  function remove(id: string) {
    deleteProject(id)
    refreshProjects()
  }

  function duplicate(id: string) {
    duplicateProject(id)
    refreshProjects()
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-display font-700 text-2xl mb-1">Saved Projects</h1>
      <p className="text-sm text-slate mb-6">Stored locally in this browser.</p>

      {projects.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-10 text-center text-slate">No saved projects yet.</div>
      ) : (
        <div className="border border-line rounded-md overflow-hidden">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-line/60 last:border-0 hover:bg-panel/60">
              <div>
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs text-slate">{p.location.name} · updated {new Date(p.updatedAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => open(p.id)} className="p-2 text-slate hover:text-ice2" title="Open"><FolderOpen size={15} /></button>
                <button onClick={() => duplicate(p.id)} className="p-2 text-slate hover:text-ice2" title="Duplicate"><Copy size={15} /></button>
                <button onClick={() => remove(p.id)} className="p-2 text-slate hover:text-ember2" title="Delete"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
