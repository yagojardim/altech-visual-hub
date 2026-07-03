import type { SVGProps } from "react";

export type ConceptIconName =
  | "projeto"
  | "discovery"
  | "epic"
  | "feature"
  | "historia"
  | "sprint"
  | "risco"
  | "roadmap"
  | "release"
  | "resultado";

export const CONCEPT_COLORS: Record<ConceptIconName, string> = {
  projeto: "#2F6BFF",
  discovery: "#7C4DFF",
  epic: "#2F6BFF",
  feature: "#2F6BFF",
  historia: "#06C18A",
  sprint: "#06C18A",
  risco: "#F0455A",
  roadmap: "#F5A524",
  release: "#06C18A",
  resultado: "#F5A524",
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
    case "projeto":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-20 12 12)" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="5" cy="9.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="19" cy="14.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "discovery":
      return (
        <svg {...props}>
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="M10.5 7.5 L10.5 13.5 M7.5 10.5 L13.5 10.5" />
          <line x1="14.5" y1="14.5" x2="20" y2="20" strokeWidth={2} />
          <path d="M6 6 L8 8" strokeWidth={1} opacity={0.5} />
          <path d="M15 6 L13 8" strokeWidth={1} opacity={0.5} />
        </svg>
      );
    case "epic":
      return (
        <svg {...props}>
          <circle cx="12" cy="4" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="20" cy="9" r="1.2" fill="currentColor" stroke="none" opacity={0.7} />
          <circle cx="17" cy="19" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="7" cy="19" r="1" fill="currentColor" stroke="none" opacity={0.6} />
          <circle cx="4" cy="9" r="1.3" fill="currentColor" stroke="none" />
          <line x1="12" y1="4" x2="20" y2="9" strokeWidth={0.8} opacity={0.4} />
          <line x1="4" y1="9" x2="12" y2="4" strokeWidth={0.8} opacity={0.4} />
        </svg>
      );
    case "feature":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <path d="M17 13 L17 21 M13 17 L21 17" />
        </svg>
      );
    case "historia":
      return (
        <svg {...props}>
          <rect x="3" y="15" width="5.5" height="5.5" rx="1.5" />
          <rect x="9.25" y="10" width="5.5" height="10.5" rx="1.5" />
          <rect x="15.5" y="4" width="5.5" height="16.5" rx="1.5" />
        </svg>
      );
    case "sprint":
      return (
        <svg {...props}>
          <path d="M12 3.5 A8.5 8.5 0 1 1 4.5 17.5" />
          <path d="M4.5 17.5 L2 14 L7.5 14 Z" fill="currentColor" stroke="none" />
          <circle cx="12" cy="3.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "risco":
      return (
        <svg {...props}>
          <path d="M12 12 m-2.5 0 a2.5 2.5 0 0 1 5 0" />
          <path d="M12 12 m-5.5 0 a5.5 5.5 0 0 1 11 0" opacity={0.65} />
          <path d="M12 12 m-8.5 0 a8.5 8.5 0 0 1 17 0" opacity={0.35} />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "roadmap":
      return (
        <svg {...props}>
          <path d="M3 18 C5 18 9 18 12 12 C15 6 19 6 21 6" />
          <circle cx="3" cy="18" r="2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" opacity={0.7} />
          <circle cx="21" cy="6" r="2" fill="currentColor" stroke="none" opacity={0.45} />
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
  return "historia"; // default: task/story = bloco construtivo
}
