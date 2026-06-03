// Logo ZonAI : diamond grid de 9 tuiles, centre emerald, périphériques beige.
// Adapté au logo source (origine bleu) pour la palette de ZonAI (vert forêt + beige).

interface MarkProps {
  size?: number;
  className?: string;
  accent?: string;
  tile?: string;
  tileShadow?: string;
}

export function LogoMark({
  size = 32,
  className = "",
  accent = "#0A6E4F",
  tile = "#E8E5DE",
  tileShadow = "#D6D2C8",
}: MarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="ZonAI"
    >
      <g transform="rotate(45 50 50)">
        {/* Row 1 */}
        <rect x="8" y="8" width="24" height="24" rx="4" fill={tile} stroke={tileShadow} strokeWidth="0.6" />
        <rect x="36" y="10" width="20" height="20" rx="4" fill={tile} stroke={tileShadow} strokeWidth="0.6" />
        <rect x="60" y="8" width="24" height="24" rx="4" fill={tile} stroke={tileShadow} strokeWidth="0.6" />
        {/* Row 2 */}
        <rect x="6" y="38" width="22" height="18" rx="4" fill={tile} stroke={tileShadow} strokeWidth="0.6" />
        <rect x="36" y="36" width="24" height="24" rx="4" fill={accent} />
        <rect x="64" y="38" width="22" height="20" rx="4" fill={tile} stroke={tileShadow} strokeWidth="0.6" />
        {/* Row 3 */}
        <rect x="10" y="64" width="22" height="22" rx="4" fill={tile} stroke={tileShadow} strokeWidth="0.6" />
        <rect x="38" y="66" width="18" height="20" rx="4" fill={tile} stroke={tileShadow} strokeWidth="0.6" />
        <rect x="60" y="64" width="24" height="22" rx="4" fill={tile} stroke={tileShadow} strokeWidth="0.6" />
      </g>
    </svg>
  );
}

interface LockupProps {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}

/**
 * Lockup horizontal : mark + texte ZonAI.
 * "Zon" en ink, "AI" en accent emerald, comme le logo source mais en vert.
 */
export function LogoLockup({ size = 28, className = "", wordmarkClassName = "" }: LockupProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className={`text-[17px] font-semibold tracking-tight leading-none ${wordmarkClassName}`}>
        <span className="text-ink">Zon</span>
        <span className="text-accent-deep">AI</span>
      </span>
    </span>
  );
}
