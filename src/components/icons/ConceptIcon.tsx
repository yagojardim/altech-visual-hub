import type { SVGProps } from "react";
import { TYPE_COLOR, SEMANTIC_COLOR } from "@/lib/work-item-type-style";

export type ConceptIconName =
  // Navegação
  | "dashboard"
  | "projeto"
  | "discovery"
  | "backlog"
  | "sprint"
  | "roadmap"
  | "relatorios"
  | "administracao"
  // Entidades
  | "epic"
  | "feature"
  | "historia"
  | "risco"
  | "pmo"
  | "release"
  | "resultado";

/**
 * Cores de conceitos que NÃO são work items (ícones de navegação).
 * Centralizadas aqui, sempre a partir de tokens CSS — nenhum hex solto.
 */
export const NAV_CONCEPT_COLOR = {
  dashboard: SEMANTIC_COLOR.inprogress,
  projeto: "var(--purple)",
  discovery: "var(--purple)",
  backlog: SEMANTIC_COLOR.backlog,
  roadmap: SEMANTIC_COLOR.warning,
  relatorios: SEMANTIC_COLOR.inprogress,
  administracao: SEMANTIC_COLOR.backlog,
  pmo: SEMANTIC_COLOR.warning,
  resultado: SEMANTIC_COLOR.warning,
} as const;

/** Mesma fonte de verdade que work-item-type-style.ts para conceitos de work item. */
export const CONCEPT_COLORS: Record<ConceptIconName, string> = {
  dashboard: NAV_CONCEPT_COLOR.dashboard,
  projeto: NAV_CONCEPT_COLOR.projeto,
  discovery: NAV_CONCEPT_COLOR.discovery,
  backlog: NAV_CONCEPT_COLOR.backlog,
  sprint: SEMANTIC_COLOR.healthy,
  roadmap: NAV_CONCEPT_COLOR.roadmap,
  relatorios: NAV_CONCEPT_COLOR.relatorios,
  administracao: NAV_CONCEPT_COLOR.administracao,
  epic: TYPE_COLOR.epic,
  feature: TYPE_COLOR.feature,
  historia: TYPE_COLOR.story,
  risco: TYPE_COLOR.risk,
  pmo: NAV_CONCEPT_COLOR.pmo,
  release: SEMANTIC_COLOR.healthy,
  resultado: NAV_CONCEPT_COLOR.resultado,
};


const BASE = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

interface Props extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: ConceptIconName;
  size?: number;
  active?: boolean;
}

export function ConceptIcon({ name, size = 20, active = false, style, ...rest }: Props) {
  const color = active ? CONCEPT_COLORS[name] : undefined;
  const props = { width: size, height: size, style: { color, ...style }, ...BASE, ...rest };
  switch (name) {
    case "dashboard":
      // Bússola — círculo + crosshair + ticks cardeais + núcleo
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="7" />
          <line x1="12" y1="2.5" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="21.5" y2="12" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "projeto":
      // Órbita elíptica com núcleo e satélites
      return (
        <svg {...props}>
          <ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(-20 12 12)" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="9.2" r="1" fill="currentColor" stroke="none" />
          <circle cx="19.5" cy="14.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "discovery":
      // Lente de aumento com "+"
      return (
        <svg {...props}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M10.5 7 L10.5 14 M7 10.5 L14 10.5" />
          <line x1="15" y1="15" x2="20.5" y2="20.5" strokeWidth={2} />
        </svg>
      );
    case "backlog":
      // Estrato de prioridade — barras crescentes alinhadas à esquerda
      return (
        <svg {...props}>
          <line x1="4" y1="6.5" x2="11" y2="6.5" strokeWidth={2} />
          <line x1="4" y1="12" x2="16" y2="12" strokeWidth={2.5} />
          <line x1="4" y1="17.5" x2="20" y2="17.5" strokeWidth={3} />
        </svg>
      );
    case "sprint":
      // Ciclo — arco aberto com seta
      return (
        <svg {...props}>
          <path d="M20 12 A8 8 0 1 1 12 4" />
          <path d="M12 4 L15.5 6.5 L12 9 Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "roadmap":
      // Linha de evolução — curva com marcos
      return (
        <svg {...props}>
          <path d="M3 18 C6 18 9 18 12 12 C15 6 18 6 21 6" />
          <circle cx="3" cy="18" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" opacity={0.75} />
          <circle cx="21" cy="6" r="1.8" fill="currentColor" stroke="none" opacity={0.5} />
        </svg>
      );
    case "relatorios":
      // Prisma — dois triângulos espelhados (bowtie)
      return (
        <svg {...props}>
          <path d="M3 5 L3 19 L12 12 Z" />
          <path d="M21 5 L21 19 L12 12 Z" />
        </svg>
      );
    case "administracao":
      // Estrutura cristalina — hexágono/cubo com arestas internas
      return (
        <svg {...props}>
          <path d="M12 3 L20.5 7.5 L20.5 16.5 L12 21 L3.5 16.5 L3.5 7.5 Z" />
          <path d="M12 3 L12 12 M3.5 7.5 L12 12 M20.5 7.5 L12 12" />
        </svg>
      );
    case "epic":
      // Constelação — pentágono com vértices marcados
      return (
        <svg {...props}>
          <polygon points="12,3.5 20,9.5 17,19.5 7,19.5 4,9.5" />
          <circle cx="12" cy="3.5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="20" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="7" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "feature":
      // Módulos + junção
      return (
        <svg {...props}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <path d="M17 13 L17 21 M13 17 L21 17" />
        </svg>
      );
    case "historia":
      // Bloco construtivo — barras ascendentes
      return (
        <svg {...props}>
          <rect x="3" y="15" width="5.5" height="5.5" rx="1.2" />
          <rect x="9.25" y="10" width="5.5" height="10.5" rx="1.2" />
          <rect x="15.5" y="4" width="5.5" height="16.5" rx="1.2" />
        </svg>
      );
    case "risco":
      // Sinal de radar — arcos superiores concêntricos com núcleo
      return (
        <svg {...props}>
          <path d="M3 15 A9 9 0 0 1 21 15" />
          <path d="M6.5 15 A5.5 5.5 0 0 1 17.5 15" opacity={0.65} />
          <path d="M10 15 A2 2 0 0 1 14 15" opacity={0.45} />
          <circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "pmo":
      // Bússola estratégica — losango com núcleo e pontos cardeais
      return (
        <svg {...props}>
          <path d="M12 3 L21 12 L12 21 L3 12 Z" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="12" cy="17.5" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="6.5" cy="12" r="0.7" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="12" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      );
    case "release":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="6" opacity={0.5} />
          <circle cx="12" cy="12" r="9.5" opacity={0.25} />
        </svg>
      );
    case "resultado":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <path d="M12 12 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" opacity={0.65} />
          <path d="M12 12 m-7.5 0 a7.5 7.5 0 1 0 15 0 a7.5 7.5 0 1 0 -15 0" opacity={0.35} />
        </svg>
      );
  }
}

/** Map work-item type string (bug, story, task, epic, feature…) to concept name */
export function conceptFromType(type?: string | null): ConceptIconName {
  const t = (type ?? "").toLowerCase();
  if (/epic/.test(t)) return "epic";
  if (/feat/.test(t)) return "feature";
  if (/(hist|story)/.test(t)) return "historia";
  if (/(bug|risco|risk|inciden)/.test(t)) return "risco";
  if (/(spike|discovery|research)/.test(t)) return "discovery";
  if (/(release|deploy)/.test(t)) return "release";
  if (/(outcome|result|impact)/.test(t)) return "resultado";
  if (/(roadmap|milestone|marco)/.test(t)) return "roadmap";
  if (/sprint/.test(t)) return "sprint";
  if (/pmo/.test(t)) return "pmo";
  return "historia";
}
