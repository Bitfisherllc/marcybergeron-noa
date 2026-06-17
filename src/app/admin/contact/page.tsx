import { AdminExternalLink } from "@/components/AdminLink";
import { listContactMessages } from "@/lib/queries";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminContactPage() {
  const rows = await listContactMessages();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Contact messages</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Messages from the public contact form. Each submission is saved here and triggers a Gmail notification when
          SMTP is configured.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="border border-line bg-white/50 p-6 text-sm text-muted">No messages yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="border border-line bg-white/50 p-5 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs tracking-[0.18em] text-muted uppercase">{formatDate(r.createdAt)}</div>
                  <div className="mt-2 font-medium text-ink">{r.name}</div>
                  <div className="mt-1">
                    <AdminExternalLink href={`mailto:${r.email}`}>{r.email}</AdminExternalLink>
                  </div>
                </div>
                <AdminExternalLink
                  href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: your message to Marcy Bergeron-Noa`)}`}
                  className="shrink-0 self-start"
                >
                  Reply
                </AdminExternalLink>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
