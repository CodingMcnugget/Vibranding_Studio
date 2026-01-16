"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onStartBranding: () => void;
}

const TEXTS = [
  "Wrap your product in a brand.",
  "Brand faster. Look sharper.",
  "Turn references into branding.",
  "Pick a vibe. Get a system.",
];

export default function LandingPage({ onStartBranding }: LandingPageProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  useEffect(() => {
    const currentText = TEXTS[currentTextIndex];
    
    if (!isDeleting && currentCharIndex < currentText.length) {
      // Typing forward
      const timeout = setTimeout(() => {
        setDisplayedText(currentText.slice(0, currentCharIndex + 1));
        setCurrentCharIndex(currentCharIndex + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && currentCharIndex === currentText.length) {
      // Finished typing, wait before deleting
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentCharIndex > 0) {
      // Deleting
      const timeout = setTimeout(() => {
        setDisplayedText(currentText.slice(0, currentCharIndex - 1));
        setCurrentCharIndex(currentCharIndex - 1);
      }, 30);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentCharIndex === 0) {
      // Finished deleting, move to next text
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % TEXTS.length);
      setDisplayedText("");
    }
  }, [currentCharIndex, currentTextIndex, isDeleting]);

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full px-8 py-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 
            className="text-black"
            style={{ 
              fontSize: '18px', 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
              fontWeight: 500
            }}
          >
            Vibranding
          </h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full border border-gray-300 bg-transparent text-black hover:bg-transparent px-4 py-2 h-auto shadow-none"
              style={{ 
                fontSize: '14px', 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                fontWeight: 400
              }}
            >
              About
            </Button>
            <Button
              variant="outline"
              className="rounded-full border border-gray-300 bg-transparent text-black hover:bg-transparent px-4 py-2 h-auto shadow-none"
              style={{ 
                fontSize: '14px', 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                fontWeight: 400
              }}
            >
              Privacy
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-20">
        <div className="flex flex-col items-center space-y-16 max-w-2xl">
          {/* Typing Text */}
          <h2 
            className="text-center text-black"
            style={{ 
              fontSize: '16px', 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
              fontWeight: 500,
              minHeight: '24px',
              lineHeight: '1.2'
            }}
          >
            {displayedText}
            {!isDeleting && currentCharIndex < TEXTS[currentTextIndex].length && (
              <span className="animate-pulse">|</span>
            )}
          </h2>

          {/* Logo */}
          <div 
            className="flex-shrink-0"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            <Image
              src={isLogoHovered ? "/logo0.png" : "/logo.png"}
              alt="Vibranding Logo"
              width={1000}
              height={1000}
              className="w-auto h-auto max-w-full"
              priority
            />
          </div>

          {/* Start Branding Button */}
          <Button
            onClick={onStartBranding}
            className="h-16 px-10 rounded-full bg-black text-white text-lg font-medium hover:bg-black/90 shadow-xl"
          >
            Start Branding
          </Button>
        </div>
      </main>
    </div>
  );
}
