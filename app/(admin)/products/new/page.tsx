import ProductForm from "../ProductForm";
import { createProductAction } from "../actions";
import { listCollectionsForSelect } from "../../../../lib/collections";

export default async function NewProductPage() {
  const collections = await listCollectionsForSelect();

  return (
    <ProductForm
      action={createProductAction}
      collections={collections}
      description="Create a product with the same core information shown on the storefront product detail page."
      submitLabel="Create product"
      title="Add product"
    />
  );
}
