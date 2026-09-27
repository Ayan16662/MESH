import React, { createContext, useCallback, useContext, useState } from 'react'
import type { ShelterProject } from '../types'
import { listProjects, saveProject, newProjectId } from '../lib/storage'
import { LADAKH_DEMO_CLIMATE, LADAKH_LOCATION } from '../data/ladakhDemo'

export function defaultProject(): ShelterProject {
  const now = new Date().toISOString()
  return {
    id: newProjectId(),
    name: 'Untitled Shelter Project',
    description: '',
    designer: '',
    organization: '',
    shelterType: 'Personnel Shelter',
    location: { ...LADAKH_LOCATION },
    climate: { ...LADAKH_DEMO_CLIMATE },
    geometry: {
      lengthM: 6,
      widthM: 4,
      heightM: 2.6,
      roofHeightM: 1.0,
      shape: 'rectangular',
      wallThicknessM: 0.3,
      floorThicknessM: 0.2,
      orientation: 'S',
      windowAreaM2: 2.4,
      doorAreaM2: 1.8,
      numWindows: 2,
      numDoors: 1,
    },
    wallAssembly: {
      name: 'Stone + Rock Wool + Concrete',
      layers: [
        { materialId: 'stone', thicknessM: 0.15 },
        { materialId: 'rockwool', thicknessM: 0.1 },
        { materialId: 'concrete', thicknessM: 0.05 },
      ],
    },
    roofAssembly: {
      name: 'Insulated Panel Roof',
      layers: [
        { materialId: 'insulatedpanel', thicknessM: 0.12 },
        { materialId: 'wood', thicknessM: 0.02 },
      ],
    },
    occupancy: {
      numOccupants: 8,
      scheduleStart: '06:00',
      scheduleEnd: '23:00',
      activityLevel: 'light',
      sensibleHeatPerPersonW: 75,
      latentHeatPerPersonW: 55,
    },
    ventilation: {
      ach: 0.6,
      mechanicalAch: 0,
      windowOpenFraction: 0.1,
      infiltrationAchBase: 0.3,
    },
    comfort: { minC: 18, maxC: 26 },
    simulationSettings: {
      date: new Date().toISOString().slice(0, 10),
      startHour: 0,
      endHour: 23,
      timeStepMin: 60,
    },
    createdAt: now,
    updatedAt: now,
  }
}

interface Ctx {
  project: ShelterProject
  setProject: React.Dispatch<React.SetStateAction<ShelterProject>>
  save: () => void
  loadNew: () => void
  load: (p: ShelterProject) => void
  projects: ShelterProject[]
  refreshProjects: () => void
}

const ProjectCtx = createContext<Ctx | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<ShelterProject>(defaultProject)
  const [projects, setProjects] = useState<ShelterProject[]>(() => listProjects())

  const refreshProjects = useCallback(() => setProjects(listProjects()), [])

  const save = useCallback(() => {
    saveProject(project)
    refreshProjects()
  }, [project, refreshProjects])

  const loadNew = useCallback(() => setProject(defaultProject()), [])
  const load = useCallback((p: ShelterProject) => setProject(p), [])

  return (
    <ProjectCtx.Provider value={{ project, setProject, save, loadNew, load, projects, refreshProjects }}>
      {children}
    </ProjectCtx.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectCtx)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
