"use client";

import { useMemo } from "react";
import { Plus, Minus } from "lucide-react";
import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Appliance, AppliancePick } from "@/lib/types";

interface Props {
  appliance: Appliance;
  pick?: AppliancePick;
  locale: "ar" | "en";
  onChange: (pick: AppliancePick | null) => void;
}

export function ApplianceCard({ appliance, pick, locale, onChange }: Props) {
  const Icon = (Icons as any)[toPascal(appliance.icon)] ?? Icons.Plug;
  const name = locale === "ar" ? appliance.name_ar : appliance.name_en;
  const variants = appliance.variants;
  const selectedVariant = useMemo(
    () => pick ? variants.find(v => v.id === pick.variantId) ?? variants[0] : variants[0],
    [pick, variants],
  );

  const count = pick?.count ?? 0;
  const isInverter = pick?.isInverter ?? false;
  const hasMultiVariants = variants.length > 1;
  const isAC = appliance.slug === "split-ac";

  function setCount(n: number) {
    if (n <= 0) onChange(null);
    else onChange({ applianceId: appliance.id, variantId: selectedVariant.id, count: n, isInverter });
  }

  function setVariant(variantId: string) {
    onChange({ applianceId: appliance.id, variantId, count: count || 1, isInverter });
  }

  function toggleInverter() {
    if (count <= 0) return;
    onChange({ applianceId: appliance.id, variantId: selectedVariant.id, count, isInverter: !isInverter });
  }

  const selected = count > 0;

  return (
    <Card
      className={cn(
        "flex flex-col p-5 transition-all duration-150 border hover:border-primary/40 hover:shadow-md",
        "w-[200px] md:w-[210px] min-h-[200px] shrink-0",
        selected && "ring-2 ring-primary border-primary bg-accent",
      )}
    >
      {/* Top: icon + name */}
      <div className="flex items-center gap-2.5">
        <Icon className="h-6 w-6 text-primary shrink-0" />
        <span className="font-semibold text-sm leading-tight">{name}</span>
      </div>

      {/* Middle: variant chips (or empty space that flexes) */}
      <div className="flex-1 flex flex-col justify-center py-3">
        {hasMultiVariants && (
          <div className="flex flex-wrap gap-1.5">
            {variants.map(v => {
              const isSel = selectedVariant.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariant(v.id)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors",
                    isSel
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70",
                  )}
                >
                  {locale === "ar" ? v.variant_label_ar : v.variant_label_en}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom: counter */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 rounded-full"
          onClick={() => setCount(Math.max(0, count - 1))}
          aria-label="decrement"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="font-bold text-lg w-6 text-center tabular-nums">{count}</span>
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 rounded-full"
          onClick={() => setCount(count + 1)}
          aria-label="increment"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom-most: inverter toggle (AC + selected) */}
      {isAC && selected && (
        <button
          type="button"
          onClick={toggleInverter}
          role="switch"
          aria-checked={isInverter}
          className={cn(
            "mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors",
            isInverter
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          <span>{locale === "ar" ? "تكييف إنفرتر؟" : "Inverter AC?"}</span>
          <span
            className={cn(
              "relative h-4 w-7 rounded-full transition-colors shrink-0",
              isInverter ? "bg-primary" : "bg-border"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all",
                isInverter ? "start-3.5" : "start-0.5"
              )}
            />
          </span>
        </button>
      )}
    </Card>
  );
}

function toPascal(s: string): string {
  return s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("");
}
