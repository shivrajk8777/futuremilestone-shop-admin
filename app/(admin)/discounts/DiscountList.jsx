"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteDiscountAction } from "./actions";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDiscountValue(type, value) {
  if (type === "percentage") {
    return `${value}% OFF`;
  }
  return `$${value} OFF`;
}

function formatScope(scope, collectionIds, productIds) {
  if (scope === "all") {
    return "All Products";
  }
  if (scope === "category") {
    return `Category (${collectionIds?.length || 0} collections)`;
  }
  if (scope === "products") {
    return `Selected Products (${productIds?.length || 0} products)`;
  }
  return scope;
}

export default function DiscountList({ discounts }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDiscounts = discounts.filter((d) =>
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.scope?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDiscounts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedDiscounts = filteredDiscounts.slice(startIndex, startIndex + rowsPerPage);

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the campaign "${name}"? This cannot be undone.`)) {
      return;
    }
    const res = await deleteDiscountAction(id);
    if (res?.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  };

  if (!discounts.length) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[22px] p-8 text-center">
        <h3 className="m-0 text-[18px] font-bold">No discount campaigns yet</h3>
        <p className="mt-1 text-fjord-muted text-[13px]">Create the first discount campaign to set price promotions.</p>
      </div>
    );
  }

  return (
    <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] overflow-hidden shadow-fjord-soft">
      {/* Top Search and Page Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-fjord-soft-line bg-fjord-bg/20">
        <div className="flex items-center gap-2 text-[13px] text-fjord-muted">
          <span>Show</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-fjord-panel-strong border border-fjord-soft-line rounded-lg px-2.5 py-1 text-fjord-ink font-medium focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-fjord-panel-strong border border-fjord-soft-line rounded-full px-4 py-1.5 pl-9 text-[13px] text-fjord-ink placeholder-fjord-muted outline-none focus:border-fjord-ink/20 focus:ring-2 focus:ring-fjord-ink/4 transition-all"
          />
          <svg className="absolute left-3.5 top-2.5 w-4 h-4 text-fjord-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-fjord-soft-line bg-fjord-bg/10 text-fjord-muted uppercase tracking-wider text-[11px] font-semibold">
              <th className="px-5 py-3">Campaign Name</th>
              <th className="px-5 py-3">Discount Value</th>
              <th className="px-5 py-3">Scope</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fjord-soft-line/60">
            {paginatedDiscounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-fjord-muted">
                  No matching campaigns found.
                </td>
              </tr>
            ) : (
              paginatedDiscounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-fjord-accent/2 transition-colors animate-fade-in">
                  <td className="px-5 py-3 font-semibold text-fjord-ink">{discount.name}</td>
                  <td className="px-5 py-3 font-medium text-fjord-ink">
                    {formatDiscountValue(discount.type, discount.value)}
                  </td>
                  <td className="px-5 py-3 text-fjord-muted">
                    {formatScope(discount.scope, discount.collectionIds, discount.productIds)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                      discount.active
                        ? "text-fjord-success bg-fjord-success/12"
                        : "text-fjord-muted bg-fjord-panel-strong/80"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {discount.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-fjord-muted">{formatDate(discount.updatedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Link
                        className="inline-block rounded-full px-3.5 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg hover:border-fjord-accent transition-all text-[12px] active:scale-[0.97]"
                        href={`/discounts/${discount.id}`}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(discount.id, discount.name)}
                        className="inline-block rounded-full px-3.5 py-1.5 border border-transparent bg-red-600/10 text-red-600 font-semibold hover:bg-red-600 hover:text-white transition-all text-[12px] active:scale-[0.97] cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-fjord-soft-line bg-fjord-bg/10 text-[13px] text-fjord-muted">
        <div>
          Showing {filteredDiscounts.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + rowsPerPage, filteredDiscounts.length)} of {filteredDiscounts.length} entries
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="rounded-lg px-3 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg disabled:opacity-40 transition cursor-pointer select-none"
          >
            Previous
          </button>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="rounded-lg px-3 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg disabled:opacity-40 transition cursor-pointer select-none"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
