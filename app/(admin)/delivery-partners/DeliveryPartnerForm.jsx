"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LOGO_OPTIONS = ["🚚", "✈️", "📦", "🌐", "📮", "⚡", "⛴️", "🚂"];

function SpinnerIcon({ className = "" }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function DeliveryPartnerForm({ partner, isEdit = false }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: partner?.name || "",
    code: partner?.code || "",
    transitTime: partner?.transitTime || "3-5 business days",
    price: partner?.price !== undefined ? partner.price : 0,
    active: partner?.active !== false,
    logo: partner?.logo || "🚚",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.code.trim()) {
      setError("Courier Code is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = isEdit ? `/api/delivery-partners/${partner.id}` : "/api/delivery-partners";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/delivery-partners");
        router.refresh();
      } else {
        setError(data.error || "Failed to save delivery partner.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-fjord-ink/10 rounded-[18px] bg-fjord-input-bg px-[18px] py-4 text-fjord-ink outline-none transition-all duration-[160ms] focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6 text-[14px]";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.05em] text-fjord-ink">
            {isEdit ? "Edit Partner" : "Add Delivery Partner"}
          </h1>
          <p className="text-fjord-muted text-[14px] mt-1">
            {isEdit ? "Update delivery partner shipping rules." : "Configure a new shipping and fulfillment option."}
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full px-6 py-3 bg-fjord-accent text-fjord-bg font-semibold text-[14px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
        >
          {saving ? <><SpinnerIcon className="h-4 w-4" /> Saving...</> : (isEdit ? "Update Partner" : "Add Partner")}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-[18px] px-5 py-3.5 text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* ── Partner Profile ──────────────────────────────────────────────── */}
      <section className="p-[18px] sm:p-[22px] bg-fjord-panel/72 border border-fjord-soft-line backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft flex flex-col gap-5">
        <div className="mb-1">
          <h2 className="text-[20px] font-bold tracking-[-0.05em]">Partner Details</h2>
          <p className="text-fjord-muted text-[14px] mt-1">Identify the courier and choose a signature icon.</p>
        </div>

        {/* Logo Picker */}
        <div className="grid gap-2.5">
          <label className="text-[14px] font-semibold">Select Icon</label>
          <div className="flex flex-wrap gap-2.5">
            {LOGO_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateField("logo", opt)}
                className={`w-12 h-12 rounded-2xl border text-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-[0.97] ${
                  form.logo === opt
                    ? "bg-fjord-accent border-transparent text-fjord-bg shadow-sm"
                    : "bg-fjord-input-bg border-fjord-ink/10 hover:border-fjord-ink/20"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Courier Name */}
        <div className="grid gap-2.5">
          <label className="text-[14px] font-semibold">Courier Name *</label>
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. DHL Express, FedEx Priority"
            className={inputClass}
            required
          />
        </div>

        {/* Courier Code */}
        <div className="grid gap-2.5">
          <label className="text-[14px] font-semibold">Courier Code (for developers) *</label>
          <input
            value={form.code}
            onChange={(e) => updateField("code", e.target.value)}
            placeholder="e.g. dhl (matches tracking implementation)"
            className={inputClass}
            required
          />
        </div>

        {/* Transit Time */}
        <div className="grid gap-2.5">
          <label className="text-[14px] font-semibold">Transit Time</label>
          <input
            value={form.transitTime}
            onChange={(e) => updateField("transitTime", e.target.value)}
            placeholder="e.g. 1-2 business days, 3-5 business days"
            className={inputClass}
          />
        </div>

        {/* Shipping Cost */}
        <div className="grid gap-2.5">
          <label className="text-[14px] font-semibold">Shipping Cost ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
            placeholder="e.g. 15"
            className={inputClass}
          />
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between border-t border-fjord-soft-line pt-5 mt-2">
          <div>
            <h3 className="text-[15px] font-bold">Active Status</h3>
            <p className="text-fjord-muted text-[13px] mt-0.5">Toggle this courier availability on storefront checkout.</p>
          </div>
          <button
            type="button"
            onClick={() => updateField("active", !form.active)}
            className={`relative inline-flex h-6.5 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              form.active ? "bg-fjord-accent" : "bg-fjord-ink/10"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-fjord-panel-strong shadow ring-0 transition duration-200 ease-in-out ${
                form.active ? "translate-x-5.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>
    </form>
  );
}
