"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Types based on Claude's generated slide content
interface SlideContent {
  slide_number: number;
  title: string;
  subtitle?: string;
  key_points: string[];
  accent_color?: string;
  font_primary?: string;
  font_secondary?: string;
}

interface GeneratedSlides {
  product_name: string;
  tagline: string;
  brand_story?: string;
  slides: {
    overview: SlideContent;
    visual_identity: SlideContent;
    typography_voice: SlideContent;
    brand_assets: SlideContent;
  };
  recommendations?: string[];
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted?: string;
  };
  typography?: {
    heading: string;
    body: string;
    mono?: string;
  };
  mood_keywords: string[];
}

interface StoredData {
  product: string;
  results: Array<{
    url: string;
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    error?: string;
  }>;
  summary: {
    total_urls: number;
    successful: number;
    failed: number;
  };
  generatedSlides?: GeneratedSlides;
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

  useEffect(() => {
    const stored = localStorage.getItem("brandingResponse");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setData(JSON.parse(stored));
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-xl">Loading...</div>
      </div>
    );
  }

  const slides = data.generatedSlides;
  const colorPalette = slides?.color_palette || {
    primary: "#4F46E5",
    secondary: "#818CF8",
    accent: "#EC4899",
    background: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
  };

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  const handleStartOver = () => {
    localStorage.removeItem("brandingResponse");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 flex justify-between items-center bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg"
            style={{ backgroundColor: colorPalette.primary }}
          />
          <div>
            <h1 className="text-slate-900 text-lg font-semibold">
              {slides?.product_name || "Design System"}
            </h1>
          </div>
        </div>
        <Button
          onClick={handleStartOver}
          variant="outline"
          className="text-slate-600 border-slate-300 hover:bg-slate-50"
        >
          Start Over
        </Button>
      </header>

      {/* Slide Container */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl aspect-[16/9] bg-white rounded-2xl shadow-xl overflow-hidden relative border border-slate-200">
          {/* Slide Content */}
          <div className="absolute inset-0">
            {currentSlide === 0 && <Slide1Overview slides={slides} colorPalette={colorPalette} />}
            {currentSlide === 1 && <Slide2Colors slides={slides} colorPalette={colorPalette} />}
            {currentSlide === 2 && <Slide3Typography slides={slides} colorPalette={colorPalette} />}
            {currentSlide === 3 && <Slide4Components slides={slides} colorPalette={colorPalette} />}
          </div>

          {/* Slide Number */}
          <div className="absolute bottom-4 left-6 text-xs text-slate-400 font-mono">
            {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </div>
        </div>
      </main>

      {/* Navigation */}
      <footer className="px-8 py-4 flex justify-center items-center gap-6 bg-white border-t border-slate-200">
        <Button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          variant="ghost"
          className="text-slate-600 disabled:opacity-30"
        >
          ← Previous
        </Button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide 
                  ? "w-6 rounded-full" 
                  : "bg-slate-300 hover:bg-slate-400"
              }`}
              style={i === currentSlide ? { backgroundColor: colorPalette.primary } : {}}
            />
          ))}
        </div>
        <Button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          variant="ghost"
          className="text-slate-600 disabled:opacity-30"
        >
          Next →
        </Button>
      </footer>
    </div>
  );
}

interface SlideProps {
  slides?: GeneratedSlides;
  colorPalette: GeneratedSlides["color_palette"];
}

// Slide 1: Brand Foundation
function Slide1Overview({ slides, colorPalette }: SlideProps) {
  const slideData = slides?.slides?.overview;

  return (
    <div className="h-full p-12 flex">
      {/* Left: Title & Points */}
      <div className="flex-1 flex flex-col justify-center pr-12">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">
          01 — Brand Foundation
        </p>
        <h1 className="text-5xl font-bold text-slate-900 mb-2">
          {slides?.product_name || "Brand"}
        </h1>
        <p className="text-xl text-slate-500 mb-8">{slides?.tagline}</p>
        
        <div className="space-y-2">
          {slideData?.key_points?.slice(0, 4).map((point, i) => (
            <p key={i} className="text-slate-600 flex items-center gap-3">
              <span 
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colorPalette.primary }}
              />
              {point}
            </p>
          ))}
        </div>
      </div>

      {/* Right: Visual Preview */}
      <div className="w-80 flex flex-col justify-center gap-4">
        {/* Color Strip */}
        <div className="flex rounded-xl overflow-hidden h-24 shadow-lg">
          <div className="flex-1" style={{ backgroundColor: colorPalette.primary }} />
          <div className="flex-1" style={{ backgroundColor: colorPalette.secondary }} />
          <div className="flex-1" style={{ backgroundColor: colorPalette.accent }} />
        </div>
        
        {/* Mood Tags */}
        <div className="flex flex-wrap gap-2">
          {slides?.mood_keywords?.slice(0, 4).map((keyword, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${colorPalette.primary}15`,
                color: colorPalette.primary,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slide 2: Color System
function Slide2Colors({ slides, colorPalette }: SlideProps) {
  const slideData = slides?.slides?.visual_identity;
  const colors = [
    { name: "Primary", value: colorPalette.primary, desc: "Main brand color" },
    { name: "Secondary", value: colorPalette.secondary, desc: "Supporting color" },
    { name: "Accent", value: colorPalette.accent, desc: "Highlights & CTAs" },
    { name: "Background", value: colorPalette.background, desc: "Page background" },
    { name: "Text", value: colorPalette.text, desc: "Body text" },
    { name: "Muted", value: colorPalette.muted || "#9CA3AF", desc: "Secondary text" },
  ];

  return (
    <div className="h-full p-12 flex flex-col">
      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
        02 — Color System
      </p>
      <h2 className="text-3xl font-bold text-slate-900 mb-8">
        {slideData?.title || "Color Palette"}
      </h2>

      {/* Color Grid */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {colors.map((color) => (
          <div key={color.name} className="flex flex-col">
            <div 
              className="aspect-square rounded-xl shadow-md mb-3 border border-slate-100"
              style={{ backgroundColor: color.value }}
            />
            <p className="text-sm font-medium text-slate-900">{color.name}</p>
            <p className="text-xs text-slate-400 font-mono uppercase">{color.value}</p>
          </div>
        ))}
      </div>

      {/* Usage Guidelines */}
      <div className="mt-auto">
        <div className="flex gap-6">
          {slideData?.key_points?.slice(0, 4).map((point, i) => (
            <p key={i} className="text-sm text-slate-500 flex items-start gap-2">
              <span 
                className="w-1 h-1 rounded-full mt-2 shrink-0"
                style={{ backgroundColor: colorPalette.primary }}
              />
              {point}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slide 3: Typography
function Slide3Typography({ slides, colorPalette }: SlideProps) {
  const slideData = slides?.slides?.typography_voice;
  const typography = slides?.typography || { heading: "Inter", body: "Inter", mono: "JetBrains Mono" };

  return (
    <div className="h-full p-12 flex">
      {/* Left: Type Scale */}
      <div className="flex-1 flex flex-col justify-center pr-12">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
          03 — Typography
        </p>
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          {slideData?.title || "Type System"}
        </h2>

        <div className="space-y-6">
          <div>
            <p className="text-xs text-slate-400 mb-1 font-mono">Display / 48px</p>
            <p className="text-5xl font-bold" style={{ color: colorPalette.text }}>
              {slides?.product_name || "Headline"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1 font-mono">Heading / 24px</p>
            <p className="text-2xl font-semibold" style={{ color: colorPalette.text }}>
              Section heading text
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1 font-mono">Body / 16px</p>
            <p className="text-base" style={{ color: colorPalette.muted || "#6B7280" }}>
              Body text for paragraphs and descriptions.
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1 font-mono">Caption / 12px</p>
            <p className="text-xs font-mono" style={{ color: colorPalette.muted || "#6B7280" }}>
              CAPTION AND LABEL TEXT
            </p>
          </div>
        </div>
      </div>

      {/* Right: Font Info */}
      <div className="w-72 flex flex-col justify-center">
        <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Headings</p>
            <p className="text-lg font-semibold text-slate-900">{typography.heading}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Body</p>
            <p className="text-lg font-semibold text-slate-900">{typography.body}</p>
          </div>
          {typography.mono && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Monospace</p>
              <p className="text-lg font-semibold text-slate-900 font-mono">{typography.mono}</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-2">
          {slideData?.key_points?.slice(0, 3).map((point, i) => (
            <p key={i} className="text-xs text-slate-500 flex items-start gap-2">
              <span 
                className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: colorPalette.primary }}
              />
              {point}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slide 4: Components
function Slide4Components({ slides, colorPalette }: SlideProps) {
  const slideData = slides?.slides?.brand_assets;

  return (
    <div className="h-full p-12 flex flex-col">
      <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
        04 — Components
      </p>
      <h2 className="text-3xl font-bold text-slate-900 mb-8">
        {slideData?.title || "UI Elements"}
      </h2>

      {/* Component Examples */}
      <div className="flex-1 grid grid-cols-3 gap-6">
        {/* Buttons */}
        <div className="bg-slate-50 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-4 font-mono">Buttons</p>
          <div className="space-y-3">
            <button 
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: colorPalette.primary }}
            >
              Primary Action
            </button>
            <button 
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium border-2"
              style={{ borderColor: colorPalette.primary, color: colorPalette.primary }}
            >
              Secondary
            </button>
            <button 
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium"
              style={{ backgroundColor: `${colorPalette.primary}15`, color: colorPalette.primary }}
            >
              Tertiary
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-slate-50 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-4 font-mono">Inputs</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Label</p>
              <input 
                type="text" 
                placeholder="Placeholder text"
                className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white"
              />
            </div>
            <div 
              className="w-full py-2 px-3 rounded-lg border-2 text-sm bg-white"
              style={{ borderColor: colorPalette.primary }}
            >
              <span style={{ color: colorPalette.text }}>Focused state</span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="bg-slate-50 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-4 font-mono">Cards</p>
          <div 
            className="p-4 rounded-xl border bg-white shadow-sm"
            style={{ borderColor: `${colorPalette.primary}20` }}
          >
            <div 
              className="w-8 h-8 rounded-lg mb-3"
              style={{ backgroundColor: colorPalette.accent }}
            />
            <p className="text-sm font-medium" style={{ color: colorPalette.text }}>Card Title</p>
            <p className="text-xs mt-1" style={{ color: colorPalette.muted || "#6B7280" }}>
              Supporting description text
            </p>
          </div>
        </div>
      </div>

      {/* Guidelines */}
      <div className="mt-6 flex gap-8">
        {slideData?.key_points?.slice(0, 4).map((point, i) => (
          <p key={i} className="text-xs text-slate-500 flex items-start gap-2">
            <span 
              className="w-1 h-1 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: colorPalette.primary }}
            />
            {point}
          </p>
        ))}
      </div>
    </div>
  );
}
