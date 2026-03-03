"use client";

import React, { useState, useEffect } from 'react';

interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onComplete: () => void;
}

export function OnboardingTour({ steps, isOpen, onComplete }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            const el = document.getElementById(steps[currentStep].targetId);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setTargetRect(null);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [currentStep, isOpen, steps]);

    if (!isOpen || !targetRect) return null;

    const step = steps[currentStep];

    const getPositionStyle = () => {
        const padding = 16;
        let top = 0;
        let left = 0;

        switch (step.position) {
            case 'bottom':
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width / 2);
                break;
            case 'top':
                top = targetRect.top - padding;
                left = targetRect.left + (targetRect.width / 2);
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2);
                left = targetRect.right + padding;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2);
                left = targetRect.left - padding;
                break;
        }

        return { top, left };
    };

    const style = getPositionStyle();

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop with a cutout for the target */}
            <div
                className="absolute inset-0 bg-black/60 transition-all duration-300 pointer-events-auto"
                style={{
                    clipPath: `polygon(
            0% 0%, 0% 100%, ${targetRect.left - 8}px 100%, 
            ${targetRect.left - 8}px ${targetRect.top - 8}px, 
            ${targetRect.right + 8}px ${targetRect.top - 8}px, 
            ${targetRect.right + 8}px ${targetRect.bottom + 8}px, 
            ${targetRect.left - 8}px ${targetRect.bottom + 8}px, 
            ${targetRect.left - 8}px 100%, 100% 100%, 100% 0%
          )`
                }}
            />

            {/* Target Highlight Outline */}
            <div
                className="absolute border-2 border-brand-emerald rounded-lg pointer-events-none animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16
                }}
            />

            {/* Tooltip Dialog */}
            <div
                className="absolute w-72 bg-ui-bg border border-brand-emerald/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-2xl p-5 pointer-events-auto transform -translate-x-1/2 transition-all duration-300 z-[101]"
                style={{
                    top: step.position === 'bottom' ? style.top : 'auto',
                    bottom: step.position === 'top' ? window.innerHeight - style.top : 'auto',
                    left: (step.position === 'top' || step.position === 'bottom') ? style.left : 'auto',
                }}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black tracking-widest uppercase text-brand-emerald">
                        Step {currentStep + 1} of {steps.length}
                    </span>
                    <button
                        onClick={onComplete}
                        className="text-white/30 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 mb-6">{step.description}</p>
                <div className="flex items-center justify-between">
                    <button
                        onClick={onComplete}
                        className="text-xs text-white/40 hover:text-white font-bold tracking-widest uppercase transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => {
                            if (currentStep < steps.length - 1) {
                                setCurrentStep(prev => prev + 1);
                            } else {
                                onComplete();
                            }
                        }}
                        className="px-5 py-2 bg-brand-emerald text-white rounded-lg text-xs font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                    >
                        {currentStep < steps.length - 1 ? 'Next' : 'Got it!'}
                    </button>
                </div>
            </div>
        </div>
    );
}
