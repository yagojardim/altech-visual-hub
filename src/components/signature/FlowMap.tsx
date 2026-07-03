import { PHASES, phaseFromStatus, type PhaseId } from "./phases";

export interface FlowItem {
  id: string;
  title: string;
  meta?: string;
  status?: string | null;
  phase?: PhaseId;
}

export function FlowMap({ items = [], title = "Fluxo de Evolução do Produto" }: { items?: FlowItem[]; title?: string }) {
  const byPhase = new Map<PhaseId, FlowItem[]>();
  for (const p of PHASES) byPhase.set(p.id, []);
  for (const it of items) {
    const p = it.phase ?? phaseFromStatus(it.status);
    byPhase.get(p)!.push(it);
  }

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
        Componente Exclusivo · Flow Map
      </div>
      <h3 style={{ font: "600 18px 'Sora',sans-serif", color: "var(--foreground)", marginBottom: 4 }}>
        {title}
      </h3>
      <p style={{ font: "400 13px 'Manrope',sans-serif", color: "var(--muted-foreground)", marginBottom: 18 }}>
        Cada item sabe em que etapa está — do problema ao impacto.
      </p>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-3 min-w-max">
          {PHASES.map((phase, idx) => {
            const list = byPhase.get(phase.id) ?? [];
            return (
              <div key={phase.id} className="flex items-start gap-3">
                <div className="flex flex-col gap-2" style={{ minWidth: 140 }}>
                  <div
                    className="keep-radius"
                    style={{
                      borderRadius: 6,
                      background: `color-mix(in srgb, ${phase.color} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${phase.color} 45%, transparent)`,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ font: "500 10px 'JetBrains Mono',monospace", color: phase.color, letterSpacing: "0.1em" }}>
                      {phase.n}
                    </div>
                    <div style={{ font: "600 13px 'Sora',sans-serif", color: phase.color, marginTop: 2 }}>
                      {phase.label}
                    </div>
                  </div>
                  <div style={{ font: "400 11px 'Manrope',sans-serif", color: "var(--muted-foreground)", padding: "0 4px" }}>
                    {phase.desc}
                  </div>
                  {list.slice(0, 3).map((it) => (
                    <div
                      key={it.id}
                      className="keep-radius"
                      style={{
                        borderRadius: 4,
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        padding: "8px 10px",
                      }}
                    >
                      <div style={{ font: "600 12px 'Manrope',sans-serif", color: "var(--foreground)", lineHeight: 1.3 }}>
                        {it.title}
                      </div>
                      {it.meta && (
                        <div style={{ font: "400 10px 'JetBrains Mono',monospace", color: "var(--muted-foreground)", marginTop: 3 }}>
                          {it.meta}
                        </div>
                      )}
                    </div>
                  ))}
                  {list.length > 3 && (
                    <div style={{ font: "500 10px 'JetBrains Mono',monospace", color: "var(--muted-foreground)", padding: "0 4px" }}>
                      +{list.length - 3} itens
                    </div>
                  )}
                  {list.length === 0 && (
                    <div
                      className="keep-radius"
                      style={{
                        borderRadius: 4,
                        border: "1px dashed var(--border)",
                        padding: "10px",
                        font: "400 10px 'Manrope',sans-serif",
                        color: "var(--muted-foreground)",
                        textAlign: "center",
                      }}
                    >
                      —
                    </div>
                  )}
                </div>
                {idx < PHASES.length - 1 && (
                  <div className="flex items-center pt-6" aria-hidden="true">
                    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                      <path d="M1 7 L15 7 M11 3 L15 7 L11 11" stroke="var(--muted-foreground)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
