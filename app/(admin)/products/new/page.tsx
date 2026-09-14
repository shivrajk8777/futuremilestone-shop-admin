import ProductForm from "../ProductForm";
import { createProductAction } from "../actions";
import { listCollectionsForSelect } from "../../../../lib/collections";
import { getProductById, ProductDetail } from "../../../../lib/products";

export interface NewProductPageProps {
  searchParams: Promise<{
    duplicateFrom?: string;
  }>;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const { duplicateFrom } = (await searchParams) || {};
  const [collections, sourceProduct] = await Promise.all([
    listCollectionsForSelect(),
    duplicateFrom ? getProductById(duplicateFrom) : Promise.resolve(null),
  ]);

  let initialProduct: ProductDetail | null = null;
  if (sourceProduct) {
    initialProduct = {
      id: "",
      collectionId: sourceProduct.collectionId ?? "",
      name: sourceProduct.name ?? "",
      slug: "",
      introText: sourceProduct.introText ?? "",
      description: sourceProduct.description ?? "",
      imageUrl: "",
      galleryImages: [],
      favorite: false,
      materials: Array.isArray(sourceProduct.materials)
        ? sourceProduct.materials.map((m) => ({
            id: uid("material"),
            name: m.name ?? "",
            stock: Number(m.stock) || 0,
          }))
        : [],
      colors: Array.isArray(sourceProduct.colors)
        ? sourceProduct.colors.map((c) => ({
            id: uid("color"),
            name: c.name ?? "",
            image: "",
            galleryImages: [],
          }))
        : [],
      dimensions: Array.isArray(sourceProduct.dimensions)
        ? sourceProduct.dimensions.map((d) => ({
            id: uid("dimension"),
            label: d.label ?? "",
            price: Number(d.price) || 0,
          }))
        : [],
      details: Array.isArray(sourceProduct.details)
        ? sourceProduct.details.map((d) => ({
            id: uid("detail"),
            imageUrl: "",
            heading: d.heading ?? "",
            content: d.content ?? "",
          }))
        : [],
      dimensionsInfo: sourceProduct.dimensionsInfo ?? {
        material: "",
        finish: "",
        dimensions: "",
        weight: "",
      },
      createdAt: null,
      updatedAt: null,
    };
  }

  return (
    <ProductForm
      action={createProductAction}
      collections={collections}
      description={
        sourceProduct
          ? `Pre-filled with details copied from ${sourceProduct.name} (images excluded).`
          : "Create a product with the same core information shown on the storefront product detail page."
      }
      product={initialProduct}
      submitLabel="Create product"
      title={sourceProduct ? `Duplicate ${sourceProduct.name}` : "Add product"}
    />
  );
}
