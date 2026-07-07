"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetch("/api/delivery-partners")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setPartners(data.partners);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete delivery partner "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/delivery-partners/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || "Failed to delete partner.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (partner) => {
    const updatedForm = { ...partner, active: !partner.active };
    try {
      const res = await fetch(`/api/delivery-partners/${partner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === partner.id ? { ...p, active: !p.active } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.05em] text-fjord-ink">
            Delivery Partners
          </h1>
          <p className="text-fjord-muted text-[14px] mt-1">
            Configure courier methods, pricing tiers, and transit times for storefront shipping.
          </p>
        </div>
        <Link
          href="/delivery-partners/new"
          className="rounded-full px-6 py-3 bg-fjord-accent text-fjord-bg font-semibold text-[14px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
        >
          Add Partner
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg className="animate-spin h-7 w-7 text-fjord-ink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-fjord-muted text-xs">Loading delivery partners...</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-fjord-panel/40 border border-dashed border-fjord-line rounded-[32px] p-20 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-fjord-panel-strong border border-fjord-soft-line flex items-center justify-center text-3xl">
            🚚
          </div>
          <div>
            <h3 className="text-lg font-bold">No delivery partners configured</h3>
            <p className="text-fjord-muted text-[14px] mt-1 max-w-sm">
              Add your first delivery service to configure shipping options at checkout.
            </p>
          </div>
          <Link
            href="/delivery-partners/new"
            className="rounded-full px-5 py-2.5 bg-fjord-accent text-fjord-bg font-semibold text-[13px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer mt-2"
          >
            Create Partner
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className={`p-6 bg-fjord-panel/72 border border-fjord-soft-line backdrop-blur-[14px] rounded-[28px] shadow-fjord-soft flex flex-col justify-between transition-all duration-[180ms] ${
                !partner.active ? "opacity-60" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-fjord-panel-strong border border-fjord-soft-line flex items-center justify-center text-2xl">
                    {partner.logo}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(partner)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      partner.active ? "bg-fjord-accent" : "bg-fjord-ink/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-fjord-panel-strong shadow ring-0 transition duration-200 ease-in-out ${
                        partner.active ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <h3 className="text-[18px] font-bold tracking-[-0.03em] text-fjord-ink flex items-center gap-2">
                  {partner.name}
                  {partner.code && (
                    <span className="px-1.5 py-0.5 bg-fjord-ink/5 border border-fjord-soft-line rounded text-[10px] uppercase font-mono tracking-wider text-fjord-muted">
                      {partner.code}
                    </span>
                  )}
                </h3>
                <p className="text-fjord-muted text-[13px] mt-1 flex items-center gap-1.5">
                  <span>⏱️</span> {partner.transitTime}
                </p>
                <p className="text-[20px] font-extrabold text-fjord-ink mt-3 font-dm-sans">
                  {partner.price === 0 ? "Free" : `$${partner.price.toFixed(2)}`}
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-fjord-soft-line pt-4 mt-5">
                <Link
                  href={`/delivery-partners/${partner.id}/edit`}
                  className="flex-1 text-center py-2 px-4 rounded-xl border border-fjord-line hover:border-fjord-ink/20 hover:bg-fjord-panel text-[13px] font-semibold transition-all"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(partner.id, partner.name)}
                  disabled={deletingId === partner.id}
                  className="flex-1 text-center py-2 px-4 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5 text-[13px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
