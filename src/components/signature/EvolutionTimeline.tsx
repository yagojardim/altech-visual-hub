import { PHASES, phaseFromStatus, type PhaseId } from "./phases";

export interface EvolutionEvent {
  id: string;
  date: string;
  title: string;
  detail?: string;
  status?: string | null;
  phase?: PhaseId;
}

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function EvolutionTimeline({
  events,
  title = "Evolution Timeline",
}: {
  events: EvolutionEvent[];
  title?: string;
}) {
  const sorted = [...events].sort((a, b) => (a.date < b.date ? 1 : -1));
  const phaseOf = (e: EvolutionEvent) => PHASES.find((p) => p.id === (e.phase ?? phaseFromStatus(e.status)))!;

  return (
    <section
      className="keep-radius"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: 20,
      }}
    >
      <div
        style={{
          font: "500 10px 'JetBrains Mono',monospace",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#7C4DFF",
          marginBottom: 8,
        }}
      >
        Componente Exclusivo · Evolution Timeline
      </div>
      <h3 style={{ font: "600 18px 'Sora',sans-serif", color: "var(--foreground)", marginBottom: 4 }}>
        {title}
      </h3>
      <p style={{ font: "400 13px 'Manrope',sans-serif", color: "var(--muted-foreground)", marginBottom: 18 }}>
        A evolução real do produto — não um Gantt de tarefas.
      </p>

      <div className="relative">
        <div style={{ position: "absolute", left: 11, top: 4, bottom: 4, width: 1, background: "var(--border)" }} aria-hidden="true" />
        <ul className="space-y-4">
          {sorted.length === 0 && (
            <li style={{ font: "400 12px 'Manrope',sans-serif", color: "var(--muted-foreground)", paddingLeft: 32 }}>
              Sem eventos registrados.
            </li>
          )}
          {sorted.slice(0, 8).map((e) => {
            const p = phaseOf(e);
            return (
              <li key={e.id} className="relative pl-8">
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 5,
                    top: 4,
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    background: p.color,
                    border: "3px solid var(--card)",
                    boxShadow: `0 0 0 1px ${p.color}`,
                  }}
                />
                <div className="flex items-baseline justify-between gap-3">
                  <div style={{ font: "600 13px 'Sora',sans-serif", color: "var(--foreground)" }}>
                    {e.title}
                  </div>
                  <div style={{ font: "500 10px 'JetBrains Mono',monospace", color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
                    {fmt(e.date)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="keep-radius"
                    style={{
                      font: "500 10px 'JetBrains Mono',monospace",
                      color: p.color,
                      background: `color-mix(in srgb, ${p.color} 12%, transparent)`,
                      padding: "2px 8px",
                      borderRadius: 999,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {p.label}
                  </span>
                  {e.detail && (
                    <span style={{ font: "400 12px 'Manrope',sans-serif", color: "var(--muted-foreground)" }}>
                      {e.detail}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
