import { ObjectId } from "mongodb";
import { z } from "zod";
import { findCollectionSummaryById } from "./collections";
import { getDatabase } from "./mongodb";

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
  imageUrl: z.url("Enter a valid Cloudinary image URL."),
  collectionId: z.string().min(1, "Select a collection."),
  name: z.string().trim().min(1, "Product name is required."),
  introText: z.string().trim().min(1, "Intro text is required."),
  description: z.string().trim().min(1, "Description is required."),
  materials: z.array(materialSchema).min(1, "Add at least one material."),
  dimensions: z.array(dimensionSchema).min(1, "Add at least one dimension."),
  galleryImages: z.array(z.string().url()).optional(),
  favorite: z.boolean().optional(),
  details: z.array(detailSectionSchema).optional(),
});

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function getProductsCollection() {
  const database = await getDatabase();
  const collection = database.collection("products");

  await Promise.all([
    collection.createIndex({ slug: 1 }, { unique: true }),
    collection.createIndex({ name: 1 }),
    collection.createIndex({ updatedAt: -1 }),
  ]);

  return collection;
}

async function buildUniqueSlug(name, excludeId) {
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

export async function listProducts() {
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
        ? Math.min(...product.dimensions.map((dimension) => Number(dimension.price) || 0))
        : 0,
    updatedAt: product.updatedAt ?? product._id.getTimestamp(),
  }));
}

export async function getProductById(productId) {
  const collection = await getProductsCollection();
  const product = await collection.findOne({ _id: new ObjectId(productId) });

  if (!product) {
    return null;
  }

  return {
    id: product._id.toString(),
    imageUrl: product.imageUrl ?? "",
    collectionId: product.collectionId ?? "",
    name: product.name ?? "",
    introText: product.introText ?? "",
    description: product.description ?? "",
    slug: product.slug ?? "",
    favorite: product.favorite ?? false,
    materials: Array.isArray(product.materials) ? product.materials : [],
    dimensions: Array.isArray(product.dimensions) ? product.dimensions : [],
    galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages : [],
    details: Array.isArray(product.details) ? product.details : [],
    createdAt: product.createdAt ?? null,
    updatedAt: product.updatedAt ?? null,
  };
}

export async function createProduct(input) {
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

  const document = {
    imageUrl: payload.imageUrl,
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
    dimensions: payload.dimensions,
    galleryImages: payload.galleryImages || [],
    details: payload.details || [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  return { id: result.insertedId.toString(), slug };
}

export async function updateProduct(productId, input) {
  const payload = productSchema.parse(input);
  const collectionSummary = await findCollectionSummaryById(payload.collectionId);

  if (!collectionSummary) {
    throw new Error("Selected collection does not exist.");
  }

  const collection = await getProductsCollection();
  const slug = await buildUniqueSlug(payload.name, productId);

  const existing = await collection.findOne(
    { _id: new ObjectId(productId) },
    { projection: { collectionId: 1, order: 1 } }
  );

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

  await collection.updateOne(
    { _id: new ObjectId(productId) },
    {
      $set: {
        imageUrl: payload.imageUrl,
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
        dimensions: payload.dimensions,
        galleryImages: payload.galleryImages || [],
        details: payload.details || [],
        updatedAt: new Date(),
      },
    },
  );

  return { id: productId, slug };
}

export function parseProductPayload(formData) {
  const raw = formData.get("productPayload");

  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Product form payload is missing.");
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Product form payload is invalid.");
  }

  return productSchema.parse(parsed);
}

export async function updateProductsOrder(orderedIds) {
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

export async function toggleProductFavorite(productId, favoriteStatus) {
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

export async function updateFavoriteProductsOrder(orderedIds) {
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
