"use client";

import { useState } from "react";

/* iOS-style letter-avatar gradients from the design spec (3a). */
const GRADIENTS = [
  ["#6e6e73", "#48484a"],
  ["#bf5af2", "#8944ab"],
  ["#64d2ff", "#0a84ff"],
  ["#ff9f0a", "#ff6482"],
  ["#30d158", "#248a3d"],
  ["#5e5ce6", "#3634a3"],
  ["#ff375f", "#ad1a3f"],
] as const;

function gradientFor(seed: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function GradientAvatar({
  name,
  url,
  size,
}: {
  name: string;
  url: string | null;
  size: number;
}) {
  const [broken, setBroken] = useState(false);
  const letter = name.replace("@", "").charAt(0).toUpperCase() || "?";

  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN URLs expire; fall back to initials
      <img
        src={url}
        alt=""
        onError={() => setBroken(true)}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  const [from, to] = gradientFor(name);
  return (
    <span
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${from}, ${to})`,
        fontSize: Math.round(size * 0.38),
      }}
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
    >
      {letter}
    </span>
  );
}
