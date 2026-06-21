"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { reorderProductsAction, toggleProductFavoriteAction, reorderFavoriteProductsAction } from "./actions";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
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

export default function ProductList({ products: initialProducts, collections }) {
  const [products, setProducts] = useState(initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [isReordering, setIsReordering] = useState(false);
  const [orderedList, setOrderedList] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync products when initialProducts changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Sync orderedList when products or selectedCategory changes
  useEffect(() => {
    if (selectedCategory !== "all") {
      const isFavoritesFilter = selectedCategory === "favorites-filter";
      const categoryProducts = isFavoritesFilter
        ? products.filter((p) => p.favorite)
        : products.filter((p) => p.collectionId === selectedCategory);

      const sorted = [...categoryProducts].sort((a, b) => {
        if (isFavoritesFilter) {
          const orderA = a.favoriteOrder !== null && a.favoriteOrder !== undefined ? a.favoriteOrder : Infinity;
          const orderB = b.favoriteOrder !== null && b.favoriteOrder !== undefined ? b.favoriteOrder : Infinity;
          if (orderA !== orderB) return orderA - orderB;
        } else {
          const orderA = a.order !== null && a.order !== undefined ? a.order : Infinity;
          const orderB = b.order !== null && b.order !== undefined ? b.order : Infinity;
          if (orderA !== orderB) return orderA - orderB;
        }
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return timeB - timeA;
      });
      setOrderedList(sorted);
    } else {
      setOrderedList([]);
    }
  }, [products, selectedCategory]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.collectionName && p.collectionName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all"
        ? true
        : selectedCategory === "favorites-filter"
          ? p.favorite
          : p.collectionId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    if (selectedCategory !== "all") {
      const isFavoritesFilter = selectedCategory === "favorites-filter";
      if (isFavoritesFilter) {
        const orderA = a.favoriteOrder !== null && a.favoriteOrder !== undefined ? a.favoriteOrder : Infinity;
        const orderB = b.favoriteOrder !== null && b.favoriteOrder !== undefined ? b.favoriteOrder : Infinity;
        if (orderA !== orderB) return orderA - orderB;
      } else {
        const orderA = a.order !== null && a.order !== undefined ? a.order : Infinity;
        const orderB = b.order !== null && b.order !== undefined ? b.order : Infinity;
        if (orderA !== orderB) return orderA - orderB;
      }
    }
    const timeA = new Date(a.updatedAt).getTime();
    const timeB = new Date(b.updatedAt).getTime();
    return timeB - timeA;
  });

  const totalPages = Math.ceil(sortedFilteredProducts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProducts = sortedFilteredProducts.slice(startIndex, startIndex + rowsPerPage);

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
    setIsReordering(false);
    // Reset local state from products
    const isFavoritesFilter = selectedCategory === "favorites-filter";
    const categoryProducts = isFavoritesFilter
      ? products.filter((p) => p.favorite)
      : products.filter((p) => p.collectionId === selectedCategory);

    const sorted = [...categoryProducts].sort((a, b) => {
      if (isFavoritesFilter) {
        const orderA = a.favoriteOrder !== null && a.favoriteOrder !== undefined ? a.favoriteOrder : Infinity;
        const orderB = b.favoriteOrder !== null && b.favoriteOrder !== undefined ? b.favoriteOrder : Infinity;
        if (orderA !== orderB) return orderA - orderB;
      } else {
        const orderA = a.order !== null && a.order !== undefined ? a.order : Infinity;
        const orderB = b.order !== null && b.order !== undefined ? b.order : Infinity;
        if (orderA !== orderB) return orderA - orderB;
      }
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
    setOrderedList(sorted);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    const orderedIds = orderedList.map((p) => p.id);
    const isFavoritesFilter = selectedCategory === "favorites-filter";

    try {
      const result = isFavoritesFilter
        ? await reorderFavoriteProductsAction(orderedIds)
        : await reorderProductsAction(orderedIds);

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
          text: isFavoritesFilter
            ? "Favorite products order saved successfully."
            : "Products order saved successfully.",
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

  const handleToggleFavorite = async (productId, currentFavorite) => {
    const nextFavorite = !currentFavorite;

    // Optimistic UI update
    setProducts((current) =>
      current.map((p) => (p.id === productId ? { ...p, favorite: nextFavorite } : p))
    );

    try {
      const result = await toggleProductFavoriteAction(productId, nextFavorite);
      if (result?.error) {
        // Rollback on error
        setProducts((current) =>
          current.map((p) => (p.id === productId ? { ...p, favorite: currentFavorite } : p))
        );
        Swal.fire({
          icon: "error",
          text: result.error,
          confirmButtonColor: "#181b1c",
        });
      }
    } catch (err) {
      // Rollback on error
      setProducts((current) =>
        current.map((p) => (p.id === productId ? { ...p, favorite: currentFavorite } : p))
      );
      Swal.fire({
        icon: "error",
        text: "An error occurred while updating favorite status.",
        confirmButtonColor: "#181b1c",
      });
    }
  };

  const selectedCategoryName = selectedCategory === "favorites-filter"
    ? "Favorites"
    : collections?.find((c) => c.id === selectedCategory)?.name || "Selected Category";

  if (!initialProducts.length) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[22px] p-8 text-center">
        <h3 className="m-0 text-[18px] font-bold">No products yet</h3>
        <p className="mt-1 text-fjord-muted text-[13px]">Create the first product to start building the live catalog.</p>
      </div>
    );
  }

  if (isReordering) {
    return (
      <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] overflow-hidden shadow-fjord-soft animate-fade-in">
        {/* Top Controls for Reordering */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-fjord-soft-line bg-fjord-bg/20">
          <div>
            <h3 className="m-0 text-[15px] font-bold text-fjord-ink font-semibold">Rearrange Products: {selectedCategoryName}</h3>
            <p className="m-0 mt-0.5 text-fjord-muted text-[12px]">Drag and drop products to rearrange their order within this view.</p>
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
          {orderedList.length === 0 ? (
            <div className="text-center text-fjord-muted py-8">
              No products found in this category to rearrange.
            </div>
          ) : (
            orderedList.map((product, index) => (
              <div
                key={product.id}
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

                {product.imageUrl ? (
                  <img
                    alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover bg-fjord-ink/8 border border-fjord-soft-line flex-shrink-0"
                    src={product.imageUrl}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-fjord-ink/8 border border-fjord-soft-line grid place-items-center text-fjord-muted text-[9px] flex-shrink-0">
                    No image
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-fjord-ink block truncate">{product.name}</span>
                  <span className="text-fjord-muted text-[11px] block truncate font-medium">
                    {product.materialCount} materials • {product.dimensionCount} dimensions
                  </span>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-semibold text-fjord-ink block text-[13px]">{formatPrice(product.startingPrice)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] overflow-hidden shadow-fjord-soft animate-fade-in">
      {/* Top Search, Category Filter, and Page Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 border-b border-fjord-soft-line bg-fjord-bg/20">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Page size entries selector */}
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

          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-2 text-[13px] text-fjord-muted">
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-fjord-panel-strong border border-fjord-soft-line rounded-lg px-2.5 py-1.5 text-fjord-ink font-medium focus:outline-none max-w-[200px]"
            >
              <option value="all">All Categories</option>
              <option value="favorites-filter">Favorites</option>
              {collections?.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rearrange button - only visible if a specific category or favorites is selected */}
          {selectedCategory !== "all" && (
            <button
              onClick={() => {
                setIsReordering(true);
              }}
              className="rounded-full px-4 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg transition-all text-[12px] active:scale-[0.97] cursor-pointer"
            >
              Rearrange Order
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search products..."
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
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Collection</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Stock Info</th>
              <th className="px-5 py-3">Starting Price</th>
              <th className="px-5 py-3 text-center">Fav</th>
              <th className="px-5 py-3">Last Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fjord-soft-line/60">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-fjord-muted">
                  No matching products found.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-fjord-accent/2 transition-colors animate-fade-in">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img alt={product.name} className="w-9 h-9 rounded-lg object-cover bg-fjord-ink/8 border border-fjord-soft-line flex-shrink-0" src={product.imageUrl} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-fjord-ink/8 border border-fjord-soft-line grid place-items-center text-fjord-muted text-[10px] flex-shrink-0">No image</div>
                      )}
                      <span className="font-semibold text-fjord-ink line-clamp-1">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-fjord-muted">{product.collectionName || "Unassigned"}</td>
                  <td className="px-5 py-3 text-fjord-muted font-mono">/{product.slug}</td>
                  <td className="px-5 py-3 text-fjord-muted">
                    {product.materialCount} materials • {product.dimensionCount} dimensions
                  </td>
                  <td className="px-5 py-3 font-semibold text-fjord-ink">{formatPrice(product.startingPrice)}</td>
                  
                  {/* Heart button cell */}
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleToggleFavorite(product.id, product.favorite)}
                      className="inline-flex items-center justify-center p-1.5 rounded-full hover:bg-red-500/10 active:scale-90 transition-all text-fjord-muted hover:text-red-500 cursor-pointer"
                      title={product.favorite ? "Remove from Favorites" : "Mark as Favorite"}
                    >
                      {product.favorite ? (
                        <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      )}
                    </button>
                  </td>

                  <td className="px-5 py-3 text-fjord-muted">{formatDate(product.updatedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      className="inline-block rounded-full px-3.5 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg hover:border-fjord-accent transition-all text-[12px] active:scale-[0.97]"
                      href={`/products/${product.id}`}
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
          Showing {sortedFilteredProducts.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + rowsPerPage, sortedFilteredProducts.length)} of {sortedFilteredProducts.length} entries
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
