import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";
import { updateProductAction } from "../actions";
import { listCollectionsForSelect } from "../../../../lib/collections";
import { getProductById } from "../../../../lib/products";

export default async function EditProductPage({ params }) {
  const { productId } = await params;
  const [product, collections] = await Promise.all([
    getProductById(productId),
    listCollectionsForSelect(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      action={updateProductAction.bind(null, productId)}
      collections={collections}
      description="Update product details, material stock, and size-based pricing."
      product={product}
      submitLabel="Save changes"
      title={`Edit ${product.name}`}
    />
  );
}
