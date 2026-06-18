"use client";

import { useEffect, useState } from "react";

function getCheckboxGroupSnapshot(form: HTMLFormElement, name: string): string {
  const boxes = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${CSS.escape(name)}"]`);
  return Array.from(boxes)
    .filter((el) => el.checked)
    .map((el) => el.value)
    .sort()
    .join("\x1e");
}

function getFormSnapshot(form: HTMLFormElement): Record<string, string> {
  const data: Record<string, string> = {};
  const checkboxNames = new Set<string>();

  for (const el of form.elements) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
      continue;
    }
    const name = el.name;
    if (!name || el.type === "submit" || el.type === "button") continue;

    if (el instanceof HTMLInputElement && el.type === "file") {
      data[name] = el.files?.length ? `file:${el.files[0]!.name}` : "";
    } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
      checkboxNames.add(name);
    } else {
      data[name] = el.value;
    }
  }

  for (const name of checkboxNames) {
    data[name] = getCheckboxGroupSnapshot(form, name);
  }

  return data;
}

function snapshotsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? "") !== (b[key] ?? "")) return false;
  }
  return true;
}

const btnSave =
  "border border-red-700 bg-red-700 px-5 py-3 text-xs tracking-[0.18em] text-white uppercase transition hover:bg-red-800 focus-ring";

/** Red SAVE button — only visible after the parent form has unsaved changes. */
export function AdminDirtySave({ formId }: { formId: string }) {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const initial = getFormSnapshot(form);
    const check = () => setDirty(!snapshotsEqual(initial, getFormSnapshot(form)));

    form.addEventListener("input", check);
    form.addEventListener("change", check);
    return () => {
      form.removeEventListener("input", check);
      form.removeEventListener("change", check);
    };
  }, [formId]);

  if (!dirty) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-6">
      <button type="submit" className={btnSave}>
        SAVE
      </button>
    </div>
  );
}
