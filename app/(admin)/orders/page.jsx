import {
  PageHeader,
  PageSection,
  StatGrid,
} from "../../../components/admin/Sections";
import { listOrders } from "../../../lib/orders";
import OrderList from "./OrderList";

export default async function OrdersPage() {
  const orders = await listOrders();

  const totalOrders = orders.length;
  const processingCount = orders.filter((o) => o.status === "Processing").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const refundedCount = orders.filter((o) => o.status === "Refunded").length;

  const stats = [
    {
      label: "New orders",
      value: String(totalOrders),
      meta: totalOrders === 1 ? "1 order in queue" : `${totalOrders} total orders`,
    },
    {
      label: "Awaiting shipment",
      value: String(processingCount),
      meta: processingCount === 1 ? "1 pending shipment" : `${processingCount} pending shipments`,
    },
    {
      label: "Delivered",
      value: String(deliveredCount),
      meta: deliveredCount === 1 ? "1 delivery completed" : `${deliveredCount} deliveries completed`,
    },
    {
      label: "Refund requests",
      value: String(refundedCount),
      meta: refundedCount === 1 ? "1 refund request" : `${refundedCount} refund requests`,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Fulfillment"
        title="Orders"
        description="Monitor payment, processing, shipment, and delivery status across your live order pipeline."
        actions={[]}
      />

      <PageSection>
        <StatGrid items={stats} />
      </PageSection>

      <PageSection
        title="Order queue"
        description="Order records will appear here after customers begin placing purchases."
      >
        <OrderList orders={orders} />
      </PageSection>
    </>
  );
}
