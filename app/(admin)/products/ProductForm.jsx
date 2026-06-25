"use client";

import { useActionState, useMemo, useState, useRef } from "react";
import SwalMessageEffect from "../../../components/SwalMessageEffect";

const initialState = { error: "" };

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMaterial() {
  return {
    id: uid("material"),
    name: "",
    stock: 0,
  };
}

function createDimension() {
  return {
    id: uid("dimension"),
    label: "",
    price: 0,
  };
}

function createDetailSection() {
  return {
    id: uid("detail"),
    imageUrl: "",
    heading: "",
    content: "",
  };
}

function normalizeInitialProduct(product) {
  return {
    imageUrl: product?.imageUrl ?? "",
    collectionId: product?.collectionId ?? "",
    name: product?.name ?? "",
    introText: product?.introText ?? "",
    description: product?.description ?? "",
    dimensionsInfo: {
      material: product?.dimensionsInfo?.material ?? "",
      finish: product?.dimensionsInfo?.finish ?? "",
      dimensions: product?.dimensionsInfo?.dimensions ?? "",
      weight: product?.dimensionsInfo?.weight ?? "",
    },
    materials:
      product?.materials?.length
        ? product.materials.map((material) => ({
            id: material.id ?? uid("material"),
            name: material.name ?? "",
            stock: material.stock ?? 0,
          }))
        : [createMaterial()],
    dimensions:
      product?.dimensions?.length
        ? product.dimensions.map((dimension) => ({
            id: dimension.id ?? uid("dimension"),
            label: dimension.label ?? "",
            price: dimension.price ?? 0,
          }))
        : [createDimension()],
    galleryImages: Array.isArray(product?.galleryImages) ? product.galleryImages : [],
    details:
      product?.details?.length
        ? product.details.map((detail) => ({
            id: detail.id ?? uid("detail"),
            imageUrl: detail.imageUrl ?? "",
            heading: detail.heading ?? "",
            content: detail.content ?? "",
          }))
        : [],
    favorite: product?.favorite ?? false,
  };
}

function CloudUploadIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

function ImagesIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 22H4a2 2 0 0 1-2-2V6" />
      <path d="M22 18H8a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
      <circle cx="12" cy="13" r="1" />
      <path d="m16 13-2-2-4 4" />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function SpinnerIcon({ className = "" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function ProductForm({
  action,
  collections,
  product,
  submitLabel,
  title,
  description,
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [form, setForm] = useState(() => normalizeInitialProduct(product));
  const [mainUploading, setMainUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [detailsUploading, setDetailsUploading] = useState({});
  const [draggingDetails, setDraggingDetails] = useState({});

  const mainInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const payload = useMemo(
    () =>
      JSON.stringify({
        imageUrl: form.imageUrl,
        collectionId: form.collectionId,
        name: form.name,
        introText: form.introText,
        description: form.description,
        favorite: form.favorite ?? false,
        materials: form.materials.map((material) => ({
          id: material.id,
          name: material.name,
          stock: Number(material.stock) || 0,
        })),
        dimensions: form.dimensions.map((dimension) => ({
          id: dimension.id,
          label: dimension.label,
          price: Number(dimension.price) || 0,
        })),
        galleryImages: form.galleryImages,
        details: form.details.map((detail) => ({
          id: detail.id,
          imageUrl: detail.imageUrl,
          heading: detail.heading,
          content: detail.content,
        })),
        dimensionsInfo: {
          material: form.dimensionsInfo.material,
          finish: form.dimensionsInfo.finish,
          dimensions: form.dimensionsInfo.dimensions,
          weight: form.dimensionsInfo.weight,
        },
      }),
    [form],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateDimensionsInfoField(field, value) {
    setForm((current) => ({
      ...current,
      dimensionsInfo: {
        ...current.dimensionsInfo,
        [field]: value,
      },
    }));
  }

  function updateMaterial(id, field, value) {
    setForm((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.id === id ? { ...material, [field]: value } : material,
      ),
    }));
  }

  function updateDimension(id, field, value) {
    setForm((current) => ({
      ...current,
      dimensions: current.dimensions.map((dimension) =>
        dimension.id === id ? { ...dimension, [field]: value } : dimension,
      ),
    }));
  }

  function removeMaterial(id) {
    setForm((current) => ({
      ...current,
      materials:
        current.materials.length > 1
          ? current.materials.filter((material) => material.id !== id)
          : current.materials,
    }));
  }

  function removeDimension(id) {
    setForm((current) => ({
      ...current,
      dimensions:
        current.dimensions.length > 1
          ? current.dimensions.filter((dimension) => dimension.id !== id)
          : current.dimensions,
    }));
  }

  function removeDetailSection(id) {
    setForm((current) => ({
      ...current,
      details: current.details.filter((detail) => detail.id !== id),
    }));
  }

  function updateDetailField(id, field, value) {
    setForm((current) => ({
      ...current,
      details: current.details.map((detail) =>
        detail.id === id ? { ...detail, [field]: value } : detail,
      ),
    }));
  }

  async function uploadDetailImageFile(id, file) {
    if (!file) return;

    setUploadError("");
    setDetailsUploading((current) => ({ ...current, [id]: true }));

    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
      });

      if (!signResponse.ok) {
        throw new Error("Unable to prepare upload.");
      }

      const { apiKey, cloudName, folder, signature, timestamp } =
        await signResponse.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("folder", folder);
      uploadData.append("signature", signature);
      uploadData.append("timestamp", String(timestamp));

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error("Image upload failed.");
      }

      const result = await uploadResponse.json();

      setForm((current) => ({
        ...current,
        details: current.details.map((detail) =>
          detail.id === id ? { ...detail, imageUrl: result.secure_url } : detail,
        ),
      }));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setDetailsUploading((current) => ({ ...current, [id]: false }));
    }
  }

  async function uploadMainImageFile(file) {
    if (!file) return;

    setUploadError("");
    setMainUploading(true);

    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
      });

      if (!signResponse.ok) {
        throw new Error("Unable to prepare upload.");
      }

      const { apiKey, cloudName, folder, signature, timestamp } =
        await signResponse.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("folder", folder);
      uploadData.append("signature", signature);
      uploadData.append("timestamp", String(timestamp));

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error("Image upload failed.");
      }

      const result = await uploadResponse.json();

      setForm((current) => ({
        ...current,
        imageUrl: result.secure_url,
      }));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setMainUploading(false);
    }
  }

  async function uploadGalleryFiles(files) {
    if (!files || files.length === 0) return;

    setUploadError("");
    setGalleryUploading(true);

    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
      });

      if (!signResponse.ok) {
        throw new Error("Unable to prepare upload.");
      }

      const { apiKey, cloudName, folder, signature, timestamp } =
        await signResponse.json();

      const newUrls = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("api_key", apiKey);
        uploadData.append("folder", folder);
        uploadData.append("signature", signature);
        uploadData.append("timestamp", String(timestamp));

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: uploadData,
          },
        );

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed.");
        }

        const result = await uploadResponse.json();
        newUrls.push(result.secure_url);
      }

      setForm((current) => ({
        ...current,
        galleryImages: [...(current.galleryImages || []), ...newUrls],
      }));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Gallery upload failed.",
      );
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (file) {
      await uploadMainImageFile(file);
    }
    event.target.value = "";
  }

  async function handleGalleryUpload(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      await uploadGalleryFiles(files);
    }
    event.target.value = "";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnterMain(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMain(true);
  }

  function handleDragLeaveMain(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMain(false);
  }

  async function handleDropMain(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMain(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await uploadMainImageFile(file);
    }
  }

  function handleDragEnterGallery(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingGallery(true);
  }

  function handleDragLeaveGallery(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingGallery(false);
  }

  async function handleDropGallery(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingGallery(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadGalleryFiles(files);
    }
  }

  function removeGalleryImage(idx) {
    setForm((current) => ({
      ...current,
      galleryImages: current.galleryImages.filter((_, i) => i !== idx),
    }));
  }

  const inputClass = "w-full border border-fjord-ink/10 rounded-[18px] bg-white/92 px-[18px] py-4 text-fjord-ink outline-none transition-all duration-[160ms] focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6 text-[14px]";

  return (
    <form action={formAction} className="grid gap-3">
      <SwalMessageEffect message={state?.error} type="error" />
      <SwalMessageEffect message={uploadError} type="error" />
      <input name="productPayload" type="hidden" value={payload} />

      <section className="p-[18px] sm:p-[22px] bg-white/72 border border-white/72 backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">{title}</h2>
            <p className="mt-1 mb-0 text-fjord-muted text-[14px]">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold text-fjord-ink">Product image</label>
            
            <input
              accept="image/*"
              className="hidden"
              disabled={mainUploading}
              id="productImageUpload"
              onChange={handleImageUpload}
              ref={mainInputRef}
              type="file"
            />

            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnterMain}
              onDragLeave={handleDragLeaveMain}
              onDrop={handleDropMain}
              onClick={() => !mainUploading && mainInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center min-h-[220px] rounded-[24px] border-2 border-dashed p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
                isDraggingMain
                  ? "border-fjord-accent bg-fjord-accent/5 scale-[0.99]"
                  : "border-fjord-line bg-white/40 hover:border-fjord-accent/40 hover:bg-white/60"
              }`}
            >
              {mainUploading ? (
                <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-fjord-accent/5 flex items-center justify-center text-fjord-accent animate-pulse-ring">
                    <SpinnerIcon className="w-6 h-6" />
                  </div>
                  <span className="text-fjord-ink font-medium text-[13px]">Uploading image...</span>
                </div>
              ) : form.imageUrl ? (
                <div className="absolute inset-0 w-full h-full group">
                  <img
                    alt={form.name || "Product preview"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={form.imageUrl}
                  />
                  <div className="absolute inset-0 bg-fjord-ink/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        mainInputRef.current?.click();
                      }}
                      className="px-4 py-2 bg-white text-fjord-ink rounded-full text-[13px] font-semibold hover:bg-fjord-accent hover:text-white transition duration-200 shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-300"
                    >
                      Change image
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateField("imageUrl", "");
                      }}
                      className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition duration-200 transform translate-y-2 group-hover:translate-y-0 duration-300 delay-75"
                      title="Remove image"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-fjord-accent-soft text-fjord-accent flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-fjord-accent group-hover:text-white group-hover:shadow-md animate-float">
                    <CloudUploadIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-semibold text-fjord-ink m-0">
                      Drag & drop image here, or <span className="text-fjord-accent underline font-bold">browse</span>
                    </p>
                    <p className="text-[12px] text-fjord-muted m-0">
                      Supports JPG, PNG, WEBP, GIF
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold text-fjord-ink">Product gallery images</label>
            
            <input
              accept="image/*"
              className="hidden"
              disabled={galleryUploading}
              id="galleryImageUpload"
              multiple
              onChange={handleGalleryUpload}
              ref={galleryInputRef}
              type="file"
            />

            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnterGallery}
              onDragLeave={handleDragLeaveGallery}
              onDrop={handleDropGallery}
              onClick={() => !galleryUploading && galleryInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center min-h-[160px] rounded-[24px] border-2 border-dashed p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
                isDraggingGallery
                  ? "border-fjord-accent bg-fjord-accent/5 scale-[0.99]"
                  : "border-fjord-line bg-white/40 hover:border-fjord-accent/40 hover:bg-white/60"
              }`}
            >
              {galleryUploading ? (
                <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-fjord-accent/5 flex items-center justify-center text-fjord-accent animate-pulse-ring">
                    <SpinnerIcon className="w-6 h-6" />
                  </div>
                  <span className="text-fjord-ink font-medium text-[13px]">Uploading gallery images...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-fjord-accent-soft text-fjord-accent flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-fjord-accent group-hover:text-white group-hover:shadow-md animate-float">
                    <ImagesIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-semibold text-fjord-ink m-0">
                      Drag & drop gallery images here, or <span className="text-fjord-accent underline font-bold">browse</span>
                    </p>
                    <p className="text-[12px] text-fjord-muted m-0">
                      Upload one or more additional images for the product detail page gallery
                    </p>
                  </div>
                </div>
              )}
            </div>

            {form.galleryImages && form.galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-4">
                {form.galleryImages.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square w-full rounded-[18px] overflow-hidden border border-fjord-soft-line bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                  >
                    <img
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium rounded-full pointer-events-none transition-opacity duration-200 group-hover:opacity-0">
                      {idx + 1}
                    </span>

                    <div className="absolute inset-0 bg-fjord-ink/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[1px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeGalleryImage(idx);
                        }}
                        className="w-9 h-9 bg-white text-red-600 hover:bg-red-50 hover:scale-110 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                        title="Remove image"
                      >
                        <TrashIcon className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="collectionId">Collection</label>
            <select
              id="collectionId"
              onChange={(event) => updateField("collectionId", event.target.value)}
              value={form.collectionId}
              className={inputClass}
            >
              <option value="">Select a collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="name">Name</label>
            <input
              id="name"
              onChange={(event) => updateField("name", event.target.value)}
              type="text"
              value={form.name}
              className={inputClass}
            />
          </div>

          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="introText">Intro text</label>
            <input
              id="introText"
              onChange={(event) => updateField("introText", event.target.value)}
              type="text"
              value={form.introText}
              className={inputClass}
            />
          </div>

          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold" htmlFor="description">Description</label>
            <textarea
              id="description"
              onChange={(event) => updateField("description", event.target.value)}
              rows={6}
              value={form.description}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 md:col-span-2 border-t border-fjord-soft-line pt-5 mt-2">
            <h3 className="text-[16px] font-bold text-fjord-ink">Dimensions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2.5">
                <label className="text-[14px] font-semibold text-fjord-ink" htmlFor="dim-material">Material</label>
                <input
                  id="dim-material"
                  onChange={(event) => updateDimensionsInfoField("material", event.target.value)}
                  type="text"
                  value={form.dimensionsInfo?.material ?? ""}
                  className={inputClass}
                  placeholder="e.g. Oak Wood"
                />
              </div>
              <div className="grid gap-2.5">
                <label className="text-[14px] font-semibold text-fjord-ink" htmlFor="dim-finish">Finish</label>
                <input
                  id="dim-finish"
                  onChange={(event) => updateDimensionsInfoField("finish", event.target.value)}
                  type="text"
                  value={form.dimensionsInfo?.finish ?? ""}
                  className={inputClass}
                  placeholder="e.g. Matte Polyurethane"
                />
              </div>
              <div className="grid gap-2.5">
                <label className="text-[14px] font-semibold text-fjord-ink" htmlFor="dim-dimensions">Dimensions</label>
                <input
                  id="dim-dimensions"
                  onChange={(event) => updateDimensionsInfoField("dimensions", event.target.value)}
                  type="text"
                  value={form.dimensionsInfo?.dimensions ?? ""}
                  className={inputClass}
                  placeholder="e.g. 120cm x 60cm x 75cm"
                />
              </div>
              <div className="grid gap-2.5">
                <label className="text-[14px] font-semibold text-fjord-ink" htmlFor="dim-weight">Weight</label>
                <input
                  id="dim-weight"
                  onChange={(event) => updateDimensionsInfoField("weight", event.target.value)}
                  type="text"
                  value={form.dimensionsInfo?.weight ?? ""}
                  className={inputClass}
                  placeholder="e.g. 15 kg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="p-[18px] sm:p-[22px] bg-white/72 border border-white/72 backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">Materials</h2>
            <p className="mt-1 mb-0 text-fjord-muted text-[14px]">Add one or more materials and keep stock per material.</p>
          </div>
          <button
            className="rounded-full px-[18px] py-3 border border-fjord-line bg-white text-fjord-ink font-semibold text-center transition hover:bg-fjord-accent hover:text-white active:scale-[0.98] cursor-pointer inline-block text-[14px]"
            onClick={() =>
              setForm((current) => ({
                ...current,
                materials: [...current.materials, createMaterial()],
              }))
            }
            type="button"
          >
            Add material
          </button>
        </div>

        <div className="grid gap-3">
          {form.materials.map((material, index) => (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[18px] p-[18px] rounded-[22px] bg-white border border-fjord-soft-line" key={material.id}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="grid gap-2.5">
                  <label className="text-[14px] font-semibold" htmlFor={`material-name-${material.id}`}>Material {index + 1}</label>
                  <input
                    id={`material-name-${material.id}`}
                    onChange={(event) =>
                      updateMaterial(material.id, "name", event.target.value)
                    }
                    type="text"
                    value={material.name}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-2.5">
                  <label className="text-[14px] font-semibold" htmlFor={`material-stock-${material.id}`}>Stock</label>
                  <input
                    id={`material-stock-${material.id}`}
                    min="0"
                    onChange={(event) =>
                      updateMaterial(material.id, "stock", event.target.value)
                    }
                    type="number"
                    value={material.stock}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                className="p-0 border-0 bg-transparent text-fjord-muted hover:text-fjord-ink cursor-pointer transition text-[14px] font-semibold"
                onClick={() => removeMaterial(material.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="p-[18px] sm:p-[22px] bg-white/72 border border-white/72 backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">Dimensions and pricing</h2>
            <p className="mt-1 mb-0 text-fjord-muted text-[14px]">Each dimension entry carries its own selling price.</p>
          </div>
          <button
            className="rounded-full px-[18px] py-3 border border-fjord-line bg-white text-fjord-ink font-semibold text-center transition hover:bg-fjord-accent hover:text-white active:scale-[0.98] cursor-pointer inline-block text-[14px]"
            onClick={() =>
              setForm((current) => ({
                ...current,
                dimensions: [...current.dimensions, createDimension()],
              }))
            }
            type="button"
          >
            Add dimension
          </button>
        </div>

        <div className="grid gap-3">
          {form.dimensions.map((dimension, index) => (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[18px] p-[18px] rounded-[22px] bg-white border border-fjord-soft-line" key={dimension.id}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="grid gap-2.5">
                  <label className="text-[14px] font-semibold" htmlFor={`dimension-label-${dimension.id}`}>Dimension {index + 1}</label>
                  <input
                    id={`dimension-label-${dimension.id}`}
                    onChange={(event) =>
                      updateDimension(dimension.id, "label", event.target.value)
                    }
                    type="text"
                    value={dimension.label}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-2.5">
                  <label className="text-[14px] font-semibold" htmlFor={`dimension-price-${dimension.id}`}>Price</label>
                  <input
                    id={`dimension-price-${dimension.id}`}
                    min="0"
                    onChange={(event) =>
                      updateDimension(dimension.id, "price", event.target.value)
                    }
                    step="0.01"
                    type="number"
                    value={dimension.price}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                className="p-0 border-0 bg-transparent text-fjord-muted hover:text-fjord-ink cursor-pointer transition text-[14px] font-semibold"
                onClick={() => removeDimension(dimension.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="p-[18px] sm:p-[22px] bg-white/72 border border-white/72 backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">Storytelling Details</h2>
            <p className="mt-1 mb-0 text-fjord-muted text-[14px]">Add dynamic detailed storytelling sections (alternating images and descriptions).</p>
          </div>
          <button
            className="rounded-full px-[18px] py-3 border border-fjord-line bg-white text-fjord-ink font-semibold text-center transition hover:bg-fjord-accent hover:text-white active:scale-[0.98] cursor-pointer inline-block text-[14px]"
            onClick={() =>
              setForm((current) => ({
                ...current,
                details: [...current.details, createDetailSection()],
              }))
            }
            type="button"
          >
            Add section
          </button>
        </div>

        <div className="grid gap-4">
          {form.details.map((detail, index) => (
            <div className="flex flex-col gap-[18px] p-[18px] rounded-[22px] bg-white border border-fjord-soft-line" key={detail.id}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-fjord-ink">Section {index + 1}</span>
                <button
                  className="p-0 border-0 bg-transparent text-fjord-muted hover:text-fjord-ink cursor-pointer transition text-[14px] font-semibold"
                  onClick={() => removeDetailSection(detail.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2.5 md:col-span-1">
                  <label className="text-[14px] font-semibold text-fjord-ink">Section Image</label>
                  
                  <label
                    htmlFor={`detail-image-upload-${detail.id}`}
                    className={`relative flex flex-col items-center justify-center min-h-[160px] rounded-[24px] border-2 border-dashed p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
                      draggingDetails[detail.id]
                        ? "border-fjord-accent bg-fjord-accent/5 scale-[0.99]"
                        : "border-fjord-line bg-white/40 hover:border-fjord-accent/40 hover:bg-white/60"
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDraggingDetails((curr) => ({ ...curr, [detail.id]: true }));
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDraggingDetails((curr) => ({ ...curr, [detail.id]: false }));
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDraggingDetails((curr) => ({ ...curr, [detail.id]: false }));
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        await uploadDetailImageFile(detail.id, file);
                      }
                    }}
                  >
                    <input
                      accept="image/*"
                      className="hidden"
                      disabled={detailsUploading[detail.id]}
                      id={`detail-image-upload-${detail.id}`}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          await uploadDetailImageFile(detail.id, file);
                        }
                        event.target.value = "";
                      }}
                      type="file"
                    />
                    {detailsUploading[detail.id] ? (
                      <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-fjord-accent/5 flex items-center justify-center text-fjord-accent animate-pulse-ring">
                          <SpinnerIcon className="w-6 h-6" />
                        </div>
                        <span className="text-fjord-ink font-medium text-[13px]">Uploading image...</span>
                      </div>
                    ) : detail.imageUrl ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <img
                          alt={detail.heading || "Detail preview"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={detail.imageUrl}
                        />
                        <div className="absolute inset-0 bg-fjord-ink/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                          <span
                            className="px-4 py-2 bg-white text-fjord-ink rounded-full text-[13px] font-semibold hover:bg-fjord-accent hover:text-white transition duration-200 shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-300"
                          >
                            Change image
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              updateDetailField(detail.id, "imageUrl", "");
                            }}
                            className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition duration-200 transform translate-y-2 group-hover:translate-y-0 duration-300 delay-75 inline-flex items-center justify-center border-none"
                            title="Remove image"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-fjord-accent-soft text-fjord-accent flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-fjord-accent group-hover:text-white group-hover:shadow-md animate-float">
                          <CloudUploadIcon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[14px] font-semibold text-fjord-ink m-0">
                            Drag & drop image here, or <span className="text-fjord-accent underline font-bold">browse</span>
                          </p>
                          <p className="text-[12px] text-fjord-muted m-0">
                            Supports JPG, PNG, WEBP, GIF
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                
                <div className="grid gap-4 md:col-span-2">
                  <div className="grid gap-2.5">
                    <label className="text-[14px] font-semibold" htmlFor={`detail-heading-${detail.id}`}>Heading</label>
                    <input
                      id={`detail-heading-${detail.id}`}
                      onChange={(event) =>
                        updateDetailField(detail.id, "heading", event.target.value)
                      }
                      type="text"
                      value={detail.heading}
                      className={inputClass}
                      placeholder="e.g., Championship Comfort"
                    />
                  </div>
                  
                  <div className="grid gap-2.5">
                    <label className="text-[14px] font-semibold" htmlFor={`detail-content-${detail.id}`}>Content</label>
                    <textarea
                      id={`detail-content-${detail.id}`}
                      onChange={(event) =>
                        updateDetailField(detail.id, "content", event.target.value)
                      }
                      rows={4}
                      value={detail.content}
                      className={inputClass}
                      placeholder="e.g., Tested and verified for ultimate posture support..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {form.details.length === 0 && (
            <div className="text-center py-6 border border-dashed border-fjord-line rounded-[22px] bg-white/40">
              <p className="text-fjord-muted text-[14px] m-0">No dynamic storytelling details added yet. Using default fallback sections.</p>
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end mt-2">
        <button
          className="rounded-full px-6 py-3 border border-transparent bg-fjord-accent text-white font-semibold text-center transition hover:bg-opacity-90 active:scale-[0.98] cursor-pointer text-[14px]"
          disabled={isPending || mainUploading || galleryUploading || Object.values(detailsUploading).some(Boolean)}
          type="submit"
        >
          {(isPending || mainUploading || galleryUploading || Object.values(detailsUploading).some(Boolean)) ? (
            (mainUploading || galleryUploading || Object.values(detailsUploading).some(Boolean)) ? "Uploading..." : "Saving..."
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
