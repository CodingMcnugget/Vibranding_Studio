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
  visual_suggestion?: string;
  accent_color?: string;
}

interface GeneratedSlides {
  product_name: string;
  tagline: string;
  brand_story: string;
  slides: {
    overview: SlideContent;
    visual_identity: SlideContent;
    typography_voice: SlideContent;
    brand_assets: SlideContent;
  };
  recommendations: string[];
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const slides = data.generatedSlides;
  const colorPalette = slides?.color_palette || {
    primary: "#4F46E5",
    secondary: "#818CF8",
    accent: "#EC4899",
    background: "#F9FAFB",
    text: "#111827",
  };

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  const handleStartOver = () => {
    localStorage.removeItem("brandingResponse");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-white text-xl font-semibold">
            {slides?.product_name || "Vibranding Studio"}
          </h1>
          {slides?.tagline && (
            <p className="text-white/60 text-sm">{slides.tagline}</p>
          )}
        </div>
        <Button
          onClick={handleStartOver}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Start Over
        </Button>
      </header>

      {/* Slide Container */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl aspect-[16/9] bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Slide Content */}
          <div className="absolute inset-0">
            {currentSlide === 0 && (
              <Slide1Overview
                slides={slides}
                product={data.product}
                colorPalette={colorPalette}
              />
            )}
            {currentSlide === 1 && (
              <Slide2VisualIdentity
                slides={slides}
                colorPalette={colorPalette}
              />
            )}
            {currentSlide === 2 && (
              <Slide3Typography
                slides={slides}
                colorPalette={colorPalette}
              />
            )}
            {currentSlide === 3 && (
              <Slide4BrandAssets
                slides={slides}
                colorPalette={colorPalette}
              />
            )}
          </div>

          {/* Slide Number */}
          <div className="absolute bottom-6 left-6 text-sm text-gray-400">
            {currentSlide + 1} / {totalSlides}
          </div>
        </div>
      </main>

      {/* Navigation */}
      <footer className="p-6 flex justify-center gap-4">
        <Button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="px-8 py-6 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
        >
          Previous
        </Button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentSlide ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
        <Button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="px-8 py-6 rounded-full bg-white text-slate-900 hover:bg-white/90 disabled:opacity-30"
        >
          Next
        </Button>
      </footer>
    </div>
  );
}

interface SlideProps {
  slides?: GeneratedSlides;
  colorPalette: GeneratedSlides["color_palette"];
  product?: string;
}

// Slide 1: Brand Overview
function Slide1Overview({ slides, product, colorPalette }: SlideProps) {
  const slideData = slides?.slides?.overview;
  const accentColor = slideData?.accent_color || colorPalette.primary;

  return (
    <div
      className="h-full p-12 flex flex-col"
      style={{ background: `linear-gradient(135deg, ${accentColor}15 0%, white 100%)` }}
    >
      <span
        className="text-sm font-medium uppercase tracking-wider mb-4"
        style={{ color: accentColor }}
      >
        {slideData?.title || "Brand Overview"}
      </span>

      <h2 className="text-4xl font-bold text-slate-900 mb-3">
        {slides?.product_name || product || "Your Brand"}
      </h2>

      {slides?.tagline && (
        <p className="text-xl text-slate-600 mb-6 italic">"{slides.tagline}"</p>
      )}

      {slides?.brand_story && (
        <p className="text-lg text-slate-600 mb-8 max-w-2xl">
          {slides.brand_story}
        </p>
      )}

      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Key Points */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            {slideData?.subtitle || "Brand Positioning"}
          </h3>
          <ul className="space-y-3">
            {slideData?.key_points?.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-slate-700">{point}</span>
              </li>
            )) || (
              <li className="text-slate-400">No key points generated</li>
            )}
          </ul>
        </div>

        {/* Mood Keywords */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Brand Mood
          </h3>
          <div className="flex flex-wrap gap-2">
            {slides?.mood_keywords?.map((keyword, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                }}
              >
                {keyword}
              </span>
            )) || (
              <span className="text-slate-400">No mood keywords</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Slide 2: Visual Identity
function Slide2VisualIdentity({ slides, colorPalette }: SlideProps) {
  const slideData = slides?.slides?.visual_identity;
  const accentColor = slideData?.accent_color || colorPalette.accent;

  return (
    <div
      className="h-full p-12 flex flex-col"
      style={{ background: `linear-gradient(135deg, ${accentColor}15 0%, white 100%)` }}
    >
      <span
        className="text-sm font-medium uppercase tracking-wider mb-4"
        style={{ color: accentColor }}
      >
        {slideData?.title || "Visual Identity"}
      </span>

      <h2 className="text-4xl font-bold text-slate-900 mb-2">
        Colors & Visual Style
      </h2>
      <p className="text-lg text-slate-500 mb-8">
        {slideData?.subtitle || "Your brand's visual language"}
      </p>

      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Color Palette */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Recommended Color Palette
          </h3>
          <div className="space-y-3">
            {Object.entries(colorPalette).map(([name, color]) => (
              <div key={name} className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl shadow-md border border-slate-200"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="text-sm font-medium text-slate-700 capitalize">{name}</p>
                  <p className="text-xs text-slate-400 uppercase">{color}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Points */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Visual Guidelines
          </h3>
          <ul className="space-y-3">
            {slideData?.key_points?.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-slate-700">{point}</span>
              </li>
            )) || (
              <li className="text-slate-400">No visual guidelines generated</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Slide 3: Typography & Voice
function Slide3Typography({ slides, colorPalette }: SlideProps) {
  const slideData = slides?.slides?.typography_voice;
  const accentColor = slideData?.accent_color || colorPalette.secondary;

  return (
    <div
      className="h-full p-12 flex flex-col"
      style={{ background: `linear-gradient(135deg, ${accentColor}15 0%, white 100%)` }}
    >
      <span
        className="text-sm font-medium uppercase tracking-wider mb-4"
        style={{ color: accentColor }}
      >
        {slideData?.title || "Typography & Voice"}
      </span>

      <h2 className="text-4xl font-bold text-slate-900 mb-2">
        How Your Brand Speaks
      </h2>
      <p className="text-lg text-slate-500 mb-8">
        {slideData?.subtitle || "Typography and tone of voice guidelines"}
      </p>

      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Typography Preview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Typography Preview
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Headline</p>
              <p className="text-3xl font-bold" style={{ color: colorPalette.text }}>
                {slides?.product_name || "Your Brand"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Subheadline</p>
              <p className="text-xl" style={{ color: colorPalette.text }}>
                {slides?.tagline || "Your tagline here"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Body Text</p>
              <p className="text-base text-slate-600">
                {slides?.brand_story?.slice(0, 100) || "Your brand story..."}...
              </p>
            </div>
          </div>
        </div>

        {/* Voice Guidelines */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Voice & Tone
          </h3>
          <ul className="space-y-3">
            {slideData?.key_points?.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-slate-700">{point}</span>
              </li>
            )) || (
              <li className="text-slate-400">No voice guidelines generated</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Slide 4: Brand Assets & Recommendations
function Slide4BrandAssets({ slides, colorPalette }: SlideProps) {
  const slideData = slides?.slides?.brand_assets;
  const accentColor = slideData?.accent_color || "#F59E0B";

  return (
    <div
      className="h-full p-12 flex flex-col"
      style={{ background: `linear-gradient(135deg, ${accentColor}15 0%, white 100%)` }}
    >
      <span
        className="text-sm font-medium uppercase tracking-wider mb-4"
        style={{ color: accentColor }}
      >
        {slideData?.title || "Brand Applications"}
      </span>

      <h2 className="text-4xl font-bold text-slate-900 mb-2">
        Next Steps
      </h2>
      <p className="text-lg text-slate-500 mb-8">
        {slideData?.subtitle || "How to apply your brand"}
      </p>

      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Application Guidelines */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Application Guidelines
          </h3>
          <ul className="space-y-3">
            {slideData?.key_points?.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-slate-700">{point}</span>
              </li>
            )) || (
              <li className="text-slate-400">No application guidelines</li>
            )}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Recommendations
          </h3>
          <ul className="space-y-3">
            {slides?.recommendations?.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {i + 1}
                </span>
                <span className="text-slate-700 text-sm">{rec}</span>
              </li>
            )) || (
              <li className="text-slate-400">No recommendations generated</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
