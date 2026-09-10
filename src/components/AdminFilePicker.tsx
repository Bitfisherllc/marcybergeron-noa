"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
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

const filterBtn =
  "focus-ring border px-3 py-1.5 text-[0.65rem] tracking-[0.16em] uppercase transition";

function galleryFilterNames(options: SiteImageOption[]): string[] {
  const names = new Set<string>();
  for (const option of options) {
    for (const gallery of option.galleries ?? []) names.add(gallery);
  }
  return [...names].sort((a, b) => {
    if (a === "The Studio") return -1;
    if (b === "The Studio") return 1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}

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
  /** Large preview for artwork edit; compact thumb elsewhere. `none` hides picker previews. */
  preview?: "hero" | "thumb" | "none";
  /** Show a Clear button so optional fields can be emptied. */
  allowClear?: boolean;
  /** Called when the chosen file, library image, or clear changes the preview source. */
  onPreviewChange?: (src: string) => void;
};

function imageLabel(src: string, options: SiteImageOption[]): string {
  const match = options.find((o) => o.src === src);
  if (match) return match.label;
  const parts = src.split("/");
  return parts[parts.length - 1] || src;
}

function isLocalPreviewSrc(src: string) {
  return src.startsWith("blob:") || src.startsWith("data:") || !src.startsWith("/");
}

function notifyFormDirty(form: HTMLFormElement | null) {
  if (!form) return;
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
}

function PreviewMedia({ src, sizes }: { src: string; sizes: string }) {
  if (isLocalPreviewSrc(src)) {
    // eslint-disable-next-line @next/next/no-img-element -- blob and remote URLs
    return <img src={src} alt="" className="h-full w-full object-cover" />;
  }
  return <Image src={src} alt="" fill className="object-cover" sizes={sizes} />;
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
  preview,
  allowClear,
  onPreviewChange,
}: AdminFilePickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const skipNotify = useRef(true);
  const existingName = existingFieldName ?? `${name}Existing`;
  const [fileName, setFileName] = useState("");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [selectedExisting, setSelectedExisting] = useState(existingValue);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [options, setOptions] = useState<SiteImageOption[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState("all");

  const displaySrc = objectUrl || selectedExisting;
  const isReplacement = Boolean(objectUrl) || (selectedExisting !== "" && selectedExisting !== existingValue);

  const statusText = fileName
    ? `Upload: ${fileName}`
    : selectedExisting
      ? `Site image: ${imageLabel(selectedExisting, options) || selectedExisting}`
      : "No image chosen yet";

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setObjectUrl(null);
  }

  function setPreviewFile(file: File | undefined) {
    clearObjectUrl();
    if (!file) return;
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setObjectUrl(url);
  }

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (skipNotify.current) {
      skipNotify.current = false;
      return;
    }
    notifyFormDirty(inputRef.current?.form ?? null);
  }, [fileName, selectedExisting, objectUrl]);

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
    setPreviewFile(undefined);
    setSelectedExisting(src);
    setFileName("");
    setSizeWarning(null);
    if (inputRef.current) inputRef.current.value = "";
    setLibraryOpen(false);
    onPreviewChange?.(src);
  }

  function clearSelection() {
    setPreviewFile(undefined);
    setSelectedExisting("");
    setFileName("");
    setSizeWarning(null);
    if (inputRef.current) inputRef.current.value = "";
    onPreviewChange?.("");
  }

  function onFileChange(file: File | undefined) {
    if (file && file.size > 0) {
      if (file.size > ADMIN_UPLOAD_MAX_BYTES) {
        setSizeWarning(uploadTooLargeMessage(file.name, file.size));
        setFileName("");
        setSelectedExisting("");
        setPreviewFile(undefined);
        if (inputRef.current) inputRef.current.value = "";
        onPreviewChange?.("");
        return;
      }
    }

    setSizeWarning(null);
    setFileName(file?.name ?? "");
    if (file?.name) {
      setSelectedExisting("");
      setPreviewFile(file);
      const url = objectUrlRef.current ?? "";
      onPreviewChange?.(url);
    } else {
      setPreviewFile(undefined);
      onPreviewChange?.(selectedExisting);
    }
  }

  const showHero = preview === "hero";
  const showThumb = preview !== "none" && (preview === "thumb" || (preview === undefined && isReplacement));
  const replacementNote = existingValue
    ? "This image will replace the current photo when you save."
    : "This image will be used when you save.";

  return (
    <div className={className}>
      {showHero && displaySrc ? (
        <div className="mb-4">
          <div
            className={`relative aspect-[3/4] overflow-hidden border bg-black/[0.03] ${
              isReplacement ? "border-ink ring-1 ring-ink/30" : "border-line"
            }`}
          >
            <PreviewMedia src={displaySrc} sizes="(max-width: 1024px) 100vw, 40vw" />
          </div>
          {isReplacement ? (
            <p className="mt-3 text-sm leading-relaxed text-ink">{replacementNote}</p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted">Current image. Choose a new file to replace it.</p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnChoose} onClick={() => inputRef.current?.click()}>
          {buttonLabel}
        </button>
        <button type="button" className={btnSecondary} onClick={() => void openLibrary()}>
          Choose existing
        </button>
        {allowClear && displaySrc ? (
          <button type="button" className={btnSecondary} onClick={clearSelection}>
            Clear
          </button>
        ) : null}
        <div className="min-w-0 text-sm">
          <div className="font-medium text-ink">{label}</div>
          <div className="mt-0.5 text-xs text-muted">{statusText}</div>
          {!sizeWarning ? (
            <div className="mt-0.5 text-xs text-muted">Maximum upload size: {ADMIN_UPLOAD_MAX_LABEL}</div>
          ) : null}
        </div>
      </div>

      {showThumb && displaySrc && !showHero ? (
        <div className="mt-4 flex items-start gap-3">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-ink bg-black/[0.03]">
            <PreviewMedia src={displaySrc} sizes="80px" />
          </div>
          <p className="pt-1 text-sm leading-relaxed text-ink">{replacementNote}</p>
        </div>
      ) : null}

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
                <p className="mt-1 text-xs text-muted">
                  Click an image to use it for this field. The Studio gallery is included — use the filters to show
                  only those photos.
                </p>
              </div>
              <button
                type="button"
                className="focus-ring border border-line px-3 py-1.5 text-xs tracking-wide uppercase"
                onClick={() => setLibraryOpen(false)}
              >
                Close
              </button>
            </div>
            {options.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
                <button
                  type="button"
                  className={`${filterBtn} ${
                    galleryFilter === "all" ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink/40"
                  }`}
                  onClick={() => setGalleryFilter("all")}
                >
                  All
                </button>
                {galleryFilterNames(options).map((gallery) => (
                  <button
                    key={gallery}
                    type="button"
                    className={`${filterBtn} ${
                      galleryFilter === gallery
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-paper text-ink hover:border-ink/40"
                    }`}
                    onClick={() => setGalleryFilter(gallery)}
                  >
                    {gallery}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loadingLibrary ? (
                <p className="text-sm text-muted">Loading images…</p>
              ) : options.length === 0 ? (
                <p className="text-sm text-muted">No images found yet.</p>
              ) : (
                (() => {
                  const visible =
                    galleryFilter === "all"
                      ? options
                      : options.filter((option) => (option.galleries ?? []).includes(galleryFilter));
                  if (visible.length === 0) {
                    return <p className="text-sm text-muted">No images in this gallery yet.</p>;
                  }
                  return (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {visible.map((option) => {
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
                  );
                })()
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
