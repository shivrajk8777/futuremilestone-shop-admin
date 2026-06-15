import { notFound } from "next/navigation";
import DiscountForm from "../DiscountForm";
import { updateDiscountAction } from "../actions";
import { listCollectionsForSelect } from "../../../../lib/collections";
import { listProducts } from "../../../../lib/products";
import { getDiscountById } from "../../../../lib/discounts";

export default async function EditDiscountPage({ params }) {
  const { discountId } = await params;
  const [discount, collections, products] = await Promise.all([
    getDiscountById(discountId),
    listCollectionsForSelect(),
    listProducts(),
  ]);

  if (!discount) {
    notFound();
  }

  return (
    <DiscountForm
      action={updateDiscountAction.bind(null, discountId)}
      collections={collections}
      products={products}
      discount={discount}
      description="Modify promotional conditions, values, target scopes, and active live status."
      submitLabel="Save changes"
      title={`Edit ${discount.name}`}
    />
  );
}
