"use client";

type AdminReorderButtonsProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  disableUp?: boolean;
  disableDown?: boolean;
};

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="block">
      <path
        d="M7 3.25 3.75 8.25h6.5L7 3.25Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="block">
      <path
        d="M7 10.75 10.25 5.75H3.75L7 10.75Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const buttonClass =
  "focus-ring inline-flex h-8 w-8 items-center justify-center border border-line text-ink/70 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30";

export function AdminReorderButtons({
  action,
  fields,
  disableUp = false,
  disableDown = false,
}: AdminReorderButtonsProps) {
  return (
    <div className="inline-flex items-center gap-1">
      <form action={action}>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input type="hidden" name="dir" value="up" />
        <button type="submit" className={buttonClass} disabled={disableUp} aria-label="Move up">
          <ArrowUpIcon />
        </button>
      </form>
      <form action={action}>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input type="hidden" name="dir" value="down" />
        <button type="submit" className={buttonClass} disabled={disableDown} aria-label="Move down">
          <ArrowDownIcon />
        </button>
      </form>
    </div>
  );
}
