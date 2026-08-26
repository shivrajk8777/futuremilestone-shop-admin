import DiscountForm from "../DiscountForm";
import { createDiscountAction } from "../actions";
import { listCollectionsForSelect } from "../../../../lib/collections";
import { listProducts } from "../../../../lib/products";

export default async function NewDiscountPage() {
  const collections = await listCollectionsForSelect();
  const products = await listProducts();

  return (
    <DiscountForm
      action={createDiscountAction}
      collections={collections}
      products={products}
      description="Configure a new promotional campaign and select its active target scope."
      submitLabel="Create campaign"
      title="Add campaign"
    />
  );
}
