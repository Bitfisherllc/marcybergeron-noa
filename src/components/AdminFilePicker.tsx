"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { addExistingArtworkToGallery } from "@/app/admin/actions";
import { listPaintingsForPickerAction } from "@/lib/adminImageActions";
import { ADMIN_UPLOAD_HINT } from "@/lib/adminUploadLimits";
import { useAdminImageUpload } from "@/lib/shrinkImageForUpload";
import { ArtworkPickerDialog, type AdminArtworkSelectOption } from "@/components/AdminArtworkSelect";

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
  /** Large preview for artwork edit; compact thumb elsewhere. `none` hides picker previews. */
  preview?: "hero" | "thumb" | "none";
  /** Show a Clear button so optional fields can be emptied. */
  allowClear?: boolean;
  /** Called when the chosen file, library image, or clear changes the preview source. */
  onPreviewChange?: (src: string) => void;
  /** Stack buttons in a narrow column (slideshow slots). */
  layout?: "row" | "stack";
  /**
   * When set, Choose a painting adds that existing painting to this gallery.
   * Title, size, material, and price stay on the original painting.
   */
  linkSeriesId?: string;
};

function imageLabel(src: string): string {
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
  layout = "row",
  linkSeriesId,
}: AdminFilePickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const skipNotify = useRef(true);
  const existingName = existingFieldName ?? `${name}Existing`;
  const [fileName, setFileName] = useState("");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [selectedExisting, setSelectedExisting] = useState(existingValue);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [paintingOpen, setPaintingOpen] = useState(false);
  const [paintings, setPaintings] = useState<AdminArtworkSelectOption[]>([]);
  const [loadingPaintings, setLoadingPaintings] = useState(false);
  const upload = useAdminImageUpload();

  const displaySrc = objectUrl || selectedExisting;
  const isReplacement = Boolean(objectUrl) || (selectedExisting !== "" && selectedExisting !== existingValue);

  const statusText = fileName
    ? `Upload: ${fileName}`
    : selectedExisting
      ? selectedLabel || imageLabel(selectedExisting)
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

  function pickExisting(src: string, label = "") {
    upload.reset();
    setPreviewFile(undefined);
    setSelectedExisting(src);
    setSelectedLabel(label);
    setFileName("");
    setSizeError(null);
    setSizeWarning(null);
    if (inputRef.current) inputRef.current.value = "";
    setPaintingOpen(false);
    onPreviewChange?.(src);
  }

  async function openPaintings() {
    setPaintingOpen(true);
    if (paintings.length > 0) return;
    setLoadingPaintings(true);
    try {
      const rows = await listPaintingsForPickerAction();
      setPaintings(
        rows.map((row) => ({
          id: row.id,
          label: row.label || row.title,
          image: row.image,
          gallery: row.gallery,
          gallerySortOrder: row.gallerySortOrder,
          series: row.series,
        })),
      );
    } finally {
      setLoadingPaintings(false);
    }
  }

  async function pickPainting(id: string) {
    if (linkSeriesId) {
      setPaintingOpen(false);
      const data = new FormData();
      data.set("artworkId", id);
      data.set("seriesId", linkSeriesId);
      await addExistingArtworkToGallery(data);
      return;
    }
    const piece = paintings.find((row) => row.id === id);
    if (!piece?.image) return;
    pickExisting(piece.image, piece.label);
  }

  function clearSelection() {
    upload.reset();
    setPreviewFile(undefined);
    setSelectedExisting("");
    setSelectedLabel("");
    setFileName("");
    setSizeError(null);
    setSizeWarning(null);
    if (inputRef.current) inputRef.current.value = "";
    onPreviewChange?.("");
  }

  async function onFileChange(input: HTMLInputElement, picked: File | undefined) {
    let file = picked;
    let warning: string | null = null;
    if (picked && picked.size > 0) {
      setSizeError(null);
      setSizeWarning(null);
      const prepared = await upload.prepare(input, picked);
      if (!prepared) return;
      if ("error" in prepared) {
        setSizeError(prepared.error);
        setFileName("");
        setSelectedExisting("");
        setPreviewFile(undefined);
        onPreviewChange?.("");
        return;
      }
      file = prepared.file;
      warning = prepared.warning;
    } else {
      upload.reset();
    }

    setSizeError(null);
    setSizeWarning(warning);
    setFileName(file?.name ?? "");
    if (file?.name) {
      setSelectedExisting("");
      setSelectedLabel("");
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
            <p className="mt-3 text-sm leading-relaxed text-muted">Current image. Upload an image to replace it.</p>
          )}
        </div>
      ) : null}

      <div className={layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-3"}>
        <button
          type="button"
          className={layout === "stack" ? `${btnChoose} w-full justify-center` : btnChoose}
          onClick={() => void openPaintings()}
        >
          Choose a painting
        </button>
        <button
          type="button"
          className={layout === "stack" ? `${btnSecondary} w-full justify-center` : btnSecondary}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </button>
        {allowClear && (layout === "stack" || displaySrc) ? (
          <button
            type="button"
            className={`${layout === "stack" ? `${btnSecondary} w-full justify-center` : btnSecondary} ${
              !displaySrc ? "pointer-events-none opacity-30" : ""
            }`}
            disabled={!displaySrc}
            onClick={clearSelection}
          >
            Clear
          </button>
        ) : null}
        <div className={layout === "stack" ? "min-w-0 text-xs text-muted" : "min-w-0 text-sm"}>
          {layout === "stack" ? null : <div className="font-medium text-ink">{label}</div>}
          <div className={layout === "stack" ? "truncate leading-relaxed" : "mt-0.5 text-xs text-muted"}>{statusText}</div>
          {upload.optimizing ? (
            <div role="status" className={layout === "stack" ? "leading-relaxed text-ink" : "mt-0.5 text-xs text-ink"}>
              Optimizing image…
            </div>
          ) : upload.note ? (
            <div role="status" className={layout === "stack" ? "leading-relaxed" : "mt-0.5 text-xs text-muted"}>
              {upload.note}
            </div>
          ) : !sizeError ? (
            <div className={layout === "stack" ? "leading-relaxed" : "mt-0.5 text-xs text-muted"}>{ADMIN_UPLOAD_HINT}</div>
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

      {sizeError ? (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-amber-800">
          {sizeError}
        </p>
      ) : null}
      {sizeWarning ? (
        <p role="status" className="mt-3 text-sm leading-relaxed text-amber-800">
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
        onChange={(e) => void onFileChange(e.currentTarget, e.currentTarget.files?.[0])}
      />
      <input type="hidden" name={existingName} value={selectedExisting} />

      {paintingOpen ? (
        <ArtworkPickerDialog
          options={paintings}
          current=""
          loading={loadingPaintings}
          hint={
            linkSeriesId
              ? "Click a painting to add it here. Its title, size, material, and price come with it."
              : "Click a painting to use its image here."
          }
          onPick={(id) => void pickPainting(id)}
          onClose={() => setPaintingOpen(false)}
        />
      ) : null}

    </div>
  );
}
