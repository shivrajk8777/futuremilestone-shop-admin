import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { listProducts } from "@/lib/products";
import { listProductCarts } from "@/lib/carts";

export const revalidate = 0;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateVal: Date | string): string {
  const d = new Date(dateVal);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "dispatched":
    case "shipped":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "delivered":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "accepted":
    case "processing":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "cancelled":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    default:
      return "bg-futuremilestone-accent/10 text-futuremilestone-ink border-futuremilestone-soft-line";
  }
}

export default async function DashboardPage() {
  const [orders, products, cartGroups] = await Promise.all([
    listOrders(),
    listProducts(),
    listProductCarts(),
  ]);

  const totalRevenue = orders.reduce((sum, o) => {
    const val = typeof o.total === "number" ? o.total : Number(String(o.total).replace(/[^0-9.-]+/g, ""));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const cartTotalValue = cartGroups.reduce((sum, g) => sum + g.totalValue, 0);
  const activeCartCustomersCount = new Set(
    cartGroups.flatMap((g) => g.customers.map((c) => c.customerEmail))
  ).size;

  const recentOrders = orders.slice(0, 5);
  const topProducts = products.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* ── Dashboard Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line px-5 py-3.5 rounded-2xl shadow-futuremilestone-soft">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-futuremilestone-muted block">
            Store Operations
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-futuremilestone-ink leading-tight">
            Dashboard
          </h1>
          <p className="text-[11px] text-futuremilestone-muted font-medium mt-0.5">
            Real-time store performance, fulfillment orders, and catalog inventory overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="px-3.5 py-1.5 bg-futuremilestone-accent text-futuremilestone-bg text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer shadow-xs"
          >
            Manage Orders ({orders.length})
          </Link>
        </div>
      </div>

      {/* ── Real Live Metrics Cards Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="p-4 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-2xl shadow-futuremilestone-soft flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-futuremilestone-muted block">
              Total Net Revenue
            </span>
            <span className="text-xl font-extrabold tracking-tight text-futuremilestone-ink block mt-0.5">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-[10px] text-futuremilestone-muted font-semibold block mt-0.5">
              From {orders.length} store orders
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center text-base font-bold">
            💵
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-2xl shadow-futuremilestone-soft flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-futuremilestone-muted block">
              Orders Fulfilled
            </span>
            <span className="text-xl font-extrabold tracking-tight text-futuremilestone-ink block mt-0.5">
              {orders.length} Orders
            </span>
            <span className="text-[10px] text-futuremilestone-muted font-semibold block mt-0.5">
              {orders.filter((o) => ["dispatched", "shipped", "delivered"].includes(o.status.toLowerCase())).length} Dispatched / Delivered
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 grid place-items-center text-base font-bold">
            📦
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-2xl shadow-futuremilestone-soft flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-futuremilestone-muted block">
              Catalog Products
            </span>
            <span className="text-xl font-extrabold tracking-tight text-futuremilestone-ink block mt-0.5">
              {products.length} Products
            </span>
            <span className="text-[10px] text-futuremilestone-muted font-semibold block mt-0.5">
              Active in store catalog
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-futuremilestone-accent/10 text-futuremilestone-ink grid place-items-center text-base font-bold">
            🏷️
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-2xl shadow-futuremilestone-soft flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-futuremilestone-muted block">
              Cart Demand Value
            </span>
            <span className="text-xl font-extrabold tracking-tight text-futuremilestone-ink block mt-0.5">
              {formatCurrency(cartTotalValue)}
            </span>
            <span className="text-[10px] text-futuremilestone-muted font-semibold block mt-0.5">
              {activeCartCustomersCount} customers with items in cart
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 grid place-items-center text-base font-bold">
            🛒
          </div>
        </div>
      </div>

      {/* ── Main Working Grid (Recent Orders & Live Catalog) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders Section */}
        <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-2xl p-4 shadow-futuremilestone-soft space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-futuremilestone-ink">Recent Orders</h2>
              <p className="text-[11px] text-futuremilestone-muted font-medium">Latest incoming purchases and status</p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-futuremilestone-ink underline hover:opacity-80 transition"
            >
              View all orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-futuremilestone-muted bg-futuremilestone-bg/30 rounded-xl border border-futuremilestone-soft-line">
              No orders placed yet.
            </div>
          ) : (
            <div className="divide-y divide-futuremilestone-soft-line/40">
              {recentOrders.map((order) => {
                const totalNum = typeof order.total === "number" ? order.total : Number(String(order.total).replace(/[^0-9.-]+/g, ""));

                return (
                  <div
                    key={order.id}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-futuremilestone-bg/20 rounded-lg px-1 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono font-bold text-xs text-futuremilestone-ink hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <span
                          className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-futuremilestone-muted truncate mt-0.5">
                        {order.customerName} • {order.items.length} item(s)
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-extrabold text-xs text-futuremilestone-ink block">
                        {formatCurrency(isNaN(totalNum) ? 0 : totalNum)}
                      </span>
                      <span className="text-[10px] text-futuremilestone-muted block">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Store Catalog Watch */}
        <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-2xl p-4 shadow-futuremilestone-soft space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-futuremilestone-ink">Live Store Catalog</h2>
              <p className="text-[11px] text-futuremilestone-muted font-medium">Products currently active in catalog</p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-futuremilestone-ink underline hover:opacity-80 transition"
            >
              View catalog →
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-futuremilestone-muted bg-futuremilestone-bg/30 rounded-xl border border-futuremilestone-soft-line">
              No products found in catalog.
            </div>
          ) : (
            <div className="divide-y divide-futuremilestone-soft-line/40">
              {topProducts.map((product) => (
                <div
                  key={product.id}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-futuremilestone-bg/20 rounded-lg px-1 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-futuremilestone-bg overflow-hidden flex-shrink-0 border border-futuremilestone-soft-line">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-futuremilestone-ink truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-futuremilestone-muted truncate">
                        {product.collectionName || "Catalog"} • {product.materialCount} materials
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-extrabold text-xs text-futuremilestone-ink block">
                      {formatCurrency(product.startingPrice)}
                    </span>
                    <Link
                      href={`/products/${product.id}`}
                      className="text-[10px] font-bold text-futuremilestone-ink underline hover:opacity-80"
                    >
                      Edit →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
