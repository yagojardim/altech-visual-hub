export const PHASES = [
  { id: "problema", n: "01", label: "Problema", color: "#F0455A", desc: "Fricção" },
  { id: "descoberta", n: "02", label: "Descoberta", color: "#7C4DFF", desc: "Investigar" },
  { id: "hipotese", n: "03", label: "Hipótese", color: "#2E9BFF", desc: "Formular" },
  { id: "validacao", n: "04", label: "Validação", color: "#5FB0FF", desc: "Testar" },
  { id: "construcao", n: "05", label: "Construção", color: "#2F6BFF", desc: "Desenvolver" },
  { id: "entrega", n: "06", label: "Entrega", color: "#06C18A", desc: "Deploy" },
  { id: "impacto", n: "07", label: "Impacto", color: "#F5A524", desc: "Valor" },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export function phaseFromStatus(status?: string | null): PhaseId {
  const s = (status ?? "").toLowerCase();
  if (/(bug|problema|bloque)/.test(s)) return "problema";
  if (/(discovery|descoberta|research)/.test(s)) return "descoberta";
  if (/(hip[oó]tese|hypothesis)/.test(s)) return "hipotese";
  if (/(valid|test|review|revis)/.test(s)) return "validacao";
  if (/(done|conclu|closed|resolved|entregue)/.test(s)) return "entrega";
  if (/(impact|valor|kpi)/.test(s)) return "impacto";
  return "construcao";
}
