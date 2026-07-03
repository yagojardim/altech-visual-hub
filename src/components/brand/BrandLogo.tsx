interface BrandLogoProps {
  variant?: "dark" | "light";
}

export function BrandLogo({ variant = "dark" }: BrandLogoProps) {
  const titleColor = variant === "dark" ? "#F0F4FC" : "#0B1120";
  const subColor = variant === "dark" ? "rgba(148,170,200,0.6)" : "#94A2C8";
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #06C18A 0%, #2FB89A 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12.5 L10 17.5 L19 7.5"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="leading-tight text-left">
        <div style={{ font: "700 14px 'Sora',sans-serif", color: titleColor, letterSpacing: "-0.01em" }}>
          Altech Project
        </div>
        <div
          style={{
            font: "500 9px 'JetBrains Mono',monospace",
            color: subColor,
            marginTop: 2,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          BY ALTECH
        </div>
      </div>
    </div>
  );
}
