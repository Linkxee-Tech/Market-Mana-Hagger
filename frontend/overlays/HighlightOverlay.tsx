
import { UiAction } from "../types/api";

interface HighlightOverlayProps {
    width: number;
    height: number;
    actions: UiAction[];
}

export function HighlightOverlay({ width, height, actions }: HighlightOverlayProps) {
    if (width === 0 || height === 0) {
        return null;
    }

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            {actions.map((action, i) => {
                // coords are [y1, x1, y2, x2] usually normalized 0-1000 from Gemini? 
                // Or pixels?
                // "Price Intelligence" service (step 162) says "logic for scaling coordinates".
                // "UI Action Engine" (step 162) "scaling coordinates".
                // Let's assume the API returns normalized 0-1000 coordinates as [ymin, xmin, ymax, xmax].
                // If they are pixels, we need to know the original image size.
                // But here we are overlaying on an image that might be scaled via CSS `object-contain`.
                // The `CapturePanel` renders the image with `object-contain`.
                // The overlay needs to match the image content rect, not just the container.
                // This is tricky with `object-contain`. 
                // For a simple demo, assuming the image fills the container or we can't easily sync.
                // But wait, `CapturePanel` gets `naturalWidth/Height` in `onScreenshotLoad`.
                // If we assume coordinates are 0-1000 normalized:
                const [ymin, xmin, ymax, xmax] = action.highlight_coords;

                // To position correctly over an `object-contain` image, we'd need to calculate the render rect.
                // For now, let's just assume simple positioning relative to container (which might be slightly off if image has aspect ratio bars).
                // A better way is to put the overlay INSIDE the same container as the image, and make the container match aspect ratio?
                // `CapturePanel` uses `aspect-video` (16:9). If screenshot is 16:9, it fits perfectly.

                const style: React.CSSProperties = {
                    position: "absolute",
                    top: `${ymin / 10}%`,
                    left: `${xmin / 10}%`,
                    width: `${(xmax - xmin) / 10}%`,
                    height: `${(ymax - ymin) / 10}%`,
                    border: "3px solid #facc15", // Market yellow
                    backgroundColor: "rgba(250, 204, 21, 0.2)",
                    borderRadius: 4,
                    zIndex: 20
                };

                return (
                    <div key={i} style={style}>
                        {action.message && (
                            <span className="absolute -top-8 left-0 bg-yellow-400 text-black text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                {action.message}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
