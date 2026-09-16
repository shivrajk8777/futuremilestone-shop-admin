import { Collection, Document } from "mongodb";
import { getDatabase } from "./mongodb";
import { deleteMultipleCloudinaryImages } from "./cloudinary";

export interface CarouselHotspot {
  top: string;
  left: string;
  text: string;
  image: string;
}

export interface CarouselSlide {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  bgImage: string;
  hotspots: CarouselHotspot[];
}

export interface MasterSettings {
  marqueeVisible: boolean;
  marqueeText: string;
  firstOrderDiscountVisible: boolean;
  firstOrderDiscountPercentage: number;
  carouselVisible: boolean;
  slides: CarouselSlide[];
}

const DEFAULT_SETTINGS: MasterSettings = {
  marqueeVisible: true,
  marqueeText: "Save 20% on your first order",
  firstOrderDiscountVisible: true,
  firstOrderDiscountPercentage: 20,
  carouselVisible: true,
  slides: [
    {
      slug: "sona",
      name: "Crafting Comfort, Inspired by the North",
      tagline: "Crafted for style and lasting durability, perfect for any space.",
      price: 650,
      bgImage: "/images/s1Gw9pyuUEC9vViCqmou6hRgI_bc9f50.webp",
      hotspots: [
        { top: "51%", left: "66.2%", text: "Soft leather, durable cushioning.", image: "/images/1c3s4XR0YhiP5U0jMudG8pcXqDA_692e67.webp" },
        { top: "39%", left: "55.8%", text: "Handcrafted wood finish.", image: "/images/vb8XKVhsi1CNqzR5Bozhb2yTXeo_ca005a.webp" },
        { top: "27.7%", left: "38.4%", text: "Ergonomic and supportive.", image: "/images/GbiVrsgrVhulfQoqpcQTKA1u4_a30742.webp" }
      ]
    },
    {
      slug: "sage",
      name: "Natural Elegance in Every Detail",
      tagline: "Crafted from solid oak with a smooth finish, timeless and durable.",
      price: 380,
      bgImage: "/images/M8cpp44fcecDccZvJuknm85uc_a5408b.webp",
      hotspots: [
        { top: "24.9%", left: "55.8%", text: "Smooth, curved wood for support.", image: "/images/ppC0TOwOtlTewHNf7WaCGikU_0452aa.webp" },
        { top: "46.1%", left: "45.9%", text: "Soft padding for added comfort.", image: "/images/iDjFIbeOY7plKQSKHHFlkGVJyg_cf2b8d.webp" }
      ]
    },
    {
      slug: "nest",
      name: "Modern Minimalism, Maximum Comfort",
      tagline: "Simple, sleek, and built for a cozy, stylish lifestyle.",
      price: 360,
      bgImage: "/images/yWfiT9hCK49Xggoq1k9TvLHyUY_7361e6.webp",
      hotspots: [
        { top: "23.1%", left: "54.3%", text: "Solid wood with metal accents.", image: "/images/VoEmH1ywV91w47wrTCDlGjxtk_682c4e.webp" },
        { top: "46.4%", left: "41.9%", text: "Sleek, minimalist tubular design.", image: "/images/AkTgfzbvVkgxks7FPF6tzFzn9E_c95bb0.webp" }
      ]
    }
  ]
};

export async function getSettingsCollection(): Promise<Collection<Document>> {
  const database = await getDatabase();
  return database.collection("settings");
}

export async function getSettings(): Promise<MasterSettings> {
  const collection = await getSettingsCollection();
  const settings = await collection.findOne({ _id: "master_settings" as any });
  if (!settings) {
    return { ...DEFAULT_SETTINGS };
  }
  
  return {
    marqueeVisible: settings.marqueeVisible ?? DEFAULT_SETTINGS.marqueeVisible,
    marqueeText: settings.marqueeText ?? DEFAULT_SETTINGS.marqueeText,
    firstOrderDiscountVisible: settings.firstOrderDiscountVisible ?? DEFAULT_SETTINGS.firstOrderDiscountVisible,
    firstOrderDiscountPercentage: Number(settings.firstOrderDiscountPercentage ?? DEFAULT_SETTINGS.firstOrderDiscountPercentage),
    carouselVisible: settings.carouselVisible ?? DEFAULT_SETTINGS.carouselVisible,
    slides: Array.isArray(settings.slides) ? settings.slides : DEFAULT_SETTINGS.slides,
  };
}

export async function updateSettings(input: Partial<MasterSettings>): Promise<{ success: boolean }> {
  const collection = await getSettingsCollection();
  
  const existing = await collection.findOne({ _id: "master_settings" as any });

  const payload = {
    marqueeVisible: !!input.marqueeVisible,
    marqueeText: (input.marqueeText || "").trim() || DEFAULT_SETTINGS.marqueeText,
    firstOrderDiscountVisible: !!input.firstOrderDiscountVisible,
    firstOrderDiscountPercentage: typeof input.firstOrderDiscountPercentage !== "undefined"
      ? Math.max(0, Math.min(100, Number(input.firstOrderDiscountPercentage) || 0))
      : DEFAULT_SETTINGS.firstOrderDiscountPercentage,
    carouselVisible: !!input.carouselVisible,
    slides: Array.isArray(input.slides) ? input.slides.map(slide => ({
      slug: (slide.slug || "").trim(),
      name: (slide.name || "").trim(),
      tagline: (slide.tagline || "").trim(),
      price: Number(slide.price) || 0,
      bgImage: (slide.bgImage || "").trim(),
      hotspots: Array.isArray(slide.hotspots) ? slide.hotspots : []
    })) : DEFAULT_SETTINGS.slides,
    updatedAt: new Date(),
  };

  // Collect previous images
  const oldImages: string[] = [];
  if (Array.isArray(existing?.slides)) {
    for (const slide of existing.slides) {
      if (slide.bgImage) oldImages.push(slide.bgImage);
      if (Array.isArray(slide.hotspots)) {
        for (const h of slide.hotspots) {
          if (h.image) oldImages.push(h.image);
        }
      }
    }
  }

  const newImages = new Set<string>();
  for (const slide of payload.slides) {
    if (slide.bgImage) newImages.add(slide.bgImage);
    if (Array.isArray(slide.hotspots)) {
      for (const h of slide.hotspots) {
        if (h.image) newImages.add(h.image);
      }
    }
  }

  const replacedOrRemoved = oldImages.filter(
    (img) => !newImages.has(img) && img.includes("cloudinary.com")
  );

  if (replacedOrRemoved.length > 0) {
    deleteMultipleCloudinaryImages(replacedOrRemoved).catch((err) => {
      console.error("Failed to delete old settings images from Cloudinary:", err);
    });
  }

  await collection.updateOne(
    { _id: "master_settings" as any },
    { $set: payload },
    { upsert: true }
  );

  return { success: true };
}
