"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

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
        <Card className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-8">
            <span className="text-lg font-medium text-foreground/80">Step 1</span>
            <h2 className="text-3xl font-light text-foreground mb-6">
              What is your product about?
            </h2>
            <Textarea
              placeholder="Describe your product..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="min-h-[140px] rounded-3xl border-border/50 bg-white px-6 py-5 text-lg placeholder:text-muted-foreground/50 resize-none focus-visible:ring-teal-300"
            />
          </CardContent>
        </Card>

        {/* Step 2: Add References */}
        <Card className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-8">
            <span className="text-lg font-medium text-foreground/80">Step 2</span>
            <h2 className="text-3xl font-light text-foreground mb-6">
              Add references that you like
            </h2>
            <div className="space-y-4">
              {references.map((ref, index) => (
                <Input
                  key={index}
                  placeholder="Paste URL here"
                  value={ref}
                  onChange={(e) => updateReference(index, e.target.value)}
                  className="h-14 rounded-full border-border/50 bg-white px-6 text-lg placeholder:text-muted-foreground/50 focus-visible:ring-teal-300"
                />
              ))}
              <button
                onClick={addReference}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1 mt-2"
              >
                <span className="text-lg">+</span> Add another reference
              </button>
            </div>
          </CardContent>
        </Card>

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
