import Link from "next/link";
import { listSeries } from "@/lib/queries";

export default async function AdminHomePage() {
  const rows = await listSeries();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Admin Menu</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Choose what you want to edit. Changes appear on the public site after you save.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link className="border border-line bg-white/50 p-6 hover:bg-white/80" href="/admin/home">
          <div className="text-xs tracking-[0.18em] text-muted uppercase">Home</div>
          <div className="mt-2 font-serif text-2xl tracking-tight">Home page</div>
          <p className="mt-3 text-sm text-muted">Slideshow, section copy, featured picks</p>
        </Link>
        <Link className="border border-line bg-white/50 p-6 hover:bg-white/80" href="/admin/about">
          <div className="text-xs tracking-[0.18em] text-muted uppercase">About</div>
          <div className="mt-2 font-serif text-2xl tracking-tight">About page</div>
          <p className="mt-3 text-sm text-muted">Portrait, statement, bio, education, exhibitions</p>
        </Link>
        <Link className="border border-line bg-white/50 p-6 hover:bg-white/80" href="/admin/series">
          <div className="text-xs tracking-[0.18em] text-muted uppercase">Galleries</div>
          <div className="mt-2 font-serif text-2xl tracking-tight">Galleries &amp; artwork</div>
          <p className="mt-3 text-sm text-muted">
            {rows.length} galleries — view all paintings, reorder, edit titles &amp; photos
          </p>
        </Link>
        <Link className="border border-line bg-white/50 p-6 hover:bg-white/80" href="/admin/posts">
          <div className="text-xs tracking-[0.18em] text-muted uppercase">News</div>
          <div className="mt-2 font-serif text-2xl tracking-tight">Posts</div>
          <p className="mt-3 text-sm text-muted">Exhibitions, updates, press</p>
        </Link>
        <Link className="border border-line bg-white/50 p-6 hover:bg-white/80" href="/admin/mailing-list">
          <div className="text-xs tracking-[0.18em] text-muted uppercase">Audience</div>
          <div className="mt-2 font-serif text-2xl tracking-tight">Mailing list</div>
          <p className="mt-3 text-sm text-muted">Public signups from the site</p>
        </Link>
      </div>
    </div>
  );
}
