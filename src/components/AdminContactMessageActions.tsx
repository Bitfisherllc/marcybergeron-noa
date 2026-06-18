"use client";

import { deleteContactMessage, markContactMessageRead } from "@/app/admin/actions";
import { adminBtnDanger, adminLinkVariants } from "@/components/AdminLink";

type AdminContactMessageActionsProps = {
  id: string;
  name: string;
  read: boolean;
};

export function AdminContactMessageActions({ id, name, read }: AdminContactMessageActionsProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      {!read ? (
        <form action={markContactMessageRead}>
          <input type="hidden" name="id" value={id} />
          <button className={adminLinkVariants.secondary} type="submit">
            Mark read
          </button>
        </form>
      ) : null}
      <form
        action={deleteContactMessage}
        onSubmit={(e) => {
          if (!confirm(`Delete message from ${name}? This cannot be undone.`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button className={adminBtnDanger} type="submit">
          Delete
        </button>
      </form>
    </div>
  );
}
