import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { config } from "../config.js";

// Schema for extracting brand assets from a page
const BrandAssetsSchema = z.object({
  page_title: z.string().describe("The page title"),
  meta_description: z.string().optional().describe("Meta description if available"),
  
  // Logo related
  logos: z.array(z.object({
    url: z.string().url().describe("URL of the logo image"),
    alt: z.string().optional().describe("Alt text of the logo"),
    type: z.enum(["primary_logo", "secondary_logo", "favicon", "wordmark", "icon"]).describe("Type of logo")
  })).describe("All logo images found on the page"),
  
  // Color palette
  colors: z.array(z.object({
    hex: z.string().describe("Hex color code like #ffffff"),
    usage: z.string().optional().describe("Where/how this color is used (background, text, accent, etc)")
  })).describe("Dominant colors used on the page"),
  
  // Typography
  typography: z.array(z.object({
    font_family: z.string().describe("Font family name"),
    usage: z.enum(["heading", "body", "accent", "navigation"]).describe("Where this font is used"),
    sample_text: z.string().optional().describe("Example text using this font")
  })).describe("Fonts used on the page"),
  
  // UI Components
  components: z.array(z.object({
    type: z.enum(["button", "card", "form", "input", "navigation", "footer", "header"]).describe("Component type"),
    description: z.string().describe("Brief description of the component"),
    screenshot_selector: z.string().optional().describe("CSS selector to capture this component")
  })).describe("UI components identified on the page"),
  
  // Hero section
  hero: z.object({
    headline: z.string().optional().describe("Main headline text"),
    subheadline: z.string().optional().describe("Subheadline or tagline"),
    cta_text: z.string().optional().describe("Call-to-action button text"),
    cta_url: z.string().url().optional().describe("CTA link URL"),
    background_type: z.enum(["image", "video", "gradient", "solid", "pattern"]).optional().describe("Type of hero background"),
    background_url: z.string().url().optional().describe("Hero background image/video URL if applicable")
  }).optional().describe("Hero section details if present"),
  
  // All images for further classification
  images: z.array(z.object({
    url: z.string().url().describe("Image URL"),
    alt: z.string().optional().describe("Alt text"),
    context: z.string().optional().describe("Where on the page this image appears")
  })).describe("All significant images on the page"),
  
  // Brand summary
  brand_mood: z.enum(["professional", "playful", "minimal", "bold", "elegant", "tech", "organic", "corporate", "creative"]).optional().describe("Overall brand mood/feeling"),
  
  // Links
  social_links: z.array(z.object({
    platform: z.string().describe("Social platform name"),
    url: z.string().url().describe("Link URL")
  })).optional().describe("Social media links found"),
  
  contact_info: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional()
  }).optional().describe("Contact information if found")
});

export type BrandAssets = z.infer<typeof BrandAssetsSchema>;

export async function extractBrandAssets(url: string): Promise<BrandAssets> {
  const stagehand = new Stagehand({
    env: config.stagehand.env,
    apiKey: config.stagehand.browserbaseApiKey,
    projectId: config.stagehand.browserbaseProjectId,
    modelName: "anthropic/claude-sonnet-4-20250514",
    modelClientOptions: {
      apiKey: config.anthropicApiKey
    }
  });

  try {
    await stagehand.init();
    
    // Navigate to the URL (with increased timeout for slow sites)
    await stagehand.page.goto(url, { 
      waitUntil: "networkidle",
      timeout: 60000 // 60 second timeout
    });
    
    // Wait for dynamic content
    await stagehand.page.waitForTimeout(2000);

    // Extract brand assets using Stagehand's extract
    try {
      const assets = await stagehand.page.extract({
        instruction: `Extract all brand-related assets from this page including:
        - Logos and brand marks (look for img tags in header, footer, or with 'logo' in class/id/src)
        - Color palette (identify dominant colors used for backgrounds, text, buttons, accents)
        - Typography (identify font families used for headings, body text, navigation)
        - UI Components (buttons, cards, forms, navigation elements)
        - Hero section (headline, subheadline, CTA, background)
        - All significant images (not tiny icons or tracking pixels)
        - Social links and contact info
        - Overall brand mood/feeling
        
        Be thorough and extract as much brand-relevant information as possible.`,
        schema: BrandAssetsSchema
      });

      return assets;
    } catch (extractError: any) {
      // Stagehand sometimes throws "Failed to parse server response" even when data is extracted successfully
      // Try to extract the actual data from the error context
      if (extractError.message?.includes("Failed to parse server response")) {
        // Check if the error object contains the actual extracted data
        const errorStr = extractError.stack || extractError.toString();
        // Return empty data as fallback - the extraction did work but parsing failed
        console.warn("Stagehand parse error, extraction may have succeeded:", extractError.message);
      }
      throw extractError;
    }
  } finally {
    await stagehand.close();
  }
}
