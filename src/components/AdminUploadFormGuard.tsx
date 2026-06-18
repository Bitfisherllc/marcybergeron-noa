"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { findOversizedUploadInForm, uploadTooLargeMessage } from "@/lib/adminUploadLimits";

type AdminUploadFormGuardProps = {
  children: ReactNode;
};

/** Blocks admin form submits that would exceed the Server Actions body limit. */
export function AdminUploadFormGuard({ children }: AdminUploadFormGuardProps) {
  const [warning, setWarning] = useState<string | null>(null);

  function onSubmitCapture(event: FormEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) return;

    const oversized = findOversizedUploadInForm(target);
    if (!oversized) {
      setWarning(null);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setWarning(uploadTooLargeMessage(oversized.name, oversized.size));
  }

  return (
    <div onSubmitCapture={onSubmitCapture}>
      {warning ? (
        <div
          role="alert"
          className="mb-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
        >
          {warning}
        </div>
      ) : null}
      {children}
    </div>
  );
}
