import { AdminLink } from "@/components/AdminLink";
import { countContactMessages } from "@/lib/contactMessages";
import { countWorkshopInquiries } from "@/lib/workshopInquiries";

function unreadLabel(count: number, noun: string) {
  return count === 0 ? `No unread ${noun}s` : `${count} unread ${count === 1 ? noun : `${noun}s`}`;
}

export default async function AdminInboxPage() {
  const [messageCount, workshopInterestCount] = await Promise.all([
    countContactMessages(),
    countWorkshopInquiries(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Inbox</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Everything visitors send you from the site, in one place.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <AdminLink variant="menu" href="/admin/contact">
          <div className="text-xs tracking-[0.18em] text-muted uppercase">Contact form</div>
          <div className="mt-2 font-serif text-2xl tracking-tight">Contact messages</div>
          <p className={`mt-3 text-sm ${messageCount > 0 ? "font-medium text-red-700" : "text-muted"}`}>
            {unreadLabel(messageCount, "message")}
          </p>
        </AdminLink>
        <AdminLink variant="menu" href="/admin/workshop-inquiries">
          <div className="text-xs tracking-[0.18em] text-muted uppercase">Workshops</div>
          <div className="mt-2 font-serif text-2xl tracking-tight">Workshop interest</div>
          <p className={`mt-3 text-sm ${workshopInterestCount > 0 ? "font-medium text-red-700" : "text-muted"}`}>
            {unreadLabel(workshopInterestCount, "note")}
          </p>
        </AdminLink>
        <AdminLink variant="menu" href="/admin/mailing-list">
          <div className="text-xs tracking-[0.18em] text-muted uppercase">Audience</div>
          <div className="mt-2 font-serif text-2xl tracking-tight">Mailing list</div>
          <p className="mt-3 text-sm text-muted">Public signups from the site</p>
        </AdminLink>
      </div>
    </div>
  );
}
