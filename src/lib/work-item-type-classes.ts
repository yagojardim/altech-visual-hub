// Classes utilitárias centralizadas para badges de tipo de work item.
// Todas as cores vêm de variáveis CSS (--color-type-*, --color-healthy,
// --color-blocked, --color-backlog) — nenhuma cor Tailwind pura aqui.

export const TYPE_BADGE_CLASS = {
  epic: "bg-type-epic/15 text-type-epic border-type-epic/30",
  feature: "bg-type-feature/15 text-type-feature border-type-feature/30",
  story: "bg-healthy/15 text-healthy border-healthy/30",
  task: "bg-type-task/15 text-type-task border-type-task/30",
  subtask: "bg-type-subtask/10 text-type-subtask border-type-subtask/20",
  bug: "bg-blocked/15 text-blocked border-blocked/30",
  risk: "bg-blocked/15 text-blocked border-blocked/30",
} as const;

export const TYPE_TEXT_CLASS = {
  epic: "text-type-epic",
  feature: "text-type-feature",
  story: "text-healthy",
  task: "text-type-task",
  subtask: "text-type-subtask",
  bug: "text-blocked",
  risk: "text-blocked",
} as const;

export const TYPE_DOT_CLASS = {
  epic: "bg-type-epic",
  feature: "bg-type-feature",
  story: "bg-healthy",
  task: "bg-type-task",
  subtask: "bg-type-subtask",
  bug: "bg-blocked",
  risk: "bg-blocked",
} as const;
