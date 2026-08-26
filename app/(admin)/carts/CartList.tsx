"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { ProductCartGroup, CartCustomerDetail } from "@/lib/carts";

interface CartListProps {
  productGroups: ProductCartGroup[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateVal: Date | string): string {
  const d = new Date(dateVal);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CartList({ productGroups }: CartListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingSlug, setSendingSlug] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  // Expand states
  const [collapsedProducts, setCollapsedProducts] = useState<Record<string, boolean>>({});
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  const toggleProductExpand = (slug: string) => {
    setCollapsedProducts((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

  const toggleCustomerExpand = (key: string) => {
    setExpandedCustomers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter product groups and customer list based on search query
  const filteredGroups = productGroups
    .map((group) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return group;

      const productMatch = group.name.toLowerCase().includes(q) || group.slug.toLowerCase().includes(q);

      const matchingCustomers = group.customers.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.customerEmail.toLowerCase().includes(q) ||
          c.customerPhone?.toLowerCase().includes(q) ||
          c.material?.toLowerCase().includes(q) ||
          c.dimension?.toLowerCase().includes(q)
      );

      if (productMatch) {
        return group;
      } else if (matchingCustomers.length > 0) {
        return {
          ...group,
          customers: matchingCustomers,
          customersCount: matchingCustomers.length,
          totalQuantity: matchingCustomers.reduce((sum, c) => sum + c.quantity, 0),
          totalValue: matchingCustomers.reduce((sum, c) => sum + c.totalValue, 0),
        };
      }
      return null;
    })
    .filter(Boolean) as ProductCartGroup[];

  const totalProducts = productGroups.length;
  const totalUniqueCustomers = new Set(
    productGroups.flatMap((g) => g.customers.map((c) => c.customerEmail))
  ).size;
  const totalPotentialValue = productGroups.reduce((sum, g) => sum + g.totalValue, 0);

  // Send mail to all customers across all products
  const handleSendMailToAll = async () => {
    if (productGroups.length === 0) return;

    const result = await Swal.fire({
      title: "Send Email to All Customers?",
      text: "Send cart recovery email to all customers with saved items?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0e1011",
      confirmButtonText: "Yes, Send Mail to All",
    });

    if (result.isConfirmed) {
      setSendingAll(true);
      Swal.fire({
        title: "Sending Emails...",
        text: "Dispatching cart recovery emails to customers.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const res = await fetch("/api/carts/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sendAll: true }),
        });
        const data = await res.json();

        if (data.success) {
          Swal.fire({
            title: "Emails Dispatched!",
            text: `Successfully sent cart recovery emails to ${data.successCount} customer(s).`,
            icon: "success",
            confirmButtonColor: "#0e1011",
          });
        } else {
          Swal.fire("Error", data.error || "Failed to send emails.", "error");
        }
      } catch (err: any) {
        Swal.fire("Error", err.message || "Network error sending emails.", "error");
      } finally {
        setSendingAll(false);
      }
    }
  };

  // Send mail to all customers interested in a specific product
  const handleSendMailForProduct = async (group: ProductCartGroup) => {
    const result = await Swal.fire({
      title: `Send Mail for ${group.name}?`,
      text: `Send cart recovery reminder to all ${group.customersCount} customer(s) interested in ${group.name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0e1011",
      confirmButtonText: "Send Mail to Buyers",
    });

    if (result.isConfirmed) {
      setSendingSlug(group.slug);
      Swal.fire({
        title: "Sending Emails...",
        text: `Sending cart emails to buyers of ${group.name}...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const res = await fetch("/api/carts/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: group.slug }),
        });
        const data = await res.json();

        if (data.success && data.successCount > 0) {
          Swal.fire({
            title: "Emails Sent!",
            text: `Sent cart recovery email to ${data.successCount} customer(s).`,
            icon: "success",
            confirmButtonColor: "#0e1011",
          });
        } else {
          Swal.fire("Error", data.error || "Failed to send email.", "error");
        }
      } catch (err: any) {
        Swal.fire("Error", err.message || "Network error sending email.", "error");
      } finally {
        setSendingSlug(null);
      }
    }
  };

  // Send mail to a single customer
  const handleSendMailSingle = async (customer: CartCustomerDetail, productName: string) => {
    const result = await Swal.fire({
      title: `Send Mail to ${customer.customerName}?`,
      text: `Send cart recovery email to ${customer.customerEmail} for ${productName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0e1011",
      confirmButtonText: "Send Mail Now",
    });

    if (result.isConfirmed) {
      setSendingId(customer.cartId);
      Swal.fire({
        title: "Sending Email...",
        text: `Sending email to ${customer.customerEmail}...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const res = await fetch("/api/carts/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId: customer.cartId }),
        });
        const data = await res.json();

        if (data.success && data.successCount > 0) {
          Swal.fire({
            title: "Email Sent Successfully!",
            text: `Cart reminder email sent to ${customer.customerEmail}.`,
            icon: "success",
            confirmButtonColor: "#0e1011",
          });
        } else {
          Swal.fire("Error", data.error || "Failed to send email.", "error");
        }
      } catch (err: any) {
        Swal.fire("Error", err.message || "Network error sending email.", "error");
      } finally {
        setSendingId(null);
      }
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ── Header Title & Actions (Compact Row) ─────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line px-5 py-3.5 rounded-2xl shadow-futuremilestone-soft">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-futuremilestone-ink leading-tight">
            Active Cart Products
          </h1>
          <p className="text-[11px] text-futuremilestone-muted font-medium">
            Real-time products saved in customer carts & direct mail recovery
          </p>
        </div>

        <button
          onClick={handleSendMailToAll}
          disabled={sendingAll || productGroups.length === 0}
          className="px-4 py-2 bg-futuremilestone-accent text-futuremilestone-bg text-xs font-bold rounded-xl hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
        >
          <span>✉️</span>
          <span>{sendingAll ? "Sending..." : "Send Mail to All Customers"}</span>
        </button>
      </div>

      {/* ── Compact Summary Metrics Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="px-4 py-3 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-xl shadow-futuremilestone-soft flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-futuremilestone-muted block">
              Products in Carts
            </span>
            <span className="text-lg font-extrabold tracking-tight text-futuremilestone-ink block mt-0.5">
              {totalProducts} {totalProducts === 1 ? "Product" : "Products"}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-futuremilestone-accent/10 text-futuremilestone-ink grid place-items-center text-sm font-bold">
            📦
          </div>
        </div>

        <div className="px-4 py-3 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-xl shadow-futuremilestone-soft flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-futuremilestone-muted block">
              Interested Customers
            </span>
            <span className="text-lg font-extrabold tracking-tight text-futuremilestone-ink block mt-0.5">
              {totalUniqueCustomers} {totalUniqueCustomers === 1 ? "Customer" : "Customers"}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 grid place-items-center text-sm font-bold">
            👥
          </div>
        </div>

        <div className="px-4 py-3 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-xl shadow-futuremilestone-soft flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-futuremilestone-muted block">
              Potential Cart Value
            </span>
            <span className="text-lg font-extrabold tracking-tight text-futuremilestone-ink block mt-0.5">
              {formatCurrency(totalPotentialValue)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center text-sm font-bold">
            💎
          </div>
        </div>
      </div>

      {/* ── Compact Search Row ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-xl">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, customer name, or email..."
            className="w-full bg-futuremilestone-input-bg border border-futuremilestone-soft-line rounded-lg px-3.5 py-1.5 pl-9 text-xs font-semibold focus:outline-none focus:border-futuremilestone-ink text-futuremilestone-ink"
          />
          <svg
            className="w-3.5 h-3.5 text-futuremilestone-muted absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="text-[11px] text-futuremilestone-muted font-medium">
          Showing <span className="font-bold text-futuremilestone-ink">{filteredGroups.length}</span> of {productGroups.length} products
        </div>
      </div>

      {/* ── Compact Product Cards List ──────────────────────────────────────── */}
      {filteredGroups.length === 0 ? (
        <div className="p-8 text-center bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-2xl space-y-2">
          <div className="w-12 h-12 rounded-full bg-futuremilestone-accent-soft text-futuremilestone-muted grid place-items-center mx-auto text-xl">
            📦
          </div>
          <h3 className="text-sm font-bold text-futuremilestone-ink">No Saved Products Found</h3>
          <p className="text-xs text-futuremilestone-muted max-w-xs mx-auto">
            {searchQuery
              ? "No product or customer matches your search query."
              : "There are currently no items saved in customer carts."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const isProductCollapsed = !!collapsedProducts[group.slug];

            return (
              <div
                key={group.slug}
                className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-2xl overflow-hidden shadow-futuremilestone-soft transition-all duration-200 hover:border-futuremilestone-line"
              >
                {/* Compact Product Header */}
                <div className="px-4 py-3 bg-futuremilestone-bg/30 border-b border-futuremilestone-soft-line flex flex-wrap justify-between items-center gap-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer select-none min-w-0"
                    onClick={() => toggleProductExpand(group.slug)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-futuremilestone-bg overflow-hidden flex-shrink-0 border border-futuremilestone-soft-line">
                      <img
                        src={group.image}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-futuremilestone-ink leading-tight truncate">
                          {group.name}
                        </h3>
                        <span className="text-[10px] text-futuremilestone-muted font-bold">
                          {isProductCollapsed ? "►" : "▼"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-futuremilestone-muted font-medium mt-0.5">
                        <span>Unit: <strong className="text-futuremilestone-ink">{formatCurrency(group.unitPrice)}</strong></span>
                        <span>•</span>
                        <span className="bg-futuremilestone-accent/10 text-futuremilestone-ink px-2 py-0.2 rounded-md font-bold text-[10px]">
                          {group.customersCount} {group.customersCount === 1 ? "Customer" : "Customers"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendMailForProduct(group)}
                      disabled={sendingSlug === group.slug}
                      className="px-3 py-1.5 bg-futuremilestone-accent text-futuremilestone-bg text-[11px] font-bold rounded-lg hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <span>✉️</span>
                      <span>{sendingSlug === group.slug ? "Sending..." : `Send Mail to Buyers (${group.customersCount})`}</span>
                    </button>

                    <button
                      onClick={() => toggleProductExpand(group.slug)}
                      className="px-2.5 py-1.5 border border-futuremilestone-soft-line rounded-lg text-futuremilestone-muted hover:text-futuremilestone-ink transition cursor-pointer text-[11px] font-semibold"
                      title={isProductCollapsed ? "Expand customer list" : "Collapse customer list"}
                    >
                      {isProductCollapsed ? "▼ Expand" : "▲ Collapse"}
                    </button>
                  </div>
                </div>

                {/* Compact Customers List */}
                {!isProductCollapsed && (
                  <div className="p-3 divide-y divide-futuremilestone-soft-line/40">
                    {group.customers.map((c, idx) => {
                      const customerKey = `${group.slug}-${c.cartId}-${idx}`;
                      const isCustomerExpanded = !!expandedCustomers[customerKey];

                      return (
                        <div key={customerKey} className="py-2 px-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-3 hover:bg-futuremilestone-bg/30 p-1 rounded-lg transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-futuremilestone-ink text-futuremilestone-bg font-bold text-[10px] grid place-items-center flex-shrink-0 uppercase">
                                {c.customerName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-futuremilestone-ink text-xs leading-tight truncate">
                                  {c.customerName}
                                </p>
                                <p className="text-futuremilestone-muted text-[11px] truncate">
                                  {c.customerEmail}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Send Mail Button */}
                              <button
                                onClick={() => handleSendMailSingle(c, group.name)}
                                disabled={sendingId === c.cartId}
                                className="px-3 py-1 bg-futuremilestone-panel-strong border border-futuremilestone-soft-line hover:border-futuremilestone-ink text-futuremilestone-ink font-bold text-[11px] rounded-lg hover:bg-futuremilestone-bg/50 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                              >
                                <span>✉️</span>
                                <span>{sendingId === c.cartId ? "Sending..." : "Send Mail"}</span>
                              </button>

                              {/* Expand Chevron Button */}
                              <button
                                onClick={() => toggleCustomerExpand(customerKey)}
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                                  isCustomerExpanded
                                    ? "bg-futuremilestone-ink text-futuremilestone-bg border-futuremilestone-ink"
                                    : "bg-futuremilestone-bg/40 border-futuremilestone-soft-line text-futuremilestone-muted hover:text-futuremilestone-ink hover:bg-futuremilestone-bg"
                                }`}
                                title={isCustomerExpanded ? "Collapse details" : "Expand item details"}
                              >
                                {isCustomerExpanded ? "▲" : "▼"}
                              </button>
                            </div>
                          </div>

                          {/* Compact Details Drawer */}
                          {isCustomerExpanded && (
                            <div className="ml-9 p-3 bg-futuremilestone-bg/60 border border-futuremilestone-soft-line rounded-xl text-[11px] space-y-1.5 text-futuremilestone-ink animate-fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-futuremilestone-muted block">
                                    Variant
                                  </span>
                                  <span className="font-semibold block capitalize truncate">
                                    {[c.material, c.dimension].filter(Boolean).join(" • ") || "Standard"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[9px] uppercase font-bold text-futuremilestone-muted block">
                                    Qty & Value
                                  </span>
                                  <span className="font-semibold block">
                                    {c.quantity} unit(s) — <strong className="text-futuremilestone-ink">{formatCurrency(c.totalValue)}</strong>
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[9px] uppercase font-bold text-futuremilestone-muted block">
                                    Last Activity
                                  </span>
                                  <span className="font-medium text-futuremilestone-muted block">
                                    {formatDate(c.updatedAt)}
                                  </span>
                                </div>
                              </div>

                              {(c.customerPhone || c.customerAddress) && (
                                <div className="border-t border-futuremilestone-soft-line/60 pt-1.5 flex flex-wrap gap-3 text-[10.5px] text-futuremilestone-muted">
                                  {c.customerPhone && (
                                    <span>📞 <strong>Phone:</strong> {c.customerPhone}</span>
                                  )}
                                  {c.customerAddress && (
                                    <span className="truncate max-w-full">📍 <strong>Location:</strong> {c.customerAddress}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
