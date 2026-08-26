"use client";

import Link from "next/link";
import { useState, useEffect, DragEvent } from "react";
import Swal from "sweetalert2";
import { reorderCollectionsAction } from "./actions";
import { CollectionItem } from "../../../lib/collections";

function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function GripIcon() {
  return (
    <svg className="w-4 h-4 text-futuremilestone-muted/60 cursor-grab active:cursor-grabbing flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="5" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="9" cy="19" r="2" />
      <circle cx="15" cy="5" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="15" cy="19" r="2" />
    </svg>
  );
}

export default function CollectionList({ collections }: { collections: CollectionItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [isReordering, setIsReordering] = useState(false);
  const [orderedList, setOrderedList] = useState<CollectionItem[]>(collections);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (isSaving) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
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
      <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[22px] p-8 text-center">
        <h3 className="m-0 text-[18px] font-bold">No collections yet</h3>
        <p className="mt-1 text-futuremilestone-muted text-[13px]">Create the first collection to organize the product catalog.</p>
      </div>
    );
  }

  if (isReordering) {
    return (
      <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[24px] overflow-hidden shadow-futuremilestone-soft">
        {/* Top Controls for Reordering */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-futuremilestone-soft-line bg-futuremilestone-bg/20">
          <div>
            <h3 className="m-0 text-[15px] font-bold text-futuremilestone-ink">Rearrange Order</h3>
            <p className="m-0 mt-0.5 text-futuremilestone-muted text-[12px]">Drag and drop collections to rearrange their order on the storefront.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={isSaving}
              onClick={handleCancel}
              className="rounded-full px-4 py-2 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold hover:bg-futuremilestone-accent-soft disabled:opacity-40 transition-all text-[12px] active:scale-[0.97] cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={isSaving}
              onClick={handleSaveOrder}
              className="rounded-full px-4 py-2 border border-transparent bg-futuremilestone-accent text-futuremilestone-bg font-semibold hover:bg-opacity-90 disabled:opacity-40 transition-all text-[12px] active:scale-[0.97] cursor-pointer"
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
              className={`flex items-center gap-4 p-3 bg-futuremilestone-panel-strong border rounded-2xl select-none transition-all duration-200 ${
                draggedIndex === index
                  ? "border-futuremilestone-accent/35 opacity-40 scale-[0.98] shadow-inner"
                  : "border-futuremilestone-soft-line hover:border-futuremilestone-ink/20 shadow-sm cursor-move"
              }`}
            >
              <GripIcon />

              {collection.imageUrl ? (
                <img
                  alt={collection.name}
                  className="w-10 h-10 rounded-lg object-cover bg-futuremilestone-ink/8 border border-futuremilestone-soft-line flex-shrink-0"
                  src={collection.imageUrl}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-futuremilestone-ink/8 border border-futuremilestone-soft-line grid place-items-center text-futuremilestone-muted text-[9px] flex-shrink-0">
                  No image
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span className="font-semibold text-futuremilestone-ink block truncate">{collection.name}</span>
                <span className="text-futuremilestone-muted text-[11px] font-mono block truncate">/{collection.slug}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-[24px] overflow-hidden shadow-futuremilestone-soft">
      {/* Top Search and Page Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-futuremilestone-soft-line bg-futuremilestone-bg/20">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
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

          <button
            onClick={() => {
              setOrderedList(collections);
              setIsReordering(true);
            }}
            className="rounded-full px-4 py-1.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold hover:bg-futuremilestone-accent hover:text-futuremilestone-bg transition-all text-[12px] active:scale-[0.97] cursor-pointer"
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
            className="w-full bg-futuremilestone-panel-strong border border-futuremilestone-soft-line rounded-full px-4 py-1.5 pl-9 text-[13px] text-futuremilestone-ink placeholder-futuremilestone-muted outline-none focus:border-futuremilestone-ink/20 focus:ring-2 focus:ring-futuremilestone-ink/4 transition-all"
          />
          <svg className="absolute left-3.5 top-2.5 w-4 h-4 text-futuremilestone-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-futuremilestone-soft-line bg-futuremilestone-bg/10 text-futuremilestone-muted uppercase tracking-wider text-[11px] font-semibold">
              <th className="px-5 py-3">Collection</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Last Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-futuremilestone-soft-line/60">
            {paginatedCollections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-futuremilestone-muted">
                  No matching collections found.
                </td>
              </tr>
            ) : (
              paginatedCollections.map((collection) => (
                <tr key={collection.id} className="hover:bg-futuremilestone-accent/2 transition-colors animate-fade-in">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {collection.imageUrl ? (
                        <a
                          href={`${(process.env.NEXT_PUBLIC_STORE_URL || 'https://futuremilestone.shop').replace(/\/$/, '')}/shop?category=${collection.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on website"
                          className="hover:opacity-80 transition-opacity"
                        >
                          <img alt={collection.name} className="w-9 h-9 rounded-lg object-cover bg-futuremilestone-ink/8 border border-futuremilestone-soft-line flex-shrink-0 cursor-pointer" src={collection.imageUrl} />
                        </a>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-futuremilestone-ink/8 border border-futuremilestone-soft-line grid place-items-center text-futuremilestone-muted text-[10px] flex-shrink-0">No image</div>
                      )}
                      <a
                        href={`${(process.env.NEXT_PUBLIC_STORE_URL || 'https://futuremilestone.shop').replace(/\/$/, '')}/shop?category=${collection.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on website"
                        className="font-semibold text-futuremilestone-ink line-clamp-1 hover:underline cursor-pointer"
                      >
                        {collection.name}
                      </a>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-futuremilestone-muted font-mono">/{collection.slug}</td>
                  <td className="px-5 py-3 text-futuremilestone-muted max-w-[280px] truncate">{collection.description || "--"}</td>
                  <td className="px-5 py-3 text-futuremilestone-muted">{formatDate(collection.updatedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      className="inline-block rounded-full px-3.5 py-1.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold hover:bg-futuremilestone-accent hover:text-futuremilestone-bg hover:border-futuremilestone-accent transition-all text-[12px] active:scale-[0.97]"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-futuremilestone-soft-line bg-futuremilestone-bg/10 text-[13px] text-futuremilestone-muted">
        <div>
          Showing {filteredCollections.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + rowsPerPage, filteredCollections.length)} of {filteredCollections.length} entries
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
