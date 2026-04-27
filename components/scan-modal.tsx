"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Check, AlertCircle, Loader2, Upload, Keyboard, ScanLine } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { extractOrCalculateWatts, findClosestVariant } from "@/lib/match-variant";
import type { Appliance, AppliancePick } from "@/lib/types";

interface Props {
  catalog: Appliance[];
  locale: "ar" | "en";
  onAdd: (pick: AppliancePick) => void;
  onClose: () => void;
}

type Status =
  | { kind: "init" }
  | { kind: "scanning"; attempts: number; lastSeen?: string }
  | { kind: "processing-upload" }
  | { kind: "result"; watts: number | null; match: ReturnType<typeof findClosestVariant>; method?: "direct" | "computed" | "manual" }
  | { kind: "barcode-found"; code: string }
  | { kind: "camera-error"; message: string }
  | { kind: "ocr-error"; message: string };

// Try the browser's native BarcodeDetector. Returns the first decoded value, or null
// if not detected (or the API isn't supported, e.g. Firefox).
async function tryDetectBarcode(source: HTMLCanvasElement | HTMLImageElement): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const Ctor = (window as unknown as { BarcodeDetector?: new (opts?: object) => { detect: (img: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const detector = new Ctor({
      formats: ["code_128", "code_39", "ean_8", "ean_13", "upc_a", "upc_e", "qr_code", "data_matrix"],
    });
    const codes = await detector.detect(source);
    return codes[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}

// Cooldown between auto-scan attempts (lets the camera refocus and saves battery).
const SCAN_COOLDOWN_MS = 500;
// Show a "still searching..." hint after this many failed attempts.
const HINT_AFTER_ATTEMPTS = 3;

// Type for the Tesseract worker without pulling tesseract types into the main bundle.
type TesseractWorker = {
  recognize: (image: HTMLCanvasElement | string | ImageData | Blob) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

export function ScanModal({ catalog, locale, onAdd, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const cancelledRef = useRef(false);
  const [status, setStatus] = useState<Status>({ kind: "init" });
  const [manualWattsInput, setManualWattsInput] = useState("");

  const t = locale === "ar"
    ? {
        title: "ادخل الجهاز بالكاميرا",
        hint_idle: "وجّه الكاميرا على لوحة المواصفات (اللي مكتوب فيها مثلًا 220V 150W)",
        hint_scanning: "ثبّت الكاميرا على لوحة المواصفات...",
        hint_keep_trying: "قرّب الكاميرا أكتر للوحة المواصفات.",
        capture_manual: "التقط",
        upload: "رفع صورة",
        processing: "جاري قراءة الصورة...",
        retry: "حاول تاني",
        cancel: "إلغاء",
        detected: "وجدنا",
        computed: "(محسوب من V × A)",
        watts_unit: "وات",
        no_watts: "ما قدرناش نقرأ القدرة",
        no_watts_hint: "ممكن تكتبها يدوي من اللوحة، أو حاول تاني.",
        manual_label: "اكتب القدرة بنفسك",
        manual_placeholder: "مثلًا 150",
        manual_use: "استخدم",
        no_match: "ما لقيناش جهاز قريب في القائمة",
        no_match_hint: "ممكن جهازك مش في كتالوجنا. ضيفه يدوي من الخطوة.",
        match_label: "الجهاز الأقرب",
        confirm: "أضف",
        close: "إغلاق",
        barcode_title: "ما لقيناش قدرة في الصورة",
        barcode_body: "شفنا باركود/كود سيريال على اللوحة، بس ده مش بيقولنا القدرة. وجّه الكاميرا على المكان اللي مكتوب فيه 220V 150W في اللوحة، أو اكتب القدرة يدوي.",
        camera_error: "ما قدرناش نفتح الكاميرا",
        camera_error_hint: "تأكد إنك سمحت بالكاميرا في إعدادات المتصفح، أو ارفع صورة من جهازك.",
        ocr_error: "حصلت مشكلة في القراءة",
        ocr_error_hint: "حاول تاني أو ضيف الجهاز يدوي.",
        opening: "بنفتح الكاميرا...",
      }
    : {
        title: "Add appliance by camera",
        hint_idle: "Point your camera at the spec plate (the one with values like 220V 150W).",
        hint_scanning: "Hold steady on the spec plate...",
        hint_keep_trying: "Move the camera closer to the spec plate.",
        capture_manual: "Capture",
        upload: "Upload image",
        processing: "Reading image...",
        retry: "Try again",
        cancel: "Cancel",
        detected: "Detected",
        computed: "(computed from V × A)",
        watts_unit: "W",
        no_watts: "Couldn't read the wattage",
        no_watts_hint: "Type it manually from the plate, or try the camera again.",
        manual_label: "Or type the wattage yourself",
        manual_placeholder: "e.g. 150",
        manual_use: "Use",
        no_match: "No close match in our catalog",
        no_match_hint: "Your appliance might not be in our list — go back and add it manually from the step.",
        match_label: "Closest match",
        confirm: "Add",
        close: "Close",
        barcode_title: "Couldn't find watts on this label",
        barcode_body: "We saw a barcode or serial code, but it doesn't tell us the wattage. Point the camera at the part of the plate that says 220V 150W, or type the wattage manually below.",
        camera_error: "Couldn't access the camera",
        camera_error_hint: "Make sure you allowed camera access — or upload an image from your device instead.",
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
    let lastSeen: string | undefined;
    // Brief warm-up so the camera has time to focus before the first capture.
    await sleep(500);

    while (!cancelledRef.current) {
      attempts += 1;
      setStatus({ kind: "scanning", attempts, lastSeen });

      const canvas = captureCroppedFrame();
      if (!canvas) {
        await sleep(SCAN_COOLDOWN_MS);
        continue;
      }

      try {
        // OCR first — the spec-plate text is the data we actually want.
        const { data } = await workerRef.current!.recognize(canvas);
        if (cancelledRef.current) return;

        const snippet = data.text.replace(/\s+/g, " ").trim().slice(0, 60);
        if (snippet) lastSeen = snippet;

        const r = extractOrCalculateWatts(data.text);
        if (r != null) {
          const match = findClosestVariant(r.watts, catalog);
          setStatus({ kind: "result", watts: r.watts, match, method: r.method });
          return;
        }

        // OCR didn't find watts. Try a barcode as a last resort —
        // we can at least surface what we saw before giving up.
        const code = await tryDetectBarcode(canvas);
        if (cancelledRef.current) return;
        if (code) {
          setStatus({ kind: "barcode-found", code });
          return;
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
      // OCR first — gives us the wattage we actually need.
      const { data } = await workerRef.current.recognize(canvas);
      const r = extractOrCalculateWatts(data.text);
      if (r != null) {
        const match = findClosestVariant(r.watts, catalog);
        setStatus({ kind: "result", watts: r.watts, match, method: r.method });
        return;
      }
      // No watts found; try barcode as a fallback.
      const code = await tryDetectBarcode(canvas);
      if (code) {
        setStatus({ kind: "barcode-found", code });
        return;
      }
      // Nothing useful — surface "no watts" with the manual-entry option.
      setStatus({ kind: "result", watts: null, match: null });
    } catch (err) {
      setStatus({
        kind: "ocr-error",
        message: err instanceof Error ? err.message : "OCR failed",
      });
    }
  }

  // Upload an image from the user's device (gallery, files, screenshots).
  async function uploadImage(file: File) {
    if (!workerRef.current) {
      // If the camera failed and we never got a worker, lazy-create one now.
      try {
        const Tesseract = (await import("tesseract.js")).default;
        const worker = await Tesseract.createWorker("eng");
        workerRef.current = worker as unknown as TesseractWorker;
      } catch {
        setStatus({ kind: "ocr-error", message: "OCR engine unavailable" });
        return;
      }
    }
    cancelledRef.current = true;
    setStatus({ kind: "processing-upload" });

    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Couldn't load image"));
      });

      // Don't crop uploaded images — the user already framed it.
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.drawImage(img, 0, 0);

      // OCR first — if the image is a spec plate, this gives us watts.
      const { data } = await workerRef.current!.recognize(canvas);
      const r = extractOrCalculateWatts(data.text);
      if (r != null) {
        const match = findClosestVariant(r.watts, catalog);
        setStatus({ kind: "result", watts: r.watts, match, method: r.method });
        return;
      }

      // OCR didn't find watts. If the image was a packaging barcode photo,
      // surface the code so the user knows we processed something.
      const code = await tryDetectBarcode(img);
      if (code) {
        setStatus({ kind: "barcode-found", code });
        return;
      }

      // Nothing usable — show the no-watts result with manual entry.
      setStatus({ kind: "result", watts: null, match: null });
    } catch (err) {
      setStatus({
        kind: "ocr-error",
        message: err instanceof Error ? err.message : "Image processing failed",
      });
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  // Manual wattage entry: skip OCR entirely.
  function submitManualWatts() {
    const n = parseInt(manualWattsInput, 10);
    if (!Number.isFinite(n) || n < 5 || n > 15000) return;
    const match = findClosestVariant(n, catalog);
    setStatus({ kind: "result", watts: n, match, method: "manual" });
    setManualWattsInput("");
  }

  function captureCroppedFrame(): HTMLCanvasElement | null {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    // Crop to a wider area (~85% × 55%) to be more forgiving about how the user frames the plate.
    const fullW = video.videoWidth;
    const fullH = video.videoHeight;
    const cropW = Math.round(fullW * 0.85);
    const cropH = Math.round(fullH * 0.55);
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
  const isResultMode = status.kind === "result" || status.kind === "ocr-error" || status.kind === "camera-error" || status.kind === "barcode-found";
  const showUploadFallback = status.kind === "scanning" || status.kind === "camera-error";

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
          {/* Video element is always mounted so its srcObject stays attached
              when the user toggles between scanning and result states. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "absolute inset-0 w-full h-full object-cover",
              !showLiveCamera && "invisible",
            )}
          />
          {showLiveCamera && (
            <>
              <Viewfinder pulsing={status.kind === "scanning"} />
              {status.kind === "init" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                  <p className="text-white text-sm font-medium">{t.opening}</p>
                </div>
              )}
              {status.kind === "scanning" && (
                <>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                    {t.hint_scanning}
                    <span className="text-white/60 tabular-nums">· {status.attempts}</span>
                  </div>
                  {status.lastSeen && status.attempts >= HINT_AFTER_ATTEMPTS && (
                    <div className="absolute top-3 left-3 right-3 mx-auto max-w-xs px-3 py-2 rounded-lg bg-black/70 text-white/90 text-[10px] font-mono backdrop-blur-sm truncate">
                      {status.lastSeen}
                    </div>
                  )}
                </>
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

          {status.kind === "processing-upload" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-card text-foreground">
              <Loader2 className="h-9 w-9 text-primary animate-spin" />
              <p className="font-medium text-sm">{t.processing}</p>
            </div>
          )}

          {status.kind === "result" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center bg-card text-foreground overflow-y-auto">
              {status.watts == null ? (
                <>
                  <AlertCircle className="h-9 w-9 text-warning" />
                  <p className="font-bold text-sm">{t.no_watts}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{t.no_watts_hint}</p>
                  <ManualWattsInput
                    value={manualWattsInput}
                    onChange={setManualWattsInput}
                    onSubmit={submitManualWatts}
                    label={t.manual_label}
                    placeholder={t.manual_placeholder}
                    useLabel={t.manual_use}
                    wattsUnit={t.watts_unit}
                  />
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t.detected}</p>
                  <p className="text-5xl font-extrabold tabular-nums tracking-tight">
                    {status.watts}
                    <span className="text-2xl font-semibold opacity-70 ms-2">{t.watts_unit}</span>
                  </p>
                  {status.method === "computed" && (
                    <p className="text-[10px] text-muted-foreground -mt-1">{t.computed}</p>
                  )}
                  {status.match ? (
                    <MatchPreview match={status.match} locale={locale} matchLabel={t.match_label} />
                  ) : (
                    <p className="text-xs text-muted-foreground max-w-xs">{t.no_match} — {t.no_match_hint}</p>
                  )}
                </>
              )}
            </div>
          )}

          {status.kind === "barcode-found" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center bg-card text-foreground overflow-y-auto">
              <ScanLine className="h-9 w-9 text-warning" />
              <p className="font-bold text-sm">{t.barcode_title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{t.barcode_body}</p>
              <p className="text-[10px] text-muted-foreground/70 font-mono break-all max-w-full">
                {status.code}
              </p>
              <ManualWattsInput
                value={manualWattsInput}
                onChange={setManualWattsInput}
                onSubmit={submitManualWatts}
                label={t.manual_label}
                placeholder={t.manual_placeholder}
                useLabel={t.manual_use}
                wattsUnit={t.watts_unit}
              />
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

        <div className="p-4 flex items-center justify-center gap-2 flex-wrap">
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

          {showUploadFallback && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-border font-medium hover:bg-muted transition-colors text-sm"
              >
                <Upload className="h-4 w-4" />
                {t.upload}
              </button>
            </>
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

function ManualWattsInput({
  value,
  onChange,
  onSubmit,
  label,
  placeholder,
  useLabel,
  wattsUnit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  label: string;
  placeholder: string;
  useLabel: string;
  wattsUnit: string;
}) {
  const n = parseInt(value, 10);
  const valid = Number.isFinite(n) && n >= 5 && n <= 15000;
  return (
    <div className="w-full max-w-xs mt-1 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5 justify-center">
        <Keyboard className="h-3 w-3" />
        {label}
      </p>
      <form
        onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(); }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="numeric"
            min={5}
            max={15000}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 ps-3 pe-9 rounded-full border border-border bg-input-background text-foreground text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
            {wattsUnit}
          </span>
        </div>
        <button
          type="submit"
          disabled={!valid}
          className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-[hsl(var(--primary-dark))] transition-colors"
        >
          {useLabel}
        </button>
      </form>
    </div>
  );
}

function Viewfinder({ pulsing }: { pulsing: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div
        className={cn(
          "w-[85%] h-[55%] rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-all",
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
