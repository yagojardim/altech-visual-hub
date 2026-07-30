// Estilo unificado para badges de tipo/prioridade de work items.
// TODAS as cores vêm de tokens semânticos definidos em
// src/styles/altech-tokens.css / src/styles.css — nenhum hex solto aqui.
// Cobre os tipos: epic, feature, story, task, subtask, bug, risk (+ aliases PT-BR).

/** Constante central de cores semânticas (variáveis CSS). */
export const SEMANTIC_COLOR = {
  healthy: "var(--healthy)",
  warning: "var(--warning)",
  blocked: "var(--blocked)",
  inprogress: "var(--inprogress)",
  backlog: "var(--backlog)",
} as const;

/** Cores por tipo — tipos não-semânticos leem tokens dedicados de tipo. */
export const TYPE_COLOR = {
  epic: "var(--type-epic)",
  feature: "var(--type-feature)",
  story: SEMANTIC_COLOR.healthy,
  task: "var(--type-task)",
  subtask: "var(--type-subtask)",
  bug: SEMANTIC_COLOR.blocked,
  risk: SEMANTIC_COLOR.blocked,
  default: SEMANTIC_COLOR.backlog,
} as const;

export interface TypeMeta {
  label: string;
  color: string; // variável CSS
}

const TYPE_MAP: Record<string, TypeMeta> = {
  epic: { label: "Épico", color: TYPE_COLOR.epic },
  epico: { label: "Épico", color: TYPE_COLOR.epic },
  épico: { label: "Épico", color: TYPE_COLOR.epic },
  feature: { label: "Feature", color: TYPE_COLOR.feature },
  story: { label: "História", color: TYPE_COLOR.story },
  historia: { label: "História", color: TYPE_COLOR.story },
  história: { label: "História", color: TYPE_COLOR.story },
  task: { label: "Task", color: TYPE_COLOR.task },
  tarefa: { label: "Task", color: TYPE_COLOR.task },
  subtask: { label: "Subtask", color: TYPE_COLOR.subtask },
  subtarefa: { label: "Subtask", color: TYPE_COLOR.subtask },
  bug: { label: "Bug", color: TYPE_COLOR.bug },
  risk: { label: "Risco", color: TYPE_COLOR.risk },
  risco: { label: "Risco", color: TYPE_COLOR.risk },
};

function softStyle(color: string): React.CSSProperties {
  return {
    color,
    background: `color-mix(in srgb, ${color} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
  };
}

export function typeMeta(type?: string | null): TypeMeta {
  const key = (type ?? "").toLowerCase().trim();
  return TYPE_MAP[key] ?? { label: type ?? "—", color: TYPE_COLOR.default };
}

export function typeBadgeStyle(type?: string | null): React.CSSProperties {
  return softStyle(typeMeta(type).color);
}

export interface PriorityMeta {
  label: string;
  color: string;
  style: React.CSSProperties;
  /** mantido por compatibilidade — sem cores hardcoded */
  className: string;
}

function priority(label: string, color: string): PriorityMeta {
  return { label, color, style: softStyle(color), className: "" };
}

const PRIORITY_MAP: Record<string, PriorityMeta> = {
  baixa: priority("Baixa", SEMANTIC_COLOR.backlog),
  low: priority("Baixa", SEMANTIC_COLOR.backlog),
  media: priority("Média", SEMANTIC_COLOR.inprogress),
  média: priority("Média", SEMANTIC_COLOR.inprogress),
  medium: priority("Média", SEMANTIC_COLOR.inprogress),
  alta: priority("Alta", SEMANTIC_COLOR.warning),
  high: priority("Alta", SEMANTIC_COLOR.warning),
  critica: priority("Crítica", SEMANTIC_COLOR.blocked),
  crítica: priority("Crítica", SEMANTIC_COLOR.blocked),
  critical: priority("Crítica", SEMANTIC_COLOR.blocked),
};

export function priorityMeta(p?: string | null): PriorityMeta | null {
  if (!p) return null;
  const key = p.toLowerCase().trim();
  return PRIORITY_MAP[key] ?? priority(p, SEMANTIC_COLOR.backlog);
}

/** Estilo suave (soft) a partir de qualquer cor semântica de token. */
export function semanticBadgeStyle(color: string): React.CSSProperties {
  return softStyle(color);
}
