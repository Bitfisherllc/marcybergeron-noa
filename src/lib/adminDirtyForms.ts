"use client";

import { useSyncExternalStore } from "react";

export type AdminSaveState = "clean" | "dirty" | "optimizing" | "saving" | "failed";

const dirty = new Set<string>();
const saving = new Set<string>();
const listeners = new Set<() => void>();
let optimizing = false;
let failed = false;
let state: AdminSaveState = "clean";

function emit() {
  state =
    saving.size > 0
      ? "saving"
      : optimizing
        ? "optimizing"
        : dirty.size > 0
          ? "dirty"
          : failed
            ? "failed"
            : "clean";
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setFormDirty(formId: string, isDirty: boolean) {
  if (isDirty === dirty.has(formId)) return;
  if (isDirty) dirty.add(formId);
  else dirty.delete(formId);
  emit();
}

export function setFormSaving(formId: string, isSaving: boolean) {
  if (isSaving === saving.has(formId)) return;
  if (isSaving) {
    saving.add(formId);
    failed = false;
  } else saving.delete(formId);
  emit();
}

/** Set by the admin error boundary so the bar says the save failed instead of "Saved". */
export function setSaveFailed(isFailed: boolean) {
  if (isFailed === failed) return;
  failed = isFailed;
  emit();
}

/** True while an upload is still being resized in the browser. */
export function setUploadOptimizing(isOptimizing: boolean) {
  if (isOptimizing === optimizing) return;
  optimizing = isOptimizing;
  emit();
}

/** A save that redirects re-mounts the page, so the old form unmounts without ever firing "reset". */
export function forgetForm(formId: string) {
  const wasDirty = dirty.delete(formId);
  const wasSaving = saving.delete(formId);
  if (wasDirty || wasSaving) emit();
}

export function isSaving(): boolean {
  return saving.size > 0;
}

export function hasUnsavedForms(): boolean {
  return dirty.size > 0;
}

/** Submits every changed form on the page; Next.js runs the server actions one at a time. */
export function saveDirtyForms() {
  if (optimizing) return;
  for (const formId of [...dirty]) {
    const form = document.getElementById(formId);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  }
}

export function useAdminSaveState(): AdminSaveState {
  return useSyncExternalStore(subscribe, () => state, () => "clean");
}
