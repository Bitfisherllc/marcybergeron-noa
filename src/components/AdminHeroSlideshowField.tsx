"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Artwork } from "@/db";
import {
  AdminArtworkSelect,
  ArtworkPickerDialog,
  type AdminArtworkSelectOption,
  type AdminArtworkSeriesTag,
} from "@/components/AdminArtworkSelect";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import {
  ADMIN_UPLOAD_MAX_BYTES,
  ADMIN_UPLOAD_MAX_LABEL,
  ADMIN_UPLOAD_WARN_BYTES,
  uploadLargeFileWarning,
  uploadTooLargeMessage,
} from "@/lib/adminUploadLimits";
import { HERO_SLIDESHOW_MAX, type HeroSlideshowSlot } from "@/lib/featuredArtwork";
import type { HomeSlideLinkGroup } from "@/lib/homeSlideLinks";

export type AdminHeroLiveSlide = {
  src: string;
  title: string;
};

export type AdminSlideshowPiece = Pick<Artwork, "id" | "title" | "image"> & {
  label?: string;
  href?: string;
  gallery?: string;
  gallerySortOrder?: number;
  series?: AdminArtworkSeriesTag[];
};

type SlideshowAdminVariant = "gallery" | "home";

type AdminHeroSlideshowFieldProps = {
  pieces: AdminSlideshowPiece[];
  slots: HeroSlideshowSlot[];
  liveSlides: AdminHeroLiveSlide[];
  usingRandom: boolean;
  variant?: SlideshowAdminVariant;
  fieldPrefix?: string;
  /** Defaults to three (gallery). Home page passes five. */
  maxSlots?: number;
  /** Gallery pages only. Home slideshow is always shown. */
  showOnPage?: boolean;
  /** The Studio always shows the slideshow area; hide the optional Display toggle. */
  lockDisplayOn?: boolean;
  /** Home page only — pages the slide can open instead of a lightbox. */
  linkGroups?: HomeSlideLinkGroup[];
};

const COPY: Record<
  SlideshowAdminVariant,
  {
    legend: string;
    hint: string;
    paintingLabel: string;
    emptyPaintings: string;
    afterSaveEmpty: string;
    liveEmpty: string;
    previewLive: string;
    emptySlotRandom: string;
  }
> = {
  gallery: {
    legend: "Gallery page slideshow",
    hint: "Optional. Off by default — About then sits under the title. Turn on Display slideshow to restore the side-by-side About row. One chosen image stays as a single photo with no slideshow arrows. Two or three become a slideshow with navigation. You do not have to fill every slot. Upload a photo, pick one already on the site, or choose a painting from this gallery. This is separate from the rotating card on the main Portfolio page.",
    paintingLabel: "Or painting in this gallery",
    emptyPaintings: "Add paintings if you want to pick from this gallery’s works.",
    afterSaveEmpty:
      "After you save with Display slideshow on and no images chosen, the gallery page will show one random image from this gallery, without slideshow navigation.",
    liveEmpty:
      "No slideshow images are chosen. With Display slideshow on, the gallery page shows one random painting from this gallery, without slideshow navigation. Pick one image to keep that still photo, or two or three for a slideshow with arrows.",
    previewLive: "On the gallery page",
    emptySlotRandom: "Random from this gallery",
  },
  home: {
    legend: "Home page slideshow",
    hint: "Large image beside the opening text on the home page. One image stays as a single photo; two to five become a slideshow. You do not have to fill every slot. Click Choose a painting to pick one by portfolio and series, or to upload a new image. Each slide can link to a gallery, series, or other page — it does not open a lightbox. If none are chosen, the home page uses the automatic mix of series and artwork images.",
    paintingLabel: "Or choose a painting visually",
    emptyPaintings: "Add paintings if you want to pick from your galleries.",
    afterSaveEmpty: "After you save, the home page will use the automatic mix of series and artwork images.",
    liveEmpty:
      "No slideshow images are chosen. The home page currently uses the automatic mix of series and artwork images. You can pick one image, or up to five for a slideshow, or leave this unchosen.",
    previewLive: "On the home page",
    emptySlotRandom: "Automatic mix",
  },
};

type SlotDraft = {
  pickerSrc: string;
  artworkId: string;
  href: string;
  initialSrc: string;
  initialArtworkId: string;
  initialHref: string;
};

function imageFileLabel(src: string): string {
  try {
    const path = src.startsWith("http") ? new URL(src).pathname : src;
    return decodeURIComponent(path.split("/").filter(Boolean).pop() || "a custom photo");
  } catch {
    return "a custom photo";
  }
}

function isBlobPreviewSrc(src: string) {
  return src.startsWith("blob:") || src.startsWith("data:");
}

function isRemoteSrc(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function slotSavedImage(
  slot: HeroSlideshowSlot,
  byId: Map<string, Pick<Artwork, "id" | "title" | "image">>,
): string {
  return slot.image || (slot.artworkId ? (byId.get(slot.artworkId)?.image ?? "") : "");
}

function resolvedSlotSrc(
  draft: SlotDraft,
  byId: Map<string, Pick<Artwork, "id" | "title" | "image">>,
): string {
  const painting = draft.artworkId ? (byId.get(draft.artworkId)?.image ?? "") : "";
  if (draft.pickerSrc.startsWith("blob:") || draft.pickerSrc.startsWith("data:")) return draft.pickerSrc;
  if (draft.pickerSrc && draft.pickerSrc !== draft.initialSrc) return draft.pickerSrc;
  if (painting) return painting;
  return draft.pickerSrc;
}

function slotLabel(
  src: string,
  artworkId: string,
  byId: Map<string, Pick<Artwork, "id" | "title" | "image">>,
): string {
  if (artworkId) {
    const piece = byId.get(artworkId);
    if (piece) return piece.title;
  }
  const match = [...byId.values()].find((piece) => piece.image === src);
  if (match) return match.title;
  if (src && !isBlobPreviewSrc(src)) return imageFileLabel(src);
  if (src) return "New upload";
  return "";
}

function notifyFormDirty(form: HTMLFormElement | null) {
  if (!form) return;
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
}

function formatNameList(names: string[]): string {
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

const btnPrimary =
  "inline-flex w-full shrink-0 justify-center border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90 focus-ring";

const btnSecondary =
  "inline-flex w-full shrink-0 justify-center border border-line bg-paper px-4 py-3 text-xs tracking-[0.18em] text-ink uppercase transition hover:bg-black/[0.03] focus-ring";

/** Home slideshow slot: one Choose a painting button; the popup also offers an upload. */
function HomeSlidePicker({
  fieldName,
  artworkFieldName,
  draft,
  options,
  statusLabel,
  onDraft,
}: {
  fieldName: string;
  artworkFieldName: string;
  draft: SlotDraft;
  options: AdminArtworkSelectOption[];
  statusLabel: string;
  onDraft: (patch: Partial<SlotDraft>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const keptImage = isBlobPreviewSrc(draft.pickerSrc) ? "" : draft.pickerSrc;
  const hasValue = Boolean(draft.pickerSrc || draft.artworkId);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function releaseUpload() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (inputRef.current) inputRef.current.value = "";
    setSizeError(null);
    setSizeWarning(null);
  }

  function choose(artworkId: string, form: HTMLFormElement | null) {
    releaseUpload();
    onDraft({ artworkId, pickerSrc: "" });
    notifyFormDirty(form ?? inputRef.current?.form ?? null);
    setOpen(false);
  }

  function onFile(file: File | undefined) {
    if (!file || file.size === 0) return;
    if (file.size > ADMIN_UPLOAD_MAX_BYTES) {
      releaseUpload();
      setSizeError(uploadTooLargeMessage(file.name, file.size));
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSizeError(null);
    setSizeWarning(file.size >= ADMIN_UPLOAD_WARN_BYTES ? uploadLargeFileWarning(file.name, file.size) : null);
    onDraft({ artworkId: "", pickerSrc: url });
    notifyFormDirty(inputRef.current?.form ?? null);
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
        Choose a painting
      </button>
      <button
        type="button"
        className={`${btnSecondary} ${!hasValue ? "pointer-events-none opacity-30" : ""}`}
        disabled={!hasValue}
        onClick={(event) => choose("", event.currentTarget.form)}
      >
        Clear
      </button>
      <p className="truncate text-xs leading-relaxed text-muted">{statusLabel || "No painting chosen yet"}</p>
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
      <input
        ref={inputRef}
        name={fieldName}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      <input type="hidden" name={`${fieldName}Existing`} value={keptImage} />
      <input type="hidden" name={artworkFieldName} value={draft.artworkId} />
      {open ? (
        <ArtworkPickerDialog
          options={options}
          current={draft.artworkId}
          hint={`Click a painting to use it for this slide, or upload a new image (up to ${ADMIN_UPLOAD_MAX_LABEL}).`}
          onPick={choose}
          onClose={() => setOpen(false)}
          onUpload={() => {
            setOpen(false);
            inputRef.current?.click();
          }}
        />
      ) : null}
    </div>
  );
}

function SlidePreview({
  src,
  pending,
  emptyLabel,
}: {
  src: string;
  pending: boolean;
  emptyLabel: string;
}) {
  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden border bg-black/[0.03] ${
        pending ? "border-ink ring-1 ring-ink/30" : "border-line"
      }`}
    >
      {src ? (
        isBlobPreviewSrc(src) || isRemoteSrc(src) ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob and remote URLs
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
        )
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-xs leading-relaxed text-muted">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export function AdminHeroSlideshowField({
  pieces,
  slots,
  liveSlides,
  usingRandom,
  variant = "gallery",
  fieldPrefix = "heroSlide",
  maxSlots = HERO_SLIDESHOW_MAX,
  showOnPage = false,
  lockDisplayOn = false,
  linkGroups = [],
}: AdminHeroSlideshowFieldProps) {
  const copy = COPY[variant];
  const [displayOnPage, setDisplayOnPage] = useState(showOnPage || lockDisplayOn);
  const padded = useMemo(
    () => Array.from({ length: maxSlots }, (_, i) => slots[i] ?? { artworkId: null, image: null }),
    [slots, maxSlots],
  );
  const byId = useMemo(() => new Map(pieces.map((piece) => [piece.id, piece])), [pieces]);
  const pickerOptions = useMemo<AdminArtworkSelectOption[]>(
    () =>
      pieces.map((piece) => ({
        id: piece.id,
        label: piece.label ?? piece.title,
        image: piece.image,
        gallery: piece.gallery,
        gallerySortOrder: piece.gallerySortOrder,
        series: piece.series,
      })),
    [pieces],
  );
  const [drafts, setDrafts] = useState<SlotDraft[]>(() =>
    padded.map((slot) => {
      const initialSrc = slotSavedImage(slot, byId);
      const initialHref = slot.href ?? "";
      return {
        pickerSrc: initialSrc,
        artworkId: slot.artworkId ?? "",
        href: initialHref,
        initialSrc,
        initialArtworkId: slot.artworkId ?? "",
        initialHref,
      };
    }),
  );

  const hasEdits = drafts.some(
    (draft) =>
      draft.pickerSrc !== draft.initialSrc ||
      draft.artworkId !== draft.initialArtworkId ||
      draft.href !== draft.initialHref,
  );
  const displaySrcs = Array.from({ length: maxSlots }, (_, i) => {
    if (hasEdits) return resolvedSlotSrc(drafts[i]!, byId);
    if (!usingRandom) return drafts[i]?.initialSrc ?? "";
    return liveSlides[i]?.src ?? "";
  });
  const displayNames = displaySrcs
    .map((src, i) => {
      if (!src) return "";
      if (!hasEdits && liveSlides[i]?.title) return liveSlides[i]!.title;
      return slotLabel(src, hasEdits ? drafts[i]!.artworkId : drafts[i]!.initialArtworkId, byId);
    })
    .filter(Boolean);
  const chosenCount = displaySrcs.filter(Boolean).length;

  function updateDraft(index: number, patch: Partial<SlotDraft>) {
    setDrafts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, ...patch };
      return next;
    });
  }

  return (
    <fieldset
      data-admin-section={variant === "gallery" ? "Gallery page slideshow" : undefined}
      className="space-y-4 border border-line bg-paper/40 p-4"
    >
      <legend className="px-1 text-sm font-medium text-ink">{copy.legend}</legend>
      <p className="text-xs leading-relaxed text-muted">
        {lockDisplayOn
          ? "The image sits beside About on this page. One chosen image stays as a still photo with no slideshow arrows. Two or three become a slideshow with navigation. You do not have to fill every slot. Upload a photo, pick one already on the site, or choose a painting from this gallery."
          : copy.hint}
      </p>
      {variant === "gallery" && lockDisplayOn ? (
        <>
          <input type="hidden" name="showHeroSlideshow" value="on" />
          <p className="text-sm leading-relaxed text-ink">
            This gallery always shows the image area beside About. One chosen image is a still photo with no
            arrows. Two or three become a slideshow with navigation.
          </p>
        </>
      ) : variant === "gallery" ? (
        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="showHeroSlideshow"
            value="on"
            checked={displayOnPage}
            onChange={(e) => {
              setDisplayOnPage(e.target.checked);
              notifyFormDirty(e.currentTarget.form);
            }}
            className="mt-1 border border-line"
          />
          <span>
            <span className="font-medium">Display slideshow</span>
            <span className="block text-xs leading-relaxed text-muted">
              Off by default. When on, the image sits beside About. One chosen image has no slideshow arrows.
              Two or three become a slideshow with navigation. When off, About appears under the title.
            </span>
          </span>
        </label>
      ) : null}
      <p className="text-sm leading-relaxed text-ink">
        {variant === "gallery" && !displayOnPage ? (
          <>The gallery page will not show a slideshow. About will appear under the title.</>
        ) : hasEdits ? (
          chosenCount === 0 ? (
            <>{copy.afterSaveEmpty}</>
          ) : chosenCount === 1 ? (
            <>Preview of the single image that will show after you save, without slideshow navigation: {displayNames[0]}.</>
          ) : (
            <>
              Preview of the {chosenCount}-image slideshow that will show after you save: {formatNameList(displayNames)}.
            </>
          )
        ) : usingRandom ? (
          <>{copy.liveEmpty}</>
        ) : chosenCount === 1 ? (
          <>Currently showing a single image, without slideshow navigation: {displayNames[0]}.</>
        ) : (
          <>Currently showing a {chosenCount}-image slideshow: {formatNameList(displayNames)}.</>
        )}
      </p>
      {hasEdits ? (
        <p className="text-sm leading-relaxed text-red-700">
          This preview is not live yet. Use the red SAVE button in the top bar to update the{" "}
          {variant === "home" ? "home" : "gallery"} page.
        </p>
      ) : null}
      <div
        className={`grid items-start gap-6 ${
          maxSlots > 3 ? "sm:grid-cols-2 lg:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {drafts.map((draft, i) => {
          const existingImage = draft.initialSrc;
          const src = displaySrcs[i] ?? "";
          return (
            <div key={i} className="min-w-0 space-y-3">
              <p className="text-xs tracking-wide text-muted uppercase">
                {hasEdits ? "Preview" : copy.previewLive} · {i + 1}
              </p>
              <SlidePreview
                src={src}
                pending={hasEdits && Boolean(src)}
                emptyLabel={
                  hasEdits ? "Not used after save" : usingRandom ? copy.emptySlotRandom : "Not used"
                }
              />
              <p className="text-sm text-muted">Image {i + 1} (optional)</p>
              <input type="hidden" name={`${fieldPrefix}${i}Initial`} value={existingImage} />
              {variant === "home" ? (
                <HomeSlidePicker
                  fieldName={`${fieldPrefix}${i}`}
                  artworkFieldName={`${fieldPrefix}Artwork${i}`}
                  draft={draft}
                  options={pickerOptions}
                  statusLabel={slotLabel(resolvedSlotSrc(draft, byId), draft.artworkId, byId)}
                  onDraft={(patch) => {
                    if (patch.artworkId === undefined) return updateDraft(i, patch);
                    const previousHref = byId.get(draft.artworkId)?.href ?? "";
                    const nextHref = byId.get(patch.artworkId)?.href ?? "";
                    const keepCustom = draft.href && draft.href !== previousHref;
                    updateDraft(i, { ...patch, href: keepCustom ? draft.href : nextHref });
                  }}
                />
              ) : (
              <>
              <AdminFilePicker
                name={`${fieldPrefix}${i}`}
                existingValue={existingImage}
                label="Upload or choose from the site"
                buttonLabel="Upload image"
                allowClear
                preview="none"
                layout="stack"
                onPreviewChange={(src) => updateDraft(i, { pickerSrc: src })}
              />
              {pieces.length > 0 ? (
                <div className="space-y-2 text-sm text-muted">
                  <p>{copy.paintingLabel}</p>
                  <AdminArtworkSelect
                    name={`${fieldPrefix}Artwork${i}`}
                    value={draft.artworkId}
                    options={pickerOptions}
                    onChange={(next) => {
                      const previousHref = byId.get(draft.artworkId)?.href ?? "";
                      const nextHref = byId.get(next)?.href ?? "";
                      const keepCustom = draft.href && draft.href !== previousHref;
                      updateDraft(i, {
                        artworkId: next,
                        href: keepCustom ? draft.href : nextHref,
                      });
                    }}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted">{copy.emptyPaintings}</p>
              )}
              </>
              )}
              {variant === "home" && linkGroups.length > 0 ? (
                <label className="block text-sm text-muted">
                  Link this slide to
                  <select
                    name={`${fieldPrefix}Href${i}`}
                    value={draft.href}
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
                    onChange={(event) => {
                      updateDraft(i, { href: event.target.value });
                      notifyFormDirty(event.currentTarget.form);
                    }}
                  >
                    <option value="">— No link —</option>
                    {draft.href &&
                    !linkGroups.some((group) => group.options.some((option) => option.href === draft.href)) ? (
                      <option value={draft.href}>{draft.href}</option>
                    ) : null}
                    {linkGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                          <option key={option.href} value={option.href}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
