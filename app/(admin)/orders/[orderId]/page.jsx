import {
  PageHeader,
  PageSection,
} from "../../../../components/admin/Sections";
import { getOrder } from "../../../../lib/orders";
import { getDatabase } from "../../../../lib/mongodb";
import { trackShipment } from "../../../../lib/tracking-providers";
import OrderActions from "./OrderActions";
import StatusDropdown from "../StatusDropdown";
import Link from "next/link";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function OrderDetailsPage({ params }) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  // Retrieve live tracking details server-side if trackingId is present
  let tracking = null;
  if (order && order.trackingId) {
    try {
      const dispatchEntry = (order.statusTimeline || []).find(
        (t) => t.status === "Dispatched" || t.status === "Shipped"
      );
      const dispatchTime = dispatchEntry ? new Date(dispatchEntry.timestamp) : new Date(order.updatedAt || order.createdAt || Date.now());
      tracking = await trackShipment(order.deliveryPartnerCode || "", order.trackingId, dispatchTime);
    } catch (e) {
      console.error("Failed to load live tracking info for admin page:", e);
    }
  }

  // Fetch product IDs for items to link to their detail pages
  let productMap = {};
  if (order && order.items && order.items.length > 0) {
    try {
      const db = await getDatabase();
      const itemSlugs = order.items.map((item) => item.slug).filter(Boolean);
      const products = await db.collection("products").find({ slug: { $in: itemSlugs } }).toArray();
      productMap = products.reduce((acc, p) => {
        acc[p.slug] = p._id.toString();
        return acc;
      }, {});
    } catch (e) {
      console.error("Failed to map products for order details:", e);
    }
  }

  if (!order) {
    return (
      <>
        <PageHeader
          eyebrow="Error"
          title="Order Not Found"
          description="The order identifier does not exist or may have been deleted."
          actions={[{ label: "Back to Orders", kind: "secondary", href: "/orders" }]}
        />
        <PageSection>
          <div className="py-12 text-center text-fjord-muted">
            <p className="text-[14px]">Please double-check the order URL or return to the order queue.</p>
          </div>
        </PageSection>
      </>
    );
  }

  // Calculate pricing breakdown
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 15;
  const tax = Number((subtotal * 0.08).toFixed(2));

  return (
    <>
      <PageHeader
        eyebrow="Order Fulfillment"
        title={order.orderNumber}
        description={`Placed on ${formatDate(order.createdAt)}`}
        actions={[{ label: "Back to Orders", kind: "secondary", href: "/orders" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)] gap-3 mt-1">
        {/* Left Column: Ordered Items */}
        <div className="space-y-3">
          <PageSection
            title="Ordered Items"
            description="Products purchased in this order transaction."
          >
            <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-fjord-soft-line bg-fjord-bg/10 text-fjord-muted uppercase tracking-wider text-[11px] font-semibold">
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Details</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fjord-soft-line/60">
                    {order.items.map((item) => {
                      const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://futuremilestone.shop';
                      const storeProductUrl = item.slug ? `${STORE_URL}/shop/${item.slug}` : '#';

                      return (
                        <tr
                          key={`${item.slug}-${item.material}-${item.dimension}`}
                          className="hover:bg-fjord-accent/2 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <a
                                  href={storeProductUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View on website"
                                  className="hover:opacity-80 transition-opacity"
                                >
                                  <img
                                    alt={item.name}
                                    className="w-9 h-9 rounded-lg object-cover bg-fjord-ink/8 border border-fjord-soft-line flex-shrink-0 cursor-pointer"
                                    src={item.image}
                                  />
                                </a>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-fjord-ink/8 border border-fjord-soft-line grid place-items-center text-fjord-muted text-[10px] flex-shrink-0">
                                  No img
                                </div>
                              )}
                              <a
                                href={storeProductUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View on website"
                                className="font-semibold text-fjord-ink line-clamp-1 hover:underline cursor-pointer"
                              >
                                {item.name}
                              </a>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-fjord-muted text-[12px] capitalize">
                            {item.material} • {item.dimension}
                          </td>
                          <td className="px-5 py-3 text-fjord-muted">{formatPrice(item.price)}</td>
                          <td className="px-5 py-3 text-fjord-ink font-semibold">{item.quantity}</td>
                          <td className="px-5 py-3 text-right font-semibold text-fjord-ink">
                            {formatPrice(item.price * item.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </PageSection>
        </div>

        {/* Right Column: Customer, Shipping, and Payment Summary */}
        <div className="space-y-3">
          <PageSection title="Fulfillment & Actions">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-fjord-soft-line/60 pb-3">
                <span className="text-[13px] text-fjord-muted">Current status:</span>
                <StatusDropdown orderId={order.id} currentStatus={order.status} />
              </div>
              
              {order.trackingId && (
                <div className="text-[13px] space-y-3.5 border-b border-fjord-soft-line/60 pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-fjord-muted">Delivery Partner</span>
                      <span className="font-semibold text-fjord-ink flex items-center gap-1">
                        ✈️ {order.deliveryPartnerName || "Standard Shipping"}
                      </span>
                    </div>
                    {tracking && (
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] uppercase font-extrabold tracking-wider border ${
                        tracking.status === "Delivered"
                          ? "bg-fjord-success/12 text-fjord-success border-fjord-success/20"
                          : tracking.status === "Out for Delivery"
                            ? "bg-[#9b6b2b]/12 text-[#9b6b2b] border-[#9b6b2b]/20"
                            : "bg-fjord-accent-soft text-fjord-ink border-fjord-soft-line"
                      }`}>
                        {tracking.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-fjord-muted">Tracking ID</span>
                    <span className="font-mono font-semibold text-fjord-ink select-all">{order.trackingId}</span>
                  </div>

                  {/* Timeline segment inside admin order view */}
                  {tracking && tracking.checkpoints && tracking.checkpoints.length > 0 && (
                    <div className="bg-fjord-panel/80 p-3.5 border border-fjord-soft-line rounded-2xl space-y-3 mt-1.5">
                      <span className="block text-[9px] uppercase font-bold text-fjord-muted tracking-wider">Live Checkpoint Scans</span>
                      <div className="relative border-l border-fjord-soft-line pl-3 space-y-3.5 ml-1 py-1 max-h-[220px] overflow-y-auto">
                        {tracking.checkpoints.map((cp, idx) => {
                          const isLatest = idx === 0;
                          return (
                            <div key={idx} className="relative">
                              <div className={`absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border bg-fjord-panel ${
                                isLatest ? "border-fjord-accent bg-fjord-accent" : "border-fjord-muted bg-fjord-panel-strong"
                              }`} />
                              <div className="text-[11.5px]">
                                <span className={`font-semibold block ${isLatest ? "text-fjord-ink" : "text-fjord-muted"}`}>{cp.description}</span>
                                <span className="text-[9.5px] text-fjord-muted block mt-0.5">📍 {cp.location}</span>
                                <span className="text-[9px] text-fjord-muted/70 block mt-0.5">
                                  {new Intl.DateTimeFormat("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false
                                  }).format(new Date(cp.timestamp))}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {tracking.trackingUrl && (
                        <a
                          href={tracking.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-center block py-2 border border-fjord-soft-line hover:border-fjord-ink/20 hover:bg-fjord-panel rounded-xl text-[11px] font-semibold text-fjord-ink transition-all mt-1"
                        >
                          View on DHL Portal ↗
                        </a>
                      )}
                    </div>
                  )}

                  {order.adminMessage && (
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-fjord-muted">Latest Update Msg</span>
                      <span className="text-fjord-muted italic">"{order.adminMessage}"</span>
                    </div>
                  )}
                </div>
              )}

              <OrderActions
                orderId={order.id}
                orderNumber={order.orderNumber}
                currentStatus={order.status}
                customerEmail={order.customerEmail}
                customerName={order.customerName}
              />
            </div>
          </PageSection>

          <PageSection title="Customer & Delivery">
            <div className="space-y-3 text-[13px] text-fjord-ink">
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-fjord-muted">Customer Email</span>
                <span className="font-semibold">{order.customerEmail}</span>
              </div>

              {order.shippingAddress ? (
                <div className="border-t border-fjord-soft-line pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-fjord-muted">Shipping Location</span>
                    {order.shippingAddress.label && (
                      <span className="px-1.5 py-0.5 bg-fjord-accent-soft text-fjord-ink text-[9px] font-bold uppercase tracking-wider rounded border border-fjord-soft-line">
                        {order.shippingAddress.label}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-fjord-muted block text-[11px]">Recipient</span>
                    <span className="font-semibold block">{order.shippingAddress.name}</span>
                  </div>
                  <div>
                    <span className="text-fjord-muted block text-[11px]">Street Address</span>
                    <span className="font-medium block leading-relaxed">{order.shippingAddress.addressLine}</span>
                  </div>
                  {order.shippingAddress.phone && (
                    <div>
                      <span className="text-fjord-muted block text-[11px]">Phone Number</span>
                      <span className="font-semibold block">{order.shippingAddress.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-fjord-soft-line pt-3 text-fjord-muted italic">
                  No shipping address provided.
                </div>
              )}
            </div>
          </PageSection>

          <PageSection title="Payment Details">
            <div className="space-y-2 text-[13px] font-semibold text-fjord-ink">
              <div className="flex justify-between">
                <span className="text-fjord-muted font-normal">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fjord-muted font-normal">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fjord-muted font-normal">Taxes (8%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-[15px] font-bold border-t border-fjord-soft-line pt-3 mt-1">
                <span>Grand Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </PageSection>
        </div>
      </div>
    </>
  );
}
