// The mystery egg. Each correct answer adds a crack and brightens the glow;
// the final answer hatches it. Crack segments are revealed progressively so
// progress is visible at a glance, no reading required.

interface Props {
  /** Correct answers so far. */
  stage: number;
  /** Answers needed to hatch. */
  total: number;
  shell: string;
  speckle: string;
  className?: string;
  /** Wobble on the most recent crack (suppressed when reduced motion is on). */
  justCracked?: boolean;
}

// Crack path segments, revealed one per correct answer.
const CRACKS = [
  "M60 30 L55 40 L62 48",
  "M62 48 L54 58 L63 66",
  "M40 52 L48 60 L44 70",
  "M80 50 L72 60 L78 68",
  "M63 66 L56 78 L64 86",
  "M44 70 L52 82 L48 92 M78 68 L72 80",
];

export function Egg({ stage, total, shell, speckle, className, justCracked }: Props) {
  const glow = Math.min(stage / total, 1);
  const cracksToShow = Math.min(stage, CRACKS.length);

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg
        viewBox="0 0 120 140"
        className={`w-full h-full ${justCracked ? "motion-safe:animate-wobble" : ""}`}
        role="img"
        aria-label={`Mystery egg: ${stage} of ${total} words found`}
      >
        {/* progress glow behind the egg */}
        <ellipse
          cx="60"
          cy="78"
          rx={46}
          ry={54}
          fill="#ffd15c"
          opacity={0.12 + glow * 0.4}
        />
        {/* shell */}
        <path
          d="M60 14 C36 14 22 46 22 76 C22 104 38 122 60 122 C82 122 98 104 98 76 C98 46 84 14 60 14 Z"
          fill={shell}
          stroke="#00000022"
          strokeWidth="1.5"
        />
        {/* speckles */}
        <circle cx="44" cy="46" r="4" fill={speckle} opacity="0.7" />
        <circle cx="74" cy="38" r="3" fill={speckle} opacity="0.7" />
        <circle cx="82" cy="80" r="4.5" fill={speckle} opacity="0.7" />
        <circle cx="38" cy="84" r="3.5" fill={speckle} opacity="0.7" />
        <circle cx="60" cy="104" r="3" fill={speckle} opacity="0.7" />
        {/* cracks */}
        {CRACKS.slice(0, cracksToShow).map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#4a3f66"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={i === cracksToShow - 1 && justCracked ? "animate-pop-in" : undefined}
          />
        ))}
        {/* a hint of light through the cracks as hatch nears */}
        {glow > 0.65 && (
          <path
            d="M62 48 L54 58 L63 66"
            fill="none"
            stroke="#ffd15c"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={0.5}
          />
        )}
      </svg>
    </div>
  );
}
