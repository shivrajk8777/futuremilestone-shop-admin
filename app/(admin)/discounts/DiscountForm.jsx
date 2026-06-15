"use client";

import { useActionState, useMemo, useState } from "react";
import SwalMessageEffect from "../../../components/SwalMessageEffect";

const initialState = { error: "" };

function normalizeInitialDiscount(discount) {
  return {
    name: discount?.name ?? "",
    type: discount?.type ?? "percentage",
    value: discount?.value ?? 0,
    scope: discount?.scope ?? "all",
    collectionIds: discount?.collectionIds || [],
    productIds: discount?.productIds || [],
    active: discount?.active ?? true,
  };
}

export default function DiscountForm({
  action,
  collections = [],
  products = [],
  discount,
  submitLabel,
  title,
  description,
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [form, setForm] = useState(() => normalizeInitialDiscount(discount));
  const [collectionSearch, setCollectionSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const payload = useMemo(() => {
    return JSON.stringify({
      name: form.name,
      type: form.type,
      value: Number(form.value) || 0,
      scope: form.scope,
      collectionIds: form.collectionIds,
      productIds: form.productIds,
      active: !!form.active,
    });
  }, [form]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleCollection(id) {
    setForm((current) => {
      const exists = current.collectionIds.includes(id);
      const next = exists
        ? current.collectionIds.filter((cid) => cid !== id)
        : [...current.collectionIds, id];
      return { ...current, collectionIds: next };
    });
  }

  function toggleProduct(id) {
    setForm((current) => {
      const exists = current.productIds.includes(id);
      const next = exists
        ? current.productIds.filter((pid) => pid !== id)
        : [...current.productIds, id];
      return { ...current, productIds: next };
    });
  }

  const filteredCollections = collections.filter((c) =>
    c.name?.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const inputClass = "w-full border border-fjord-ink/10 rounded-[18px] bg-white/92 px-[18px] py-4 text-fjord-ink outline-none transition-all duration-[160ms] focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6 text-[14px]";

  return (
    <form action={formAction} className="grid gap-3">
      <SwalMessageEffect message={state?.error} type="error" />
      <input name="discountPayload" type="hidden" value={payload} />

      <section className="p-[18px] sm:p-[22px] bg-white/72 border border-white/72 backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">{title}</h2>
            <p className="mt-1 mb-0 text-fjord-muted text-[14px]">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="name">Campaign Name</label>
            <input
              id="name"
              onChange={(event) => updateField("name", event.target.value)}
              type="text"
              placeholder="e.g. Summer Promo"
              value={form.name}
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="active">Active Status</label>
            <div className="flex items-center gap-3 h-[54px] border border-fjord-ink/10 rounded-[18px] bg-white/92 px-[18px] select-none">
              <input
                id="active"
                onChange={(event) => updateField("active", event.target.checked)}
                type="checkbox"
                checked={form.active}
                className="w-4 h-4 rounded text-fjord-accent focus:ring-fjord-accent cursor-pointer"
              />
              <span className="text-[14px] font-medium text-fjord-ink cursor-pointer" onClick={() => updateField("active", !form.active)}>
                Campaign Active (Live on store)
              </span>
            </div>
          </div>

          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="type">Discount Type</label>
            <select
              id="type"
              onChange={(event) => updateField("type", event.target.value)}
              value={form.type}
              className={inputClass}
            >
              <option value="percentage">Percentage OFF (%)</option>
              <option value="fixed">Fixed Amount OFF ($)</option>
            </select>
          </div>

          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="value">
              {form.type === "percentage" ? "Percentage Value (%)" : "Fixed Amount Value ($)"}
            </label>
            <input
              id="value"
              onChange={(event) => updateField("value", event.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              placeholder={form.type === "percentage" ? "e.g. 15" : "e.g. 50"}
              value={form.value || ""}
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold" htmlFor="scope">Campaign Scope</label>
            <select
              id="scope"
              onChange={(event) => updateField("scope", event.target.value)}
              value={form.scope}
              className={inputClass}
            >
              <option value="all">Apply to All Products</option>
              <option value="category">Category-wise (Select Collections)</option>
              <option value="products">Selected Products (Select Individual Products)</option>
            </select>
          </div>

          {form.scope === "category" && (
            <div className="grid gap-2.5 md:col-span-2 bg-white/40 border border-fjord-soft-line rounded-[22px] p-4">
              <label className="text-[14px] font-semibold">Select Collections ({form.collectionIds.length} selected)</label>
              <input
                type="text"
                placeholder="Search collections..."
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                className="w-full border border-fjord-ink/10 rounded-full px-4 py-2 bg-white/80 outline-none text-[13px]"
              />
              <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-1">
                {filteredCollections.length === 0 ? (
                  <div className="text-fjord-muted text-xs p-2">No matching collections found</div>
                ) : (
                  filteredCollections.map((collection) => {
                    const isChecked = form.collectionIds.includes(collection.id);
                    return (
                      <label
                        key={collection.id}
                        className={`flex items-center gap-3 p-3 rounded-[14px] border cursor-pointer select-none transition-all ${
                          isChecked
                            ? "bg-fjord-accent-soft/20 border-fjord-accent/30 text-fjord-ink"
                            : "bg-white/50 border-fjord-soft-line hover:bg-white/80 text-fjord-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCollection(collection.id)}
                          className="w-4 h-4 rounded text-fjord-accent focus:ring-fjord-accent"
                        />
                        <span className="text-[13px] font-medium">{collection.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {form.scope === "products" && (
            <div className="grid gap-2.5 md:col-span-2 bg-white/40 border border-fjord-soft-line rounded-[22px] p-4">
              <label className="text-[14px] font-semibold">Select Products ({form.productIds.length} selected)</label>
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full border border-fjord-ink/10 rounded-full px-4 py-2 bg-white/80 outline-none text-[13px]"
              />
              <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-1">
                {filteredProducts.length === 0 ? (
                  <div className="text-fjord-muted text-xs p-2">No matching products found</div>
                ) : (
                  filteredProducts.map((product) => {
                    const isChecked = form.productIds.includes(product.id);
                    return (
                      <label
                        key={product.id}
                        className={`flex items-center gap-3 p-3 rounded-[14px] border cursor-pointer select-none transition-all ${
                          isChecked
                            ? "bg-fjord-accent-soft/20 border-fjord-accent/30 text-fjord-ink"
                            : "bg-white/50 border-fjord-soft-line hover:bg-white/80 text-fjord-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProduct(product.id)}
                          className="w-4 h-4 rounded text-fjord-accent focus:ring-fjord-accent"
                        />
                        <span className="text-[13px] font-medium">{product.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      <div className="flex justify-end mt-2">
        <button
          className="rounded-full px-6 py-3 border border-transparent bg-fjord-accent text-white font-semibold text-center transition hover:bg-opacity-90 active:scale-[0.98] cursor-pointer text-[14px]"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
