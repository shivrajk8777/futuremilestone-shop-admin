"use client";

import { useState } from "react";
import Link from "next/link";
import StatusDropdown from "./StatusDropdown";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OrderList({ orders }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter((o) =>
    o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

  if (!orders.length) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[22px] p-8 text-center">
        <h3 className="m-0 text-[18px] font-bold">No orders yet</h3>
        <p className="mt-1 text-fjord-muted text-[13px]">Order records will appear here after customers begin placing purchases.</p>
      </div>
    );
  }

  return (
    <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] overflow-hidden shadow-fjord-soft">
      {/* Search and Page Controls */}
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
            placeholder="Search orders..."
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
              <th className="px-5 py-3">Order Number</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Items</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fjord-soft-line/60">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-fjord-muted">
                  No matching orders found.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                return (
                  <tr key={order.id} className="hover:bg-fjord-accent/2 transition-colors animate-fade-in">
                    <td className="px-5 py-3 font-semibold text-fjord-ink">{order.orderNumber}</td>
                    <td className="px-5 py-3 text-fjord-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-fjord-ink">{order.customerName}</span>
                        <span className="text-fjord-muted text-[11px] block">{order.customerEmail}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-fjord-muted">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-fjord-ink">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusDropdown orderId={order.id} currentStatus={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        className="inline-block rounded-full px-3.5 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg hover:border-fjord-accent transition-all text-[12px] active:scale-[0.97]"
                        href={`/orders/${order.id}`}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-fjord-soft-line bg-fjord-bg/10 text-[13px] text-fjord-muted">
        <div>
          Showing {filteredOrders.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + rowsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
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
