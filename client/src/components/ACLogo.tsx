interface ACLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  className?: string;
}

export default function ACLogo({ size = "md", variant = "full", className = "" }: ACLogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-sm" },
    md: { icon: 36, text: "text-base" },
    lg: { icon: 48, text: "text-xl" },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon mark */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle cx="24" cy="24" r="24" fill="#F97316" />
        {/* Stylized "AC" / athlete figure */}
        {/* Shield / chevron shape */}
        <path
          d="M24 8L38 15V27C38 34.5 31.5 40.5 24 43C16.5 40.5 10 34.5 10 27V15L24 8Z"
          fill="white"
          fillOpacity="0.15"
        />
        {/* Letter A */}
        <path
          d="M18 34L22 20H26L30 34H27.5L26.8 31.5H21.2L20.5 34H18ZM22 29H26L24 22.5L22 29Z"
          fill="white"
        />
        {/* Accent bar */}
        <rect x="10" y="38" width="28" height="2.5" rx="1.25" fill="white" fillOpacity="0.4" />
      </svg>

      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight text-foreground ${s.text}`}>
            Athletes
          </span>
          <span className={`font-light tracking-widest text-muted-foreground ${size === "sm" ? "text-[9px]" : size === "md" ? "text-[11px]" : "text-sm"}`}>
            COLLABORATIVE
          </span>
        </div>
      )}
    </div>
  );
}

// Dark version for light backgrounds
export function ACLogoDark({ size = "md", variant = "full", className = "" }: ACLogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-sm" },
    md: { icon: 36, text: "text-base" },
    lg: { icon: 48, text: "text-xl" },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="24" fill="#F97316" />
        <path
          d="M24 8L38 15V27C38 34.5 31.5 40.5 24 43C16.5 40.5 10 34.5 10 27V15L24 8Z"
          fill="white"
          fillOpacity="0.15"
        />
        <path
          d="M18 34L22 20H26L30 34H27.5L26.8 31.5H21.2L20.5 34H18ZM22 29H26L24 22.5L22 29Z"
          fill="white"
        />
        <rect x="10" y="38" width="28" height="2.5" rx="1.25" fill="white" fillOpacity="0.4" />
      </svg>

      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight text-gray-900 ${s.text}`}>
            Athletes
          </span>
          <span className={`font-light tracking-widest text-gray-500 ${size === "sm" ? "text-[9px]" : size === "md" ? "text-[11px]" : "text-sm"}`}>
            COLLABORATIVE
          </span>
        </div>
      )}
    </div>
  );
}
