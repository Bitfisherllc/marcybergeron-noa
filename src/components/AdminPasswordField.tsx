"use client";

import { useState } from "react";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      {open ? <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.5" /> : null}
    </svg>
  );
}

export function AdminPasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm text-muted">
      Password
      <span className="relative mt-2 block">
        <input
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          required
          className="w-full border border-line bg-paper px-3 py-2 pr-11 text-sm text-ink"
        />
        <button
          type="button"
          onClick={() => setVisible((open) => !open)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <EyeIcon open={visible} />
        </button>
      </span>
    </label>
  );
}
