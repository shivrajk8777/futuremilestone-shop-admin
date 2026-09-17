import { Collection, Document, ObjectId } from "mongodb";
import { z } from "zod";
import { findCollectionSummaryById } from "./collections";
import { getDatabase } from "./mongodb";
import { deleteMultipleCloudinaryImages } from "./cloudinary";

const colorVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Color name is required."),
  image: z.string().url("Enter a valid Cloudinary image URL.").or(z.literal("")).optional().default(""),
  galleryImages: z.array(z.string().trim().min(1)).optional().default([]),
});

const materialSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Material name is required."),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or greater."),
});

const dimensionSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "Dimension label is required."),
  price: z.coerce.number().min(0, "Price must be 0 or greater."),
});

const detailSectionSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string().url("Enter a valid Cloudinary image URL.").or(z.literal("")),
  heading: z.string().trim().min(1, "Heading is required."),
  content: z.string().trim().min(1, "Content is required."),
});

const productSchema = z.object({
  imageUrl: z.string().url("Enter a valid Cloudinary image URL.").or(z.literal("")).optional(),
  collectionId: z.string().min(1, "Select a collection."),
  name: z.string().trim().min(1, "Product name is required."),
  introText: z.string().trim().min(1, "Intro text is required."),
  description: z.string().trim().min(1, "Description is required."),
  materials: z.array(materialSchema).min(1, "Add at least one material."),
  colors: z.array(colorVariantSchema).optional(),
  dimensions: z
    .array(dimensionSchema)
    .min(1, "Add at least one dimension.")
    .refine(
      (items) => {
        const labels = items
          .map((item) => item.label.trim().toLowerCase())
          .filter(Boolean);
        return new Set(labels).size === labels.length;
      },
      {
        message: "Duplicate dimension labels are not allowed in Dimensions and pricing.",
      },
    ),
  galleryImages: z.array(z.string().trim().min(1)).optional(),
  favorite: z.boolean().optional(),
  details: z.array(detailSectionSchema).optional(),
  dimensionsInfo: z.object({
    material: z.string().trim().optional(),
    finish: z.string().trim().optional(),
    dimensions: z.string().trim().optional(),
    weight: z.string().trim().optional(),
  }).optional(),
});

export type ProductPayload = z.infer<typeof productSchema>;
export type ColorVariantInput = z.infer<typeof colorVariantSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type DimensionInput = z.infer<typeof dimensionSchema>;
export type DetailSectionInput = z.infer<typeof detailSectionSchema>;

export interface ProductItem {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  slug: string;
  imageUrl: string;
  order: number | null;
  favorite: boolean;
  favoriteOrder: number | null;
  materialCount: number;
  dimensionCount: number;
  startingPrice: number;
  updatedAt: Date;
}

export interface DimensionsInfo {
  material: string;
  finish: string;
  dimensions: string;
  weight: string;
}

export interface ProductDetail {
  id: string;
  imageUrl: string;
  collectionId: string;
  name: string;
  introText: string;
  description: string;
  slug: string;
  favorite: boolean;
  colors: ColorVariantInput[];
  materials: MaterialInput[];
  dimensions: DimensionInput[];
  galleryImages: string[];
  details: DetailSectionInput[];
  dimensionsInfo: DimensionsInfo;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

let productsIndexesPromise: Promise<any> | undefined;

export async function getProductsCollection(): Promise<Collection<Document>> {
  const database = await getDatabase();
  const collection = database.collection("products");

  if (!productsIndexesPromise) {
    productsIndexesPromise = Promise.all([
      collection.createIndex({ slug: 1 }, { unique: true }),
      collection.createIndex({ name: 1 }),
      collection.createIndex({ updatedAt: -1 }),
    ]).catch((err) => {
      console.error("Failed to create products indexes:", err);
    });
  }
  await productsIndexesPromise;

  return collection;
}

async function buildUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const collection = await getProductsCollection();
  const baseSlug = slugify(name) || "product";
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await collection.findOne(
      excludeId
        ? { slug, _id: { $ne: new ObjectId(excludeId) } }
        : { slug },
      { projection: { _id: 1 } },
    );

    if (!existing) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function listProducts(): Promise<ProductItem[]> {
  const collection = await getProductsCollection();
  const products = await collection
    .find(
      {},
      {
        projection: {
          collectionId: 1,
          collectionName: 1,
          name: 1,
          slug: 1,
          imageUrl: 1,
          materials: 1,
          dimensions: 1,
          order: 1,
          favorite: 1,
          favoriteOrder: 1,
          updatedAt: 1,
        },
      },
    )
    .sort({ updatedAt: -1, _id: -1 })
    .toArray();

  return products.map((product) => ({
    id: product._id.toString(),
    collectionId: product.collectionId ?? "",
    collectionName: product.collectionName ?? "",
    name: product.name,
    slug: product.slug,
    imageUrl: product.imageUrl,
    order: product.order ?? null,
    favorite: product.favorite ?? false,
    favoriteOrder: product.favoriteOrder ?? null,
    materialCount: Array.isArray(product.materials) ? product.materials.length : 0,
    dimensionCount: Array.isArray(product.dimensions) ? product.dimensions.length : 0,
    startingPrice:
      Array.isArray(product.dimensions) && product.dimensions.length
        ? Math.min(...product.dimensions.map((dimension: any) => Number(dimension.price) || 0))
        : 0,
    updatedAt: product.updatedAt ?? product._id.getTimestamp(),
  }));
}

export async function getProductById(productId: string): Promise<ProductDetail | null> {
  if (!ObjectId.isValid(productId)) {
    return null;
  }

  const collection = await getProductsCollection();
  const product = await collection.findOne({ _id: new ObjectId(productId) });

  if (!product) {
    return null;
  }

  let colors: ColorVariantInput[] = [];
  if (Array.isArray(product.colors) && product.colors.length > 0) {
    colors = product.colors.map((c: any) => ({
      id: c.id || `color-${Math.random().toString(36).slice(2, 8)}`,
      name: c.name || "",
      image: c.image || "",
      galleryImages: Array.isArray(c.galleryImages) ? c.galleryImages : [],
    }));
  }

  return {
    id: product._id.toString(),
    imageUrl: product.imageUrl || colors.flatMap((c: any) => c.galleryImages || [])[0] || colors[0]?.image || "",
    collectionId: product.collectionId ?? "",
    name: product.name ?? "",
    introText: product.introText ?? "",
    description: product.description ?? "",
    slug: product.slug ?? "",
    favorite: product.favorite ?? false,
    colors,
    materials: Array.isArray(product.materials) ? product.materials : [],
    dimensions: Array.isArray(product.dimensions) ? product.dimensions : [],
    galleryImages: Array.isArray(product.galleryImages)
      ? product.galleryImages
      : colors.flatMap((c) => c.galleryImages),
    details: Array.isArray(product.details) ? product.details : [],
    dimensionsInfo: product.dimensionsInfo ?? {
      material: "",
      finish: "",
      dimensions: "",
      weight: "",
    },
    createdAt: product.createdAt ?? null,
    updatedAt: product.updatedAt ?? null,
  };
}

export async function createProduct(input: unknown): Promise<{ id: string; slug: string }> {
  const payload = productSchema.parse(input);
  const collectionSummary = await findCollectionSummaryById(payload.collectionId);

  if (!collectionSummary) {
    throw new Error("Selected collection does not exist.");
  }

  const collection = await getProductsCollection();
  const slug = await buildUniqueSlug(payload.name);
  const now = new Date();

  const maxOrderDoc = await collection.findOne(
    { collectionId: collectionSummary.id },
    { sort: { order: -1 }, projection: { order: 1 } }
  );
  const nextOrder = maxOrderDoc && typeof maxOrderDoc.order === "number"
    ? maxOrderDoc.order + 1
    : 0;

  const colors = payload.colors || [];
  const allGalleryImages = colors.flatMap((c) => c.galleryImages || []);
  const mainImage = (payload.imageUrl && payload.imageUrl.trim()) || allGalleryImages[0] || colors[0]?.image || "";

  const document = {
    imageUrl: mainImage,
    collectionId: collectionSummary.id,
    collectionName: collectionSummary.name,
    collectionSlug: collectionSummary.slug,
    name: payload.name,
    introText: payload.introText,
    description: payload.description,
    slug,
    order: nextOrder,
    favorite: payload.favorite ?? false,
    materials: payload.materials,
    colors,
    dimensions: payload.dimensions,
    galleryImages: allGalleryImages,
    details: payload.details || [],
    dimensionsInfo: payload.dimensionsInfo ?? {
      material: "",
      finish: "",
      dimensions: "",
      weight: "",
    },
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  return { id: result.insertedId.toString(), slug };
}

export async function updateProduct(productId: string, input: unknown): Promise<{ id: string; slug: string }> {
  const payload = productSchema.parse(input);
  const collectionSummary = await findCollectionSummaryById(payload.collectionId);

  if (!collectionSummary) {
    throw new Error("Selected collection does not exist.");
  }

  const collection = await getProductsCollection();
  const slug = await buildUniqueSlug(payload.name, productId);

  const existing = await collection.findOne({ _id: new ObjectId(productId) });

  let nextOrder = existing?.order;

  if (!existing || existing.collectionId !== collectionSummary.id || nextOrder === undefined || nextOrder === null) {
    const maxOrderDoc = await collection.findOne(
      { collectionId: collectionSummary.id },
      { sort: { order: -1 }, projection: { order: 1 } }
    );
    nextOrder = maxOrderDoc && typeof maxOrderDoc.order === "number"
      ? maxOrderDoc.order + 1
      : 0;
  }

  const colors = payload.colors || [];
  const allGalleryImages = colors.flatMap((c) => c.galleryImages || []);
  const mainImage = (payload.imageUrl && payload.imageUrl.trim()) || allGalleryImages[0] || colors[0]?.image || "";

  // Collect previous images to detect any replaced or removed images
  const oldImages: string[] = [];
  if (existing?.imageUrl) oldImages.push(existing.imageUrl);
  if (Array.isArray(existing?.colors)) {
    for (const c of existing.colors) {
      if (c.image) oldImages.push(c.image);
      if (Array.isArray(c.galleryImages)) {
        for (const g of c.galleryImages) {
          if (g) oldImages.push(g);
        }
      }
    }
  }
  if (Array.isArray(existing?.galleryImages)) {
    for (const g of existing.galleryImages) {
      if (g) oldImages.push(g);
    }
  }
  if (Array.isArray(existing?.details)) {
    for (const d of existing.details) {
      if (d.imageUrl) oldImages.push(d.imageUrl);
    }
  }

  const newImages = new Set<string>();
  if (mainImage) newImages.add(mainImage);
  if (payload.imageUrl) newImages.add(payload.imageUrl);
  for (const c of colors) {
    if (c.image) newImages.add(c.image);
    if (Array.isArray(c.galleryImages)) {
      for (const g of c.galleryImages) {
        if (g) newImages.add(g);
      }
    }
  }
  if (Array.isArray(payload.details)) {
    for (const d of payload.details) {
      if (d.imageUrl) newImages.add(d.imageUrl);
    }
  }

  const replacedOrRemoved = oldImages.filter(
    (img) => !newImages.has(img) && img.includes("cloudinary.com")
  );

  if (replacedOrRemoved.length > 0) {
    deleteMultipleCloudinaryImages(replacedOrRemoved).catch((err) => {
      console.error("Failed to delete replaced Cloudinary images:", err);
    });
  }

  await collection.updateOne(
    { _id: new ObjectId(productId) },
    {
      $set: {
        imageUrl: mainImage,
        collectionId: collectionSummary.id,
        collectionName: collectionSummary.name,
        collectionSlug: collectionSummary.slug,
        name: payload.name,
        introText: payload.introText,
        description: payload.description,
        slug,
        order: nextOrder,
        favorite: payload.favorite ?? false,
        materials: payload.materials,
        colors,
        dimensions: payload.dimensions,
        galleryImages: allGalleryImages,
        details: payload.details || [],
        dimensionsInfo: payload.dimensionsInfo ?? {
          material: "",
          finish: "",
          dimensions: "",
          weight: "",
        },
        updatedAt: new Date(),
      },
    },
  );

  return { id: productId, slug };
}

export function parseProductPayload(formData: FormData): ProductPayload {
  const raw = formData.get("productPayload");

  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Product form payload is missing.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Product form payload is invalid.");
  }

  return productSchema.parse(parsed);
}

export async function updateProductsOrder(orderedIds: string[]): Promise<void> {
  const collection = await getProductsCollection();

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new ObjectId(id) },
      update: { $set: { order: index, updatedAt: new Date() } },
    },
  }));

  if (bulkOps.length > 0) {
    await collection.bulkWrite(bulkOps);
  }
}

export async function toggleProductFavorite(productId: string, favoriteStatus: boolean): Promise<void> {
  const collection = await getProductsCollection();

  if (favoriteStatus) {
    const maxFavDoc = await collection.findOne(
      { favorite: true },
      { sort: { favoriteOrder: -1 }, projection: { favoriteOrder: 1 } }
    );
    const nextFavOrder = maxFavDoc && typeof maxFavDoc.favoriteOrder === "number"
      ? maxFavDoc.favoriteOrder + 1
      : 0;

    await collection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { favorite: true, favoriteOrder: nextFavOrder, updatedAt: new Date() } }
    );
  } else {
    await collection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { favorite: false, favoriteOrder: null, updatedAt: new Date() } }
    );
  }
}

export async function updateFavoriteProductsOrder(orderedIds: string[]): Promise<void> {
  const collection = await getProductsCollection();

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new ObjectId(id) },
      update: { $set: { favoriteOrder: index, updatedAt: new Date() } },
    },
  }));

  if (bulkOps.length > 0) {
    await collection.bulkWrite(bulkOps);
  }
}
