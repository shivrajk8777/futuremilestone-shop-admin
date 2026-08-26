import { listProductCarts } from "@/lib/carts";
import CartList from "./CartList";

export const revalidate = 0;

export default async function ActiveCartsPage() {
  const productGroups = await listProductCarts();

  return (
    <div className="space-y-4">
      <CartList productGroups={productGroups} />
    </div>
  );
}
