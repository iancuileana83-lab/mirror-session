import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, CameraOff, FlipHorizontal, Upload, RotateCcw, Sparkles } from "lucide-react";
import { z } from "zod";
import { fileToDataUrl, saveFace } from "@/lib/mirror-session";

const eventLabels: Record<string, string> = {
  "job-interview": "Job Interview",
  "professional-photoshoot": "Professional Photoshoot",
  "date-night": "Date Night",
  "family-event": "Family Event",
  other: "Other",
};

const sessionSearchSchema = z.object({
  event: z.enum(["job-interview", "professional-photoshoot", "date-night", "family-event", "other"]).optional(),
});

export const Route = createFileRoute("/session")({
  validateSearch: sessionSearchSchema,
  head: () => ({
    meta: [
      { title: "New Session — Mirror Session" },
      {
        name: "description",
        content: "Start a private mirror session to check your look before heading out.",
      },
      { property: "og:title", content: "New Session — Mirror Session" },
      {
        property: "og:description",
        content: "Start a private mirror session to check your look before heading out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Session,
});

function Session() {
  const { event } = useSearch({ from: "/session" });
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    setLoading(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
    } catch (err) {
      setError("Could not access the camera. Please allow camera permission and try again.");
      setActive(false);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  };

  const toggleFacing = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      // mirror front-camera capture to match what the user sees
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCaptured(dataUrl);
    saveFace({ dataUrl });
    stopCamera();
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setCaptured(dataUrl);
      saveFace({ dataUrl });
      stopCamera();
    } catch {
      setError("Couldn't read that file. Try another image.");
    }
  };

  const retake = () => {
    setCaptured(null);
  };

  const continueToSkin = () => {
    navigate({ to: "/skin", search: { event } });
  };

  useEffect(() => {
    if (active) {
      void startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <div className="text-center">
          <h1 className="font-heading text-xl text-foreground">Mirror Session</h1>
          {event && (
            <p className="text-xs font-medium text-primary">Preparing for: {eventLabels[event]}</p>
          )}
        </div>
        <div className="w-10" aria-hidden="true" />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="aspect-[4/3] w-full bg-muted">
            {captured ? (
              <img
                src={captured}
                alt="Captured photo preview"
                className="h-full w-full object-cover"
              />
            ) : active ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                aria-label="Live mirror preview"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="rounded-full bg-secondary p-4">
                  <Camera className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="mt-4 text-lg font-medium text-foreground">Your mirror is ready</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Start the camera, take a photo, or upload one from your device.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="absolute inset-x-0 bottom-0 bg-destructive/90 px-4 py-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {captured ? (
            <>
              <button
                onClick={retake}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Choose different photo
              </button>
              <button
                onClick={continueToSkin}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Analyze Skin
              </button>
            </>
          ) : (
            <>
              <button
                onClick={active ? stopCamera : startCamera}
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
              >
                {active ? (
                  <>
                    <CameraOff className="h-4 w-4" aria-hidden="true" />
                    Stop camera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    {loading ? "Starting..." : "Start camera"}
                  </>
                )}
              </button>

              {active && (
                <>
                  <button
                    onClick={takePhoto}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Take Photo
                  </button>
                  <button
                    onClick={toggleFacing}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <FlipHorizontal className="h-4 w-4" aria-hidden="true" />
                    Flip camera
                  </button>
                </>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload from device
              </button>
            </>
          )}
        </div>

        <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
          Your camera feed is processed locally in your browser. Nothing is recorded or uploaded.
        </p>
      </section>
    </main>
  );
}
