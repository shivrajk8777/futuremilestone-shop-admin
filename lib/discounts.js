import { ObjectId } from "mongodb";
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

export async function getDiscountsCollection() {
  const database = await getDatabase();
  const collection = database.collection("discounts");

  await Promise.all([
    collection.createIndex({ name: 1 }),
    collection.createIndex({ active: 1 }),
    collection.createIndex({ updatedAt: -1 }),
  ]);

  return collection;
}

export async function listDiscounts() {
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

export async function getDiscountById(discountId) {
  const collection = await getDiscountsCollection();
  let objId;
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

export async function createDiscount(input) {
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

export async function updateDiscount(discountId, input) {
  const payload = discountSchema.parse(input);
  const collection = await getDiscountsCollection();
  let objId;
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

export async function deleteDiscount(discountId) {
  const collection = await getDiscountsCollection();
  let objId;
  try {
    objId = new ObjectId(discountId);
  } catch {
    throw new Error("Invalid discount ID");
  }

  await collection.deleteOne({ _id: objId });
  return { success: true };
}

export function parseDiscountPayload(formData) {
  const raw = formData.get("discountPayload");

  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Discount form payload is missing.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Discount form payload is invalid.");
  }

  return discountSchema.parse(parsed);
}
