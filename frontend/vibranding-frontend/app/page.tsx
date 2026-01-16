"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [productDescription, setProductDescription] = useState("");
  const [references, setReferences] = useState(["", ""]);

  const addReference = () => {
    setReferences([...references, ""]);
  };

  const updateReference = (index: number, value: string) => {
    const newReferences = [...references];
    newReferences[index] = value;
    setReferences(newReferences);
  };

  const handleSubmit = () => {
    console.log({ productDescription, references });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-teal-100 via-emerald-50 to-cyan-100 py-10 px-4">
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

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSubmit}
            className="h-16 px-10 rounded-full bg-black text-white text-lg font-medium hover:bg-black/90 shadow-xl"
          >
            Start Branding
          </Button>
        </div>
      </div>
    </div>
  );
}
