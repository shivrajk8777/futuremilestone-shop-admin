import {
  PageHeader,
  PageSection,
} from "../../../../components/admin/Sections";
import { getOrder, updateOrderStatus } from "../../../../lib/orders";
import { formatOrderPrice } from "../../../../lib/formatOrderPrice";
import { getDatabase } from "../../../../lib/mongodb";
import { trackShipment } from "../../../../lib/tracking-providers";
import OrderActions from "./OrderActions";
import StatusDropdown from "../StatusDropdown";

function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export interface OrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  // Retrieve live tracking details server-side if trackingId is present
  let tracking: any = null;
  if (order && order.trackingId) {
    try {
      const dispatchEntry = (order.statusTimeline || []).find(
        (t) => t.status === "Dispatched" || t.status === "Shipped"
      );
      const dispatchTime = dispatchEntry ? new Date(dispatchEntry.timestamp) : new Date(order.updatedAt || order.createdAt || Date.now());
      tracking = await trackShipment(order.deliveryPartnerCode || "", order.trackingId, dispatchTime);

      if (tracking && tracking.status) {
        const trackingStatus = tracking.status.trim();
        const isDelivered = trackingStatus.toLowerCase() === "delivered";
        const isOutForDelivery = trackingStatus.toLowerCase() === "out for delivery";

        if (isDelivered && order.status !== "Delivered") {
          await updateOrderStatus(orderId, "Delivered", {
            comment: tracking.checkpoints?.[0]?.description || "Delivered according to carrier tracking.",
            sendToUser: true
          });
          order.status = "Delivered";
        } else if (isOutForDelivery && order.status !== "Delivered" && order.status !== "Out for Delivery") {
          await updateOrderStatus(orderId, "Out for Delivery", {
            comment: tracking.checkpoints?.[0]?.description || "Out for delivery with courier.",
            sendToUser: false
          });
          order.status = "Out for Delivery";
        }
      }
    } catch (e) {
      console.error("Failed to load live tracking info for admin page:", e);
    }
  }

  // Fetch product IDs for items to link to their detail pages
  let productMap: Record<string, string> = {};
  if (order && order.items && order.items.length > 0) {
    try {
      const db = await getDatabase();
      const itemSlugs = order.items.map((item) => item.slug).filter(Boolean);
      const products = await db.collection("products").find({ slug: { $in: itemSlugs } }).toArray();
      productMap = products.reduce((acc: Record<string, string>, p: any) => {
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
        <PageSection title="Error details">
          <div className="py-12 text-center text-futuremilestone-muted">
            <p className="text-[14px]">Please double-check the order URL or return to the order queue.</p>
          </div>
        </PageSection>
      </>
    );
  }

  // Calculate pricing breakdown in purchased currency
  const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);


  return (
    <>
      <PageHeader
        eyebrow="Order Fulfillment"
        title={order.orderNumber}
        description={`Placed on ${formatDate(order.createdAt)}`}
        actions={[{ label: "Back to Orders", kind: "secondary", href: "/orders" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)] gap-3 mt-1">
        {/* Left Column: Ordered Items and Customer & Delivery */}
        <div className="space-y-3">
          <PageSection
            title="Ordered Items"
            description="Products purchased in this order transaction."
          >
            <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[24px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-futuremilestone-soft-line bg-futuremilestone-bg/10 text-futuremilestone-muted uppercase tracking-wider text-[11px] font-semibold">
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Details</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-futuremilestone-soft-line/60">
                    {order.items.map((item) => {
                      const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://futuremilestone.shop';
                      const storeProductUrl = item.slug ? `${STORE_URL}/shop/${item.slug}` : '#';

                      return (
                        <tr
                          key={`${item.slug}-${item.material}-${item.dimension}`}
                          className="hover:bg-futuremilestone-accent/2 transition-colors"
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
                                    className="w-9 h-9 rounded-lg object-cover bg-futuremilestone-ink/8 border border-futuremilestone-soft-line flex-shrink-0 cursor-pointer"
                                    src={item.image}
                                  />
                                </a>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-futuremilestone-ink/8 border border-futuremilestone-soft-line grid place-items-center text-futuremilestone-muted text-[10px] flex-shrink-0">
                                  No img
                                </div>
                              )}
                              <a
                                href={storeProductUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View on website"
                                className="font-semibold text-futuremilestone-ink line-clamp-1 hover:underline cursor-pointer"
                              >
                                {item.name}
                              </a>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-futuremilestone-muted text-[12px] capitalize">
                            {item.material} • {item.dimension}
                          </td>
                          <td className="px-5 py-3 text-futuremilestone-muted">{formatOrderPrice(item.price, order.currencySymbol, order.currency)}</td>
                          <td className="px-5 py-3 text-futuremilestone-ink font-semibold">{item.quantity}</td>
                          <td className="px-5 py-3 text-right font-semibold text-futuremilestone-ink">
                            {formatOrderPrice(item.price * item.quantity, order.currencySymbol, order.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </PageSection>

          <PageSection title="Customer & Delivery">
            <div className="space-y-3 text-[13px] text-futuremilestone-ink">
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-futuremilestone-muted">Customer Email</span>
                <span className="font-semibold">{order.customerEmail}</span>
              </div>

              {order.shippingAddress ? (
                <div className="border-t border-futuremilestone-soft-line pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-futuremilestone-muted">Shipping Location</span>
                    {order.shippingAddress.label && (
                      <span className="px-1.5 py-0.5 bg-futuremilestone-accent-soft text-futuremilestone-ink text-[9px] font-bold uppercase tracking-wider rounded border border-futuremilestone-soft-line">
                        {order.shippingAddress.label}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-futuremilestone-muted block text-[11px]">Recipient</span>
                    <span className="font-semibold block">
                      {order.shippingAddress.name || order.shippingAddress.fullName || order.customerName || "Customer"}
                    </span>
                  </div>
                  <div>
                    <span className="text-futuremilestone-muted block text-[11px]">Street Address</span>
                    <span className="font-medium block leading-relaxed">
                      {order.shippingAddress.addressLine ||
                        [
                          order.shippingAddress.flat,
                          order.shippingAddress.area,
                          order.shippingAddress.landmark ? `Near ${order.shippingAddress.landmark}` : "",
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                          order.shippingAddress.pincode,
                          order.shippingAddress.country,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                        "Address details provided"}
                    </span>
                  </div>
                  {order.shippingAddress.phone && (
                    <div>
                      <span className="text-futuremilestone-muted block text-[11px]">Phone Number</span>
                      <span className="font-semibold block">{order.shippingAddress.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-futuremilestone-soft-line pt-3 text-futuremilestone-muted italic">
                  No shipping address provided.
                </div>
              )}
            </div>
          </PageSection>
        </div>

        {/* Right Column: Actions and Payment Summary */}
        <div className="space-y-3">
          <PageSection title="Fulfillment & Actions">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-futuremilestone-soft-line/60 pb-3">
                <span className="text-[13px] text-futuremilestone-muted">Current status:</span>
                <StatusDropdown orderId={order.id} currentStatus={order.status} />
              </div>

              {order.trackingId && (
                <div className="text-[13px] space-y-3.5 border-b border-futuremilestone-soft-line/60 pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-futuremilestone-muted">Delivery Partner</span>
                      <span className="font-semibold text-futuremilestone-ink flex items-center gap-1">
                        ✈️ {order.deliveryPartnerName || "Standard Shipping"}
                      </span>
                    </div>
                    {tracking && (
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] uppercase font-extrabold tracking-wider border ${tracking.status === "Delivered"
                          ? "bg-futuremilestone-success/12 text-futuremilestone-success border-futuremilestone-success/20"
                          : tracking.status === "Out for Delivery"
                            ? "bg-[#9b6b2b]/12 text-[#9b6b2b] border-[#9b6b2b]/20"
                            : "bg-futuremilestone-accent-soft text-futuremilestone-ink border-futuremilestone-soft-line"
                        }`}>
                        {tracking.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-futuremilestone-muted">Tracking ID</span>
                    <span className="font-mono font-semibold text-futuremilestone-ink select-all">{order.trackingId}</span>
                  </div>

                  {/* Timeline segment inside admin order view */}
                  {tracking && tracking.checkpoints && tracking.checkpoints.length > 0 && (
                    <div className="bg-futuremilestone-panel/80 p-3.5 border border-futuremilestone-soft-line rounded-2xl space-y-3 mt-1.5">
                      <span className="block text-[9px] uppercase font-bold text-futuremilestone-muted tracking-wider">Live Checkpoint Scans</span>
                      <div className="relative border-l border-futuremilestone-soft-line pl-3 space-y-3.5 ml-1 py-1 max-h-[220px] overflow-y-auto">
                        {tracking.checkpoints.map((cp: any, idx: number) => {
                          const isLatest = idx === 0;
                          return (
                            <div key={idx} className="relative">
                              <div className={`absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border bg-futuremilestone-panel ${isLatest ? "border-futuremilestone-accent bg-futuremilestone-accent" : "border-futuremilestone-muted bg-futuremilestone-panel-strong"
                                }`} />
                              <div className="text-[11.5px]">
                                <span className={`font-semibold block ${isLatest ? "text-futuremilestone-ink" : "text-futuremilestone-muted"}`}>{cp.description}</span>
                                <span className="text-[9.5px] text-futuremilestone-muted block mt-0.5"> {cp.location}</span>
                                <span className="text-[9px] text-futuremilestone-muted/70 block mt-0.5">
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
                          className="w-full text-center block py-2 border border-futuremilestone-soft-line hover:border-futuremilestone-ink/20 hover:bg-futuremilestone-panel rounded-xl text-[11px] font-semibold text-futuremilestone-ink transition-all mt-1"
                        >
                          View on DHL Portal ↗
                        </a>
                      )}
                    </div>
                  )}

                  {order.adminMessage && (
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-futuremilestone-muted">Latest Update Msg</span>
                      <span className="text-futuremilestone-muted italic">"{order.adminMessage}"</span>
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

          <PageSection title="Payment Details">
            <div className="space-y-2 text-[13px] font-semibold text-futuremilestone-ink">
              <div className="flex justify-between items-center pb-2 border-b border-futuremilestone-soft-line/60">
                <span className="text-futuremilestone-muted font-normal">Payment Method</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-futuremilestone-ink/6 border border-futuremilestone-soft-line">
                  💳 {order.paymentMethod || "Online"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-futuremilestone-soft-line/60">
                <span className="text-futuremilestone-muted font-normal">Transaction ID</span>
                <span className="font-mono text-[12px] font-semibold select-all text-futuremilestone-ink">
                  {order.transactionId || `TXN-${order.id.slice(-8).toUpperCase()}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-futuremilestone-muted font-normal">Subtotal</span>
                <span>{formatOrderPrice(subtotal, order.currencySymbol, order.currency)}</span>
              </div>
              <div className="flex justify-between text-[15px] font-bold border-t border-futuremilestone-soft-line pt-3 mt-1">
                <span>Grand Total</span>
                <span>{formatOrderPrice(order.total, order.currencySymbol, order.currency)}</span>
              </div>
            </div>
          </PageSection>
        </div>
      </div>
    </>
  );
}
