"use client";

import { useState, useRef, FormEvent, ChangeEvent, DragEvent } from "react";
import { convertToWebP } from "../../../lib/image-convert";


function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
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

export interface TeamFormProps {
  member?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function TeamForm({ member, onCancel, onSuccess }: TeamFormProps) {
  const isEdit = !!member;
  const [form, setForm] = useState({
    name: member?.name || "",
    role: member?.role || "",
    image: member?.image || "",
    socials: member?.socials || { twitter: "#", instagram: "#", behance: "#" },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: string, val: any) => {
    setForm((f) => ({ ...f, [field]: val }));
  };

  const updateSocial = (socialField: string, val: string) => {
    setForm((f) => ({
      ...f,
      socials: { ...f.socials, [socialField]: val },
    }));
  };

  // Cloudinary direct upload function
  const uploadImageFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
      });

      if (!signResponse.ok) {
        throw new Error("Unable to prepare upload.");
      }

      const [signData, webpFile] = await Promise.all([
        signResponse.json(),
        convertToWebP(file),
      ]);
      const { apiKey, cloudName, folder, signature, timestamp } = signData;

      const uploadData = new FormData();
      uploadData.append("file", webpFile);
      uploadData.append("api_key", apiKey);
      uploadData.append("folder", folder);
      uploadData.append("signature", signature);
      uploadData.append("timestamp", String(timestamp));

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Image upload failed.");
      }

      const result = await uploadResponse.json();
      updateField("image", result.secure_url);
    } catch (err) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImageFile(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await uploadImageFile(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.role.trim()) {
      setError("Role is required.");
      return;
    }
    if (!form.image) {
      setError("Profile image is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = isEdit ? `/api/team/${member.id}` : "/api/team";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "Failed to save team member.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-futuremilestone-ink/10 rounded-[18px] bg-futuremilestone-input-bg px-[18px] py-4 text-futuremilestone-ink outline-none transition-all duration-[160ms] focus:border-futuremilestone-ink/25 focus:ring-4 focus:ring-futuremilestone-ink/6 text-[14px]";
  const labelClass = "text-[14px] font-semibold text-futuremilestone-ink";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl w-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.05em] text-futuremilestone-ink">
            {isEdit ? "Edit Team Member" : "Add Team Member"}
          </h1>
          <p className="text-futuremilestone-muted text-[14px] mt-1">
            {isEdit ? "Update profile photo and credentials." : "Create a new team member profile."}
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full px-6 py-3 bg-futuremilestone-accent text-futuremilestone-bg font-semibold text-[14px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
        >
          {saving ? <><SpinnerIcon className="h-4 w-4" /> Saving...</> : (isEdit ? "Update Member" : "Add Member")}
        </button>
      </div>

      {(error || uploadError) && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-[18px] px-5 py-3.5 text-[13px] font-medium">
          {error || uploadError}
        </div>
      )}

      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft flex flex-col gap-5">
        <div className="grid gap-2.5">
          <label className={labelClass}>Profile Photo</label>

          <input
            accept="image/*"
            className="hidden"
            disabled={uploading}
            id="teamMemberImageUpload"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />

          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center min-h-[220px] rounded-[24px] border-2 border-dashed p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
              isDragging
                ? "border-futuremilestone-accent bg-futuremilestone-accent/5 scale-[0.99]"
                : "border-futuremilestone-line bg-futuremilestone-panel/40 hover:border-futuremilestone-accent/40 hover:bg-futuremilestone-panel/60"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-futuremilestone-accent/5 flex items-center justify-center text-futuremilestone-accent">
                  <SpinnerIcon className="w-6 h-6" />
                </div>
                <span className="text-futuremilestone-ink font-medium text-[13px]">Uploading profile photo...</span>
              </div>
            ) : form.image ? (
              <div className="absolute inset-0 w-full h-full group">
                <img
                  alt={form.name || "Preview"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={form.image}
                />
                <div className="absolute inset-0 bg-futuremilestone-ink/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-futuremilestone-panel-strong text-futuremilestone-ink rounded-full text-[13px] font-semibold hover:bg-futuremilestone-accent hover:text-futuremilestone-bg transition duration-200 shadow-lg"
                  >
                    Change photo
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateField("image", "");
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-full text-[13px] font-semibold hover:bg-red-600 transition duration-200 shadow-lg"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-futuremilestone-panel-strong border border-futuremilestone-soft-line flex items-center justify-center text-futuremilestone-muted">
                  <CloudUploadIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-futuremilestone-ink font-bold text-[14px]">Click to upload</span>
                  <span className="text-futuremilestone-muted text-[13px]"> or drag and drop</span>
                  <p className="text-futuremilestone-muted text-[11px] mt-1">PNG, JPG or WEBP up to 5MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label htmlFor="member-name" className={labelClass}>Full Name</label>
            <input
              id="member-name"
              type="text"
              placeholder="E.g. Erik Jansen"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="member-role" className={labelClass}>Role / Title</label>
            <input
              id="member-role"
              type="text"
              placeholder="E.g. Head of Design"
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-futuremilestone-soft-line pt-4 mt-2">
          <h3 className="text-[14px] font-bold text-futuremilestone-ink mb-3 font-dm-sans">Social Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <label htmlFor="social-twitter" className="text-[12px] font-semibold text-futuremilestone-muted">Twitter URL</label>
              <input
                id="social-twitter"
                type="text"
                placeholder="E.g. #"
                value={form.socials.twitter}
                onChange={(e) => updateSocial("twitter", e.target.value)}
                className="w-full border border-futuremilestone-ink/10 rounded-xl bg-futuremilestone-input-bg px-4 py-3 text-futuremilestone-ink outline-none text-xs focus:border-futuremilestone-ink/25"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="social-instagram" className="text-[12px] font-semibold text-futuremilestone-muted">Instagram URL</label>
              <input
                id="social-instagram"
                type="text"
                placeholder="E.g. #"
                value={form.socials.instagram}
                onChange={(e) => updateSocial("instagram", e.target.value)}
                className="w-full border border-futuremilestone-ink/10 rounded-xl bg-futuremilestone-input-bg px-4 py-3 text-futuremilestone-ink outline-none text-xs focus:border-futuremilestone-ink/25"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="social-behance" className="text-[12px] font-semibold text-futuremilestone-muted">Behance URL</label>
              <input
                id="social-behance"
                type="text"
                placeholder="E.g. #"
                value={form.socials.behance}
                onChange={(e) => updateSocial("behance", e.target.value)}
                className="w-full border border-futuremilestone-ink/10 rounded-xl bg-futuremilestone-input-bg px-4 py-3 text-futuremilestone-ink outline-none text-xs focus:border-futuremilestone-ink/25"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-futuremilestone-soft-line pt-4 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-5 py-2.5 border border-futuremilestone-line bg-transparent hover:bg-futuremilestone-panel text-futuremilestone-ink font-semibold text-[13px] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full px-6 py-2.5 bg-futuremilestone-accent text-futuremilestone-bg font-semibold text-[13px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
        >
          {saving ? "Saving..." : (isEdit ? "Update Member" : "Add Member")}
        </button>
      </div>
    </form>
  );
}
