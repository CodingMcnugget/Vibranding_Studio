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
