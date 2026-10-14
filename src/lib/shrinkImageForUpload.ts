"use client";

import { useEffect, useRef, useState } from "react";
import { setUploadOptimizing } from "@/lib/adminDirtyForms";
import {
  ADMIN_UPLOAD_FORM_MAX_BYTES,
  ADMIN_UPLOAD_MAX_BYTES,
  ADMIN_UPLOAD_MAX_EDGE,
  ADMIN_UPLOAD_TARGET_BYTES,
  ADMIN_UPLOAD_WARN_BYTES,
  uploadLargeFileWarning,
  uploadNotResizableMessage,
  uploadResizedNote,
  uploadTooLargeMessage,
} from "@/lib/adminUploadLimits";

const QUALITIES = [0.88, 0.8, 0.72, 0.64];
const SCALE_STEPS = 4;
/** Animated, vector, and icon formats would be flattened or blurred by a canvas round trip. */
const PASS_THROUGH_TYPES = /^image\/(gif|svg\+xml|x-icon|vnd\.microsoft\.icon)$/;

export type ShrinkResult = { file: File; resized: boolean };

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void };

let webpSupport: Promise<boolean> | null = null;

/** Safari draws WebP but cannot encode it from a canvas, and silently returns PNG instead. */
function canEncodeWebp(): Promise<boolean> {
  webpSupport ??= new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    canvas.toBlob((blob) => resolve(blob?.type === "image/webp"), "image/webp", 0.8);
  });
  return webpSupport;
}

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall through to <img>, which also applies EXIF orientation.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

function draw(image: Decoded, width: number, height: number, background?: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image.source, 0, 0, width, height);
  return canvas;
}

function hasTransparency(image: Decoded): boolean {
  const scale = Math.min(1, 256 / Math.max(image.width, image.height));
  const canvas = draw(image, Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)));
  const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! < 255) return true;
  }
  return false;
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

const EXTENSIONS: Record<string, string> = { "image/webp": ".webp", "image/jpeg": ".jpg", "image/png": ".png" };

function renamed(name: string, type: string): string {
  const base = name.replace(/\.[^./\\]+$/, "") || "image";
  return `${base}${EXTENSIONS[type] ?? ""}`;
}

/**
 * Resizes a photo to at most ADMIN_UPLOAD_MAX_EDGE on the long edge and re-encodes it (WebP, else JPEG)
 * under ADMIN_UPLOAD_TARGET_BYTES. Small images, unsupported formats, and anything the browser cannot
 * decode (e.g. HEIC outside Safari) come back unchanged.
 */
export async function shrinkImageForUpload(file: File): Promise<ShrinkResult> {
  const unchanged = { file, resized: false };
  if (!file.type.startsWith("image/") || PASS_THROUGH_TYPES.test(file.type)) return unchanged;

  let image: Decoded;
  try {
    image = await decode(file);
  } catch {
    return unchanged;
  }

  try {
    const longEdge = Math.max(image.width, image.height);
    if (!longEdge) return unchanged;
    if (file.size <= ADMIN_UPLOAD_WARN_BYTES && longEdge <= ADMIN_UPLOAD_MAX_EDGE) return unchanged;

    const webp = await canEncodeWebp();
    const types = webp
      ? ["image/webp"]
      : file.type === "image/png" && hasTransparency(image)
        ? ["image/png", "image/jpeg"]
        : ["image/jpeg"];

    for (const type of types) {
      let scale = Math.min(1, ADMIN_UPLOAD_MAX_EDGE / longEdge);
      for (let step = 0; step < SCALE_STEPS; step++, scale *= 0.8) {
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = draw(image, width, height, type === "image/jpeg" ? "#fff" : undefined);
        for (const quality of type === "image/png" ? [undefined] : QUALITIES) {
          const blob = await encode(canvas, type, quality);
          if (!blob || blob.type !== type || blob.size > ADMIN_UPLOAD_TARGET_BYTES) continue;
          if (blob.size >= file.size && longEdge <= ADMIN_UPLOAD_MAX_EDGE) return unchanged;
          return {
            file: new File([blob], renamed(file.name, type), { type, lastModified: file.lastModified }),
            resized: true,
          };
        }
      }
    }
    return unchanged;
  } catch {
    return unchanged;
  } finally {
    image.close();
  }
}

const pendingInputs = new Map<HTMLInputElement, number>();
let submitBlockerInstalled = false;

/** Runs before React's own listeners so a form cannot post the original file mid-resize. */
function installSubmitBlocker() {
  if (submitBlockerInstalled) return;
  submitBlockerInstalled = true;
  window.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (![...pendingInputs.keys()].some((input) => input.form === form)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
}

function setPending(input: HTMLInputElement, pending: boolean) {
  const count = (pendingInputs.get(input) ?? 0) + (pending ? 1 : -1);
  if (count > 0) pendingInputs.set(input, count);
  else pendingInputs.delete(input);
  setUploadOptimizing(pendingInputs.size > 0);
}

function replaceInputFile(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

/** Event on the form (not the input) so AdminSaveTracker re-reads it without re-running the input's onChange. */
function notifyFormChanged(input: HTMLInputElement) {
  input.form?.dispatchEvent(new Event("change", { bubbles: true }));
}

export type PreparedUpload = { file: File; warning: string | null } | { error: string };

/**
 * Shared upload handling for admin file inputs: rejects files over the pick limit, resizes large
 * photos in place (the input's file is swapped), and reports status for the field to show.
 * `prepare` resolves to null when a newer pick or `reset` superseded it.
 */
export function useAdminImageUpload() {
  const [optimizing, setOptimizing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const runRef = useRef(0);

  useEffect(() => {
    const runs = runRef;
    return () => {
      runs.current++;
    };
  }, []);

  function reset() {
    runRef.current++;
    setOptimizing(false);
    setNote(null);
  }

  async function prepare(input: HTMLInputElement, picked: File): Promise<PreparedUpload | null> {
    const run = ++runRef.current;
    setNote(null);
    if (picked.size > ADMIN_UPLOAD_MAX_BYTES) {
      input.value = "";
      notifyFormChanged(input);
      return { error: uploadTooLargeMessage(picked.name, picked.size) };
    }

    installSubmitBlocker();
    setOptimizing(true);
    setPending(input, true);
    let result: ShrinkResult;
    try {
      result = await shrinkImageForUpload(picked);
    } finally {
      setPending(input, false);
      if (run === runRef.current) setOptimizing(false);
    }
    if (run !== runRef.current) return null;

    const { file, resized } = result;
    if (file.size > ADMIN_UPLOAD_FORM_MAX_BYTES) {
      input.value = "";
      notifyFormChanged(input);
      return { error: uploadNotResizableMessage(file.name, file.size) };
    }
    if (resized) {
      replaceInputFile(input, file);
      setNote(uploadResizedNote(picked.size, file.size));
      notifyFormChanged(input);
    }
    return {
      file,
      warning: !resized && file.size >= ADMIN_UPLOAD_WARN_BYTES ? uploadLargeFileWarning(file.name, file.size) : null,
    };
  }

  return { optimizing, note, prepare, reset };
}
