import { getOrder } from "../../../../lib/orders";
import { requireAdminSession } from "../../../../lib/auth/session";
import Link from "next/link";
import AutoPrintTrigger from "./AutoPrintTrigger";

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

export default async function OrderChallanPage({ params }) {
  await requireAdminSession();
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    return (
      <div className="min-h-screen grid place-items-center bg-white p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-red-500 mb-2">Challan Not Found</h1>
          <p className="text-sm text-gray-500 mb-4">The order details could not be loaded.</p>
          <Link href="/orders" className="text-xs font-semibold underline text-gray-800">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 15;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans select-text relative">
      <AutoPrintTrigger />

      {/* Header controls (no-print) */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-8 no-print">
        <Link
          href={`/orders/${order.id}`}
          className="rounded-full px-5 py-2 border border-gray-300 hover:border-black text-[12px] font-semibold transition"
        >
          ← Back to Order
        </Link>
        <button
          onClick="window.print()"
          className="rounded-full px-6 py-2 bg-black text-white font-semibold text-[12px] hover:opacity-90 transition cursor-pointer"
        >
          Print Challan
        </button>
      </div>

      {/* Challan Sheet */}
      <div className="max-w-[800px] mx-auto bg-white border border-gray-300 p-8 md:p-12 shadow-sm rounded-xl print:border-none print:shadow-none print:p-0">
        
        {/* Brand Header */}
        <div className="flex justify-between items-start gap-6 border-b-2 border-gray-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight uppercase">fjord</h1>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mt-0.5">Future Milestone Furniture</span>
            <p className="text-[11px] text-gray-500 mt-2 max-w-xs leading-normal">
              108 Studio Lane, Industrial Area,<br/>
              Mumbai, MH, 400013<br/>
              support@fjord.com
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">Delivery Challan</h2>
            <div className="text-[12px] text-gray-600 mt-2 space-y-1">
              <p><strong>Order No:</strong> {order.orderNumber}</p>
              <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
              <p><strong>Status:</strong> {order.status}</p>
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-gray-200 pb-6">
          <div>
            <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-2">Delivery Address</h3>
            {order.shippingAddress ? (
              <div className="text-[13px] leading-relaxed">
                <p className="font-bold text-gray-900">{order.shippingAddress.name}</p>
                <p className="text-gray-700 mt-1">{order.shippingAddress.addressLine}</p>
                {order.shippingAddress.phone && (
                  <p className="text-gray-600 mt-1"><strong>Phone:</strong> {order.shippingAddress.phone}</p>
                )}
                {order.shippingAddress.label && (
                  <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] uppercase font-semibold rounded mt-2">
                    {order.shippingAddress.label}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-gray-500 italic">No delivery address provided.</p>
            )}
          </div>

          <div>
            <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-2">Tracking & Shipment</h3>
            <div className="text-[13px] space-y-1.5">
              <p><strong>Customer Email:</strong> {order.customerEmail}</p>
              {order.trackingId ? (
                <>
                  <p><strong>Carrier:</strong> {order.deliveryPartnerName || 'Standard Shipping'}</p>
                  <p><strong>Tracking ID:</strong> <span className="font-mono text-sm bg-gray-50 border border-gray-200 px-1 rounded">{order.trackingId}</span></p>
                </>
              ) : (
                <p className="text-gray-500 italic">Not dispatched yet</p>
              )}
              {order.adminMessage && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-[11px]">
                  <strong>Admin Note:</strong><br/>
                  <span className="text-gray-700 mt-1 block">{order.adminMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="mb-8">
          <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-3">Order Specification</h3>
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-700 font-bold">
                <th className="py-2.5">Item Specification</th>
                <th className="py-2.5">Details</th>
                <th className="py-2.5 text-right">Price</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={`${item.slug}-${item.material}-${item.dimension}`} className="align-top">
                  <td className="py-3 font-semibold text-gray-900">{item.name}</td>
                  <td className="py-3 text-gray-600 text-[12px] capitalize">
                    {item.material} &bull; {item.dimension}
                  </td>
                  <td className="py-3 text-right text-gray-600">{formatPrice(item.price)}</td>
                  <td className="py-3 text-center font-semibold text-gray-900">{item.quantity}</td>
                  <td className="py-3 text-right font-bold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <div className="w-full sm:w-[280px] space-y-2 text-[13px]">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 border-b border-gray-100 pb-2">
              <span>Shipping Fee</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-gray-600 border-b border-gray-100 pb-2">
              <span>GST / Taxes (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2">
              <span>Total Amount</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-gray-200 mt-12 pt-6 text-center text-[11px] text-gray-500 space-y-1">
          <p className="font-bold">Thank you for selecting Fjord Furniture.</p>
          <p>Please inspect the goods at the time of delivery. Report any issues within 48 hours.</p>
        </div>

      </div>

      {/* Print css */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
        }
      `}} />
    </div>
  );
}
