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
  | { kind: "init" }
  | { kind: "scanning"; attempts: number }
  | { kind: "result"; watts: number | null; match: ReturnType<typeof findClosestVariant> }
  | { kind: "camera-error"; message: string }
  | { kind: "ocr-error"; message: string };

// Cooldown between auto-scan attempts (lets the camera refocus and saves battery).
const SCAN_COOLDOWN_MS = 600;
// Show a "still searching..." hint after this many failed attempts.
const HINT_AFTER_ATTEMPTS = 4;

// Type for the Tesseract worker without pulling tesseract types into the main bundle.
type TesseractWorker = {
  recognize: (image: HTMLCanvasElement | string | ImageData | Blob) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

export function ScanModal({ catalog, locale, onAdd, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const cancelledRef = useRef(false);
  const [status, setStatus] = useState<Status>({ kind: "init" });

  const t = locale === "ar"
    ? {
        title: "ادخل الجهاز بالكاميرا",
        hint_idle: "وجّه الكاميرا على لوحة المواصفات (اللي مكتوب فيها مثلًا 220V 150W)",
        hint_scanning: "ثبّت الكاميرا على لوحة المواصفات...",
        hint_keep_trying: "قرّب الكاميرا أكتر للوحة المواصفات.",
        capture_manual: "التقط دلوقتي",
        retry: "حاول تاني",
        cancel: "إلغاء",
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
        opening: "بنفتح الكاميرا...",
      }
    : {
        title: "Add appliance by camera",
        hint_idle: "Point your camera at the spec plate (the one with values like 220V 150W).",
        hint_scanning: "Hold steady on the spec plate...",
        hint_keep_trying: "Move the camera closer to the spec plate.",
        capture_manual: "Capture now",
        retry: "Try again",
        cancel: "Cancel",
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
        opening: "Opening the camera...",
      };

  // Initialise camera + Tesseract worker in parallel, then start auto-scan loop.
  useEffect(() => {
    cancelledRef.current = false;

    async function setup() {
      // 1) Camera
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus({ kind: "camera-error", message: "Camera API not available." });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (cancelledRef.current) {
          stream.getTracks().forEach(tr => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setStatus({
            kind: "camera-error",
            message: err instanceof Error ? err.message : "Camera unavailable",
          });
        }
        return;
      }

      // 2) Tesseract worker (heavy — pre-warm once and reuse)
      try {
        const Tesseract = (await import("tesseract.js")).default;
        const worker = await Tesseract.createWorker("eng");
        if (cancelledRef.current) {
          await worker.terminate();
          return;
        }
        workerRef.current = worker as unknown as TesseractWorker;
      } catch (err) {
        if (!cancelledRef.current) {
          setStatus({
            kind: "ocr-error",
            message: err instanceof Error ? err.message : "OCR engine failed to load",
          });
        }
        return;
      }

      // 3) Start the loop
      if (cancelledRef.current) return;
      setStatus({ kind: "scanning", attempts: 0 });
      runScanLoop();
    }

    setup();

    return () => {
      cancelledRef.current = true;
      streamRef.current?.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
      workerRef.current?.terminate().catch(() => {});
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runScanLoop() {
    let attempts = 0;
    // Brief warm-up so the camera has time to focus before the first capture.
    await sleep(700);

    while (!cancelledRef.current) {
      attempts += 1;
      setStatus({ kind: "scanning", attempts });

      const canvas = captureCroppedFrame();
      if (!canvas) {
        await sleep(SCAN_COOLDOWN_MS);
        continue;
      }

      try {
        const { data } = await workerRef.current!.recognize(canvas);
        if (cancelledRef.current) return;

        const watts = extractWatts(data.text);
        if (watts != null) {
          const match = findClosestVariant(watts, catalog);
          if (match) {
            setStatus({ kind: "result", watts, match });
            return;
          }
        }
      } catch {
        // Swallow individual-iteration errors and keep trying.
      }

      await sleep(SCAN_COOLDOWN_MS);
    }
  }

  // Manual capture: cancel auto-loop briefly, take one shot, show result regardless of match.
  async function captureManually() {
    if (!workerRef.current) return;
    cancelledRef.current = true;
    const canvas = captureCroppedFrame();
    if (!canvas) {
      setStatus({ kind: "ocr-error", message: "No frame captured" });
      return;
    }
    setStatus({ kind: "scanning", attempts: 0 });
    try {
      const { data } = await workerRef.current.recognize(canvas);
      const watts = extractWatts(data.text);
      const match = watts != null ? findClosestVariant(watts, catalog) : null;
      setStatus({ kind: "result", watts, match });
    } catch (err) {
      setStatus({
        kind: "ocr-error",
        message: err instanceof Error ? err.message : "OCR failed",
      });
    }
  }

  function captureCroppedFrame(): HTMLCanvasElement | null {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

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
    if (!ctx) return null;
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return canvas;
  }

  function reset() {
    if (status.kind === "camera-error" || status.kind === "ocr-error") {
      // Hard error — close and let the user reopen.
      onClose();
      return;
    }
    cancelledRef.current = false;
    setStatus({ kind: "scanning", attempts: 0 });
    runScanLoop();
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

  const showLiveCamera = status.kind === "init" || status.kind === "scanning";
  const isResultMode = status.kind === "result" || status.kind === "ocr-error" || status.kind === "camera-error";

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div className="relative w-full max-w-md bg-card text-foreground rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-3 end-3 z-10 inline-flex items-center justify-center h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-5 pb-3 text-center">
          <h2 className="text-lg font-bold tracking-tight">{t.title}</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {status.kind === "scanning"
              ? (status.attempts >= HINT_AFTER_ATTEMPTS ? t.hint_keep_trying : t.hint_scanning)
              : t.hint_idle}
          </p>
        </div>

        <div className="relative aspect-[4/3] bg-black overflow-hidden">
          {showLiveCamera && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <Viewfinder pulsing={status.kind === "scanning"} />
              {status.kind === "init" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                  <p className="text-white text-sm font-medium">{t.opening}</p>
                </div>
              )}
              {status.kind === "scanning" && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {t.hint_scanning}
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
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{t.no_watts_hint}</p>
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

        <div className="p-4 flex items-center justify-center gap-3">
          {status.kind === "scanning" && (
            <button
              type="button"
              onClick={captureManually}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-border font-medium hover:bg-muted transition-colors text-sm"
            >
              <Camera className="h-4 w-4" />
              {t.capture_manual}
            </button>
          )}

          {isResultMode && (
            <>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-border font-medium hover:bg-muted transition-colors text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                {t.retry}
              </button>
              {status.kind === "result" && status.match && (
                <button
                  type="button"
                  onClick={confirmMatch}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold shadow-md hover:bg-[hsl(var(--primary-dark))] hover:shadow-lg transition-all text-sm"
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

function Viewfinder({ pulsing }: { pulsing: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div
        className={cn(
          "w-[70%] h-[35%] rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-all",
          pulsing && "ring-4 ring-primary/40 animate-pulse",
        )}
      />
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

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
