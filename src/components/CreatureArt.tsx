// Parametric kawaii-style creature renderer. Every collectible is drawn from
// its CreatureSpec (body kind + feature + palette) so the whole collection has
// one coherent look. `silhouette` renders the mystery version for the gallery.

import type { CreatureSpec } from "../game/creatures";

interface Props {
  spec: CreatureSpec;
  silhouette?: boolean;
  className?: string;
  /** Accessible label; defaults to the creature's name, or a mystery label. */
  label?: string;
}

const SIL = "#2c2a55";

export function CreatureArt({ spec, silhouette = false, className, label }: Props) {
  const p = silhouette
    ? { body: SIL, belly: SIL, accent: SIL, cheek: SIL }
    : spec.palette;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={label ?? (silhouette ? "Mystery creature" : `${spec.name} ${spec.species}`)}
    >
      {/* rear features drawn behind the body */}
      {renderRearFeature(spec, p)}
      {renderEars(spec, p)}

      {/* main body: one friendly rounded blob for every creature */}
      <ellipse cx="60" cy="68" rx="34" ry="32" fill={p.body} />
      {/* belly */}
      <ellipse cx="60" cy="80" rx="20" ry="15" fill={p.belly} />

      {renderBodyExtras(spec, p)}
      {renderFrontFeature(spec, p)}

      {!silhouette && renderFace(spec)}
      {!silhouette && (
        <>
          <ellipse cx="42" cy="72" rx="5" ry="3.4" fill={spec.palette.cheek} />
          <ellipse cx="78" cy="72" rx="5" ry="3.4" fill={spec.palette.cheek} />
        </>
      )}
    </svg>
  );
}

function renderFace(spec: CreatureSpec) {
  return (
    <g>
      <circle cx="48" cy="62" r="4.2" fill="#26243f" />
      <circle cx="72" cy="62" r="4.2" fill="#26243f" />
      <circle cx="49.5" cy="60.5" r="1.4" fill="#fff" />
      <circle cx="73.5" cy="60.5" r="1.4" fill="#fff" />
      {spec.body === "bird" ? (
        // little beak
        <path d="M56 68 L64 68 L60 74 Z" fill="#f0a500" />
      ) : (
        <path
          d="M54 69 Q60 75 66 69"
          fill="none"
          stroke="#26243f"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function renderEars(spec: CreatureSpec, p: CreatureSpec["palette"]) {
  switch (spec.body) {
    case "fox":
      return (
        <g>
          <path d="M32 52 L26 26 L50 40 Z" fill={p.body} />
          <path d="M88 52 L94 26 L70 40 Z" fill={p.body} />
          <path d="M34 47 L30 32 L45 41 Z" fill={p.accent} />
          <path d="M86 47 L90 32 L75 41 Z" fill={p.accent} />
        </g>
      );
    case "cat":
      return (
        <g>
          <path d="M34 50 L30 28 L52 40 Z" fill={p.body} />
          <path d="M86 50 L90 28 L68 40 Z" fill={p.body} />
        </g>
      );
    case "bunny":
      return (
        <g>
          <ellipse cx="44" cy="26" rx="8" ry="20" fill={p.body} transform="rotate(-8 44 26)" />
          <ellipse cx="76" cy="26" rx="8" ry="20" fill={p.body} transform="rotate(8 76 26)" />
          <ellipse cx="44" cy="28" rx="4" ry="13" fill={p.belly} transform="rotate(-8 44 28)" />
          <ellipse cx="76" cy="28" rx="4" ry="13" fill={p.belly} transform="rotate(8 76 28)" />
        </g>
      );
    case "dragon":
      return (
        <g>
          <path d="M40 42 Q36 26 48 34 Z" fill={p.accent} />
          <path d="M60 38 Q60 20 70 32 Z" fill={p.accent} />
          <path d="M80 42 Q86 28 72 34 Z" fill={p.accent} />
        </g>
      );
    case "bird":
      return (
        <g>
          <path d="M56 38 Q54 24 62 30 Q66 22 68 36 Z" fill={p.accent} />
        </g>
      );
    default:
      return null;
  }
}

function renderBodyExtras(spec: CreatureSpec, p: CreatureSpec["palette"]) {
  switch (spec.body) {
    case "turtle":
      return (
        <g>
          {/* shell dome over the back */}
          <path d="M30 66 A30 26 0 0 1 90 66 L86 74 A26 20 0 0 0 34 74 Z" fill={p.accent} />
          <circle cx="48" cy="52" r="4" fill={p.belly} opacity="0.7" />
          <circle cx="66" cy="47" r="4" fill={p.belly} opacity="0.7" />
        </g>
      );
    case "octo":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={i}
              cx={38 + i * 15}
              cy={98}
              rx="7"
              ry="8"
              fill={p.body}
            />
          ))}
        </g>
      );
    case "fox":
    case "cat":
      return (
        <path
          d="M92 82 Q108 78 102 62 Q112 76 96 90 Z"
          fill={p.accent}
        />
      );
    default:
      return null;
  }
}

function renderRearFeature(spec: CreatureSpec, p: CreatureSpec["palette"]) {
  switch (spec.feature) {
    case "wings":
      return (
        <g>
          <path d="M26 62 Q6 50 16 34 Q22 48 34 50 Z" fill={p.belly} stroke={p.accent} strokeWidth="1.5" />
          <path d="M94 62 Q114 50 104 34 Q98 48 86 50 Z" fill={p.belly} stroke={p.accent} strokeWidth="1.5" />
        </g>
      );
    default:
      return null;
  }
}

function renderFrontFeature(spec: CreatureSpec, p: CreatureSpec["palette"]) {
  switch (spec.feature) {
    case "horn":
      return <path d="M56 38 L60 22 L64 38 Z" fill={p.accent} />;
    case "antenna":
      return (
        <g>
          <path d="M52 40 Q48 26 42 24" fill="none" stroke={p.accent} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M68 40 Q72 26 78 24" fill="none" stroke={p.accent} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="42" cy="23" r="3.5" fill={p.accent} />
          <circle cx="78" cy="23" r="3.5" fill={p.accent} />
        </g>
      );
    case "flame":
      return (
        <path
          d="M60 34 Q54 26 58 18 Q60 24 63 20 Q68 28 60 34 Z"
          fill={p.accent}
        />
      );
    case "leaf":
      return (
        <g>
          <path d="M60 36 Q58 24 66 20 Q68 30 60 36 Z" fill={p.accent} />
          <path d="M60 36 Q60 28 62 24" fill="none" stroke={p.belly} strokeWidth="1.2" />
        </g>
      );
    case "star":
      return (
        <path
          d="M60 18 L62.4 24.6 L69.4 24.8 L63.9 29.1 L65.9 35.8 L60 31.8 L54.1 35.8 L56.1 29.1 L50.6 24.8 L57.6 24.6 Z"
          fill={p.accent}
        />
      );
    case "crystal":
      return (
        <g>
          <path d="M54 36 L58 22 L62 36 Z" fill={p.accent} opacity="0.9" />
          <path d="M62 36 L67 26 L70 36 Z" fill={p.accent} opacity="0.7" />
        </g>
      );
    default:
      return null;
  }
}
