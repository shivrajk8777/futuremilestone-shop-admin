"use client";

import { useActionState, useMemo, useState, useRef } from "react";
import SwalMessageEffect from "../../../components/SwalMessageEffect";

const initialState = { error: "" };

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

export default function MasterSettingsForm({ initialSettings, action }) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [form, setForm] = useState(initialSettings);
  const [uploadingIndices, setUploadingIndices] = useState({});
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef(null);
  const activeUploadIndexRef = useRef(null);

  const payload = useMemo(
    () =>
      JSON.stringify({
        marqueeVisible: form.marqueeVisible,
        marqueeText: form.marqueeText,
        carouselVisible: form.carouselVisible,
        slides: form.slides.map((slide) => ({
          slug: slide.slug,
          name: slide.name,
          tagline: slide.tagline,
          price: Number(slide.price) || 0,
          bgImage: slide.bgImage,
          hotspots: slide.hotspots || [],
        })),
      }),
    [form],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSlide(idx, field, value) {
    setForm((current) => {
      const nextSlides = [...current.slides];
      nextSlides[idx] = { ...nextSlides[idx], [field]: value };
      return { ...current, slides: nextSlides };
    });
  }

  function addSlide() {
    setForm((current) => ({
      ...current,
      slides: [
        ...current.slides,
        {
          slug: "",
          name: "",
          tagline: "",
          price: 0,
          bgImage: "",
          hotspots: [],
        },
      ],
    }));
  }

  function removeSlide(idx) {
    setForm((current) => ({
      ...current,
      slides: current.slides.filter((_, i) => i !== idx),
    }));
  }

  async function uploadImageFile(file, idx) {
    if (!file) return;

    setUploadError("");
    setUploadingIndices((prev) => ({ ...prev, [idx]: true }));

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

      updateSlide(idx, "bgImage", result.secure_url);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setUploadingIndices((prev) => ({ ...prev, [idx]: false }));
    }
  }

  function triggerUpload(idx) {
    activeUploadIndexRef.current = idx;
    fileInputRef.current?.click();
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    const idx = activeUploadIndexRef.current;
    if (file && idx !== null) {
      await uploadImageFile(file, idx);
    }
    event.target.value = "";
    activeUploadIndexRef.current = null;
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e, idx) {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(idx);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(null);
  }

  async function handleDrop(e, idx) {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await uploadImageFile(file, idx);
    }
  }

  const inputClass =
    "w-full border border-fjord-ink/10 rounded-[18px] bg-white/92 px-[18px] py-4 text-fjord-ink outline-none transition-all duration-[160ms] focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6 text-[14px]";

  return (
    <form action={formAction} className="grid gap-4">
      <SwalMessageEffect message={state?.error} type="error" />
      <SwalMessageEffect message={uploadError} type="error" />
      <input name="settingsPayload" type="hidden" value={payload} />

      {/* Hidden file input for uploads */}
      <input
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      {/* Section 1: Marquee Settings */}
      <section className="p-[18px] sm:p-[22px] bg-white/72 border border-white/72 backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="mt-1 mb-0 text-[22px] font-bold tracking-[-0.04em]">
              Marquee Announcement
            </h2>
            <p className="mt-1 mb-0 text-fjord-muted text-[13px]">
              Toggle on/off the announcement banner at the top of the storefront homepage and customize its text.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateField("marqueeVisible", !form.marqueeVisible)}
            className={`relative inline-flex h-6.5 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              form.marqueeVisible ? "bg-fjord-accent" : "bg-fjord-ink/10"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                form.marqueeVisible ? "translate-x-5.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {form.marqueeVisible && (
          <div className="grid gap-2 mt-2">
            <label className="text-[13px] font-semibold text-fjord-ink" htmlFor="marqueeText">
              Marquee Text Content
            </label>
            <input
              id="marqueeText"
              onChange={(e) => updateField("marqueeText", e.target.value)}
              type="text"
              value={form.marqueeText}
              className={inputClass}
              placeholder="e.g. Save 20% on your first order"
            />
          </div>
        )}
      </section>

      {/* Section 2: Carousel Settings */}
      <section className="p-[18px] sm:p-[22px] bg-white/72 border border-white/72 backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="mt-1 mb-0 text-[22px] font-bold tracking-[-0.04em]">
              Hero Carousel / Slideshow
            </h2>
            <p className="mt-1 mb-0 text-fjord-muted text-[13px]">
              Toggle on/off the top full-screen slideshow on the storefront homepage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateField("carouselVisible", !form.carouselVisible)}
            className={`relative inline-flex h-6.5 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              form.carouselVisible ? "bg-fjord-accent" : "bg-fjord-ink/10"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                form.carouselVisible ? "translate-x-5.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {form.carouselVisible && (
          <div className="grid gap-4 mt-2">
            <div className="border-t border-fjord-ink/5 pt-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h3 className="text-[15px] font-bold text-fjord-ink mb-0">Carousel Slides</h3>
                <button
                  type="button"
                  onClick={addSlide}
                  className="rounded-full px-[14px] py-1.5 border border-fjord-line bg-white text-fjord-ink font-semibold text-center transition hover:bg-fjord-accent hover:text-white active:scale-[0.98] cursor-pointer inline-block text-[12px]"
                >
                  Add Slide
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {form.slides.map((slide, idx) => {
                  const isUploading = uploadingIndices[idx];
                  const isDragging = draggingIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white/50 border border-fjord-ink/5 rounded-[24px] grid grid-cols-1 lg:grid-cols-12 gap-4 relative"
                    >
                      <div className="lg:col-span-12 flex items-center justify-between border-b border-fjord-ink/5 pb-2 mb-1">
                        <span className="text-[13px] font-bold text-fjord-ink">Slide {idx + 1}</span>
                        {form.slides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlide(idx)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Remove Slide
                          </button>
                        )}
                      </div>
                      {/* Left: Image upload preview */}
                      <div className="lg:col-span-4 flex flex-col gap-2">
                        <label className="text-[13px] font-semibold text-fjord-ink">
                          Background Image (Slide {idx + 1})
                        </label>
                        <div
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, idx)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, idx)}
                          onClick={() => !isUploading && triggerUpload(idx)}
                          className={`relative flex flex-col items-center justify-center min-h-[160px] aspect-[2/1] rounded-[18px] border-2 border-dashed p-4 transition-all duration-300 cursor-pointer overflow-hidden ${
                            isDragging
                              ? "border-fjord-accent bg-fjord-accent/5 scale-[0.99]"
                              : "border-fjord-line bg-white/40 hover:border-fjord-accent/40 hover:bg-white/60"
                          }`}
                        >
                          {isUploading ? (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <SpinnerIcon className="w-6 h-6 text-fjord-accent" />
                              <span className="text-fjord-muted text-[11px] font-medium">
                                Uploading...
                              </span>
                            </div>
                          ) : slide.bgImage ? (
                            <div className="absolute inset-0 w-full h-full group">
                              <img
                                alt={slide.name || `Slide ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                src={slide.bgImage}
                              />
                              <div className="absolute inset-0 bg-fjord-ink/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerUpload(idx);
                                  }}
                                  className="px-3 py-1.5 bg-white text-fjord-ink rounded-full text-[12px] font-semibold hover:bg-fjord-accent hover:text-white transition duration-200 shadow-md"
                                >
                                  Change image
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSlide(idx, "bgImage", "");
                                  }}
                                  className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition duration-200"
                                  title="Remove image"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center gap-2">
                              <CloudUploadIcon className="w-5 h-5 text-fjord-accent" />
                              <span className="text-[12px] font-semibold text-fjord-ink">
                                Upload slide image
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Slide details fields */}
                      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <label className="text-[12px] font-semibold text-fjord-ink" htmlFor={`slide-name-${idx}`}>
                            Slide Title / Name
                          </label>
                          <input
                            id={`slide-name-${idx}`}
                            onChange={(e) => updateSlide(idx, "name", e.target.value)}
                            type="text"
                            value={slide.name}
                            className={inputClass}
                            placeholder="Slide Title"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-[12px] font-semibold text-fjord-ink" htmlFor={`slide-tagline-${idx}`}>
                            Tagline
                          </label>
                          <input
                            id={`slide-tagline-${idx}`}
                            onChange={(e) => updateSlide(idx, "tagline", e.target.value)}
                            type="text"
                            value={slide.tagline}
                            className={inputClass}
                            placeholder="Tagline description"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-[12px] font-semibold text-fjord-ink" htmlFor={`slide-price-${idx}`}>
                            Starting Price
                          </label>
                          <input
                            id={`slide-price-${idx}`}
                            onChange={(e) => updateSlide(idx, "price", e.target.value)}
                            type="number"
                            value={slide.price}
                            className={inputClass}
                            placeholder="Price"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <label className="text-[12px] font-semibold text-fjord-ink" htmlFor={`slide-slug-${idx}`}>
                            Product Slug / Link
                          </label>
                          <input
                            id={`slide-slug-${idx}`}
                            onChange={(e) => updateSlide(idx, "slug", e.target.value)}
                            type="text"
                            value={slide.slug}
                            className={inputClass}
                            placeholder="sona"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Submit Button */}
      <div className="flex justify-end mt-2">
        <button
          className="rounded-full px-6 py-3 border border-transparent bg-fjord-accent text-white font-semibold text-center transition hover:bg-opacity-90 active:scale-[0.98] cursor-pointer text-[14px]"
          disabled={isPending || Object.values(uploadingIndices).some(Boolean)}
          type="submit"
        >
          {isPending
            ? "Saving..."
            : Object.values(uploadingIndices).some(Boolean)
            ? "Uploading image..."
            : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
