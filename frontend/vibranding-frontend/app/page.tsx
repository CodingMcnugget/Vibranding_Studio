"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Backend API URL - defaults to port 3001 where backend runs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface SessionInfo {
  sessionId?: string;
  sessionUrl?: string;
  debugUrl?: string;
}

interface UrlProgress {
  url: string;
  status: "pending" | "extracting" | "classifying" | "complete" | "error";
  session?: SessionInfo;
  error?: string;
}

export default function Home() {
  const router = useRouter();
  const [productDescription, setProductDescription] = useState("");
  const [references, setReferences] = useState(["", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [urlProgress, setUrlProgress] = useState<UrlProgress[]>([]);
  const [activeSession, setActiveSession] = useState<SessionInfo | null>(null);

  const updateReference = (index: number, value: string) => {
    const newReferences = [...references];
    newReferences[index] = value;
    
    // If user is typing in the last field and it's not empty, add a new empty field
    if (index === references.length - 1 && value.trim() !== "") {
      newReferences.push("");
    }
    
    setReferences(newReferences);
  };

  const deleteReference = (index: number) => {
    const newReferences = references.filter((_, i) => i !== index);
    // Ensure at least one empty field remains
    if (newReferences.length === 0 || newReferences.every(ref => ref.trim() !== "")) {
      newReferences.push("");
    }
    setReferences(newReferences);
  };

  const handleSubmitWithStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep("Starting extraction...");
    setActiveSession(null);

    const validReferences = references.filter((ref) => ref.trim() !== "");
    
    // Initialize progress for all URLs
    setUrlProgress(validReferences.map(url => ({ url, status: "pending" })));

    const requestBody = {
      product: productDescription,
      urls: validReferences,
    };

    console.log("=== STREAMING BRANDING EXTRACTION ===");
    console.log("URL:", `${API_BASE_URL}/branding/stream`);

    try {
      const response = await fetch(`${API_BASE_URL}/branding/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let brandingData: any = null;

      if (reader) {
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              const eventType = line.slice(7);
              continue;
            }
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Handle different event types
                if (data.session) {
                  // Session ready event
                  console.log("Session ready:", data.session);
                  setActiveSession(data.session);
                  setUrlProgress(prev => prev.map((p, i) => 
                    i === data.index ? { ...p, session: data.session, status: "extracting" } : p
                  ));
                } else if (data.index !== undefined && data.url) {
                  // URL progress events
                  if (data.success !== undefined) {
                    // URL complete
                    setUrlProgress(prev => prev.map((p, i) => 
                      i === data.index ? { 
                        ...p, 
                        status: data.success ? "complete" : "error",
                        error: data.error 
                      } : p
                    ));
                  } else if (data.imageCount !== undefined) {
                    // Classifying
                    setLoadingStep(`Classifying ${data.imageCount} images...`);
                    setUrlProgress(prev => prev.map((p, i) => 
                      i === data.index ? { ...p, status: "classifying" } : p
                    ));
                  } else {
                    // URL start
                    setLoadingStep(`Extracting from ${new URL(data.url).hostname}...`);
                    setUrlProgress(prev => prev.map((p, i) => 
                      i === data.index ? { ...p, status: "extracting" } : p
                    ));
                  }
                } else if (data.results) {
                  // Final complete event
                  brandingData = data;
                  console.log("Extraction complete:", data);
                }
              } catch (e) {
                console.warn("Failed to parse SSE data:", line);
              }
            }
          }
        }
      }

      if (!brandingData) {
        throw new Error("No data received from stream");
      }

      // Step 2: Generate personalized slides with Claude
      setLoadingStep("AI is crafting your brand presentation...");
      setActiveSession(null);

      const successfulResult = brandingData.results?.find((r: { success: boolean }) => r.success);
      const brandData = successfulResult?.data || {};
      const sourceUrls = brandingData.results
        ?.filter((r: { success: boolean }) => r.success)
        .map((r: { url: string }) => r.url) || [];

      console.log("=== GENERATING SLIDES ===");
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

      const slidesData = await slidesRes.json();
      console.log("Slides Data:", slidesData);

      if (!slidesRes.ok) {
        throw new Error(slidesData.error || `Slide generation failed`);
      }

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
      setLoadingStep("");
      setActiveSession(null);
    }
  }, [productDescription, references, router]);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-teal-100 via-emerald-50 to-cyan-100 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-8">
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
            {references.map((ref, index) => {
              const isEmpty = ref.trim() === "";
              const showDelete = !isEmpty;
              
              return (
                <div key={index} className="relative group">
                  <Input
                    placeholder="Paste URL here"
                    value={ref}
                    onChange={(e) => updateReference(index, e.target.value)}
                    className={`h-12 w-full rounded-full border border-gray-300 bg-white px-5 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0 focus-visible:outline-none shadow-none ${showDelete ? 'pr-12' : ''}`}
                    style={{ fontSize: '16px', fontFamily: 'inherit' }}
                  />
                  {showDelete && (
                    <button
                      onClick={() => deleteReference(index)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ fontSize: '18px', lineHeight: '1' }}
                      aria-label="Delete reference"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
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
