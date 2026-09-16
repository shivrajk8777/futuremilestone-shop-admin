"use client";

import { useActionState, useMemo, useState, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import SwalMessageEffect from "../../../components/SwalMessageEffect";
import { CollectionSelectItem } from "../../../lib/collections";
import { ProductDetail, ColorVariantInput, MaterialInput, DimensionInput, DetailSectionInput } from "../../../lib/products";
import { ProductActionState } from "./actions";

const initialState: ProductActionState = { error: "" };

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMaterial(): MaterialInput {
  return {
    id: uid("material"),
    name: "",
    stock: 0,
  };
}

function createColor(name = ""): ColorVariantInput {
  return {
    id: uid("color"),
    name,
    image: "",
    galleryImages: [],
  };
}

function createDimension(): DimensionInput {
  return {
    id: uid("dimension"),
    label: "",
    price: 0,
  };
}

function createDetailSection(): DetailSectionInput {
  return {
    id: uid("detail"),
    imageUrl: "",
    heading: "",
    content: "",
  };
}

function normalizeInitialProduct(product?: ProductDetail | null) {
  let colors: ColorVariantInput[] = [];

  if (product?.colors && product.colors.length > 0) {
    colors = product.colors.map((color) => ({
      id: color.id ?? uid("color"),
      name: color.name ?? "",
      image: color.image ?? "",
      galleryImages: Array.isArray(color.galleryImages) ? color.galleryImages : [],
    }));
  } else {
    colors = [createColor("Default")];
  }

  return {
    collectionId: product?.collectionId ?? "",
    name: product?.name ?? "",
    introText: product?.introText ?? "",
    description: product?.description ?? "",
    imageUrl: product?.imageUrl ?? "",
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
          stock: Number(material.stock) || 0,
        }))
        : [createMaterial()],
    colors,
    dimensions:
      product?.dimensions?.length
        ? product.dimensions.map((dimension) => ({
          id: dimension.id ?? uid("dimension"),
          label: dimension.label ?? "",
          price: Number(dimension.price) || 0,
        }))
        : [createDimension()],
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

function CloudUploadIcon({ className = "" }: { className?: string }) {
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

function ImagesIcon({ className = "" }: { className?: string }) {
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

function TrashIcon({ className = "" }: { className?: string }) {
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

function SpinnerIcon({ className = "" }: { className?: string }) {
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

function ArrowLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function GripIcon({ className = "" }: { className?: string }) {
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
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function StarIcon({ className = "" }: { className?: string }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PaletteIcon({ className = "" }: { className?: string }) {
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
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function CopyIcon({ className = "" }: { className?: string }) {
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
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export interface ProductFormProps {
  action: (state: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  collections: CollectionSelectItem[];
  product?: ProductDetail | null;
  submitLabel: string;
  title: string;
  description: string;
}

export default function ProductForm({
  action,
  collections,
  product,
  submitLabel,
  title,
  description,
}: ProductFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [form, setForm] = useState(() => normalizeInitialProduct(product));

  async function handleDuplicate() {
    if (!product?.id) return;
    const result = await Swal.fire({
      title: "Duplicate this product?",
      text: "This will open the create product page pre-filled with this product's details (images excluded). No new database entry will be created until you save.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Duplicate",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#1e1e1e",
      cancelButtonColor: "#71717a",
      background: "#18181b",
      color: "#f4f4f5",
    });

    if (result.isConfirmed) {
      router.push(`/products/new?duplicateFrom=${product.id}`);
    }
  }

  const [activeColorId, setActiveColorId] = useState<string>(() => form.colors[0]?.id || "");
  const [colorSwatchUploading, setColorSwatchUploading] = useState<Record<string, boolean>>({});
  const [colorGalleryUploading, setColorGalleryUploading] = useState<Record<string, boolean>>({});
  const [isDraggingSwatch, setIsDraggingSwatch] = useState<Record<string, boolean>>({});
  const [isDraggingGallery, setIsDraggingGallery] = useState<Record<string, boolean>>({});
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);

  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [detailsUploading, setDetailsUploading] = useState<Record<string, boolean>>({});
  const [draggingDetails, setDraggingDetails] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState("");

  const swatchInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const activeColor = useMemo(() => {
    return form.colors.find((c) => c.id === activeColorId) || form.colors[0];
  }, [form.colors, activeColorId]);

  const duplicateDimensionLabels = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of form.dimensions) {
      const key = d.label.trim().toLowerCase();
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return new Set(
      Object.keys(counts).filter((key) => counts[key] > 1)
    );
  }, [form.dimensions]);

  const payload = useMemo(
    () => {
      const normalizedColors = form.colors.map((color) => ({
        id: color.id,
        name: color.name.trim() || "Default",
        image: color.image ?? "",
        galleryImages: Array.isArray(color.galleryImages) ? color.galleryImages : [],
      }));

      const primaryImage = normalizedColors[0]?.image || normalizedColors[0]?.galleryImages?.[0] || "";
      const allGalleryImages = normalizedColors.flatMap((c) => c.galleryImages);

      return JSON.stringify({
        imageUrl: primaryImage,
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
        colors: normalizedColors,
        dimensions: form.dimensions.map((dimension) => ({
          id: dimension.id,
          label: dimension.label,
          price: Number(dimension.price) || 0,
        })),
        galleryImages: allGalleryImages,
        details: form.details.map((detail) => ({
          id: detail.id,
          imageUrl: detail.imageUrl,
          heading: detail.heading,
          content: detail.content,
        })),
        dimensionsInfo: {
          material: form.dimensionsInfo?.material ?? "",
          finish: form.dimensionsInfo?.finish ?? "",
          dimensions: form.dimensionsInfo?.dimensions ?? "",
          weight: form.dimensionsInfo?.weight ?? "",
        },
      });
    },
    [form],
  );

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  // --- Material Management ---
  function updateMaterial(id: string, field: keyof MaterialInput, value: string) {
    setForm((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.id === id ? { ...material, [field]: value } : material,
      ),
    }));
  }

  function removeMaterial(id: string) {
    setForm((current) => ({
      ...current,
      materials:
        current.materials.length > 1
          ? current.materials.filter((material) => material.id !== id)
          : current.materials,
    }));
  }

  // --- Color Variant Management ---
  function addColorVariant() {
    const newColor = createColor(`Color ${form.colors.length + 1}`);
    setForm((current) => ({
      ...current,
      colors: [...current.colors, newColor],
    }));
    setActiveColorId(newColor.id);
  }

  function removeColorVariant(colorId: string) {
    if (form.colors.length <= 1) {
      setUploadError("You must have at least one color variant.");
      return;
    }
    const updated = form.colors.filter((c) => c.id !== colorId);
    setForm((current) => ({ ...current, colors: updated }));
    if (activeColorId === colorId) {
      setActiveColorId(updated[0]?.id || "");
    }
  }

  function updateColorField<K extends keyof ColorVariantInput>(
    colorId: string,
    field: K,
    value: ColorVariantInput[K]
  ) {
    setForm((current) => ({
      ...current,
      colors: current.colors.map((c) => (c.id === colorId ? { ...c, [field]: value } : c)),
    }));
  }

  // --- Dimension Management ---
  function updateDimension(id: string, field: keyof DimensionInput, value: string) {
    setForm((current) => ({
      ...current,
      dimensions: current.dimensions.map((dimension) =>
        dimension.id === id ? { ...dimension, [field]: value } : dimension,
      ),
    }));
  }

  function removeDimension(id: string) {
    setForm((current) => ({
      ...current,
      dimensions:
        current.dimensions.length > 1
          ? current.dimensions.filter((dimension) => dimension.id !== id)
          : current.dimensions,
    }));
  }

  // --- Storytelling Detail Management ---
  function updateDetailField(id: string, field: keyof DetailSectionInput, value: string) {
    setForm((current) => ({
      ...current,
      details: current.details.map((detail) =>
        detail.id === id ? { ...detail, [field]: value } : detail,
      ),
    }));
  }

  function removeDetailSection(id: string) {
    setForm((current) => ({
      ...current,
      details: current.details.filter((detail) => detail.id !== id),
    }));
  }

  // --- Cloudinary Uploads ---
  async function uploadThumbnailFile(file: File) {
    setThumbnailUploading(true);
    setUploadError("");

    try {
      const signResponse = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!signResponse.ok) throw new Error("Could not sign upload request.");

      const { apiKey, cloudName, folder, signature, timestamp } = await signResponse.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("folder", folder);
      uploadData.append("signature", signature);
      uploadData.append("timestamp", String(timestamp));

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: uploadData }
      );

      if (!uploadResponse.ok) throw new Error("Thumbnail upload failed.");

      const result = await uploadResponse.json();
      updateField("imageUrl", result.secure_url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Thumbnail upload failed.");
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function uploadColorSwatchFile(colorId: string, file: File) {
    setColorSwatchUploading((prev) => ({ ...prev, [colorId]: true }));
    setUploadError("");

    try {
      const signResponse = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!signResponse.ok) throw new Error("Could not sign upload request.");

      const { apiKey, cloudName, folder, signature, timestamp } = await signResponse.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("folder", folder);
      uploadData.append("signature", signature);
      uploadData.append("timestamp", String(timestamp));

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: uploadData }
      );

      if (!uploadResponse.ok) throw new Error("Swatch image upload failed.");

      const result = await uploadResponse.json();
      updateColorField(colorId, "image", result.secure_url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Swatch upload failed.");
    } finally {
      setColorSwatchUploading((prev) => ({ ...prev, [colorId]: false }));
    }
  }

  async function uploadColorGalleryFiles(colorId: string, files: FileList | File[]) {
    setColorGalleryUploading((prev) => ({ ...prev, [colorId]: true }));
    setUploadError("");

    try {
      const signResponse = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!signResponse.ok) throw new Error("Could not sign upload request.");

      const { apiKey, cloudName, folder, signature, timestamp } = await signResponse.json();
      const newUrls: string[] = [];

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
          { method: "POST", body: uploadData }
        );

        if (!uploadResponse.ok) throw new Error("Gallery image upload failed.");

        const result = await uploadResponse.json();
        newUrls.push(result.secure_url);
      }

      setForm((current) => ({
        ...current,
        colors: current.colors.map((c) => {
          if (c.id !== colorId) return c;
          const updatedGallery = [...(c.galleryImages || []), ...newUrls];
          const updatedSwatch = c.image || updatedGallery[0] || "";
          return {
            ...c,
            image: updatedSwatch,
            galleryImages: updatedGallery,
          };
        }),
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Gallery upload failed.");
    } finally {
      setColorGalleryUploading((prev) => ({ ...prev, [colorId]: false }));
    }
  }

  async function uploadDetailImageFile(detailId: string, file: File) {
    setDetailsUploading((curr) => ({ ...curr, [detailId]: true }));
    setUploadError("");

    try {
      const signResponse = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (!signResponse.ok) throw new Error("Could not sign upload request.");

      const { apiKey, cloudName, folder, signature, timestamp } = await signResponse.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("folder", folder);
      uploadData.append("signature", signature);
      uploadData.append("timestamp", String(timestamp));

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: uploadData }
      );

      if (!uploadResponse.ok) throw new Error("Image upload failed.");

      const result = await uploadResponse.json();
      updateDetailField(detailId, "imageUrl", result.secure_url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Detail image upload failed.");
    } finally {
      setDetailsUploading((curr) => ({ ...curr, [detailId]: false }));
    }
  }

  // --- Color Gallery Operations ---
  function removeColorGalleryImage(colorId: string, idx: number) {
    setForm((current) => ({
      ...current,
      colors: current.colors.map((c) => {
        if (c.id !== colorId) return c;
        const newGallery = c.galleryImages.filter((_, i) => i !== idx);
        let newImage = c.image;
        if (c.image === c.galleryImages[idx]) {
          newImage = newGallery[0] || "";
        }
        return {
          ...c,
          image: newImage,
          galleryImages: newGallery,
        };
      }),
    }));
  }

  function moveColorGalleryImage(colorId: string, fromIndex: number, toIndex: number) {
    setForm((current) => ({
      ...current,
      colors: current.colors.map((c) => {
        if (c.id !== colorId) return c;
        if (toIndex < 0 || toIndex >= c.galleryImages.length) return c;
        const updated = [...c.galleryImages];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return { ...c, galleryImages: updated };
      }),
    }));
  }

  function handleColorGalleryDragStart(e: DragEvent<HTMLDivElement>, index: number) {
    e.stopPropagation();
    setDraggedGalleryIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleColorGalleryDragOver(colorId: string, e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    e.stopPropagation();
    if (draggedGalleryIndex === null || draggedGalleryIndex === index) return;

    setForm((current) => ({
      ...current,
      colors: current.colors.map((c) => {
        if (c.id !== colorId) return c;
        const newList = [...c.galleryImages];
        const item = newList[draggedGalleryIndex];
        newList.splice(draggedGalleryIndex, 1);
        newList.splice(index, 0, item);
        return { ...c, galleryImages: newList };
      }),
    }));
    setDraggedGalleryIndex(index);
  }

  function handleDragOver(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  const inputClass =
    "w-full border border-futuremilestone-ink/10 rounded-[18px] bg-futuremilestone-input-bg px-[18px] py-4 text-futuremilestone-ink outline-none transition-all duration-[160ms] focus:border-futuremilestone-ink/25 focus:ring-4 focus:ring-futuremilestone-ink/6 text-[14px]";

  const isAnyUploading =
    thumbnailUploading ||
    Object.values(colorSwatchUploading).some(Boolean) ||
    Object.values(colorGalleryUploading).some(Boolean) ||
    Object.values(detailsUploading).some(Boolean);

  return (
    <form action={formAction} className="grid gap-4">
      <SwalMessageEffect message={state?.error} type="error" />
      <SwalMessageEffect message={uploadError} type="error" />
      <input name="productPayload" type="hidden" value={payload} />

      {/* Product General Info */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">{title}</h2>
            <p className="mt-1 mb-0 text-futuremilestone-muted text-[14px]">{description}</p>
          </div>
          {product?.id && (
            <button
              type="button"
              onClick={handleDuplicate}
              className="rounded-full px-5 py-2.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold text-center transition hover:bg-futuremilestone-accent hover:text-futuremilestone-bg active:scale-[0.98] cursor-pointer inline-flex items-center gap-2 text-[13px] self-start sm:self-auto shadow-sm"
              title="Duplicate this product without images"
            >
              <CopyIcon className="w-4 h-4" />
              <span>Duplicate</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="collectionId">
              Collection
            </label>
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
            <label className="text-[14px] font-semibold" htmlFor="name">
              Product Name
            </label>
            <input
              id="name"
              onChange={(event) => updateField("name", event.target.value)}
              type="text"
              value={form.name}
              className={inputClass}
              placeholder="e.g., Elysian Minimalist Chair"
            />
          </div>

          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold" htmlFor="introText">
              Intro text
            </label>
            <input
              id="introText"
              onChange={(event) => updateField("introText", event.target.value)}
              type="text"
              value={form.introText}
              className={inputClass}
              placeholder="Short catchy tagline or brief overview"
            />
          </div>

          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              onChange={(event) => updateField("description", event.target.value)}
              rows={5}
              value={form.description}
              className={inputClass}
              placeholder="Detailed description of the product and its craft..."
            />
          </div>
        </div>
      </section>

      {/* Product Thumbnail / Cover Image */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">Product Thumbnail</h2>
            <p className="mt-1 mb-0 text-futuremilestone-muted text-[14px]">
              Upload a primary thumbnail image for this product.
            </p>
          </div>
          {form.imageUrl && (
            <button
              type="button"
              onClick={() => updateField("imageUrl", "")}
              className="px-3.5 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Remove Thumbnail
            </button>
          )}
        </div>

        <input
          accept="image/*"
          className="hidden"
          disabled={thumbnailUploading}
          id="product-thumbnail-upload"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await uploadThumbnailFile(file);
            e.target.value = "";
          }}
          ref={thumbnailInputRef}
          type="file"
        />

        <div className="max-w-md">
          {form.imageUrl ? (
            <div className="relative group rounded-[22px] overflow-hidden border border-futuremilestone-soft-line bg-futuremilestone-panel-strong shadow-md aspect-square max-w-[240px] flex items-center justify-center">
              <img
                src={form.imageUrl}
                alt="Product Thumbnail"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={thumbnailUploading}
                  className="px-3 py-1.5 bg-white text-black rounded-full font-semibold text-[12px] hover:bg-gray-100 transition shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  {thumbnailUploading ? <SpinnerIcon className="w-3.5 h-3.5" /> : <CloudUploadIcon className="w-3.5 h-3.5" />}
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => updateField("imageUrl", "")}
                  className="p-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition shadow-lg cursor-pointer"
                  title="Remove Image"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDraggingThumbnail(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingThumbnail(false);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDraggingThumbnail(false);
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith("image/")) {
                  await uploadThumbnailFile(file);
                }
              }}
              onClick={() => thumbnailInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 p-6 text-center rounded-[22px] border-2 border-dashed transition-all cursor-pointer aspect-square max-w-[240px] ${
                isDraggingThumbnail
                  ? "border-futuremilestone-accent bg-futuremilestone-accent/10 scale-[1.01]"
                  : "border-futuremilestone-soft-line bg-futuremilestone-panel-strong hover:border-futuremilestone-accent/50 hover:bg-futuremilestone-panel-strong/80"
              }`}
            >
              {thumbnailUploading ? (
                <div className="flex flex-col items-center gap-2 text-futuremilestone-accent">
                  <SpinnerIcon className="w-8 h-8" />
                  <span className="text-[13px] font-semibold">Uploading...</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-futuremilestone-accent/10 grid place-items-center text-futuremilestone-accent">
                    <CloudUploadIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="m-0 text-[13px] font-semibold text-futuremilestone-ink">
                      Click or drag thumbnail photo here
                    </p>
                    <p className="mt-1 mb-0 text-[11px] text-futuremilestone-muted">
                      JPG, PNG, WEBP (Max 10MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Materials Section */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">Materials</h2>
            <p className="mt-1 mb-0 text-futuremilestone-muted text-[14px]">
              Add one or more materials and keep stock per material.
            </p>
          </div>
          <button
            className="rounded-full px-[18px] py-2.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold text-center transition hover:bg-futuremilestone-accent hover:text-futuremilestone-bg active:scale-[0.98] cursor-pointer inline-block text-[14px]"
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
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-[18px] p-[18px] rounded-[22px] bg-futuremilestone-panel-strong border border-futuremilestone-soft-line"
              key={material.id}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="grid gap-2.5">
                  <label className="text-[14px] font-semibold" htmlFor={`material-name-${material.id}`}>
                    Material {index + 1}
                  </label>
                  <input
                    id={`material-name-${material.id}`}
                    onChange={(event) =>
                      updateMaterial(material.id, "name", event.target.value)
                    }
                    type="text"
                    value={material.name}
                    className={inputClass}
                    placeholder="e.g., Solid Teak, Walnut, Brass"
                  />
                </div>
                <div className="grid gap-2.5">
                  <label className="text-[14px] font-semibold" htmlFor={`material-stock-${material.id}`}>
                    Stock
                  </label>
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
                className="p-0 border-0 bg-transparent text-futuremilestone-muted hover:text-futuremilestone-ink cursor-pointer transition text-[14px] font-semibold"
                onClick={() => removeMaterial(material.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Color Variants & Color-Specific Galleries */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-futuremilestone-accent-soft text-futuremilestone-accent rounded-xl">
                <PaletteIcon className="w-5 h-5" />
              </div>
              <h2 className="m-0 text-[24px] font-bold tracking-[-0.05em]">Color Variants & Galleries</h2>
            </div>
            <p className="mt-1 mb-0 text-futuremilestone-muted text-[14px]">
              Add colors and manage dedicated gallery images for each color.
            </p>
          </div>
          <button
            className="rounded-full px-[18px] py-2.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold text-center transition hover:bg-futuremilestone-accent hover:text-futuremilestone-bg active:scale-[0.98] cursor-pointer inline-flex items-center gap-2 text-[14px]"
            onClick={addColorVariant}
            type="button"
          >
            <span>+</span> Add Color Variant
          </button>
        </div>

        {/* Color Tabs Header */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-futuremilestone-soft-line">
          {form.colors.map((c, index) => {
            const isActive = c.id === (activeColor?.id || form.colors[0]?.id);
            const imageCount = c.galleryImages?.length || 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveColorId(c.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] text-[13px] font-semibold transition-all duration-200 border cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-futuremilestone-accent text-futuremilestone-bg border-futuremilestone-accent shadow-md scale-[1.02]"
                    : "bg-futuremilestone-panel-strong text-futuremilestone-ink border-futuremilestone-soft-line hover:border-futuremilestone-accent/40"
                }`}
              >
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-5 h-5 rounded-full object-cover border border-white/40"
                  />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                )}
                <span>{c.name.trim() || `Color ${index + 1}`}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-black/20 text-white" : "bg-futuremilestone-ink/5 text-futuremilestone-muted"
                  }`}
                >
                  {imageCount} {imageCount === 1 ? "img" : "imgs"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Color Details & Dedicated Gallery */}
        {activeColor && (
          <div className="space-y-6 bg-futuremilestone-panel-strong p-5 sm:p-6 rounded-[26px] border border-futuremilestone-soft-line">
            <div className="flex items-center justify-between gap-4 border-b border-futuremilestone-soft-line pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-futuremilestone-ink">
                  Editing: <span className="text-futuremilestone-accent">{activeColor.name || "Unnamed Variant"}</span>
                </span>
              </div>
              {form.colors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeColorVariant(activeColor.id)}
                  className="px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Remove Color
                </button>
              )}
            </div>

            {/* Color Name Field */}
            <div className="grid gap-2">
              <label className="text-[13px] font-semibold text-futuremilestone-ink" htmlFor={`color-name-${activeColor.id}`}>
                Color / Finish Name
              </label>
              <input
                id={`color-name-${activeColor.id}`}
                onChange={(e) => updateColorField(activeColor.id, "name", e.target.value)}
                type="text"
                value={activeColor.name}
                className={inputClass}
                placeholder="e.g., Natural Oak, Matte Black, Walnut"
              />
            </div>

            {/* Color Swatch / Preview Image Upload */}
            <div className="grid gap-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-futuremilestone-ink">
                  Color Swatch / Cover Photo
                </label>
                <span className="text-[11px] text-futuremilestone-muted">
                  Used as thumbnail chip on storefront or primary photo
                </span>
              </div>

              <input
                accept="image/*"
                className="hidden"
                disabled={colorSwatchUploading[activeColor.id]}
                id={`swatch-upload-${activeColor.id}`}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await uploadColorSwatchFile(activeColor.id, file);
                  e.target.value = "";
                }}
                ref={swatchInputRef}
                type="file"
              />

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDraggingSwatch((prev) => ({ ...prev, [activeColor.id]: true }));
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingSwatch((prev) => ({ ...prev, [activeColor.id]: false }));
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDraggingSwatch((prev) => ({ ...prev, [activeColor.id]: false }));
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      await uploadColorSwatchFile(activeColor.id, file);
                    }
                  }}
                  onClick={() => !colorSwatchUploading[activeColor.id] && swatchInputRef.current?.click()}
                  className={`w-28 h-28 rounded-[20px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all duration-200 flex-shrink-0 ${
                    isDraggingSwatch[activeColor.id]
                      ? "border-futuremilestone-accent bg-futuremilestone-accent/5 scale-95"
                      : "border-futuremilestone-line bg-futuremilestone-panel/40 hover:border-futuremilestone-accent/40 hover:bg-futuremilestone-panel/60"
                  }`}
                >
                  {colorSwatchUploading[activeColor.id] ? (
                    <SpinnerIcon className="w-6 h-6 text-futuremilestone-accent" />
                  ) : activeColor.image ? (
                    <img
                      src={activeColor.image}
                      alt={activeColor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center p-2">
                      <CloudUploadIcon className="w-5 h-5 text-futuremilestone-accent mb-1" />
                      <span className="text-[10px] font-semibold text-futuremilestone-ink">Upload Swatch</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-xs text-futuremilestone-muted space-y-1.5">
                  <p className="font-semibold text-futuremilestone-ink text-[13px] m-0">
                    {activeColor.image ? "Swatch image active" : "No separate swatch image"}
                  </p>
                  <p className="m-0">
                    Upload a dedicated texture/color swatch, or click the <StarIcon className="w-3 h-3 inline text-amber-500 fill-amber-500" /> on any gallery photo below to set it as this color&apos;s cover.
                  </p>
                  {activeColor.image && (
                    <button
                      type="button"
                      onClick={() => updateColorField(activeColor.id, "image", "")}
                      className="text-red-500 hover:text-red-600 font-semibold cursor-pointer underline text-[11px]"
                    >
                      Clear swatch image
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery Images for this specific Color */}
            <div className="grid gap-2.5 pt-4 border-t border-futuremilestone-soft-line">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[14px] font-semibold text-futuremilestone-ink">
                    Gallery Images for {activeColor.name || "this color"}
                  </label>
                  <p className="text-[12px] text-futuremilestone-muted m-0">
                    Only these images will display on the storefront when users pick this color.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-futuremilestone-ink/60 bg-futuremilestone-panel px-2.5 py-1 rounded-full border border-futuremilestone-soft-line">
                  {activeColor.galleryImages?.length || 0} images
                </span>
              </div>

              <input
                accept="image/*"
                className="hidden"
                disabled={colorGalleryUploading[activeColor.id]}
                id={`gallery-upload-${activeColor.id}`}
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    await uploadColorGalleryFiles(activeColor.id, files);
                  }
                  e.target.value = "";
                }}
                ref={galleryInputRef}
                type="file"
              />

              <div
                onDragOver={handleDragOver}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingGallery((prev) => ({ ...prev, [activeColor.id]: true }));
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingGallery((prev) => ({ ...prev, [activeColor.id]: false }));
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDraggingGallery((prev) => ({ ...prev, [activeColor.id]: false }));
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    await uploadColorGalleryFiles(activeColor.id, files);
                  }
                }}
                onClick={() => !colorGalleryUploading[activeColor.id] && galleryInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center min-h-[140px] rounded-[22px] border-2 border-dashed p-5 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isDraggingGallery[activeColor.id]
                    ? "border-futuremilestone-accent bg-futuremilestone-accent/5 scale-[0.99]"
                    : "border-futuremilestone-line bg-futuremilestone-panel/40 hover:border-futuremilestone-accent/40 hover:bg-futuremilestone-panel/60"
                }`}
              >
                {colorGalleryUploading[activeColor.id] ? (
                  <div className="flex flex-col items-center justify-center gap-2 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-futuremilestone-accent/10 flex items-center justify-center text-futuremilestone-accent">
                      <SpinnerIcon className="w-5 h-5" />
                    </div>
                    <span className="text-futuremilestone-ink font-medium text-[13px]">
                      Uploading gallery photos for {activeColor.name}...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center gap-2 group">
                    <div className="w-10 h-10 rounded-xl bg-futuremilestone-accent-soft text-futuremilestone-accent flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                      <ImagesIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-semibold text-futuremilestone-ink m-0">
                        Drag & drop gallery photos for <span className="text-futuremilestone-accent font-bold">{activeColor.name || "this color"}</span>, or <span className="underline font-bold">browse</span>
                      </p>
                      <p className="text-[11px] text-futuremilestone-muted m-0">
                        Supports multiple JPG, PNG, WEBP files
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Gallery Grid for this Color */}
              {activeColor.galleryImages && activeColor.galleryImages.length > 0 ? (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between text-[12px] font-medium text-futuremilestone-muted">
                    <span className="flex items-center gap-1.5">
                      <GripIcon className="w-3.5 h-3.5" /> Drag thumbnails to reorder
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {activeColor.galleryImages.map((url, idx) => {
                      const isDragged = draggedGalleryIndex === idx;
                      const isSwatch = activeColor.image === url;
                      return (
                        <div
                          key={`${url}-${idx}`}
                          draggable
                          onDragStart={(e) => handleColorGalleryDragStart(e, idx)}
                          onDragOver={(e) => handleColorGalleryDragOver(activeColor.id, e, idx)}
                          onDragEnd={() => setDraggedGalleryIndex(null)}
                          className={`group relative aspect-square w-full rounded-[18px] overflow-hidden border bg-white shadow-sm transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
                            isDragged
                              ? "border-futuremilestone-accent ring-2 ring-futuremilestone-accent/30 scale-95 opacity-50 z-20"
                              : "border-futuremilestone-soft-line hover:border-futuremilestone-accent/50 hover:shadow-md hover:-translate-y-0.5"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Index Badge */}
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold rounded-full pointer-events-none shadow-sm">
                            <span>{idx + 1}</span>
                          </div>

                          {/* Swatch Indicator */}
                          {isSwatch && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-futuremilestone-accent text-white text-[9px] font-bold rounded-full shadow-sm flex items-center gap-0.5">
                              <StarIcon className="w-2.5 h-2.5 fill-current" />
                              Cover
                            </div>
                          )}

                          {/* Hover Overlay Controls */}
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-2 backdrop-blur-[2px]">
                            {/* Top row: Set as Swatch */}
                            <div className="flex items-center justify-end">
                              {!isSwatch && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateColorField(activeColor.id, "image", url);
                                  }}
                                  className="p-1 bg-white/95 hover:bg-white text-amber-600 rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                                  title="Set as cover/swatch photo"
                                >
                                  <StarIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Bottom row: Move Left, Remove, Move Right */}
                            <div className="flex items-center justify-between gap-1 bg-black/70 backdrop-blur-md rounded-full p-1 border border-white/20">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveColorGalleryImage(activeColor.id, idx, idx - 1);
                                }}
                                className="w-6 h-6 bg-white/90 hover:bg-white text-gray-800 disabled:opacity-30 rounded-full flex items-center justify-center transition-all cursor-pointer"
                                title="Move left"
                              >
                                <ArrowLeftIcon className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeColorGalleryImage(activeColor.id, idx);
                                }}
                                className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
                                title="Remove photo"
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                disabled={idx === activeColor.galleryImages.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveColorGalleryImage(activeColor.id, idx, idx + 1);
                                }}
                                className="w-6 h-6 bg-white/90 hover:bg-white text-gray-800 disabled:opacity-30 rounded-full flex items-center justify-center transition-all cursor-pointer"
                                title="Move right"
                              >
                                <ArrowRightIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {/* Dimensions & Pricing */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">Dimensions and pricing</h2>
            <p className="mt-1 mb-0 text-futuremilestone-muted text-[14px]">
              Each dimension entry carries its own selling price.
            </p>
          </div>
          <button
            className="rounded-full px-[18px] py-2.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold text-center transition hover:bg-futuremilestone-accent hover:text-futuremilestone-bg active:scale-[0.98] cursor-pointer inline-block text-[14px]"
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
          {form.dimensions.map((dimension, index) => {
            const isDuplicate =
              dimension.label.trim() !== "" &&
              duplicateDimensionLabels.has(dimension.label.trim().toLowerCase());

            return (
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-[18px] p-[18px] rounded-[22px] bg-futuremilestone-panel-strong border transition-all duration-200 ${
                  isDuplicate
                    ? "border-red-400 bg-red-500/5 shadow-sm"
                    : "border-futuremilestone-soft-line"
                }`}
                key={dimension.id}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div className="grid gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[14px] font-semibold" htmlFor={`dimension-label-${dimension.id}`}>
                        Dimension {index + 1}
                      </label>
                      {isDuplicate && (
                        <span className="text-[12px] font-bold text-red-600 animate-pulse flex items-center gap-1">
                          ⚠️ Duplicate Label
                        </span>
                      )}
                    </div>
                    <input
                      id={`dimension-label-${dimension.id}`}
                      onChange={(event) =>
                        updateDimension(dimension.id, "label", event.target.value)
                      }
                      type="text"
                      value={dimension.label}
                      className={`${inputClass} ${
                        isDuplicate
                          ? "!border-red-500 !bg-red-500/10 text-red-900 focus:!ring-red-500/20"
                          : ""
                      }`}
                      placeholder="e.g., Standard, Large, King"
                    />
                  </div>
                  <div className="grid gap-2.5">
                    <label className="text-[14px] font-semibold" htmlFor={`dimension-price-${dimension.id}`}>
                      Price ($ USD)
                    </label>
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
                  className="p-0 border-0 bg-transparent text-futuremilestone-muted hover:text-futuremilestone-ink cursor-pointer transition text-[14px] font-semibold"
                  onClick={() => removeDimension(dimension.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Storytelling Details */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">Storytelling Details</h2>
            <p className="mt-1 mb-0 text-futuremilestone-muted text-[14px]">
              Add dynamic storytelling sections (alternating images and descriptions).
            </p>
          </div>
          <button
            className="rounded-full px-[18px] py-2.5 border border-futuremilestone-line bg-futuremilestone-panel-strong text-futuremilestone-ink font-semibold text-center transition hover:bg-futuremilestone-accent hover:text-futuremilestone-bg active:scale-[0.98] cursor-pointer inline-block text-[14px]"
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
            <div
              className="flex flex-col gap-[18px] p-[18px] rounded-[22px] bg-futuremilestone-panel-strong border border-futuremilestone-soft-line"
              key={detail.id}
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-futuremilestone-ink">Section {index + 1}</span>
                <button
                  className="p-0 border-0 bg-transparent text-futuremilestone-muted hover:text-futuremilestone-ink cursor-pointer transition text-[14px] font-semibold"
                  onClick={() => removeDetailSection(detail.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2.5 md:col-span-1">
                  <label className="text-[14px] font-semibold text-futuremilestone-ink">Section Image</label>

                  <label
                    htmlFor={`detail-image-upload-${detail.id}`}
                    className={`relative flex flex-col items-center justify-center min-h-[160px] rounded-[24px] border-2 border-dashed p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
                      draggingDetails[detail.id]
                        ? "border-futuremilestone-accent bg-futuremilestone-accent/5 scale-[0.99]"
                        : "border-futuremilestone-line bg-futuremilestone-panel/40 hover:border-futuremilestone-accent/40 hover:bg-futuremilestone-panel/60"
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
                        <div className="w-12 h-12 rounded-full bg-futuremilestone-accent/5 flex items-center justify-center text-futuremilestone-accent">
                          <SpinnerIcon className="w-6 h-6" />
                        </div>
                        <span className="text-futuremilestone-ink font-medium text-[13px]">Uploading image...</span>
                      </div>
                    ) : detail.imageUrl ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <img
                          alt={detail.heading || "Detail preview"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={detail.imageUrl}
                        />
                        <div className="absolute inset-0 bg-futuremilestone-ink/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                          <span className="px-4 py-2 bg-futuremilestone-panel-strong text-futuremilestone-ink rounded-full text-[13px] font-semibold hover:bg-futuremilestone-accent hover:text-futuremilestone-bg transition duration-200 shadow-lg">
                            Change image
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              updateDetailField(detail.id, "imageUrl", "");
                            }}
                            className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition duration-200"
                            title="Remove image"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-futuremilestone-accent-soft text-futuremilestone-accent flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                          <CloudUploadIcon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[14px] font-semibold text-futuremilestone-ink m-0">
                            Drag & drop image here, or <span className="text-futuremilestone-accent underline font-bold">browse</span>
                          </p>
                          <p className="text-[12px] text-futuremilestone-muted m-0">Supports JPG, PNG, WEBP, GIF</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                <div className="grid gap-4 md:col-span-2">
                  <div className="grid gap-2.5">
                    <label className="text-[14px] font-semibold" htmlFor={`detail-heading-${detail.id}`}>
                      Heading
                    </label>
                    <input
                      id={`detail-heading-${detail.id}`}
                      onChange={(event) => updateDetailField(detail.id, "heading", event.target.value)}
                      type="text"
                      value={detail.heading}
                      className={inputClass}
                      placeholder="e.g., Championship Comfort"
                    />
                  </div>

                  <div className="grid gap-2.5">
                    <label className="text-[14px] font-semibold" htmlFor={`detail-content-${detail.id}`}>
                      Content
                    </label>
                    <textarea
                      id={`detail-content-${detail.id}`}
                      onChange={(event) => updateDetailField(detail.id, "content", event.target.value)}
                      rows={4}
                      value={detail.content}
                      className={inputClass}
                      placeholder="e.g., Hand-crafted with sustainably sourced solid timber..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {form.details.length === 0 && (
            <div className="text-center py-6 border border-dashed border-futuremilestone-line rounded-[22px] bg-futuremilestone-panel/40">
              <p className="text-futuremilestone-muted text-[14px] m-0">
                No dynamic storytelling details added yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex items-center justify-between mt-2">
        <div>
          {duplicateDimensionLabels.size > 0 && (
            <p className="text-[13px] font-semibold text-red-600 m-0 flex items-center gap-1.5 animate-bounce">
              ⚠️ Please fix duplicate dimension labels before saving.
            </p>
          )}
        </div>
        <button
          className="rounded-full px-7 py-3.5 border border-transparent bg-futuremilestone-accent text-futuremilestone-bg font-bold text-center transition hover:bg-opacity-90 active:scale-[0.98] cursor-pointer text-[14px] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          disabled={isPending || isAnyUploading || duplicateDimensionLabels.size > 0}
          type="submit"
        >
          {isPending || isAnyUploading ? (isAnyUploading ? "Uploading Images..." : "Saving...") : submitLabel}
        </button>
      </div>
    </form>
  );
}
