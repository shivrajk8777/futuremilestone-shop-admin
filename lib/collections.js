import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDatabase } from "./mongodb";

const collectionSchema = z.object({
  imageUrl: z.url("Collection image is required."),
  name: z.string().trim().min(1, "Collection name is required."),
  description: z.string().trim().min(1, "Collection description is required."),
});

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function getCollectionsCollection() {
  const database = await getDatabase();
  const collection = database.collection("collections");

  await Promise.all([
    collection.createIndex({ slug: 1 }, { unique: true }),
    collection.createIndex({ name: 1 }),
    collection.createIndex({ updatedAt: -1 }),
  ]);

  return collection;
}

async function buildUniqueSlug(name, excludeId) {
  const collection = await getCollectionsCollection();
  const baseSlug = slugify(name) || "collection";
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

export async function listCollections() {
  const collection = await getCollectionsCollection();
  const rows = await collection
    .find(
      {},
      {
        projection: {
          name: 1,
          slug: 1,
          imageUrl: 1,
          description: 1,
          updatedAt: 1,
        },
      },
    )
    .sort({ updatedAt: -1, _id: -1 })
    .toArray();

  return rows.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    slug: item.slug,
    imageUrl: item.imageUrl,
    description: item.description,
    updatedAt: item.updatedAt ?? item._id.getTimestamp(),
  }));
}

export async function listCollectionsForSelect() {
  const collection = await getCollectionsCollection();
  const rows = await collection
    .find({}, { projection: { name: 1 } })
    .sort({ name: 1 })
    .toArray();

  return rows.map((item) => ({
    id: item._id.toString(),
    name: item.name,
  }));
}

export async function getCollectionById(collectionId) {
  const collection = await getCollectionsCollection();
  const item = await collection.findOne({ _id: new ObjectId(collectionId) });

  if (!item) {
    return null;
  }

  return {
    id: item._id.toString(),
    imageUrl: item.imageUrl ?? "",
    name: item.name ?? "",
    description: item.description ?? "",
    slug: item.slug ?? "",
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
  };
}

export async function findCollectionSummaryById(collectionId) {
  const collection = await getCollectionsCollection();
  const item = await collection.findOne(
    { _id: new ObjectId(collectionId) },
    { projection: { name: 1, slug: 1 } },
  );

  if (!item) {
    return null;
  }

  return {
    id: item._id.toString(),
    name: item.name,
    slug: item.slug,
  };
}

export async function createCollection(input) {
  const payload = collectionSchema.parse(input);
  const collection = await getCollectionsCollection();
  const slug = await buildUniqueSlug(payload.name);
  const now = new Date();

  const result = await collection.insertOne({
    imageUrl: payload.imageUrl,
    name: payload.name,
    description: payload.description,
    slug,
    createdAt: now,
    updatedAt: now,
  });

  return { id: result.insertedId.toString(), slug };
}

export async function updateCollection(collectionId, input) {
  const payload = collectionSchema.parse(input);
  const collection = await getCollectionsCollection();
  const slug = await buildUniqueSlug(payload.name, collectionId);

  await collection.updateOne(
    { _id: new ObjectId(collectionId) },
    {
      $set: {
        imageUrl: payload.imageUrl,
        name: payload.name,
        description: payload.description,
        slug,
        updatedAt: new Date(),
      },
    },
  );

  return { id: collectionId, slug };
}

export function parseCollectionPayload(formData) {
  const raw = formData.get("collectionPayload");

  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Collection form payload is missing.");
  }

  try {
    return collectionSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Collection form payload is invalid.");
    }

    throw error;
  }
}
