"use client";

import { useState } from "react";
import Link from "next/link";
import { OrderItem } from "../../../lib/orders";
import { formatOrderPrice } from "../../../lib/formatOrderPrice";

function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export interface OrderListProps {
  orders: OrderItem[];
}

export default function OrderList({ orders }: OrderListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  const filteredOrders = orders.filter((o) => {
    // 1. Search Query filter
    const matchesSearch =
      searchQuery === "" ||
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Status filter
    const matchesStatus =
      statusFilter === "All" ||
      o.status?.toLowerCase() === statusFilter.toLowerCase();

    // 3. Date filter (match exact local calendar day)
    let matchesDate = true;
    if (filterDate) {
      if (!o.createdAt) {
        matchesDate = false;
      } else {
        const orderTime = new Date(o.createdAt).getTime();

        const [yr, mo, dy] = filterDate.split("-").map(Number);
        const start = new Date(yr, mo - 1, dy, 0, 0, 0, 0).getTime();
        const end = new Date(yr, mo - 1, dy, 23, 59, 59, 999).getTime();

        if (orderTime < start || orderTime > end) {
          matchesDate = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

  if (!orders.length) {
    return (
      <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[22px] p-8 text-center">
        <h3 className="m-0 text-[18px] font-bold">No orders yet</h3>
        <p className="mt-1 text-futuremilestone-muted text-[13px]">Order records will appear here after customers begin placing purchases.</p>
      </div>
    );
  }

  return (
    <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[24px] overflow-hidden shadow-futuremilestone-soft">
      {/* Search and Page Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-futuremilestone-soft-line bg-futuremilestone-bg/20">
        {/* Left Side: Entries count */}
        <div className="flex items-center gap-2 text-[13px] text-futuremilestone-muted">
          <span>Show</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-lg px-2.5 py-1 text-futuremilestone-ink font-medium focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        {/* Right Side: Filters & Search grouped together */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-[13px] w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-futuremilestone-muted whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-lg px-3 py-1.5 text-futuremilestone-ink font-medium focus:outline-none min-w-[120px]"
            >
              <option value="All">All Statuses</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-futuremilestone-muted whitespace-nowrap">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-lg px-3 py-1 text-futuremilestone-ink font-medium focus:outline-none text-[12px] h-[34px] w-[130px]"
            />
          </div>

          {/* Clear Filters Button */}
          {(filterDate !== "" || statusFilter !== "All" || searchQuery !== "") && (
            <button
              onClick={() => {
                setFilterDate("");
                setStatusFilter("All");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="text-futuremilestone-accent font-semibold hover:underline cursor-pointer select-none text-[12px] whitespace-nowrap"
            >
              Clear
            </button>
          )}

          {/* Search Input */}
          <div className="relative w-full sm:w-48 lg:w-64">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-full px-4 py-1.5 pl-9 text-[13px] text-futuremilestone-ink placeholder-futuremilestone-muted outline-none focus:border-futuremilestone-ink/20 focus:ring-2 focus:ring-futuremilestone-ink/4 transition-all"
            />
            <svg className="absolute left-3.5 top-2.5 w-4 h-4 text-futuremilestone-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-futuremilestone-soft-line bg-futuremilestone-bg/10 text-futuremilestone-muted uppercase tracking-wider text-[11px] font-semibold">
              <th className="px-5 py-3">Order Number</th>
              <th className="px-5 py-3 whitespace-nowrap">Date</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3 whitespace-nowrap">Items</th>
              <th className="px-5 py-3 whitespace-nowrap">Total</th>
              <th className="px-5 py-3 whitespace-nowrap">Payment Method</th>
              <th className="px-5 py-3 whitespace-nowrap">Transaction ID</th>
              <th className="px-5 py-3 whitespace-nowrap">Status</th>
              <th className="px-5 py-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-futuremilestone-soft-line/60">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-futuremilestone-muted">
                  No matching orders found.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                const txnIdDisplay = order.transactionId || `TXN-${order.id.slice(-8).toUpperCase()}`;

                return (
                  <tr key={order.id} className="hover:bg-futuremilestone-accent/2 transition-colors animate-fade-in">
                    <td className="px-5 py-3 font-semibold text-futuremilestone-ink whitespace-nowrap">{order.orderNumber}</td>
                    <td className="px-5 py-3 text-futuremilestone-muted whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-futuremilestone-ink">{order.customerName}</span>
                        <span className="text-futuremilestone-muted text-[11px] block">{order.customerEmail}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-futuremilestone-muted whitespace-nowrap">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-futuremilestone-ink whitespace-nowrap">
                      {formatOrderPrice(order.total, order.currencySymbol, order.currency)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-futuremilestone-ink/6 border border-futuremilestone-soft-line text-futuremilestone-ink">
                        💳 {order.paymentMethod || "Online"}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-futuremilestone-ink/90 bg-futuremilestone-panel-strong px-2.5 py-1 rounded-lg border border-futuremilestone-soft-line select-all inline-block" title={txnIdDisplay}>
                        {txnIdDisplay}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-block rounded-full px-3.5 py-1.5 text-[12px] font-semibold whitespace-nowrap ${
                        order.status === "Delivered"
                          ? "text-futuremilestone-success bg-futuremilestone-success/12"
                          : ["Processing", "Accepted", "Dispatched", "Shipped"].includes(order.status)
                            ? "text-[#9b6b2b] bg-[#9b6b2b]/12"
                            : ["Cancelled", "Refunded"].includes(order.status)
                              ? "text-red-600 bg-red-600/12"
                              : "text-futuremilestone-ink bg-futuremilestone-ink/6"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Link
                        className="inline-block rounded-full px-3.5 py-1.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold hover:bg-futuremilestone-accent hover:text-futuremilestone-bg hover:border-futuremilestone-accent transition-all text-[12px] active:scale-[0.97] whitespace-nowrap"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-futuremilestone-soft-line bg-futuremilestone-bg/10 text-[13px] text-futuremilestone-muted">
        <div>
          Showing {filteredOrders.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + rowsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="rounded-lg px-3 py-1.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold hover:bg-futuremilestone-accent hover:text-futuremilestone-bg disabled:opacity-40 transition cursor-pointer select-none"
          >
            Previous
          </button>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="rounded-lg px-3 py-1.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold hover:bg-futuremilestone-accent hover:text-futuremilestone-bg disabled:opacity-40 transition cursor-pointer select-none"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
