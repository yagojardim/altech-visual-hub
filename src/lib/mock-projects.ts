export interface ProjectSprintMock {
  name: string;
  status: string;
  dates: string;
  objective: string;
  capacity: string;
  itemsTotal: number;
}

export interface ProjectSummary {
  projectId: string;
  name: string;
  client: string;
  owner: string;
  status: string;
  dueDate: string;
  description: string;
  sprint: ProjectSprintMock;
}

export const MOCK_PROJECTS: ProjectSummary[] = [
  {
    projectId: "altech-core",
    name: "Altech Core",
    client: "Altech",
    owner: "Ana Silva",
    status: "Em progresso",
    dueDate: "01/01 – 31/03/2026",
    description: "Projeto principal do Altech Project. Estrutura visual do MVP.",
    sprint: {
      name: "Sprint 3",
      status: "Ativa",
      dates: "15/01 – 29/01/2026",
      objective: "Estabilizar MVP",
      capacity: "32 / 40",
      itemsTotal: 12,
    },
  },
  {
    projectId: "altech-labs",
    name: "Altech Labs",
    client: "Altech Labs",
    owner: "Bruno Costa",
    status: "Planejamento",
    dueDate: "15/06/2026",
    description: "Iniciativa de exploração de novas capacidades do Altech Project.",
    sprint: {
      name: "Sprint 1",
      status: "Planejamento",
      dates: "01/05 – 15/05/2026",
      objective: "Prototipar novas capacidades",
      capacity: "18 / 30",
      itemsTotal: 7,
    },
  },
  {
    projectId: "altech-launch",
    name: "Altech Launch",
    client: "Altech",
    owner: "Camila Rocha",
    status: "Em progresso",
    dueDate: "30/04/2026",
    description: "Preparação do go-to-market da primeira release pública.",
    sprint: {
      name: "Sprint 2",
      status: "Ativa",
      dates: "05/03 – 19/03/2026",
      objective: "Preparar release pública",
      capacity: "26 / 35",
      itemsTotal: 9,
    },
  },
];

const FALLBACK_SPRINT: ProjectSprintMock = {
  name: "Sprint 1",
  status: "Planejamento",
  dates: "—",
  objective: "Definir escopo inicial",
  capacity: "0 / 0",
  itemsTotal: 0,
};

export function getProjectById(projectId: string | undefined | null): ProjectSummary {
  if (!projectId) return MOCK_PROJECTS[0];
  return (
    MOCK_PROJECTS.find((p) => p.projectId === projectId) ?? {
      projectId,
      name: projectId
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      client: "Altech",
      owner: "—",
      status: "Em progresso",
      dueDate: "—",
      description: "Projeto do workspace Altech Project.",
      sprint: FALLBACK_SPRINT,
    }
  );
}
