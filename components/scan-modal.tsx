"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Check, AlertCircle, Loader2 } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { extractWatts, findClosestVariant } from "@/lib/match-variant";
import type { Appliance, AppliancePick } from "@/lib/types";

interface Props {
  catalog: Appliance[];
  locale: "ar" | "en";
  onAdd: (pick: AppliancePick) => void;
  onClose: () => void;
}

type Status =
  | { kind: "loading-camera" }
  | { kind: "camera-ready" }
  | { kind: "camera-error"; message: string }
  | { kind: "scanning"; progress: number }
  | { kind: "result"; watts: number | null; match: ReturnType<typeof findClosestVariant> }
  | { kind: "ocr-error"; message: string };

export function ScanModal({ catalog, locale, onAdd, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading-camera" });

  const t = locale === "ar"
    ? {
        title: "ادخل الجهاز بالكاميرا",
        hint: "وجّه الكاميرا على لوحة المواصفات على الجهاز (اللي مكتوب فيها مثلًا 220V 150W)",
        capture: "التقط",
        retry: "حاول تاني",
        cancel: "إلغاء",
        scanning: "جاري قراءة المواصفات...",
        detected: "وجدنا",
        watts_unit: "وات",
        no_watts: "ما قدرناش نقرأ القدرة",
        no_watts_hint: "وجّه الكاميرا أقرب للوحة المواصفات وحاول مرة تانية.",
        no_match: "ما لقيناش جهاز قريب في القائمة",
        no_match_hint: "ممكن جهازك مش في كتالوجنا. ضيفه يدوي من الخطوة.",
        match_label: "الجهاز الأقرب",
        confirm: "أضف",
        close: "إغلاق",
        camera_error: "ما قدرناش نفتح الكاميرا",
        camera_error_hint: "تأكد إنك سمحت بالكاميرا في إعدادات المتصفح.",
        ocr_error: "حصلت مشكلة في القراءة",
        ocr_error_hint: "حاول تاني أو ضيف الجهاز يدوي.",
      }
    : {
        title: "Add appliance by camera",
        hint: "Point your camera at the spec plate on the appliance (the one with values like 220V 150W).",
        capture: "Capture",
        retry: "Try again",
        cancel: "Cancel",
        scanning: "Reading the spec plate...",
        detected: "Detected",
        watts_unit: "W",
        no_watts: "Couldn't read the wattage",
        no_watts_hint: "Hold the camera closer to the spec plate and try again.",
        no_match: "No close match in our catalog",
        no_match_hint: "Your appliance might not be in our list — go back and add it manually from the step.",
        match_label: "Closest match",
        confirm: "Add",
        close: "Close",
        camera_error: "Couldn't access the camera",
        camera_error_hint: "Make sure you allowed camera access in your browser.",
        ocr_error: "Something went wrong while reading",
        ocr_error_hint: "Try again or add the appliance manually.",
      };

  // Open the camera on mount; stop on unmount
  useEffect(() => {
    let cancelled = false;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus({ kind: "camera-error", message: "Camera API not available." });
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(tr => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus({ kind: "camera-ready" });
      })
      .catch((err: Error) => {
        if (!cancelled) setStatus({ kind: "camera-error", message: err.message });
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
    };
  }, []);

  async function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    setStatus({ kind: "scanning", progress: 0 });

    // Snapshot the visible frame; crop to the central viewfinder rectangle (60% of width, 25% of height)
    // Cropping focuses OCR on the spec plate area and roughly halves processing time.
    const fullW = video.videoWidth;
    const fullH = video.videoHeight;
    const cropW = Math.round(fullW * 0.7);
    const cropH = Math.round(fullH * 0.35);
    const cropX = Math.round((fullW - cropW) / 2);
    const cropY = Math.round((fullH - cropH) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus({ kind: "ocr-error", message: "Canvas not available." });
      return;
    }
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(canvas, "eng", {
        logger: m => {
          if (m.status === "recognizing text") {
            setStatus({ kind: "scanning", progress: Math.round(m.progress * 100) });
          }
        },
      });

      const watts = extractWatts(data.text);
      const match = watts != null ? findClosestVariant(watts, catalog) : null;
      setStatus({ kind: "result", watts, match });
    } catch (err) {
      setStatus({
        kind: "ocr-error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  function reset() {
    setStatus(streamRef.current ? { kind: "camera-ready" } : { kind: "loading-camera" });
  }

  function confirmMatch() {
    if (status.kind !== "result" || !status.match) return;
    onAdd({
      applianceId: status.match.appliance.id,
      variantId: status.match.variant.id,
      count: 1,
    });
    onClose();
  }

  const showCamera = status.kind === "loading-camera" || status.kind === "camera-ready" || status.kind === "scanning";

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div className="relative w-full max-w-md bg-card text-foreground rounded-3xl overflow-hidden shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-3 end-3 z-10 inline-flex items-center justify-center h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="p-5 pb-3 text-center">
          <h2 className="text-lg font-bold tracking-tight">{t.title}</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.hint}</p>
        </div>

        {/* Camera preview / result area */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden">
          {showCamera && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  status.kind === "scanning" && "opacity-60",
                )}
              />
              {/* Viewfinder rectangle: 70% wide × 35% tall, centered */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
              >
                <div className="w-[70%] h-[35%] rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
              {status.kind === "loading-camera" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              {status.kind === "scanning" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm">
                  <Loader2 className="h-9 w-9 text-white animate-spin" />
                  <p className="text-white text-sm font-medium">{t.scanning}</p>
                  <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white tabular-nums transition-all"
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                  <p className="text-white/80 text-xs tabular-nums">{status.progress}%</p>
                </div>
              )}
            </>
          )}

          {status.kind === "camera-error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-card text-foreground">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-bold">{t.camera_error}</p>
              <p className="text-sm text-muted-foreground">{t.camera_error_hint}</p>
            </div>
          )}

          {status.kind === "result" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-card text-foreground">
              {status.watts == null ? (
                <>
                  <AlertCircle className="h-10 w-10 text-warning" />
                  <p className="font-bold text-base">{t.no_watts}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.no_watts_hint}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t.detected}</p>
                  <p className="text-5xl font-extrabold tabular-nums tracking-tight">
                    {status.watts}
                    <span className="text-2xl font-semibold opacity-70 ms-2">{t.watts_unit}</span>
                  </p>
                  {status.match ? (
                    <MatchPreview match={status.match} locale={locale} matchLabel={t.match_label} />
                  ) : (
                    <p className="text-xs text-muted-foreground max-w-xs">{t.no_match} — {t.no_match_hint}</p>
                  )}
                </>
              )}
            </div>
          )}

          {status.kind === "ocr-error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-card text-foreground">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-bold">{t.ocr_error}</p>
              <p className="text-xs text-muted-foreground">{t.ocr_error_hint}</p>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="p-4 flex items-center justify-center gap-3">
          {status.kind === "camera-ready" && (
            <button
              type="button"
              onClick={capture}
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-semibold shadow-md hover:bg-[hsl(var(--primary-dark))] hover:shadow-lg transition-all"
            >
              <Camera className="h-5 w-5" />
              {t.capture}
            </button>
          )}

          {(status.kind === "result" || status.kind === "ocr-error" || status.kind === "camera-error") && (
            <>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-border font-medium hover:bg-muted transition-colors"
                disabled={status.kind === "camera-error"}
              >
                <RotateCcw className="h-4 w-4" />
                {t.retry}
              </button>
              {status.kind === "result" && status.match && (
                <button
                  type="button"
                  onClick={confirmMatch}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold shadow-md hover:bg-[hsl(var(--primary-dark))] hover:shadow-lg transition-all"
                >
                  <Check className="h-4 w-4" />
                  {t.confirm}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchPreview({
  match,
  locale,
  matchLabel,
}: {
  match: NonNullable<ReturnType<typeof findClosestVariant>>;
  locale: "ar" | "en";
  matchLabel: string;
}) {
  const Icon = (Icons as unknown as Record<string, typeof Camera>)[toPascal(match.appliance.icon)] ?? Camera;
  const name = locale === "ar" ? match.appliance.name_ar : match.appliance.name_en;
  const variantLabel = locale === "ar" ? match.variant.variant_label_ar : match.variant.variant_label_en;
  const showVariant = variantLabel && variantLabel !== "—";

  return (
    <div className="flex flex-col items-center gap-2 mt-2 pt-4 border-t border-border w-full max-w-xs">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {matchLabel}
      </p>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="text-start">
          <p className="font-semibold text-sm">{name}</p>
          {showVariant && <p className="text-xs text-muted-foreground">{variantLabel}</p>}
        </div>
      </div>
    </div>
  );
}

function toPascal(s: string): string {
  return s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("");
}
