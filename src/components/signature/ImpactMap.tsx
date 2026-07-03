export interface ImpactEpic {
  title: string;
  deliveries: string[];
  outcome?: string;
}

export function ImpactMap({
  objective,
  epics,
}: {
  objective: string;
  epics: ImpactEpic[];
}) {
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
        Componente Exclusivo · Impact Map
      </div>
      <h3 style={{ font: "600 18px 'Sora',sans-serif", color: "var(--foreground)", marginBottom: 4 }}>
        Objetivo → Entregas → Impacto
      </h3>

      <div
        className="keep-radius"
        style={{
          borderRadius: 4,
          background: "color-mix(in srgb, #2F6BFF 8%, transparent)",
          border: "1px solid color-mix(in srgb, #2F6BFF 35%, transparent)",
          padding: "14px 16px",
          marginTop: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ font: "500 10px 'JetBrains Mono',monospace", color: "#2F6BFF", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Objetivo de negócio
        </div>
        <div style={{ font: "600 15px 'Sora',sans-serif", color: "var(--foreground)", marginTop: 4 }}>
          {objective}
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        {epics.map((epic, i) => (
          <div
            key={i}
            className="keep-radius"
            style={{
              borderRadius: 4,
              border: "1px solid var(--border)",
              padding: 14,
              background: "var(--card)",
            }}
          >
            <div style={{ font: "500 10px 'JetBrains Mono',monospace", color: "#7C4DFF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              Epic {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ font: "600 14px 'Sora',sans-serif", color: "var(--foreground)", marginBottom: 10 }}>
              {epic.title}
            </div>
            <ul className="space-y-1.5">
              {epic.deliveries.map((d, j) => (
                <li key={j} className="flex items-start gap-2" style={{ font: "400 12px 'Manrope',sans-serif", color: "var(--muted-foreground)" }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#2F6BFF", marginTop: 6, flexShrink: 0 }} />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
            {epic.outcome && (
              <div
                className="keep-radius"
                style={{
                  marginTop: 10,
                  padding: "6px 10px",
                  borderRadius: 4,
                  background: "color-mix(in srgb, #06C18A 12%, transparent)",
                  font: "500 11px 'JetBrains Mono',monospace",
                  color: "#06C18A",
                  letterSpacing: "0.04em",
                }}
              >
                ↗ {epic.outcome}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
