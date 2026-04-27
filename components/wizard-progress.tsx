"use client";

import { cn } from "@/lib/utils";

interface Props {
  steps: { label: string }[];
  current: number;
  locale: "ar" | "en";
}

export function WizardProgress({ steps, current, locale }: Props) {
  const stepOf = locale === "ar"
    ? `الخطوة ${current + 1} من ${steps.length}`
    : `Step ${current + 1} of ${steps.length}`;

  return (
    <div className="space-y-3 py-4 shrink-0">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground tabular-nums font-medium">{stepOf}</span>
        <span className="text-foreground font-semibold">{steps[current]?.label}</span>
      </div>
      <ol className="flex items-center gap-1.5">
        {steps.map((_, i) => {
          const isCurrent = i === current;
          const isDone = i < current;
          return (
            <li key={i} className="flex-1">
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all",
                  isDone && "bg-primary",
                  isCurrent && "bg-primary",
                  !isDone && !isCurrent && "bg-muted",
                )}
                aria-current={isCurrent ? "step" : undefined}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
