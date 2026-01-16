import {
  ClaudeClient,
  type ImageClassification,
  type BrandSummary
} from "./claudeClient.js";

export interface ClassifiedAssets {
  brand_summary: BrandSummary;
  color_palette: CategoryAssets;
  typography: CategoryAssets;
  components: CategoryAssets;
  landing_hero: CategoryAssets;
  logo_usage: CategoryAssets;
  brand_assets: CategoryAssets;
  all_images: ClassifiedImage[];
}

export interface CategoryAssets {
  count: number;
  items: ClassifiedImage[];
}

export interface ClassifiedImage {
  url: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
  classification?: ImageClassification;
}

export class AssetClassifier {
  private claude: ClaudeClient;

  constructor(anthropicApiKey: string) {
    this.claude = new ClaudeClient(anthropicApiKey);
  }

  async classifyAssets(
    images: Array<{ url?: string; alt?: string; width?: number | null; height?: number | null }>,
    options: { maxImages?: number; concurrency?: number } = {}
  ): Promise<ClassifiedAssets> {
    const { maxImages = 20, concurrency = 3 } = options;

    const validImages = images.filter((img) => img.url);
    const imageUrls = validImages.map((img) => img.url!);

    const classifications = await this.claude.classifyImages(imageUrls, {
      maxImages,
      concurrency
    });

    const classificationMap = new Map(
      classifications.map((c) => [c.url, c])
    );

    const classifiedImages: ClassifiedImage[] = validImages.map((img) => ({
      url: img.url!,
      alt: img.alt,
      width: img.width,
      height: img.height,
      classification: classificationMap.get(img.url!)
    }));

    // Generate brand summary using Claude
    const brandSummary = await this.claude.generateBrandSummary(classifications);

    // Organize by category
    const organized = this.organizeByCategory(classifiedImages);

    return {
      brand_summary: brandSummary,
      ...organized,
      all_images: classifiedImages
    };
  }

  private organizeByCategory(images: ClassifiedImage[]): Omit<ClassifiedAssets, "brand_summary" | "all_images"> {
    const categories: Record<string, ClassifiedImage[]> = {
      logo_usage: [],
      color_palette: [],
      typography: [],
      component: [],
      landing_hero: [],
      brand_asset: []
    };

    for (const img of images) {
      const category = img.classification?.category;
      if (category && categories[category]) {
        categories[category].push(img);
      } else {
        // Uncategorized goes to brand_asset
        categories.brand_asset.push(img);
      }
    }

    return {
      logo_usage: {
        count: categories.logo_usage.length,
        items: categories.logo_usage
      },
      color_palette: {
        count: categories.color_palette.length,
        items: categories.color_palette
      },
      typography: {
        count: categories.typography.length,
        items: categories.typography
      },
      components: {
        count: categories.component.length,
        items: categories.component
      },
      landing_hero: {
        count: categories.landing_hero.length,
        items: categories.landing_hero
      },
      brand_assets: {
        count: categories.brand_asset.length,
        items: categories.brand_asset
      }
    };
  }
}
