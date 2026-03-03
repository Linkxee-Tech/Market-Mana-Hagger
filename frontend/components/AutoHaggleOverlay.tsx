"use client";

import { useEffect, useState } from "react";

interface AutoHaggleOverlayProps {
    active: boolean;
    target?: string;
    coords?: [number, number, number, number];
}

export function AutoHaggleOverlay({ active, target, coords }: AutoHaggleOverlayProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (active && target) {
            setTimeout(() => setVisible(true), 0);
            const timer = setTimeout(() => setVisible(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [active, target]);

    if (!active || !visible || !coords) return null;

    const [x, y, w, h] = coords;

    return (
        <div
            className="absolute pointer-events-none z-50 animate-in fade-in zoom-in duration-300"
            style={{
                left: x,
                top: y,
                width: w,
                height: h,
            }}
        >
            <div className="absolute inset-0 border-2 border-brand-emerald rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-emerald text-white text-[8px] font-black uppercase px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Mama is checking: {target}
            </div>
            <div className="absolute -bottom-2 -right-2 text-2xl animate-bounce">
                ☝️
            </div>
        </div>
    );
}
