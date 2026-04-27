"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [2, 4, 6, 8] as const;

interface Props {
  hours: number;
  locale: "ar" | "en";
  onChange: (hours: number) => void;
}

export function HoursPicker({ hours, locale, onChange }: Props) {
  const t = locale === "ar"
    ? { title: "ساعات قطع الكهرباء", hint: "عدد الساعات اللي محتاج البطارية تشتغل فيها", h: "س" }
    : { title: "Power-cut hours per day", hint: "How long the battery should keep things running", h: "h" };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold">{t.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t.hint}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map(p => {
          const isSel = hours === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "h-12 rounded-xl border font-semibold text-base transition-all duration-150 tabular-nums",
                isSel
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground border-border hover:border-primary/40",
              )}
            >
              {p}{t.h}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, hours - 1))}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:border-primary/40 disabled:opacity-40"
          disabled={hours <= 1}
          aria-label="Decrease"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="text-center">
          <span className="text-3xl font-extrabold text-primary tabular-nums">{hours}</span>
          <span className="text-sm text-muted-foreground ms-1">{t.h}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(12, hours + 1))}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:border-primary/40 disabled:opacity-40"
          disabled={hours >= 12}
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
