import {
  PageHeader,
  PageSection,
  StatGrid,
} from "../../../components/admin/Sections";
import { listContacts } from "../../../lib/contacts";
import ContactList from "./ContactList";

export default async function ContactsPage() {
  const contacts = await listContacts();

  const totalInquiries = contacts.length;
  const pendingCount = contacts.filter((c) => !c.replies || c.replies.length === 0).length;
  const repliedCount = contacts.filter((c) => c.replies && c.replies.length > 0).length;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
  const todayCount = contacts.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t >= startOfToday && t <= endOfToday;
  }).length;

  const stats = [
    {
      label: "Total inquiries",
      value: String(totalInquiries),
      meta: totalInquiries === 1 ? "1 inquiry total" : `${totalInquiries} total inquiries`,
    },
    {
      label: "Awaiting response",
      value: String(pendingCount),
      meta: pendingCount === 1 ? "1 pending response" : `${pendingCount} pending responses`,
    },
    {
      label: "Replied",
      value: String(repliedCount),
      meta: repliedCount === 1 ? "1 inquiry replied" : `${repliedCount} inquiries replied`,
    },
    {
      label: "Received today",
      value: String(todayCount),
      meta: todayCount === 1 ? "1 received today" : `${todayCount} received today`,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Customer Inquiries"
        description="Manage contact form queries and feedback submitted by storefront visitors."
        actions={[]}
      />

      <PageSection>
        <StatGrid items={stats} />
      </PageSection>

      <PageSection
        title="Inquiry queue"
        description="Inquiries submitted through the contact form will appear here."
      >
        <ContactList contacts={contacts} />
      </PageSection>
    </>
  );
}
