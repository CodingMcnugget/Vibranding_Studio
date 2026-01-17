"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type LoadingStep = "summary" | "color" | "typography" | "components" | "landing" | "logo";

interface LoadingStateProps {
  step: LoadingStep;
  description: string;
  previewUrl?: string | null;
}

const STEP_CONFIG: Record<LoadingStep, { title: string; iconPath: string }> = {
  summary: {
    title: "Brand summary",
    iconPath: "/loading/summary.svg",
  },
  color: {
    title: "Color palette",
    iconPath: "/loading/color.svg",
  },
  typography: {
    title: "Typography",
    iconPath: "/loading/typography.svg",
  },
  components: {
    title: "Components",
    iconPath: "/loading/components.svg",
  },
  landing: {
    title: "Landing hero example",
    iconPath: "/loading/landing.svg",
  },
  logo: {
    title: "Logo / Mascot",
    iconPath: "/loading/logo.svg",
  },
};

export default function LoadingState({ step, description, previewUrl }: LoadingStateProps) {
  const config = STEP_CONFIG[step];
  const fullText = `Generating ${config.title}`;
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 50); // Typing speed: 50ms per character

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  // Reset animation when step changes
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [step]);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-4 py-20">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 max-w-2xl">
        {/* Icon */}
        <div className="shrink-0">
          <div className="w-14 h-14 relative opacity-90 animate-pulse">
            <Image
              src={config.iconPath}
              alt={config.title}
              width={56}
              height={56}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Text Block */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          {/* Small red label */}
          <span className="text-sm font-medium text-red-500 mb-3 block" style={{ fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
            Vibranding is
          </span>

          {/* Large headline - 32px, SF Regular */}
          <h1 className="font-normal text-black mb-3 leading-tight" style={{ fontSize: '32px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif', fontWeight: 400 }}>
            {displayedText}
            {currentIndex < fullText.length && (
              <span className="animate-pulse">|</span>
            )}
          </h1>

          {/* Description */}
          <p className="text-gray-500 max-w-md leading-relaxed" style={{ fontSize: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
            {description}
          </p>
        </div>
      </div>

      {/* Browserbase Live Preview */}
      {previewUrl && (
        <div className="mt-12 w-full max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Live Browser Preview</span>
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Open in new tab
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 shadow-xl">
            <div className="aspect-video">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                allow="autoplay"
                title="Browserbase Live Session"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            Watch the AI agent navigate and extract brand assets in real-time
          </p>
        </div>
      )}
    </div>
  );
}
