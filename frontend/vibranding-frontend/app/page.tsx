"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Placeholder backend URL - update this when backend is ready
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function Home() {
  const [productDescription, setProductDescription] = useState("");
  const [references, setReferences] = useState(["", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReference = () => {
    setReferences([...references, ""]);
  };

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

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    // Filter out empty references
    const validReferences = references.filter((ref) => ref.trim() !== "");

    try {
      const response = await fetch(`${API_BASE_URL}/branding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: productDescription,
          urls: validReferences,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Backend response:", data);
      // TODO: Handle successful response (navigate to results, show preview, etc.)
    } catch (err) {
      console.error("Error submitting:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex justify-center pt-4">
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
