export interface ProjectSummary {
  projectId: string;
  name: string;
  client: string;
  owner: string;
  status: string;
  dueDate: string;
  description: string;
}

export const MOCK_PROJECTS: ProjectSummary[] = [
  {
    projectId: "altech-core",
    name: "Altech Core",
    client: "Altech",
    owner: "Ana Silva",
    status: "Em progresso",
    dueDate: "01/01 – 31/03/2026",
    description: "Projeto principal da plataforma. Estrutura visual do MVP.",
  },
  {
    projectId: "altech-labs",
    name: "Altech Labs",
    client: "Altech Labs",
    owner: "Bruno Costa",
    status: "Planejamento",
    dueDate: "15/06/2026",
    description: "Iniciativa de exploração de novas capacidades da plataforma.",
  },
  {
    projectId: "altech-launch",
    name: "Altech Launch",
    client: "Altech",
    owner: "Camila Rocha",
    status: "Em progresso",
    dueDate: "30/04/2026",
    description: "Preparação do go-to-market da primeira release pública.",
  },
];

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
      description: "Projeto do workspace Altech.",
    }
  );
}
