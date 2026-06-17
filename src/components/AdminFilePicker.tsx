"use client";

import { useId, useRef, useState } from "react";

const btnChoose =
  "inline-flex shrink-0 border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90 focus-ring";

type AdminFilePickerProps = {
  name: string;
  /** Shown beside the button, e.g. “Add image”. */
  label?: string;
  buttonLabel?: string;
  accept?: string;
  required?: boolean;
  className?: string;
};

export function AdminFilePicker({
  name,
  label = "Add image",
  buttonLabel = "Choose image",
  accept = "image/*",
  required,
  className,
}: AdminFilePickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className={btnChoose} onClick={() => inputRef.current?.click()}>
          {buttonLabel}
        </button>
        <div className="min-w-0 text-sm">
          <div className="font-medium text-ink">{label}</div>
          <div className="mt-0.5 text-xs text-muted">{fileName || "No file chosen yet"}</div>
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
      />
    </div>
  );
}
