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
    const prompt = `You are a design system expert creating a minimal, visual brand deck. Create a 4-slide design system presentation.

## PRODUCT
${productDescription}

## REFERENCE DATA
${JSON.stringify(brandData, null, 2)}

## RULES
- Create a CREATIVE brand name that fits the product (e.g., "Matcha" → "Zencha", "Water bottle" → "Hydra", "Tech startup" → "Nexus")
- MAX 4 short bullet points per slide (under 10 words each)
- Focus on VISUAL elements: colors, typography, spacing
- Think like Figma/design system documentation
- Extract actual colors from reference data when available
- Match product context (beverage=natural greens, tech=blues/purples, fashion=bold contrast)

Return ONLY valid JSON:
{
  "product_name": "creative brand name that captures the product essence (1-2 words, memorable)",
  "tagline": "max 6 words that describe the brand promise",
  "slides": {
    "overview": {
      "slide_number": 1,
      "title": "Brand Foundation",
      "key_points": ["max 4 short points about brand essence"],
      "accent_color": "#hex"
    },
    "visual_identity": {
      "slide_number": 2,
      "title": "Color System",
      "key_points": ["max 4 short points about color usage"],
      "accent_color": "#hex"
    },
    "typography_voice": {
      "slide_number": 3,
      "title": "Typography",
      "key_points": ["max 4 short points about type"],
      "font_primary": "suggested primary font name",
      "font_secondary": "suggested secondary font name",
      "accent_color": "#hex"
    },
    "brand_assets": {
      "slide_number": 4,
      "title": "Components",
      "key_points": ["max 4 short points about UI patterns"],
      "accent_color": "#hex"
    }
  },
  "color_palette": {
    "primary": "#hex main brand color",
    "secondary": "#hex supporting color", 
    "accent": "#hex highlight color",
    "background": "#hex bg color",
    "text": "#hex text color",
    "muted": "#hex muted/gray color"
  },
  "typography": {
    "heading": "Font name for headings",
    "body": "Font name for body",
    "mono": "Monospace font if applicable"
  },
  "mood_keywords": ["3-4 words max"]
}`;

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
    // Generate a simple brand name from the product description
    const words = productDescription.toLowerCase().split(" ");
    const brandName = words.find(w => w.length > 3 && !["the", "and", "for", "with", "that", "this"].includes(w)) || "Brand";
    const capitalizedName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
    
    return {
      product_name: capitalizedName,
      tagline: "Designed for impact",
      slides: {
        overview: {
          slide_number: 1,
          title: "Brand Foundation",
          key_points: [
            "Clear brand positioning",
            "Distinct visual identity",
            "Consistent experience"
          ],
          accent_color: "#4F46E5"
        },
        visual_identity: {
          slide_number: 2,
          title: "Color System",
          key_points: [
            "Primary for key actions",
            "Secondary for support",
            "Accent for highlights"
          ],
          accent_color: "#EC4899"
        },
        typography_voice: {
          slide_number: 3,
          title: "Typography",
          key_points: [
            "Headlines: Bold, impactful",
            "Body: Clean, readable",
            "Hierarchy through weight"
          ],
          font_primary: "Inter",
          font_secondary: "System UI",
          accent_color: "#10B981"
        },
        brand_assets: {
          slide_number: 4,
          title: "Components",
          key_points: [
            "Consistent button styles",
            "Card-based layouts",
            "Clear visual hierarchy"
          ],
          accent_color: "#F59E0B"
        }
      },
      color_palette: {
        primary: "#4F46E5",
        secondary: "#818CF8",
        accent: "#EC4899",
        background: "#FFFFFF",
        text: "#111827",
        muted: "#6B7280"
      },
      typography: {
        heading: "Inter",
        body: "Inter",
        mono: "JetBrains Mono"
      },
      mood_keywords: ["modern", "minimal", "clean"]
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
  font_primary?: string;
  font_secondary?: string;
}

export interface GeneratedSlides {
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
