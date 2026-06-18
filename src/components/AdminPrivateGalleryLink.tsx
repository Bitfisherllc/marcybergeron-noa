"use client";

import { useState } from "react";
import { adminLinkVariants } from "@/components/AdminLink";
import { privateGalleryAbsoluteUrl } from "@/lib/privateGalleries";

type AdminPrivateGalleryLinkProps = {
  accessToken: string;
};

export function AdminPrivateGalleryLink({ accessToken }: AdminPrivateGalleryLinkProps) {
  const url = privateGalleryAbsoluteUrl(accessToken);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: select from readonly input */
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Share this link with jurors or curators. The gallery is hidden from the public portfolio and search engines.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={url}
          className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
          aria-label="Private gallery link"
        />
        <button className={adminLinkVariants.secondary} type="button" onClick={() => void copyLink()}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
