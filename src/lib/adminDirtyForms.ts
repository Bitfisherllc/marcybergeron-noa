"use client";

import { useSyncExternalStore } from "react";

export type AdminSaveState = "clean" | "dirty" | "saving";

const dirty = new Set<string>();
const saving = new Set<string>();
const listeners = new Set<() => void>();
let state: AdminSaveState = "clean";

function emit() {
  state = saving.size > 0 ? "saving" : dirty.size > 0 ? "dirty" : "clean";
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
  if (isSaving) saving.add(formId);
  else saving.delete(formId);
  emit();
}

export function forgetForm(formId: string) {
  const had = dirty.delete(formId) || saving.delete(formId);
  if (had) emit();
}

export function hasUnsavedForms(): boolean {
  return dirty.size > 0;
}

/** Submits every changed form on the page; Next.js runs the server actions one at a time. */
export function saveDirtyForms() {
  for (const formId of [...dirty]) {
    const form = document.getElementById(formId);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  }
}

export function useAdminSaveState(): AdminSaveState {
  return useSyncExternalStore(subscribe, () => state, () => "clean");
}
