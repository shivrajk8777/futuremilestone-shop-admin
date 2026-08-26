import {
  PageHeader,
  PageSection,
  StatGrid,
} from "../../../components/admin/Sections";
import { listDiscounts } from "../../../lib/discounts";
import DiscountList from "./DiscountList";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const discounts = await listDiscounts();
  const activeCount = discounts.filter((d) => d.active).length;
  const percentageCount = discounts.filter((d) => d.type === "percentage").length;
  const fixedCount = discounts.filter((d) => d.type === "fixed").length;

  const stats = [
    {
      label: "Campaigns",
      value: String(discounts.length),
      meta: discounts.length ? "Total campaigns configured" : "No campaigns created yet",
    },
    {
      label: "Active Campaigns",
      value: String(activeCount),
      meta: activeCount ? "Promotions currently live" : "No promotions active",
    },
    {
      label: "Percentage Discount",
      value: String(percentageCount),
      meta: "Percentage off campaigns",
    },
    {
      label: "Fixed Discount",
      value: String(fixedCount),
      meta: "Fixed price off campaigns",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Discounts"
        description="Configure percentage or fixed discounts on all products, category wise, or selected individual products."
        actions={[
          { label: "Create campaign", kind: "primary", href: "/discounts/new" },
        ]}
      />

      <PageSection>
        <StatGrid items={stats} />
      </PageSection>

      <PageSection
        title="Discount Campaigns"
        description="Activate or configure specific discount terms for your store categories and products."
      >
        <DiscountList discounts={discounts} />
      </PageSection>
    </>
  );
}
