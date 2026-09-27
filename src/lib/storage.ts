import type { ShelterProject } from '../types'

// Project persistence. Backed by localStorage for this frontend-only build.
// To move to a real backend: replace these functions with fetch() calls to
// /api/projects (see README "Adding a backend") — the ShelterProject shape
// already matches the MongoDB schema described in the original spec.
const KEY = 'therma.projects.v1'

function readAll(): Record<string, ShelterProject> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, ShelterProject>) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function listProjects(): ShelterProject[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getProject(id: string): ShelterProject | undefined {
  return readAll()[id]
}

export function saveProject(project: ShelterProject): void {
  const all = readAll()
  all[project.id] = { ...project, updatedAt: new Date().toISOString() }
  writeAll(all)
}

export function deleteProject(id: string): void {
  const all = readAll()
  delete all[id]
  writeAll(all)
}

export function duplicateProject(id: string): ShelterProject | undefined {
  const all = readAll()
  const src = all[id]
  if (!src) return undefined
  const copy: ShelterProject = {
    ...src,
    id: crypto.randomUUID(),
    name: `${src.name} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  all[copy.id] = copy
  writeAll(all)
  return copy
}

export function newProjectId(): string {
  return crypto.randomUUID()
}
