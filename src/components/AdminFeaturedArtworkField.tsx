"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Artwork } from "@/db";
import { ArtworkPickerDialog, type AdminArtworkSelectOption } from "@/components/AdminArtworkSelect";
import {
  ADMIN_UPLOAD_MAX_BYTES,
  ADMIN_UPLOAD_MAX_LABEL,
  ADMIN_UPLOAD_WARN_BYTES,
  uploadLargeFileWarning,
  uploadTooLargeMessage,
} from "@/lib/adminUploadLimits";
import { listingCardPiece, parseFeaturedArtworkMode, type FeaturedArtworkMode } from "@/lib/featuredArtwork";

type AdminFeaturedArtworkFieldProps = {
  mode: string | null | undefined;
  artworkId: string | null | undefined;
  pieces: Pick<Artwork, "id" | "title" | "image">[];
  listingSurface?: "portfolio" | "series";
  /** Saved card image, or empty when only the placeholder is stored. */
  cardImage: string;
  /** Button that submits the form, when it is not the top-bar SAVE. */
  submitLabel?: string;
};

const btnPrimary =
  "inline-flex shrink-0 border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90 focus-ring";

const btnSecondary =
  "inline-flex shrink-0 border border-line bg-paper px-4 py-3 text-xs tracking-[0.18em] text-ink uppercase transition hover:bg-black/[0.03] focus-ring";

function notifyFormDirty(form: HTMLFormElement | null) {
  if (!form) return;
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
}

function isLocalPreviewSrc(src: string) {
  return src.startsWith("blob:") || src.startsWith("data:") || !src.startsWith("/");
}

export function AdminFeaturedArtworkField({
  mode,
  artworkId,
  pieces,
  listingSurface = "portfolio",
  cardImage,
  submitLabel,
}: AdminFeaturedArtworkFieldProps) {
  const listingName = listingSurface === "series" ? "Series" : "Portfolio";
  const pageName = listingSurface === "series" ? "medium’s page" : "Portfolio page";
  const noun = listingSurface === "series" ? "series" : "gallery";
  const hasPieces = pieces.length > 0;
  const firstPiece = pieces[0];
  const byId = useMemo(() => new Map(pieces.map((piece) => [piece.id, piece])), [pieces]);
  const options = useMemo<AdminArtworkSelectOption[]>(
    () => pieces.map((piece) => ({ id: piece.id, label: piece.title, image: piece.image })),
    [pieces],
  );

  const savedMode = parseFeaturedArtworkMode(mode);
  const initialMode: FeaturedArtworkMode = savedMode ?? (hasPieces ? "static" : "upload");
  const initialArtworkId =
    initialMode === "static"
      ? (listingCardPiece({ featuredArtworkMode: mode ?? "", featuredArtworkId: artworkId ?? null }, pieces)?.id ?? "")
      : "";

  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<FeaturedArtworkMode>(initialMode);
  const [selectedId, setSelectedId] = useState(initialArtworkId);
  const [upload, setUpload] = useState<{ src: string; name: string } | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const cardSrc = upload?.src ?? cardImage;
  const chosenPiece = selectedId ? byId.get(selectedId) : undefined;
  const dirty = selectedMode !== initialMode || selectedId !== initialArtworkId || Boolean(upload);

  let shown: { src: string; label: string } | null = null;
  let note: string | null = null;
  if (selectedMode === "upload" && cardSrc) {
    shown = { src: cardSrc, label: upload ? `Uploaded image: ${upload.name}` : "Uploaded image" };
  } else if (selectedMode === "static" && chosenPiece) {
    shown = { src: chosenPiece.image, label: chosenPiece.title };
  } else if (firstPiece) {
    shown = { src: firstPiece.image, label: firstPiece.title };
    note = `Nothing chosen yet, so the first painting in this ${noun} shows.`;
  }

  function releaseUpload() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (fileRef.current) fileRef.current.value = "";
    setUpload(null);
    setSizeError(null);
    setSizeWarning(null);
  }

  function pick(id: string, form: HTMLFormElement | null) {
    releaseUpload();
    setSelectedId(id);
    setSelectedMode("static");
    setPickerOpen(false);
    notifyFormDirty(form ?? fileRef.current?.form ?? null);
  }

  function onFile(file: File | undefined) {
    if (!file || file.size === 0) return;
    if (file.size > ADMIN_UPLOAD_MAX_BYTES) {
      releaseUpload();
      setSizeError(uploadTooLargeMessage(file.name, file.size));
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const src = URL.createObjectURL(file);
    objectUrlRef.current = src;
    setUpload({ src, name: file.name });
    setSizeError(null);
    setSizeWarning(file.size >= ADMIN_UPLOAD_WARN_BYTES ? uploadLargeFileWarning(file.name, file.size) : null);
    setSelectedMode("upload");
  }

  return (
    <fieldset data-admin-section={`${listingName} listing card`} className="space-y-4 border border-line bg-paper/40 p-4">
      <legend className="px-1 text-sm font-medium text-ink">{listingName} listing card</legend>
      <p className="text-xs leading-relaxed text-muted">
        The picture on this card on the {pageName}
        {listingSurface === "series" ? " and, when this series is featured, on the home page" : ""}.
        {hasPieces ? ` Choose one of the paintings in this ${noun}, or upload an image.` : ""}
      </p>
      <div className="grid items-start gap-6 md:grid-cols-[14rem_1fr]">
        <div className="space-y-2">
          <p className="text-xs tracking-wide text-muted uppercase">
            {dirty ? "After you save" : `On the ${pageName}`}
          </p>
          <div
            className={`relative aspect-[4/3] overflow-hidden border bg-black/[0.03] ${
              dirty ? "border-ink ring-1 ring-ink/30" : "border-line"
            }`}
          >
            {shown ? (
              isLocalPreviewSrc(shown.src) ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob and remote URLs
                <img src={shown.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <Image src={shown.src} alt="" fill className="object-cover" sizes="224px" />
              )
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted">
                No image yet
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {hasPieces ? (
              <button type="button" className={btnPrimary} onClick={() => setPickerOpen(true)}>
                Choose a painting
              </button>
            ) : null}
            <button
              type="button"
              className={hasPieces ? btnSecondary : btnPrimary}
              onClick={() => fileRef.current?.click()}
            >
              Upload an image
            </button>
          </div>
          {shown ? <p className="text-sm leading-relaxed text-ink">Showing: {shown.label}</p> : null}
          {note ? <p className="text-xs leading-relaxed text-muted">{note}</p> : null}
          {!hasPieces ? (
            <p className="text-xs leading-relaxed text-muted">
              This {noun} has no paintings yet, so you can only upload an image.
            </p>
          ) : null}
          <p className="text-xs text-muted">Maximum upload size: {ADMIN_UPLOAD_MAX_LABEL}</p>
          {sizeError ? (
            <p role="alert" className="text-xs leading-relaxed text-amber-800">
              {sizeError}
            </p>
          ) : null}
          {sizeWarning ? (
            <p role="status" className="text-xs leading-relaxed text-amber-800">
              {sizeWarning}
            </p>
          ) : null}
          {dirty ? (
            <p className="text-xs leading-relaxed text-red-700">
              {submitLabel
                ? `Not live yet. Click ${submitLabel} to save it.`
                : `Not live yet. Use the red SAVE button in the top bar to update the ${pageName}.`}
            </p>
          ) : null}
        </div>
      </div>
      <input type="hidden" name="featuredArtworkMode" value={selectedMode} />
      <input type="hidden" name="featuredArtworkId" value={selectedId} />
      <input
        ref={fileRef}
        name="featured"
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {pickerOpen ? (
        <ArtworkPickerDialog
          options={options}
          current={selectedMode === "static" ? selectedId : ""}
          hint={`Click a painting to show it on this card on the ${pageName}.`}
          onPick={pick}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </fieldset>
  );
}
