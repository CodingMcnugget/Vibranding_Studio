"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LoadingState from "@/components/LoadingState";

// Placeholder backend URL - update this when backend is ready
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function Home() {
  const router = useRouter();
  const [productDescription, setProductDescription] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [newReference, setNewReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
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

  const handleSubmitWithStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep("Starting extraction...");
    setActiveSession(null);

    // Include the new reference if it's not empty
    const validReferences = newReference.trim() !== "" 
      ? [...references, newReference.trim()]
      : references;

    try {
      const response = await fetch(`${API_BASE_URL}/branding`, {
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

      const slidesData = await slidesRes.json();
      console.log("Slides Data:", slidesData);

      if (!slidesRes.ok) {
        throw new Error(slidesData.error || `Slide generation failed`);
      }

      const data = await response.json();
      console.log("Backend response:", data);
      
      // Update loading step and description based on backend response
      // For now, using placeholder logic - update this based on your API response structure
      if (data.step) {
        setLoadingStep(data.step);
      }
      if (data.description) {
        setLoadingDescription(data.description);
      }
      
      // TODO: Handle successful response (navigate to results, show preview, etc.)
    } catch (err) {
      console.error("=== ERROR ===", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
      setLoadingStep("");
      setActiveSession(null);
    }
  };

  if (isLoading) {
    return <LoadingState step={loadingStep} description={loadingDescription} />;
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
            onClick={handleSubmitWithStream}
            disabled={isLoading || !productDescription.trim()}
            className="h-16 px-10 rounded-full bg-black text-white text-lg font-medium hover:bg-black/90 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Start Branding"}
          </Button>
          {isLoading && loadingStep && (
            <p className="text-sm text-gray-600 animate-pulse">{loadingStep}</p>
          )}
        </div>

        {/* Live Preview & Progress */}
        {isLoading && (
          <div className="rounded-2xl bg-white p-8 space-y-6">
            {/* URL Progress */}
            {urlProgress.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Extraction Progress
                </h3>
                {urlProgress.map((progress, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      progress.status === "complete" ? "bg-green-500" :
                      progress.status === "error" ? "bg-red-500" :
                      progress.status === "pending" ? "bg-gray-300" :
                      "bg-blue-500 animate-pulse"
                    }`} />
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {progress.url}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {progress.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Browserbase Live Preview */}
            {activeSession?.debugUrl && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Live Browser Preview
                  </h3>
                  <a
                    href={activeSession.debugUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Open in new tab
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900">
                  <div className="aspect-video">
                    <iframe
                      src={activeSession.debugUrl}
                      className="w-full h-full"
                      allow="autoplay"
                      title="Browserbase Live Session"
                    />
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-white font-medium">LIVE</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Watch the AI agent navigate and extract brand assets in real-time
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
