// Centralized sprint status values, labels and colors.
// Keep the canonical PT strings aligned with the database.

export const SPRINT_STATUS = ["Planejada", "Ativa", "Concluída"] as const;
export type SprintStatus = (typeof SPRINT_STATUS)[number];

export const DEFAULT_SPRINT_STATUS: SprintStatus = "Planejada";

const NORMALIZED: Record<string, SprintStatus> = {
  planejada: "Planejada",
  planned: "Planejada",
  ativa: "Ativa",
  active: "Ativa",
  "em andamento": "Ativa",
  "concluída": "Concluída",
  concluida: "Concluída",
  done: "Concluída",
  completed: "Concluída",
  closed: "Concluída",
};

export function normalizeSprintStatus(value: string | null | undefined): SprintStatus {
  if (!value) return DEFAULT_SPRINT_STATUS;
  return NORMALIZED[value.toLowerCase()] ?? DEFAULT_SPRINT_STATUS;
}

export function getSprintStatusLabel(value: string | null | undefined): string {
  return normalizeSprintStatus(value);
}

// Tailwind class strings for the sprint status chip/badge.
// Reuses existing token colors — no new palette.
const COLORS: Record<SprintStatus, string> = {
  Planejada: "border-border bg-panel text-muted-foreground",
  Ativa: "border-accent/30 bg-accent/15 text-accent",
  "Concluída": "border-primary/30 bg-primary/10 text-primary",
};

export function getSprintStatusColor(value: string | null | undefined): string {
  return COLORS[normalizeSprintStatus(value)];
}
