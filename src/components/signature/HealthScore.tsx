export interface HealthDimension {
  label: string;
  score: number; // 0-100
  hint?: string;
}

function colorFor(score: number) {
  if (score >= 75) return "#06C18A";
  if (score >= 50) return "#F5A524";
  return "#F0455A";
}

export function HealthScore({
  dimensions,
  title = "Health Score",
  subtitle = "Diagnóstico multidimensional",
}: {
  dimensions: HealthDimension[];
  title?: string;
  subtitle?: string;
}) {
  const avg = dimensions.length ? Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length) : 0;
  const avgColor = colorFor(avg);

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
        Componente Exclusivo · Health Score
      </div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 style={{ font: "600 18px 'Sora',sans-serif", color: "var(--foreground)" }}>{title}</h3>
          <p style={{ font: "400 13px 'Manrope',sans-serif", color: "var(--muted-foreground)", marginTop: 2 }}>
            {subtitle}
          </p>
        </div>
        <div className="text-right">
          <div style={{ font: "700 32px 'Sora',sans-serif", color: avgColor, lineHeight: 1 }}>{avg}</div>
          <div style={{ font: "500 10px 'JetBrains Mono',monospace", color: "var(--muted-foreground)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            score
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dimensions.map((d) => {
          const c = colorFor(d.score);
          return (
            <div
              key={d.label}
              className="keep-radius"
              style={{
                borderRadius: 4,
                border: "1px solid var(--border)",
                padding: "12px 14px",
                background: `color-mix(in srgb, ${c} 5%, transparent)`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ font: "500 11px 'JetBrains Mono',monospace", color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {d.label}
                </span>
                <span style={{ font: "700 16px 'Sora',sans-serif", color: c }}>{d.score}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "color-mix(in srgb, var(--muted-foreground) 15%, transparent)", overflow: "hidden" }}>
                <div style={{ width: `${d.score}%`, height: "100%", background: c, borderRadius: 2 }} />
              </div>
              {d.hint && (
                <div style={{ font: "400 11px 'Manrope',sans-serif", color: "var(--muted-foreground)", marginTop: 6 }}>
                  {d.hint}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
