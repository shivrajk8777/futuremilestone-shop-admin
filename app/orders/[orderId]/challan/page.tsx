import { getOrder } from "../../../../lib/orders";
import { formatOrderPrice } from "../../../../lib/formatOrderPrice";
import { requireAdminSession } from "../../../../lib/auth/session";
import Link from "next/link";
import AutoPrintTrigger, { PrintButton } from "./AutoPrintTrigger";

function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",

  }).format(new Date(value));
}

export interface OrderChallanPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderChallanPage({ params }: OrderChallanPageProps) {
  await requireAdminSession();
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-6 text-center text-gray-900">
        <div className="bg-white border border-gray-200 p-8 rounded-2xl max-w-md shadow-sm space-y-3">
          <h1 className="text-lg font-bold text-red-600">Challan Not Found</h1>
          <p className="text-xs text-gray-500">The order details could not be loaded from database.</p>
          <Link href="/orders" className="inline-block text-xs font-bold text-black underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const recipientName =
    order.shippingAddress?.name ||
    order.shippingAddress?.fullName ||
    order.customerName ||
    "Customer";

  const addressLine =
    order.shippingAddress?.addressLine ||
    [
      order.shippingAddress?.flat,
      order.shippingAddress?.area,
      order.shippingAddress?.landmark ? `Near ${order.shippingAddress.landmark}` : "",
      order.shippingAddress?.city,
      order.shippingAddress?.state,
      order.shippingAddress?.pincode,
      order.shippingAddress?.country,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Address details attached to order";

  const challanNo = `DC-${order.orderNumber.replace("#", "")}`;

  return (
    <div className="min-h-screen bg-gray-100 text-black p-4 md:p-8 font-sans select-text relative">
      <AutoPrintTrigger />

      {/* Top Header Controls (Hidden when printing) */}
      <div className="max-w-[850px] mx-auto flex items-center justify-between bg-white border border-gray-200 px-6 py-3.5 rounded-2xl shadow-sm mb-6 no-print">
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:border-black rounded-xl text-xs font-bold transition-all text-gray-800"
        >
          ← Back to Order Details
        </Link>
        <PrintButton />
      </div>

      {/* Printable Challan Sheet Container */}
      <div className="max-w-[850px] mx-auto bg-white border border-gray-300 p-8 md:p-12 shadow-sm rounded-2xl print:border-none print:shadow-none print:p-0 print:m-0">

        {/* Brand & Document Header */}
        <div className="flex justify-between items-start gap-6 border-b-2 border-black pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3">
              {/* <svg width="34" height="27" viewBox="0 0 287 229" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-black">
                <path d="M87.8077 65.3935C115.406 66.2883 135.246 83.8697 142.855 92.6595C166.484 66.0782 199.642 63.2085 213.267 65.0964C269.597 72.4865 285.917 121.565 285.917 145.553V226.159C285.917 227.169 284.663 227.351 283.653 227.351H248.771C246.699 227.5 246.534 224.513 246.534 222.433V151.066C247.369 119.599 224.704 107.361 213.267 105.176C182.728 99.5964 166.239 122.082 163.198 140.605C162.064 147.509 162.994 154.579 162.994 161.575V223.687C162.994 224.738 162.916 226.247 162.152 226.968C161.448 227.634 160.716 227.5 159.747 227.5H125.102C123.431 227.5 123.312 225.984 123.312 225.116V151.811C124.625 118.079 100.935 107.832 89.8962 105.299C88.106 105.001 87.8077 104.256 87.8077 103.835V65.3935Z" fill="currentColor" />
                <path d="M0.5 74.8408C4.62763 22.5872 51.7228 0.168822 79.9038 0.503694C80.5642 0.511541 81.1784 0.785788 81.6454 1.25284C82.1351 1.74262 82.4089 2.40766 82.4061 3.10025L82.2635 38.4762C82.2621 38.8287 82.1214 39.1663 81.8722 39.4156C81.6422 39.6457 81.3275 39.7839 81.003 39.807C51.2199 41.9285 42.7099 63.4225 40.3363 76.0347C52.7754 67.4304 72.0744 64.9226 80.836 64.706C81.2644 64.6954 81.6638 64.9014 81.9128 65.2501C82.1395 65.5675 82.2613 65.9477 82.2613 66.3377V102.063C82.2613 102.696 82.0316 103.307 81.6149 103.784C81.3602 104.075 80.9887 104.252 80.6028 104.28C46.9871 106.723 39.344 134.365 39.7395 147.962V225.158C39.7395 225.971 39.3427 226.733 38.6766 227.2C38.3973 227.395 38.0646 227.5 37.7236 227.5H2.85894C2.29466 227.5 1.74405 227.326 1.28181 227.003C0.791816 226.66 0.5 226.099 0.5 225.501V74.8408Z" fill="currentColor" />
              </svg> */}
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight uppercase leading-none">FUTURE MILESTONE</h1>
              </div>
            </div>
            <p className="text-[11px] text-gray-600 mt-3 leading-relaxed">
              A-50, Kanaram Nagar, Sikar Road, Jaipur Rajasthan India 302039<br />
              Email: info@futuremilestone.shop | Phone: +91-7073803090<br />
              Website : www.futuremilestone.shop
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">DELIVERY CHALLAN</h2>
            <div className="text-[12px] text-gray-700 mt-2 space-y-1">
              <p><strong>Challan No:</strong> <span className="font-mono font-bold">{challanNo}</span></p>
              <p><strong>Order Ref:</strong> <span className="font-mono font-bold">{order.orderNumber}</span></p>
              <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
              {/* <p>
                <strong>Status:</strong>{" "}
                <span className="uppercase font-extrabold text-[10px] px-2 py-0.5 rounded bg-gray-100 border border-gray-300">
                  {order.status}
                </span>
              </p> */}
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8 border-b border-gray-200 pb-6">

          {/* Consignee / Delivery Address */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 print:bg-gray-50">
            <h3 className="text-[10.5px] uppercase font-extrabold text-gray-500 tracking-wider mb-2 border-b border-gray-200 pb-1">
              Consignee & Delivery Destination
            </h3>
            <div className="text-[12.5px] space-y-1">
              <p className="font-bold text-gray-900 text-sm">{recipientName}</p>
              <p className="text-gray-700 leading-relaxed mt-1">{addressLine}</p>
              {order.shippingAddress?.phone && (
                <p className="text-gray-800 font-medium mt-1"> <strong>Phone:</strong> {order.shippingAddress.phone}</p>
              )}
              {order.customerEmail && (
                <p className="text-gray-600 text-[11.5px] mt-0.5"><strong>Email:</strong> {order.customerEmail}</p>
              )}
            </div>
          </div>

          {/* Dispatch & Carrier Information */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 print:bg-gray-50">
            <h3 className="text-[10.5px] uppercase font-extrabold text-gray-500 tracking-wider mb-2 border-b border-gray-200 pb-1">
              Logistics & Shipment Details
            </h3>
            <div className="text-[12.5px] space-y-1.5">
              <p><strong>Courier Partner:</strong> {order.deliveryPartnerName || "DHL"}</p>
              {order.trackingId ? (
                <p>
                  <strong>Tracking ID (AWB):</strong>{" "}
                  <span className="font-mono font-bold bg-white border border-gray-300 px-2 py-0.5 rounded text-indigo-900 text-xs">
                    {order.trackingId}
                  </span>
                </p>
              ) : (
                <p className="text-gray-500 italic text-[11.5px]">Waybill number pending assignment</p>
              )}
              <p><strong>Payment Method:</strong> {order.paymentMethod || "PayPal"}</p>
              {/* {order.transactionId && (
                <p className="text-[11px] text-gray-500"><strong>Txn Reference:</strong> <span className="font-mono">{order.transactionId}</span></p>
              )} */}
            </div>
          </div>
        </div>

        {/* Goods Specification Table */}
        <div className="mb-8">
          <h3 className="text-[11px] uppercase font-extrabold text-gray-500 tracking-wider mb-3">
            Goods Dispatch Specification
          </h3>
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b-2 border-gray-800 bg-gray-100 text-gray-800 font-extrabold uppercase text-[10.5px] print:bg-gray-100">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Variant / Finish</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item: any, index: number) => {
                const itemPrice = Number(item.price) || 0;
                const itemQty = Number(item.quantity) || 1;
                const itemTotal = itemPrice * itemQty;

                return (
                  <tr key={`${item.slug}-${index}`} className="align-top hover:bg-gray-50">
                    <td className="py-3 px-3 font-semibold text-gray-400 text-xs">{index + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || item.imageUrl || "/images/menu-icon-dark.svg"}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-200 flex-shrink-0 print:border-gray-300"
                        />
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{item.name}</p>
                          {item.slug && <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{item.slug}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 text-[11.5px] capitalize">
                      {[item.material, item.dimension].filter(Boolean).join(" • ")}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 font-medium">
                      {formatOrderPrice(itemPrice, order.currencySymbol, order.currency)}
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold text-gray-900">{itemQty}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-gray-900">
                      {formatOrderPrice(itemTotal, order.currencySymbol, order.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown */}
        <div className="flex justify-end pt-4 border-t-2 border-black mb-10">
          <div className="w-full sm:w-[320px] space-y-2 text-[13px]">
            <div className="flex justify-between font-black text-base text-gray-900 pt-1">
              <span>Total Shipment Value</span>
              <span>{formatOrderPrice(order.total, order.currencySymbol, order.currency)}</span>
            </div>
          </div>
        </div>

        {/* Brand Stamp & Verification Block */}
        <div className="pt-6 mt-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg width="44" height="35" viewBox="0 0 287 229" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-black">
              <path d="M87.8077 65.3935C115.406 66.2883 135.246 83.8697 142.855 92.6595C166.484 66.0782 199.642 63.2085 213.267 65.0964C269.597 72.4865 285.917 121.565 285.917 145.553V226.159C285.917 227.169 284.663 227.351 283.653 227.351H248.771C246.699 227.5 246.534 224.513 246.534 222.433V151.066C247.369 119.599 224.704 107.361 213.267 105.176C182.728 99.5964 166.239 122.082 163.198 140.605C162.064 147.509 162.994 154.579 162.994 161.575V223.687C162.994 224.738 162.916 226.247 162.152 226.968C161.448 227.634 160.716 227.5 159.747 227.5H125.102C123.431 227.5 123.312 225.984 123.312 225.116V151.811C124.625 118.079 100.935 107.832 89.8962 105.299C88.106 105.001 87.8077 104.256 87.8077 103.835V65.3935Z" fill="currentColor" />
              <path d="M0.5 74.8408C4.62763 22.5872 51.7228 0.168822 79.9038 0.503694C80.5642 0.511541 81.1784 0.785788 81.6454 1.25284C82.1351 1.74262 82.4089 2.40766 82.4061 3.10025L82.2635 38.4762C82.2621 38.8287 82.1214 39.1663 81.8722 39.4156C81.6422 39.6457 81.3275 39.7839 81.003 39.807C51.2199 41.9285 42.7099 63.4225 40.3363 76.0347C52.7754 67.4304 72.0744 64.9226 80.836 64.706C81.2644 64.6954 81.6638 64.9014 81.9128 65.2501C82.1395 65.5675 82.2613 65.9477 82.2613 66.3377V102.063C82.2613 102.696 82.0316 103.307 81.6149 103.784C81.3602 104.075 80.9887 104.252 80.6028 104.28C46.9871 106.723 39.344 134.365 39.7395 147.962V225.158C39.7395 225.971 39.3427 226.733 38.6766 227.2C38.3973 227.395 38.0646 227.5 37.7236 227.5H2.85894C2.29466 227.5 1.74405 227.326 1.28181 227.003C0.791816 226.66 0.5 226.099 0.5 225.501V74.8408Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Declaration Notice */}
        <div className="border-t border-gray-200 mt-6 pt-4 text-center text-[10.5px] text-gray-500 space-y-0.5">
          <p className="font-bold text-gray-700">This Delivery Challan serves as official proof of dispatch and shipment.</p>
          <p>Please inspect goods upon arrival. Any transit damage or missing items must be reported within 48 hours.</p>
        </div>

      </div>

      {/* Print CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          .no-print {
            display: none !important;
          }
          html, body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
          }
        }
      `}} />
    </div>
  );
}
