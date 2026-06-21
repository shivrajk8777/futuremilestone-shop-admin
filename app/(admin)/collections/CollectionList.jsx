"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { reorderCollectionsAction } from "./actions";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function GripIcon() {
  return (
    <svg className="w-4 h-4 text-fjord-muted/60 cursor-grab active:cursor-grabbing flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="5" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="9" cy="19" r="2" />
      <circle cx="15" cy="5" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="15" cy="19" r="2" />
    </svg>
  );
}

export default function CollectionList({ collections }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [isReordering, setIsReordering] = useState(false);
  const [orderedList, setOrderedList] = useState(collections);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setOrderedList(collections);
  }, [collections]);

  const filteredCollections = collections.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCollections.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedCollections = filteredCollections.slice(startIndex, startIndex + rowsPerPage);

  const handleDragStart = (e, index) => {
    if (isSaving) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (isSaving || draggedIndex === null || draggedIndex === index) return;

    const newList = [...orderedList];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setOrderedList(newList);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleCancel = () => {
    setOrderedList(collections);
    setIsReordering(false);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    const orderedIds = orderedList.map((c) => c.id);

    try {
      const result = await reorderCollectionsAction(orderedIds);
      if (result?.error) {
        Swal.fire({
          icon: "error",
          text: result.error,
          confirmButtonColor: "#181b1c",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Order saved",
          text: "Collections have been successfully reordered.",
          confirmButtonColor: "#181b1c",
          timer: 2000,
          showConfirmButton: false,
        });
        setIsReordering(false);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        text: "An error occurred while saving the order.",
        confirmButtonColor: "#181b1c",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!collections.length) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[22px] p-8 text-center">
        <h3 className="m-0 text-[18px] font-bold">No collections yet</h3>
        <p className="mt-1 text-fjord-muted text-[13px]">Create the first collection to organize the product catalog.</p>
      </div>
    );
  }

  if (isReordering) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] overflow-hidden shadow-fjord-soft">
        {/* Top Controls for Reordering */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-fjord-soft-line bg-fjord-bg/20">
          <div>
            <h3 className="m-0 text-[15px] font-bold text-fjord-ink">Rearrange Order</h3>
            <p className="m-0 mt-0.5 text-fjord-muted text-[12px]">Drag and drop collections to rearrange their order on the storefront.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={isSaving}
              onClick={handleCancel}
              className="rounded-full px-4 py-2 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent-soft disabled:opacity-40 transition-all text-[12px] active:scale-[0.97] cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={isSaving}
              onClick={handleSaveOrder}
              className="rounded-full px-4 py-2 border border-transparent bg-fjord-accent text-fjord-bg font-semibold hover:bg-opacity-90 disabled:opacity-40 transition-all text-[12px] active:scale-[0.97] cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Order"}
            </button>
          </div>
        </div>

        {/* Drag and drop list */}
        <div className="p-6 grid gap-2.5 max-w-xl mx-auto py-8">
          {orderedList.map((collection, index) => (
            <div
              key={collection.id}
              draggable={!isSaving}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 p-3 bg-fjord-panel-strong border rounded-2xl select-none transition-all duration-200 ${
                draggedIndex === index
                  ? "border-fjord-accent/35 opacity-40 scale-[0.98] shadow-inner"
                  : "border-fjord-soft-line hover:border-fjord-ink/20 shadow-sm cursor-move"
              }`}
            >
              <GripIcon />

              {collection.imageUrl ? (
                <img
                  alt={collection.name}
                  className="w-10 h-10 rounded-lg object-cover bg-fjord-ink/8 border border-fjord-soft-line flex-shrink-0"
                  src={collection.imageUrl}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-fjord-ink/8 border border-fjord-soft-line grid place-items-center text-fjord-muted text-[9px] flex-shrink-0">
                  No image
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span className="font-semibold text-fjord-ink block truncate">{collection.name}</span>
                <span className="text-fjord-muted text-[11px] font-mono block truncate">/{collection.slug}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] overflow-hidden shadow-fjord-soft">
      {/* Top Search and Page Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-fjord-soft-line bg-fjord-bg/20">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
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

          <button
            onClick={() => {
              setOrderedList(collections);
              setIsReordering(true);
            }}
            className="rounded-full px-4 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg transition-all text-[12px] active:scale-[0.97] cursor-pointer"
          >
            Rearrange Order
          </button>
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
