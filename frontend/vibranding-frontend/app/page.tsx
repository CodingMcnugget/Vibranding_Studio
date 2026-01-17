"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LoadingState from "@/components/LoadingState";
import LandingPage from "@/components/LandingPage";

// Backend API URL - uses proxy in production, direct in development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001');

export default function Home() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(true);
  const [productDescription, setProductDescription] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [newReference, setNewReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<"summary" | "color" | "typography" | "components" | "landing" | "logo">("summary");
  const [loadingDescription, setLoadingDescription] = useState<string>("This is the description.");

  const addReference = () => {
    if (newReference.trim() !== "") {
      setReferences([...references, newReference.trim()]);
      setNewReference("");
    }
  };

  const handleNewReferenceChange = (value: string) => {
    setNewReference(value);
  };

  const handleNewReferenceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addReference();
    }
  };

  const deleteReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep("summary");
    setLoadingDescription("Extracting brand assets...");

    // Include the new reference if it's not empty
    const validReferences = newReference.trim() !== "" 
      ? [...references, newReference.trim()]
      : references;

    try {
      // Step 1: Extract brand assets
      const brandingRes = await fetch(`${API_BASE_URL}/branding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: productDescription,
          urls: validReferences,
        }),
      });

      if (!brandingRes.ok) {
        const errorData = await brandingRes.json();
        throw new Error(errorData.error || `Request failed`);
      }

      const brandingData = await brandingRes.json();
      console.log("Branding Data:", brandingData);

      // Step 2: Generate personalized slides
      setLoadingStep("color");
      setLoadingDescription("AI is crafting your brand presentation...");

      const successfulResult = brandingData.results?.find((r: { success: boolean }) => r.success);
      const brandData = successfulResult?.data || {};
      const sourceUrls = brandingData.results
        ?.filter((r: { success: boolean }) => r.success)
        .map((r: { url: string }) => r.url) || [];

      const slidesRes = await fetch(`${API_BASE_URL}/generate-slides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: productDescription,
          brandData,
          sourceUrls,
        }),
      });

      if (!slidesRes.ok) {
        const errorData = await slidesRes.json();
        throw new Error(errorData.error || `Slide generation failed`);
      }

      const slidesData = await slidesRes.json();
      console.log("Slides Data:", slidesData);

      // Store and redirect
      localStorage.setItem("brandingResponse", JSON.stringify({
        ...brandingData,
        generatedSlides: slidesData.slides,
      }));

      router.push("/results");
    } catch (err) {
      console.error("=== ERROR ===", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState step={loadingStep} description={loadingDescription} />;
  }

  if (showLanding) {
    return <LandingPage onStartBranding={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 py-16 px-8">
      <div className="mx-auto max-w-[95%] space-y-6">
        {/* Step 1: Product Description */}
        <div className="rounded-2xl bg-white p-12">
          <div className="mb-8">
            <span className="text-sm font-medium text-red-500 mb-3 block" style={{ fontSize: '14px' }}>Step 1</span>
            <h2 className="text-black" style={{ fontSize: '32px', fontWeight: 400, lineHeight: '1.2' }}>
              What is your product about?
            </h2>
          </div>
          <Textarea
            placeholder="Describe your product..."
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            className="min-h-[140px] w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 placeholder:text-gray-400 resize-none focus-visible:border-gray-400 focus-visible:ring-0 focus-visible:outline-none shadow-none"
            style={{ fontSize: '16px', fontFamily: 'inherit' }}
          />
        </div>

        {/* Step 2: Add References */}
        <div className="rounded-2xl bg-white p-12">
          <div className="mb-8">
            <span className="text-sm font-medium text-red-500 mb-3 block" style={{ fontSize: '14px' }}>Step 2</span>
            <h2 className="text-black" style={{ fontSize: '32px', fontWeight: 400, lineHeight: '1.2' }}>
              Add references that you like
            </h2>
          </div>
          <div className="space-y-4">
            {/* Display filled references first */}
            {references.map((ref, index) => (
              <div key={index} className="relative group">
                <Input
                  value={ref}
                  readOnly
                  className="h-12 w-full rounded-full border border-gray-300 bg-white px-5 pr-12 text-gray-900 focus-visible:border-gray-400 focus-visible:ring-0 focus-visible:outline-none shadow-none"
                  style={{ fontSize: '16px', fontFamily: 'inherit' }}
                />
                <button
                  onClick={() => deleteReference(index)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ fontSize: '18px', lineHeight: '1' }}
                  aria-label="Delete reference"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Empty "Paste URL here" field at the bottom */}
            <div className="relative">
              <Input
                placeholder="Paste URL here"
                value={newReference}
                onChange={(e) => handleNewReferenceChange(e.target.value)}
                onKeyDown={handleNewReferenceKeyDown}
                onBlur={addReference}
                className="h-12 w-full rounded-full border border-gray-300 bg-white px-5 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 focus-visible:outline-none shadow-none"
                style={{ fontSize: '16px', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center text-red-500 font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !productDescription.trim()}
            className="h-16 px-10 rounded-full bg-black text-white text-lg font-medium hover:bg-black/90 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Start Branding"}
          </Button>
        </div>
      </div>
    </div>
  );
}
