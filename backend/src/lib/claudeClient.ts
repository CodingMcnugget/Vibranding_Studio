import Anthropic from "@anthropic-ai/sdk";

export class ClaudeClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async classifyImageFromUrl(imageUrl: string): Promise<ImageClassification> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return { url: imageUrl, error: `Failed to fetch: ${response.status}` };
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Determine media type for Claude
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
      if (contentType.includes("png")) mediaType = "image/png";
      else if (contentType.includes("gif")) mediaType = "image/gif";
      else if (contentType.includes("webp")) mediaType = "image/webp";

      const message = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64
                }
              },
              {
                type: "text",
                text: `You are a brand design analyst. Analyze this image and classify it into ONE of these brand asset categories:

CATEGORIES:
1. "logo_usage" - Logos, wordmarks, logomarks, brand marks, mascots, brand characters
2. "color_palette" - Color swatches, gradient examples, color usage demonstrations
3. "typography" - Font samples, type specimens, text styling examples, headline examples
4. "component" - UI components like buttons, cards, forms, inputs, navigation, icons
5. "landing_hero" - Hero sections, landing page examples, CTA sections, marketing banners
6. "brand_asset" - Other brand materials: patterns, textures, illustrations, imagery guidelines

Return ONLY valid JSON with this structure:
{
  "category": one of the 6 categories above,
  "sub_category": more specific type (e.g. "primary_logo", "button", "hero_section", "color_swatch", "heading_font"),
  "description": brief description (max 30 words),
  "brand_insights": {
    "colors": array of hex codes detected (max 5),
    "has_text": boolean,
    "text_content": extracted text if readable,
    "font_style": detected font style if typography ("serif", "sans-serif", "display", "monospace", null),
    "mood": one of ["professional", "playful", "minimal", "bold", "elegant", "tech", "organic", "corporate"],
    "cta_text": call-to-action text if present
  },
  "design_notes": any notable design patterns or brand elements observed
}

Return ONLY the JSON, no markdown, no explanation.`
              }
            ]
          }
        ]
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return { url: imageUrl, error: "No text response from Claude" };
      }

      const text = textBlock.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { url: imageUrl, error: "No JSON in response", rawResponse: text };
      }

      const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult;
      return {
        url: imageUrl,
        ...parsed
      };
    } catch (err) {
      return {
        url: imageUrl,
        error: err instanceof Error ? err.message : "Classification failed"
      };
    }
  }

  async generateBrandSummary(
    classifications: ImageClassification[]
  ): Promise<BrandSummary> {
    const successful = classifications.filter((c) => !c.error && c.category);

    if (successful.length === 0) {
      return {
        keywords: [],
        positioning: "Unable to determine brand positioning",
        overall_mood: "unknown",
        primary_colors: [],
        typography_style: null
      };
    }

    const prompt = `Based on these brand asset classifications, generate a brand summary:

${JSON.stringify(successful, null, 2)}

Return ONLY valid JSON:
{
  "keywords": array of 5-8 brand keywords,
  "positioning": one sentence brand positioning statement,
  "overall_mood": dominant mood/feeling,
  "primary_colors": top 3-5 brand colors (hex),
  "typography_style": primary typography style detected,
  "brand_personality": 2-3 word brand personality description
}`;

    try {
      const message = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (textBlock && textBlock.type === "text") {
        const text = textBlock.text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as BrandSummary;
        }
      }
    } catch (err) {
      // fallback
    }

    // Fallback: generate summary from classifications
    const allColors = successful
      .flatMap((c) => c.brand_insights?.colors || [])
      .filter(Boolean);
    const colorCounts = allColors.reduce(
      (acc, color) => {
        acc[color] = (acc[color] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([c]) => c);

    const moods = successful.map((c) => c.brand_insights?.mood).filter(Boolean);
    const moodCounts = moods.reduce(
      (acc, mood) => {
        acc[mood!] = (acc[mood!] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

    return {
      keywords: [],
      positioning: "Brand positioning requires more context",
      overall_mood: topMood,
      primary_colors: topColors,
      typography_style: successful.find((c) => c.brand_insights?.font_style)?.brand_insights?.font_style || null
    };
  }

  async classifyImages(
    imageUrls: string[],
    options: { concurrency?: number; maxImages?: number } = {}
  ): Promise<ImageClassification[]> {
    const { concurrency = 3, maxImages = 20 } = options;
    const urls = imageUrls.slice(0, maxImages);
    const results: ImageClassification[] = [];

    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((url) => this.classifyImageFromUrl(url))
      );
      results.push(...batchResults);
    }

    return results;
  }

  async generateSlides(
    productDescription: string,
    brandData: Record<string, unknown>,
    sourceUrls: string[]
  ): Promise<GeneratedSlides> {
    const prompt = `You are a world-class brand strategist and designer. Analyze the extracted brand reference data and create a personalized brand presentation for a new product.

## USER'S PRODUCT
${productDescription}

## REFERENCE BRAND DATA (extracted from ${sourceUrls.join(", ")})
${JSON.stringify(brandData, null, 2)}

## YOUR TASK
Create a 4-slide brand presentation that:
1. Identifies the MOST RELEVANT and HIGH-QUALITY elements from the reference
2. ADAPTS them specifically for the user's product (${productDescription})
3. Provides actionable, personalized recommendations

Think about the product context:
- If it's a beverage (water, matcha, coffee), focus on freshness, natural colors, clean typography
- If it's tech/SaaS, focus on modern, minimal, professional elements
- If it's lifestyle/fashion, focus on elegance, photography, bold typography
- Match the mood to what makes sense for THEIR product, not just copying the reference

Return ONLY valid JSON with this exact structure:
{
  "product_name": "suggested brand name or use what user provided",
  "tagline": "a catchy tagline for their product (max 8 words)",
  "brand_story": "2-3 sentence brand narrative tailored to their product",
  "slides": {
    "overview": {
      "slide_number": 1,
      "title": "Brand Overview",
      "subtitle": "personalized subtitle about their product",
      "key_points": ["3-5 key brand positioning points tailored to their product"],
      "visual_suggestion": "what visual should go here",
      "accent_color": "hex color that fits their product"
    },
    "visual_identity": {
      "slide_number": 2,
      "title": "Visual Identity",
      "subtitle": "personalized subtitle",
      "key_points": ["3-5 points about colors, logo direction, visual style - adapted for their product"],
      "visual_suggestion": "what to show",
      "accent_color": "hex color"
    },
    "typography_voice": {
      "slide_number": 3,
      "title": "Typography & Voice",
      "subtitle": "personalized subtitle",
      "key_points": ["3-5 points about fonts, tone of voice, writing style - adapted for their product"],
      "visual_suggestion": "what to show",
      "accent_color": "hex color"
    },
    "brand_assets": {
      "slide_number": 4,
      "title": "Brand Applications",
      "subtitle": "personalized subtitle",
      "key_points": ["3-5 points about how to apply the brand - specific to their product type"],
      "visual_suggestion": "what to show",
      "accent_color": "hex color"
    }
  },
  "recommendations": [
    "5-7 specific, actionable recommendations for their brand (be specific to their product!)"
  ],
  "color_palette": {
    "primary": "hex - main brand color suited for their product",
    "secondary": "hex - complementary color",
    "accent": "hex - pop/accent color",
    "background": "hex - background color",
    "text": "hex - text color"
  },
  "mood_keywords": ["5-8 mood/vibe words that fit their specific product"]
}

Be creative but practical. The recommendations should be specific to "${productDescription}" - not generic branding advice.`;

    try {
      const message = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (textBlock && textBlock.type === "text") {
        const text = textBlock.text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as GeneratedSlides;
        }
      }

      throw new Error("Failed to parse Claude response");
    } catch (err) {
      // Return a fallback structure
      return this.generateFallbackSlides(productDescription);
    }
  }

  private generateFallbackSlides(productDescription: string): GeneratedSlides {
    return {
      product_name: productDescription.split(" ").slice(0, 3).join(" "),
      tagline: "Your brand, elevated",
      brand_story: `A fresh take on ${productDescription}, designed to stand out in today's market.`,
      slides: {
        overview: {
          slide_number: 1,
          title: "Brand Overview",
          subtitle: "Defining your brand identity",
          key_points: [
            "Establish clear brand positioning",
            "Define your unique value proposition",
            "Connect with your target audience"
          ],
          accent_color: "#4F46E5"
        },
        visual_identity: {
          slide_number: 2,
          title: "Visual Identity",
          subtitle: "Colors, logos, and visual style",
          key_points: [
            "Choose colors that reflect your brand personality",
            "Design a memorable logo",
            "Create consistent visual language"
          ],
          accent_color: "#EC4899"
        },
        typography_voice: {
          slide_number: 3,
          title: "Typography & Voice",
          subtitle: "How your brand communicates",
          key_points: [
            "Select fonts that match your brand personality",
            "Develop a consistent tone of voice",
            "Create messaging guidelines"
          ],
          accent_color: "#10B981"
        },
        brand_assets: {
          slide_number: 4,
          title: "Brand Applications",
          subtitle: "Bringing your brand to life",
          key_points: [
            "Apply brand across all touchpoints",
            "Create templates and guidelines",
            "Ensure consistency in all materials"
          ],
          accent_color: "#F59E0B"
        }
      },
      recommendations: [
        "Start with a clear brand strategy",
        "Invest in quality design assets",
        "Maintain consistency across all channels"
      ],
      color_palette: {
        primary: "#4F46E5",
        secondary: "#818CF8",
        accent: "#EC4899",
        background: "#F9FAFB",
        text: "#111827"
      },
      mood_keywords: ["modern", "professional", "approachable"]
    };
  }
}

export interface BrandInsights {
  colors?: string[];
  has_text?: boolean;
  text_content?: string;
  font_style?: string | null;
  mood?: string;
  cta_text?: string;
}

export interface ClassificationResult {
  category?: string;
  sub_category?: string;
  description?: string;
  brand_insights?: BrandInsights;
  design_notes?: string;
}

export interface ImageClassification extends ClassificationResult {
  url: string;
  error?: string;
  rawResponse?: string;
}

export interface BrandSummary {
  keywords: string[];
  positioning: string;
  overall_mood: string;
  primary_colors: string[];
  typography_style: string | null;
  brand_personality?: string;
}

// Slide generation types
export interface SlideContent {
  slide_number: number;
  title: string;
  subtitle?: string;
  key_points: string[];
  visual_suggestion?: string;
  accent_color?: string;
}

export interface GeneratedSlides {
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
