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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
            <div className="flex items-center gap-3">
              <svg width="34" height="27" viewBox="0 0 287 229" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-black">
                <path d="M87.8077 65.3935C115.406 66.2883 135.246 83.8697 142.855 92.6595C166.484 66.0782 199.642 63.2085 213.267 65.0964C269.597 72.4865 285.917 121.565 285.917 145.553V226.159C285.917 227.169 284.663 227.351 283.653 227.351H248.771C246.699 227.524 246.534 224.513 246.534 222.433V151.066C247.369 119.599 224.704 107.361 213.267 105.176C182.728 99.5964 166.239 122.082 163.198 140.605C162.064 147.509 162.994 154.579 162.994 161.575V223.687C162.994 224.738 162.916 226.247 162.152 226.968C161.448 227.634 160.716 227.5 159.747 227.5H125.102C123.431 227.5 123.312 225.984 123.312 225.116V151.811C124.625 118.079 100.935 107.832 89.8962 105.299C88.106 105.001 87.8077 104.256 87.8077 103.835V65.3935Z" fill="currentColor"/>
                <path d="M0.5 74.8408C4.62763 22.5872 51.7228 0.168822 79.9038 0.503694C80.5642 0.511541 81.1784 0.785788 81.6454 1.25284C82.1351 1.74262 82.4089 2.40766 82.4061 3.10025L82.2635 38.4762C82.2621 38.8287 82.1214 39.1663 81.8722 39.4156C81.6422 39.6457 81.3275 39.7839 81.003 39.807C51.2199 41.9285 42.7099 63.4225 40.3363 76.0347C52.7754 67.4304 72.0744 64.9226 80.836 64.706C81.2644 64.6954 81.6638 64.9014 81.9128 65.2501C82.1395 65.5675 82.2613 65.9477 82.2613 66.3377V102.063C82.2613 102.696 82.0316 103.307 81.6149 103.784C81.3602 104.075 80.9887 104.252 80.6028 104.28C46.9871 106.723 39.344 134.365 39.7395 147.962V225.158C39.7395 225.971 39.3427 226.733 38.6766 227.2C38.3973 227.395 38.0646 227.5 37.7236 227.5H2.85894C2.29466 227.5 1.74405 227.326 1.28181 227.003C0.791816 226.66 0.5 226.099 0.5 225.501V74.8408Z" fill="currentColor"/>
              </svg>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight uppercase leading-none">FUTURE MILESTONE</h1>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mt-1">Scandinavian Furniture</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-3 max-w-xs leading-normal">
              108 Studio Lane, Industrial Area,<br/>
              Mumbai, MH, 400013<br/>
              info@futuremilestone.shop
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
