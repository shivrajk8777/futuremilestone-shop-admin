import { getDatabase } from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import DeliveryPartnerForm from "../../DeliveryPartnerForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditDeliveryPartnerPage({ params }) {
  const { id } = await params;
  
  let partner = null;
  try {
    const db = await getDatabase();
    const doc = await db.collection("delivery_partners").findOne({ _id: new ObjectId(id) });
    if (doc) {
      partner = {
        id: doc._id.toString(),
        name: doc.name ?? "",
        code: doc.code ?? "",
        transitTime: doc.transitTime ?? "",
        price: doc.price ?? 0,
        active: doc.active !== false,
        logo: doc.logo ?? "🚚",
      };
    }
  } catch (err) {
    console.error(err);
  }

  if (!partner) {
    notFound();
  }

  return <DeliveryPartnerForm partner={partner} isEdit />;
}
