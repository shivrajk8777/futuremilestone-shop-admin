"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export function ContactReplyForm({ contactId, contactName, contactEmail }) {
  const router = useRouter();
  const [subject, setSubject] = useState(`Re: Your Inquiry - Future Milestone`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          replyMessage: message.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "Response Sent!",
          text: `Reply email successfully dispatched to ${contactEmail}.`,
          icon: "success",
          confirmButtonColor: "#0e1011",
        });
        setMessage(""); // clear message after sending
        router.refresh(); // reload the page data
      } else {
        setError(data.error || "Failed to send response.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while sending email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {error && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl px-4 py-2.5 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-[10px] font-bold text-fjord-muted uppercase tracking-wider pl-1.5">
            Subject
          </label>
          <input
            type="text"
            placeholder="Subject line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            className="w-full border border-fjord-ink/10 rounded-xl bg-fjord-input-bg px-4 py-3.5 text-fjord-ink outline-none text-xs focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6 font-medium disabled:opacity-60"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-[10px] font-bold text-fjord-muted uppercase tracking-wider pl-1.5">
            Response Message
          </label>
          <textarea
            rows={6}
            placeholder="Write your email reply here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            className="w-full border border-fjord-ink/10 rounded-xl bg-fjord-input-bg px-4 py-3.5 text-fjord-ink outline-none text-xs focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6 resize-none font-medium disabled:opacity-60"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={sending}
          className="rounded-full px-5 py-2.5 bg-fjord-accent text-fjord-bg font-semibold text-[11px] hover:bg-opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
        >
          {sending ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Sending...</span>
            </>
          ) : (
            <span>Send Response</span>
          )}
        </button>
      </div>
    </form>
  );
}

export function ContactDeleteButton({ contactId, contactName }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Inquiry?",
      text: `Are you sure you want to delete the inquiry from "${contactName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete Inquiry",
      cancelButtonColor: "#0e1011",
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        const res = await fetch(`/api/contacts/${contactId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          await Swal.fire({
            title: "Deleted!",
            text: "The inquiry has been successfully deleted.",
            icon: "success",
            confirmButtonColor: "#0e1011",
          });
          router.push("/contacts");
          router.refresh();
        } else {
          Swal.fire("Error", data.error || "Failed to delete inquiry.", "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "An unexpected error occurred while deleting.", "error");
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="w-full text-center py-2.5 px-4 rounded-xl border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[12px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
    >
      {deleting ? "Deleting..." : "Delete Inquiry"}
    </button>
  );
}
