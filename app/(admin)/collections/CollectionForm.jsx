"use client";

import { useActionState, useMemo, useState } from "react";
import SwalMessageEffect from "../../../components/SwalMessageEffect";

const initialState = { error: "" };

function getUploadIcon() {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function CollectionForm({
  action,
  collection,
  description,
  submitLabel,
  title,
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [form, setForm] = useState({
    imageUrl: collection?.imageUrl ?? "",
    name: collection?.name ?? "",
    description: collection?.description ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const payload = useMemo(() => JSON.stringify(form), [form]);

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const signResponse = await fetch("/api/cloudinary/sign", { method: "POST" });

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
        { method: "POST", body: uploadData },
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
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const inputClass = "w-full border border-fjord-ink/10 rounded-[18px] bg-white/92 px-[18px] py-4 text-fjord-ink outline-none transition-all duration-[160ms] focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6 text-[14px]";

  return (
    <form action={formAction} className="grid gap-3">
      <SwalMessageEffect message={state?.error} type="error" />
      <SwalMessageEffect message={uploadError} type="error" />
      <input name="collectionPayload" type="hidden" value={payload} />

      <section className="p-[18px] sm:p-[22px] bg-white/72 border border-white/72 backdrop-blur-[14px] rounded-[32px] shadow-fjord-soft">
        <div className="flex items-end justify-between gap-4 mb-[18px]">
          <div>
            <h2 className="mt-1 mb-0 text-[24px] font-bold tracking-[-0.05em]">{title}</h2>
            <p className="mt-1 mb-0 text-fjord-muted text-[14px]">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold">Collection image</label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="w-[52px] h-[52px] rounded-[16px] grid place-items-center bg-fjord-accent text-white cursor-pointer hover:bg-opacity-90 transition" htmlFor="collectionImageUpload">
                {getUploadIcon()}
              </label>
              <input
                accept="image/*"
                className="hidden"
                disabled={uploading}
                id="collectionImageUpload"
                onChange={handleImageUpload}
                type="file"
              />
              <span className="text-fjord-muted text-[13px]">
                {uploading ? "Uploading image..." : "Upload image to Cloudinary"}
              </span>
            </div>
            {form.imageUrl ? (
              <div className="mt-2 w-full max-w-[280px] rounded-[22px] overflow-hidden border border-fjord-soft-line bg-white">
                <img alt={form.name || "Collection preview"} className="block w-full h-auto object-cover" src={form.imageUrl} />
              </div>
            ) : null}
            {uploadError ? (
              <div className="px-4 py-3.5 rounded-[18px] bg-red-900/8 border border-red-900/12 text-[#8a3434] text-[14px]" role="alert">
                {uploadError}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold" htmlFor="collection-name">Name</label>
            <input
              id="collection-name"
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              type="text"
              value={form.name}
              className={inputClass}
            />
          </div>

          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold" htmlFor="collection-description">Description</label>
            <textarea
              id="collection-description"
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={6}
              value={form.description}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end mt-2">
        <button className="rounded-full px-6 py-3 border border-transparent bg-fjord-accent text-white font-semibold text-center transition hover:bg-opacity-90 active:scale-[0.98] cursor-pointer text-[14px]" disabled={isPending || uploading} type="submit">
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
