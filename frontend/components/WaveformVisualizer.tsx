"use client";

import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
    active: boolean;
    color?: string;
}

export function WaveformVisualizer({ active, color = "#10b981" }: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let offset = 0;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!active) {
                // Draw flat line or subtle pulse when inactive
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.strokeStyle = `${color}44`;
                ctx.lineWidth = 2;
                ctx.stroke();
                animationId = requestAnimationFrame(render);
                return;
            }

            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.strokeStyle = color;

            const width = canvas.width;
            const height = canvas.height;
            const amplitude = active ? height / 3 : 2;
            const frequency = 0.05;

            for (let x = 0; x <= width; x += 1) {
                const y = height / 2 + Math.sin(x * frequency + offset) * amplitude * Math.sin(offset * 0.5);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.stroke();

            offset += 0.15;
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [active, color]);

    return (
        <canvas
            ref={canvasRef}
            width={200}
            height={60}
            className="w-full h-full opacity-80"
        />
    );
}
