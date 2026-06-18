"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { listSiteImagesAction } from "@/lib/adminImageActions";
import {
  ADMIN_UPLOAD_MAX_BYTES,
  ADMIN_UPLOAD_MAX_LABEL,
  uploadTooLargeMessage,
} from "@/lib/adminUploadLimits";
import type { SiteImageOption } from "@/lib/siteImages";

const btnChoose =
  "inline-flex shrink-0 border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90 focus-ring";

const btnSecondary =
  "inline-flex shrink-0 border border-line bg-paper px-4 py-3 text-xs tracking-[0.18em] text-ink uppercase transition hover:bg-black/[0.03] focus-ring";

type AdminFilePickerProps = {
  name: string;
  /** Hidden field for a library path (default: `{name}Existing`). */
  existingFieldName?: string;
  /** Initial library selection (edit screens). */
  existingValue?: string;
  label?: string;
  buttonLabel?: string;
  accept?: string;
  required?: boolean;
  className?: string;
};

function imageLabel(src: string, options: SiteImageOption[]): string {
  const match = options.find((o) => o.src === src);
  if (match) return match.label;
  const parts = src.split("/");
  return parts[parts.length - 1] || src;
}

export function AdminFilePicker({
  name,
  existingFieldName,
  existingValue = "",
  label = "Add image",
  buttonLabel = "Upload image",
  accept = "image/*",
  required,
  className,
}: AdminFilePickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const existingName = existingFieldName ?? `${name}Existing`;
  const [fileName, setFileName] = useState("");
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [selectedExisting, setSelectedExisting] = useState(existingValue);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [options, setOptions] = useState<SiteImageOption[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const statusText = fileName
    ? `Upload: ${fileName}`
    : selectedExisting
      ? `Site image: ${imageLabel(selectedExisting, options) || selectedExisting}`
      : "No image chosen yet";

  async function openLibrary() {
    setLibraryOpen(true);
    if (options.length > 0) return;
    setLoadingLibrary(true);
    try {
      setOptions(await listSiteImagesAction());
    } finally {
      setLoadingLibrary(false);
    }
  }

  function pickExisting(src: string) {
    setSelectedExisting(src);
    setFileName("");
    setSizeWarning(null);
    if (inputRef.current) inputRef.current.value = "";
    setLibraryOpen(false);
  }

  function onFileChange(file: File | undefined) {
    if (file && file.size > 0) {
      if (file.size > ADMIN_UPLOAD_MAX_BYTES) {
        setSizeWarning(uploadTooLargeMessage(file.name, file.size));
        setFileName("");
        setSelectedExisting("");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }

    setSizeWarning(null);
    setFileName(file?.name ?? "");
    if (file?.name) setSelectedExisting("");
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnChoose} onClick={() => inputRef.current?.click()}>
          {buttonLabel}
        </button>
        <button type="button" className={btnSecondary} onClick={() => void openLibrary()}>
          Choose existing
        </button>
        <div className="min-w-0 text-sm">
          <div className="font-medium text-ink">{label}</div>
          <div className="mt-0.5 text-xs text-muted">{statusText}</div>
          {!sizeWarning ? (
            <div className="mt-0.5 text-xs text-muted">Maximum upload size: {ADMIN_UPLOAD_MAX_LABEL}</div>
          ) : null}
        </div>
      </div>

      {sizeWarning ? (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-amber-800">
          {sizeWarning}
        </p>
      ) : null}

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required && !selectedExisting}
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0])}
      />
      <input type="hidden" name={existingName} value={selectedExisting} />

      {libraryOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Choose an existing site image"
          onClick={() => setLibraryOpen(false)}
        >
          <div
            className="flex max-h-[min(85vh,720px)] w-full max-w-3xl flex-col overflow-hidden border border-line bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h3 className="font-serif text-xl tracking-tight">Site images</h3>
                <p className="mt-1 text-xs text-muted">Click an image to use it for this field.</p>
              </div>
              <button
                type="button"
                className="focus-ring border border-line px-3 py-1.5 text-xs tracking-wide uppercase"
                onClick={() => setLibraryOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loadingLibrary ? (
                <p className="text-sm text-muted">Loading images…</p>
              ) : options.length === 0 ? (
                <p className="text-sm text-muted">No images found yet.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {options.map((option) => {
                    const selected = selectedExisting === option.src;
                    return (
                      <li key={option.src}>
                        <button
                          type="button"
                          className={`focus-ring w-full border p-1.5 text-left transition ${
                            selected ? "border-ink bg-black/[0.04]" : "border-line hover:border-ink/40"
                          }`}
                          onClick={() => pickExisting(option.src)}
                        >
                          <div className="relative aspect-square overflow-hidden bg-black/[0.04]">
                            {option.src.startsWith("/") ? (
                              <Image src={option.src} alt="" fill className="object-cover" sizes="120px" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element -- blob URLs
                              <img src={option.src} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <span className="mt-1.5 block truncate text-[0.65rem] leading-snug text-muted">
                            {option.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
