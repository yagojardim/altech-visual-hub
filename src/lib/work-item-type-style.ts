// Estilo unificado para badges de tipo/prioridade de work items.
// Cobre TODOS os tipos aceitos pelo check constraint: epic, feature, story,
// task, subtask, bug, risk (+ aliases PT-BR históricos).

export interface TypeMeta {
  label: string;
  color: string; // hex — usado para texto + background com color-mix
}

const TYPE_MAP: Record<string, TypeMeta> = {
  epic: { label: "Épico", color: "#8B5CF6" },
  epico: { label: "Épico", color: "#8B5CF6" },
  épico: { label: "Épico", color: "#8B5CF6" },
  feature: { label: "Feature", color: "#2F6BFF" },
  story: { label: "História", color: "#06C18A" },
  historia: { label: "História", color: "#06C18A" },
  história: { label: "História", color: "#06C18A" },
  task: { label: "Task", color: "#38BDF8" },
  tarefa: { label: "Task", color: "#38BDF8" },
  subtask: { label: "Subtask", color: "#22D3EE" },
  subtarefa: { label: "Subtask", color: "#22D3EE" },
  bug: { label: "Bug", color: "#F43F5E" },
  risk: { label: "Risco", color: "#F0455A" },
  risco: { label: "Risco", color: "#F0455A" },
};

export function typeMeta(type?: string | null): TypeMeta {
  const key = (type ?? "").toLowerCase().trim();
  return TYPE_MAP[key] ?? { label: type ?? "—", color: "#94A3B8" };
}

export function typeBadgeStyle(type?: string | null): React.CSSProperties {
  const { color } = typeMeta(type);
  return {
    color,
    background: `color-mix(in srgb, ${color} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
  };
}

export interface PriorityMeta {
  label: string;
  className: string;
}

const PRIORITY_MAP: Record<string, PriorityMeta> = {
  baixa: { label: "Baixa", className: "bg-muted text-muted-foreground border-border" },
  low: { label: "Baixa", className: "bg-muted text-muted-foreground border-border" },
  media: { label: "Média", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  média: { label: "Média", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  medium: { label: "Média", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  alta: { label: "Alta", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  high: { label: "Alta", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  critica: { label: "Crítica", className: "bg-red-500/10 text-red-400 border-red-500/30" },
  crítica: { label: "Crítica", className: "bg-red-500/10 text-red-400 border-red-500/30" },
  critical: { label: "Crítica", className: "bg-red-500/10 text-red-400 border-red-500/30" },
};

export function priorityMeta(p?: string | null): PriorityMeta | null {
  if (!p) return null;
  const key = p.toLowerCase().trim();
  return PRIORITY_MAP[key] ?? { label: p, className: "border-border text-muted-foreground" };
}
