"use client";

import { deleteWorkshopInquiry, markWorkshopInquiryRead } from "@/app/admin/actions";
import { adminBtnDanger, adminLinkVariants } from "@/components/AdminLink";

type AdminWorkshopInquiryActionsProps = {
  id: string;
  name: string;
  read: boolean;
};

export function AdminWorkshopInquiryActions({ id, name, read }: AdminWorkshopInquiryActionsProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      {!read ? (
        <form action={markWorkshopInquiryRead}>
          <input type="hidden" name="id" value={id} />
          <button className={adminLinkVariants.secondary} type="submit">
            Mark read
          </button>
        </form>
      ) : null}
      <form
        action={deleteWorkshopInquiry}
        onSubmit={(e) => {
          if (!confirm(`Delete interest note from ${name}? This cannot be undone.`)) e.preventDefault();
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
