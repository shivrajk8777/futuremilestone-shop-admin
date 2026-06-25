import {
  PageHeader,
  PageSection,
  SimpleList,
  StatGrid,
} from "../../../components/admin/Sections";

const stats = [
  { label: "Net revenue", value: "--", meta: "No reporting data yet" },
  { label: "Orders fulfilled", value: "--", meta: "No fulfillment data yet" },
  { label: "Returning buyers", value: "--", meta: "No customer data yet" },
  { label: "Open issues", value: "--", meta: "No operational issues logged" },
];

const recentOrders = [];
const stockAlerts = [];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        description="Monitor store operations, inventory status, and incoming activity from a single administrative workspace."
        actions={[
          { label: "Today", kind: "pill" },
          { label: "Export report", kind: "secondary" },
          // { label: "New product", kind: "primary" },
        ]}
      />

      <PageSection>
        <StatGrid items={stats} />
      </PageSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PageSection
          title="Recent orders"
          description="Latest order activity will appear here as soon as the store starts receiving purchases."
          action="View all orders"
        >
          <SimpleList items={recentOrders} />
        </PageSection>

        <PageSection
          title="Stock watch"
          description="Low-stock alerts and supply issues will be listed here once products are tracked."
        >
          <SimpleList items={stockAlerts} />
        </PageSection>
      </div>

      <PageSection>
        <div className="p-6 rounded-[24px] bg-gradient-to-br from-fjord-warm/30 to-fjord-panel-strong/60 border border-fjord-soft-line shadow-fjord-soft">
          <span className="block text-fjord-muted text-[11px] tracking-[0.14em] uppercase font-bold">System status</span>
          <h3 className="mt-1.5 mb-2 text-[24px] font-bold tracking-[-0.05em] leading-tight">Admin workspace is ready.</h3>
          <p className="m-0 max-w-[56ch] text-fjord-muted leading-[1.6] text-[13px]">
            Connect your live catalog, order pipeline, and publishing workflow
            to replace these initial empty states with real operational data.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-4">
            <span className="px-3 py-1.5 rounded-full bg-fjord-panel-strong border border-fjord-soft-line text-[12px] font-semibold">Products</span>
            <span className="px-3 py-1.5 rounded-full bg-fjord-panel-strong border border-fjord-soft-line text-[12px] font-semibold">Collections</span>
            <span className="px-3 py-1.5 rounded-full bg-fjord-panel-strong border border-fjord-soft-line text-[12px] font-semibold">Orders</span>
            <span className="px-3 py-1.5 rounded-full bg-fjord-panel-strong border border-fjord-soft-line text-[12px] font-semibold">Blogs</span>
          </div>
        </div>
      </PageSection>
    </>
  );
}
