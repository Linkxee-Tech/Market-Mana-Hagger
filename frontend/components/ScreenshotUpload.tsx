import { MutableRefObject } from "react";
import { UiAction } from "../types/api";
import { HighlightOverlay } from "../overlays/HighlightOverlay";


interface CapturePanelProps {
  screenshotDataUrl?: string;
  actions: UiAction[];
  previewRef: MutableRefObject<HTMLVideoElement | null>;
  screenSize: { width: number; height: number };
  onScreenshotLoad: (width: number, height: number) => void;
  active: boolean;
  error?: string;
  onFileUpload: (file: File) => Promise<string>;
}

export function ScreenshotUpload({
  screenshotDataUrl,
  actions,
  previewRef,
  screenSize,
  onScreenshotLoad,
  active,
  error,
  onFileUpload
}: CapturePanelProps) {
  return (
    <section className="card padded relative">
      <div className="header-row">
        <h3 className="title">Screen + Highlights</h3>
        <span className="badge">{actions.length} overlays</span>
      </div>

      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

      <div className="capture-stage bg-black/50 aspect-video relative overflow-hidden rounded-md border border-white/10">
        <video
          ref={previewRef}
          className={`live-video w-full h-full object-contain ${screenshotDataUrl ? 'hidden' : 'block'}`}
          autoPlay
          muted
          playsInline
        />

        {screenshotDataUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={screenshotDataUrl}
            alt="Current shopping screenshot"
            className="w-full h-full object-contain absolute inset-0 z-10"
            onLoad={(event) => {
              const target = event.currentTarget;
              onScreenshotLoad(target.naturalWidth, target.naturalHeight);
            }}
          />
        )}

        {!active && !screenshotDataUrl && (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <p className="subtitle mb-4">Share screen or upload screenshot to begin.</p>
            <label className="btn secondary cursor-pointer">
              Upload Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    void onFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        )}

        {screenshotDataUrl && <HighlightOverlay width={screenSize.width} height={screenSize.height} actions={actions} />}
      </div>
    </section>
  );
}

