
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
                // The backend (UiEngine) returns pixel coordinates scaled to the active viewport
                // in the format: [x, y, w, h] (left, top, width, height)
                const [x_px, y_px, w_px, h_px] = action.highlight_coords;

                // Convert absolute pixel coordinates to percentages relative to the container size
                const topPercent = (y_px / height) * 100;
                const leftPercent = (x_px / width) * 100;
                const widthPercent = (w_px / width) * 100;
                const heightPercent = (h_px / height) * 100;

                const style: React.CSSProperties = {
                    position: "absolute",
                    top: `${topPercent}%`,
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
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
