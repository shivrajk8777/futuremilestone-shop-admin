import {
  PageHeader,
  PageSection,
} from "../../../../components/admin/Sections";
import { getContact } from "../../../../lib/contacts";
import { ContactReplyForm, ContactDeleteButton } from "./ContactClientComponents";
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

export default async function ContactDetailsPage({ params }) {
  const { contactId } = await params;
  const contact = await getContact(contactId);

  if (!contact) {
    return (
      <>
        <PageHeader
          eyebrow="Error"
          title="Inquiry Not Found"
          description="The inquiry identifier does not exist or may have been deleted."
          actions={[{ label: "Back to Inquiries", kind: "secondary", href: "/contacts" }]}
        />
        <PageSection>
          <div className="py-12 text-center text-fjord-muted">
            <p className="text-[14px]">Please double-check the URL or return to the support queue.</p>
          </div>
        </PageSection>
      </>
    );
  }

  const hasReplies = contact.replies && contact.replies.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Customer Support"
        title={`Inquiry from ${contact.name}`}
        description={`Submitted on ${formatDate(contact.createdAt)}`}
        actions={[{ label: "Back to Inquiries", kind: "secondary", href: "/contacts" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)] gap-3 mt-1">
        {/* Left Column: Inquiry details and Response composing */}
        <div className="space-y-3">
          <PageSection
            title="Inquiry Message"
            description="The original message submitted by the customer."
          >
            <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] p-6 text-sm leading-relaxed whitespace-pre-wrap text-fjord-ink/95 font-medium shadow-fjord-soft">
              {contact.message}
            </div>
          </PageSection>

          {hasReplies && (
            <PageSection
              title="Response History"
              description="Past email replies sent to this customer regarding this inquiry."
            >
              <div className="space-y-3">
                {contact.replies.map((reply, idx) => (
                  <div
                    key={idx}
                    className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] p-5 shadow-fjord-soft space-y-3.5 animate-fade-in"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-fjord-muted uppercase tracking-wider">
                      <span className="truncate max-w-[70%]">Subject: {reply.subject}</span>
                      <span>{formatDate(reply.sentAt)}</span>
                    </div>
                    <p className="text-fjord-ink/90 text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                      {reply.message}
                    </p>
                  </div>
                ))}
              </div>
            </PageSection>
          )}

          <PageSection
            title="Compose Response"
            description="Send an email reply directly to the customer's email address."
          >
            <ContactReplyForm
              contactId={contact.id}
              contactName={contact.name}
              contactEmail={contact.email}
            />
          </PageSection>
        </div>

        {/* Right Column: Customer info, Status, Actions */}
        <div className="space-y-3">
          <PageSection title="Inquiry Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-fjord-soft-line/60 pb-3 text-[13px]">
                <span className="text-fjord-muted">Status:</span>
                <span className={`inline-block rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${
                  hasReplies
                    ? "text-fjord-success bg-fjord-success/12"
                    : "text-[#9b6b2b] bg-[#9b6b2b]/12"
                }`}>
                  {hasReplies ? "Replied" : "Pending Reply"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-fjord-soft-line/60 pb-3 text-[13px]">
                <span className="text-fjord-muted">Responses sent:</span>
                <span className="font-semibold text-fjord-ink">
                  {contact.replies.length}
                </span>
              </div>

              <div className="text-[13px]">
                <span className="text-fjord-muted block">Submitted on:</span>
                <span className="font-semibold text-fjord-ink block mt-0.5">
                  {formatDate(contact.createdAt)}
                </span>
              </div>
            </div>
          </PageSection>

          <PageSection title="Customer Details">
            <div className="space-y-3 text-[13px] text-fjord-ink">
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-fjord-muted">Name</span>
                <span className="font-semibold text-[14px]">{contact.name}</span>
              </div>
              <div className="border-t border-fjord-soft-line pt-3">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-fjord-muted">Email Address</span>
                <a
                  href={`mailto:${contact.email}`}
                  className="font-semibold text-fjord-accent hover:underline block truncate mt-0.5"
                >
                  {contact.email}
                </a>
              </div>
            </div>
          </PageSection>

          <PageSection title="Actions">
            <div className="pt-1">
              <ContactDeleteButton
                contactId={contact.id}
                contactName={contact.name}
              />
            </div>
          </PageSection>
        </div>
      </div>
    </>
  );
}
