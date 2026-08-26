import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export interface CartCustomerDetail {
  cartId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  material?: string;
  dimension?: string;
  quantity: number;
  price: number;
  totalValue: number;
  updatedAt: Date | string;
}

export interface ProductCartGroup {
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  totalQuantity: number;
  totalValue: number;
  customersCount: number;
  customers: CartCustomerDetail[];
}

export async function listProductCarts(): Promise<ProductCartGroup[]> {
  try {
    const db = await getDatabase();
    const cartsCollection = db.collection("carts");
    const usersCollection = db.collection("users");

    const cartDocs = await cartsCollection.find({}).sort({ updatedAt: -1 }).toArray();

    if (cartDocs.length === 0) {
      return [];
    }

    const userIds = cartDocs.map((c) => c.userId).filter(Boolean);
    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .toArray();

    const userMap = new Map<string, any>();
    users.forEach((u) => {
      userMap.set(u._id.toString(), u);
    });

    const productMap = new Map<string, ProductCartGroup>();

    for (const cartDoc of cartDocs) {
      const uIdStr = cartDoc.userId ? cartDoc.userId.toString() : "";
      const user = userMap.get(uIdStr);

      const itemsRaw = cartDoc.items || [];
      if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
        continue;
      }

      let customerName = user?.name || "Guest / Customer";
      let customerEmail = user?.email || "No email available";
      let customerPhone = user?.phone || "";
      let customerAddress = "";

      if (user?.address) {
        if (typeof user.address === "string") {
          customerAddress = user.address;
        } else if (typeof user.address === "object") {
          const addr = user.address;
          customerAddress = [
            addr.flat,
            addr.area,
            addr.landmark ? `Near ${addr.landmark}` : "",
            addr.city,
            addr.state,
            addr.pincode,
            addr.country,
          ]
            .filter(Boolean)
            .join(", ");
        }
      }

      for (const raw of itemsRaw) {
        const prod = raw.product || {};
        const slug = prod.slug || raw.slug || "product";
        const name = prod.name || raw.name || "Untitled Product";
        const price = Number(prod.price || raw.price || 0);
        const quantity = Number(raw.quantity || 1);
        const material = prod.selectedMaterial || raw.selectedMaterial || prod.material || "Standard";
        const dimension = prod.selectedDimension || raw.selectedDimension || prod.dimension || "Standard";
        const image = prod.imageUrl || prod.images?.[0] || prod.image || raw.image || "/images/placeholder.webp";
        const rowTotal = price * quantity;

        const customerDetail: CartCustomerDetail = {
          cartId: cartDoc._id.toString(),
          userId: uIdStr,
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          material,
          dimension,
          quantity,
          price,
          totalValue: rowTotal,
          updatedAt: cartDoc.updatedAt || new Date(),
        };

        if (productMap.has(slug)) {
          const group = productMap.get(slug)!;
          group.totalQuantity += quantity;
          group.totalValue += rowTotal;
          group.customers.push(customerDetail);
          group.customersCount = group.customers.length;
        } else {
          productMap.set(slug, {
            slug,
            name,
            image,
            unitPrice: price,
            totalQuantity: quantity,
            totalValue: rowTotal,
            customersCount: 1,
            customers: [customerDetail],
          });
        }
      }
    }

    return Array.from(productMap.values());
  } catch (error) {
    console.error("Failed to fetch product-based active carts:", error);
    return [];
  }
}
