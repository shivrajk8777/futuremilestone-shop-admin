"use client";

import Link from "next/link";
import { useState } from "react";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CollectionList({ collections }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCollections = collections.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCollections.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedCollections = filteredCollections.slice(startIndex, startIndex + rowsPerPage);

  if (!collections.length) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[22px] p-8 text-center">
        <h3 className="m-0 text-[18px] font-bold">No collections yet</h3>
        <p className="mt-1 text-fjord-muted text-[13px]">Create the first collection to organize the product catalog.</p>
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
            placeholder="Search collections..."
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
              <th className="px-5 py-3">Collection</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Last Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fjord-soft-line/60">
            {paginatedCollections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-fjord-muted">
                  No matching collections found.
                </td>
              </tr>
            ) : (
              paginatedCollections.map((collection) => (
                <tr key={collection.id} className="hover:bg-fjord-accent/2 transition-colors animate-fade-in">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {collection.imageUrl ? (
                        <img alt={collection.name} className="w-9 h-9 rounded-lg object-cover bg-fjord-ink/8 border border-fjord-soft-line flex-shrink-0" src={collection.imageUrl} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-fjord-ink/8 border border-fjord-soft-line grid place-items-center text-fjord-muted text-[10px] flex-shrink-0">No image</div>
                      )}
                      <span className="font-semibold text-fjord-ink line-clamp-1">{collection.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-fjord-muted font-mono">/{collection.slug}</td>
                  <td className="px-5 py-3 text-fjord-muted max-w-[280px] truncate">{collection.description || "--"}</td>
                  <td className="px-5 py-3 text-fjord-muted">{formatDate(collection.updatedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      className="inline-block rounded-full px-3.5 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg hover:border-fjord-accent transition-all text-[12px] active:scale-[0.97]"
                      href={`/collections/${collection.id}`}
                    >
                      Edit
                    </Link>
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
          Showing {filteredCollections.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + rowsPerPage, filteredCollections.length)} of {filteredCollections.length} entries
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
