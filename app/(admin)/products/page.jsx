import {
  PageHeader,
  PageSection,
  StatGrid,
} from "../../../components/admin/Sections";
import { listProducts } from "../../../lib/products";
import ProductList from "./ProductList";

export default async function ProductsPage() {
  const products = await listProducts();
  const totalMaterials = products.reduce(
    (sum, product) => sum + product.materialCount,
    0,
  );
  const totalDimensions = products.reduce(
    (sum, product) => sum + product.dimensionCount,
    0,
  );
  const lowestPrice =
    products.length > 0
      ? Math.min(...products.map((product) => product.startingPrice))
      : 0;

  const stats = [
    {
      label: "Products",
      value: String(products.length),
      meta: products.length ? "Catalog entries available" : "No products created yet",
    },
    {
      label: "Materials",
      value: String(totalMaterials),
      meta: totalMaterials ? "Stock tracked per material" : "No materials added yet",
    },
    {
      label: "Dimensions",
      value: String(totalDimensions),
      meta: totalDimensions ? "Dimension pricing configured" : "No dimensions added yet",
    },
    {
      label: "Starting price",
      value: products.length
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(lowestPrice)
        : "--",
      meta: products.length ? "Lowest listed product price" : "No prices configured",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage inventory, pricing, media, and publishing status for your live product catalog."
        actions={[
          { label: "Sync ERP", kind: "secondary" },
          { label: "Add product", kind: "primary", href: "/products/new" },
        ]}
      />

      <PageSection>
        <StatGrid items={stats} />
      </PageSection>

      <PageSection
        title="Product inventory"
        description="Create and maintain products, their material stock, and dimension-based pricing."
      >
        <ProductList products={products} />
      </PageSection>
    </>
  );
}
