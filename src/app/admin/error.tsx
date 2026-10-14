"use client";

import { useEffect, useState } from "react";
import { adminBtnPrimary } from "@/components/AdminLink";
import { isSaving, setSaveFailed } from "@/lib/adminDirtyForms";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  // Read while rendering: the failed form's tracker clears its saving flag when it unmounts.
  const [duringSave] = useState(isSaving);

  useEffect(() => {
    console.error(error);
    if (!duringSave) return;
    setSaveFailed(true);
    return () => setSaveFailed(false);
  }, [error, duringSave]);

  return (
    <div role="alert" className="max-w-prose border border-red-200 bg-red-50 px-6 py-5 text-sm leading-relaxed text-red-900">
      <h1 className="font-serif text-2xl tracking-tight text-ink">Something went wrong</h1>
      <p className="mt-3">
        {duringSave
          ? "Your last change may not have been saved. Check your internet connection, then try again. If you were uploading a photo, try a smaller file."
          : "This page could not be loaded. Check your internet connection, then try again."}
      </p>
      {error.digest ? <p className="mt-2 text-xs text-red-800/80">Reference: {error.digest}</p> : null}
      <button type="button" className={`${adminBtnPrimary} mt-5`} onClick={() => unstable_retry()}>
        Try again
      </button>
    </div>
  );
}
