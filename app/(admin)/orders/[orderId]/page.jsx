import {
  PageHeader,
  PageSection,
} from "../../../../components/admin/Sections";
import { getOrder } from "../../../../lib/orders";
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function OrderDetailsPage({ params }) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

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
  const tax = Math.round(subtotal * 0.08);

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
                    {order.items.map((item) => (
                      <tr
                        key={`${item.slug}-${item.material}-${item.dimension}`}
                        className="hover:bg-fjord-accent/2 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                alt={item.name}
                                className="w-9 h-9 rounded-lg object-cover bg-fjord-ink/8 border border-fjord-soft-line flex-shrink-0"
                                src={item.image}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-fjord-ink/8 border border-fjord-soft-line grid place-items-center text-fjord-muted text-[10px] flex-shrink-0">
                                No img
                              </div>
                            )}
                            <span className="font-semibold text-fjord-ink line-clamp-1">{item.name}</span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </PageSection>
        </div>

        {/* Right Column: Customer, Shipping, and Payment Summary */}
        <div className="space-y-3">
          <PageSection title="Fulfillment Status">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-fjord-muted">Current status:</span>
              <StatusDropdown orderId={order.id} currentStatus={order.status} />
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
