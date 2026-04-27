export function AnimatedLines() {
  // Eight thin horizontal streaks with different positions, opacities, and animation speeds.
  // Lines fade in, sweep across the viewport, then fade out — creates a subtle parallax feel.
  const lines = [
    { top: "8%",  via: "hsl(218 100% 65% / 0.35)", direction: "right", duration: "7s",  delay: "0s",   width: "60%" },
    { top: "16%", via: "hsl(218 100% 65% / 0.20)", direction: "left",  duration: "9s",  delay: "1.5s", width: "75%" },
    { top: "24%", via: "hsl(218 100% 65% / 0.30)", direction: "right", duration: "8s",  delay: "0.8s", width: "55%" },
    { top: "34%", via: "hsl(218 100% 65% / 0.18)", direction: "left",  duration: "11s", delay: "2.2s", width: "85%" },
    { top: "44%", via: "hsl(218 100% 65% / 0.25)", direction: "right", duration: "9s",  delay: "0.4s", width: "70%" },
    { top: "55%", via: "hsl(218 100% 65% / 0.15)", direction: "left",  duration: "10s", delay: "3s",   width: "50%" },
    { top: "67%", via: "hsl(218 100% 65% / 0.22)", direction: "right", duration: "8.5s",delay: "1.1s", width: "65%" },
    { top: "80%", via: "hsl(218 100% 65% / 0.12)", direction: "left",  duration: "12s", delay: "2.8s", width: "80%" },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] overflow-hidden">
      {lines.map((l, i) => (
        <div
          key={i}
          className={l.direction === "right" ? "animate-line-right" : "animate-line-left"}
          style={{
            position: "absolute",
            top: l.top,
            left: 0,
            right: 0,
            height: "1px",
            width: l.width,
            background: `linear-gradient(90deg, transparent, ${l.via}, transparent)`,
            animationDuration: l.duration,
            animationDelay: l.delay,
          }}
        />
      ))}
    </div>
  );
}
