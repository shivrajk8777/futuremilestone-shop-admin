import { Collection, Document, ObjectId } from "mongodb";
import { z } from "zod";
import { getDatabase } from "./mongodb";

const discountSchema = z.object({
  name: z.string().trim().min(1, "Discount name is required."),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().min(0.01, "Discount value must be greater than 0."),
  scope: z.enum(["all", "category", "products"]),
  collectionIds: z.array(z.string()).optional().default([]),
  productIds: z.array(z.string()).optional().default([]),
  active: z.boolean().default(true),
});

export type DiscountPayload = z.infer<typeof discountSchema>;

export interface DiscountItem {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  scope: "all" | "category" | "products";
  collectionIds: string[];
  productIds: string[];
  active: boolean;
  updatedAt: Date;
}

export interface DiscountDetail extends DiscountItem {
  createdAt: Date | null;
}

let discountsIndexesPromise: Promise<any> | undefined;

export async function getDiscountsCollection(): Promise<Collection<Document>> {
  const database = await getDatabase();
  const collection = database.collection("discounts");

  if (!discountsIndexesPromise) {
    discountsIndexesPromise = Promise.all([
      collection.createIndex({ name: 1 }),
      collection.createIndex({ active: 1 }),
      collection.createIndex({ updatedAt: -1 }),
    ]).catch((err) => {
      console.error("Failed to create discounts indexes:", err);
    });
  }
  await discountsIndexesPromise;

  return collection;
}

export async function listDiscounts(): Promise<DiscountItem[]> {
  const collection = await getDiscountsCollection();
  const discounts = await collection
    .find({})
    .sort({ updatedAt: -1, _id: -1 })
    .toArray();

  return discounts.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    type: item.type,
    value: item.value,
    scope: item.scope,
    collectionIds: item.collectionIds || [],
    productIds: item.productIds || [],
    active: !!item.active,
    updatedAt: item.updatedAt ?? item._id.getTimestamp(),
  }));
}

export async function getDiscountById(discountId: string): Promise<DiscountDetail | null> {
  const collection = await getDiscountsCollection();
  let objId: ObjectId;
  try {
    objId = new ObjectId(discountId);
  } catch {
    return null;
  }
  
  const discount = await collection.findOne({ _id: objId });
  if (!discount) {
    return null;
  }

  return {
    id: discount._id.toString(),
    name: discount.name ?? "",
    type: discount.type ?? "percentage",
    value: discount.value ?? 0,
    scope: discount.scope ?? "all",
    collectionIds: discount.collectionIds || [],
    productIds: discount.productIds || [],
    active: !!discount.active,
    createdAt: discount.createdAt ?? null,
    updatedAt: discount.updatedAt ?? null,
  };
}

export async function createDiscount(input: unknown): Promise<{ id: string }> {
  const payload = discountSchema.parse(input);
  const collection = await getDiscountsCollection();
  const now = new Date();

  const document = {
    name: payload.name,
    type: payload.type,
    value: payload.value,
    scope: payload.scope,
    collectionIds: payload.collectionIds,
    productIds: payload.productIds,
    active: payload.active,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  return { id: result.insertedId.toString() };
}

export async function updateDiscount(discountId: string, input: unknown): Promise<{ id: string }> {
  const payload = discountSchema.parse(input);
  const collection = await getDiscountsCollection();
  let objId: ObjectId;
  try {
    objId = new ObjectId(discountId);
  } catch {
    throw new Error("Invalid discount ID");
  }

  await collection.updateOne(
    { _id: objId },
    {
      $set: {
        name: payload.name,
        type: payload.type,
        value: payload.value,
        scope: payload.scope,
        collectionIds: payload.collectionIds,
        productIds: payload.productIds,
        active: payload.active,
        updatedAt: new Date(),
      },
    },
  );

  return { id: discountId };
}

export async function deleteDiscount(discountId: string): Promise<{ success: boolean }> {
  const collection = await getDiscountsCollection();
  let objId: ObjectId;
  try {
    objId = new ObjectId(discountId);
  } catch {
    throw new Error("Invalid discount ID");
  }

  await collection.deleteOne({ _id: objId });
  return { success: true };
}

export function parseDiscountPayload(formData: FormData): DiscountPayload {
  const raw = formData.get("discountPayload");

  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Discount form payload is missing.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Discount form payload is invalid.");
  }

  return discountSchema.parse(parsed);
}
