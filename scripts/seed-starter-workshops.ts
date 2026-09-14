/**
 * Inserts three starter workshops if those slugs are not already present.
 * Does not overwrite copy Marcy has already saved.
 */
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { closeDb, getDb } from "@/db";
import { post, postIndexCopy, series } from "@/db/schema";
import { postIndexHeaderDefaults } from "@/lib/postKind";
import { DEFAULT_WORKSHOP_PRICE } from "@/lib/workshopPrice";

const STARTERS = [
  {
    slug: "encaustic",
    title: "Encaustic",
    imageSlug: "Encaustic Paintings on Panel",
    excerpt:
      "A studio class in pigmented wax, heat, and layered color. Dates TBA. Materials included unless otherwise noted.",
    content: `A studio workshop in pigmented wax, heat, and layered color. We work slowly—fusing, scraping, and building a surface that holds light.

Dates for this class are still TBA. If you would like to be kept in mind, send a short interest note. Marcy will write when dates are posted, or to talk through a private or group session.`,
  },
  {
    slug: "oil-and-cold-wax",
    title: "Oil and Cold Wax",
    imageSlug: "Oil and Cold Wax",
    excerpt:
      "Oil paint and cold wax, worked in layers. Dates TBA. Materials included unless otherwise noted.",
    content: `Oil and cold wax in the studio: building body, edge, and atmosphere without heat. Layers can stay open, or be pressed, scraped, and drawn back into.

Dates for this class are still TBA. If you would like to be kept in mind, send a short interest note. Marcy will write when dates are posted, or to talk through a private or group session.`,
  },
  {
    slug: "encaustic-monotypes",
    title: "Encaustic Monotypes",
    imageSlug: "Encaustic Monotypes",
    excerpt:
      "One-of-a-kind prints pulled from a heated plate of wax. Dates TBA. Materials included unless otherwise noted.",
    content: `Encaustic monotypes: pigmented wax on a heated plate, then a single pull. Each print is its own record of pressure, temperature, and timing.

Dates for this class are still TBA. If you would like to be kept in mind, send a short interest note. Marcy will write when dates are posted, or to talk through a private or group session.`,
  },
] as const;

const OLD_WORKSHOP_INTROS = [
  "Upcoming classes, studio workshops, and teaching notes—published here as workshops are added in the admin area.",
  "Studio workshops with Marcy. Scheduled dates may still be TBA—send a short note if you would like to hear when a class is posted. Private and group workshops are available for private parties.",
  "Studio workshops with Marcy. Scheduled dates may still be TBA—send a short note if you would like to hear when a class is posted.",
];

async function featuredFor(slug: string): Promise<string | null> {
  const row = await getDb()
    .select({ featuredImage: series.featuredImage })
    .from(series)
    .where(eq(series.slug, slug))
    .then((r) => r[0]);
  return row?.featuredImage ?? null;
}

async function main() {
  const db = getDb();
  const t = new Date();
  let inserted = 0;

  for (const def of STARTERS) {
    const existing = await db
      .select({ id: post.id })
      .from(post)
      .where(eq(post.slug, def.slug))
      .then((r) => r[0]);
    if (existing) {
      console.log(`Skipping ${def.slug} (already exists).`);
      continue;
    }

    await db.insert(post).values({
      id: nanoid(),
      slug: def.slug,
      title: def.title,
      excerpt: def.excerpt,
      content: def.content,
      featuredImage: await featuredFor(def.imageSlug),
      published: true,
      showDate: false,
      publishedAt: t,
      category: "Upcoming",
      kind: "workshop",
      price: DEFAULT_WORKSHOP_PRICE,
      sessionDates: "",
      materialsNote: "",
      tags: "",
      createdAt: t,
      updatedAt: t,
    });
    inserted += 1;
    console.log(`Inserted ${def.slug}.`);
  }

  const introRow = await db
    .select()
    .from(postIndexCopy)
    .where(eq(postIndexCopy.kind, "workshop"))
    .then((r) => r[0]);
  if (introRow && OLD_WORKSHOP_INTROS.includes(introRow.intro.trim())) {
    await db
      .update(postIndexCopy)
      .set({ intro: postIndexHeaderDefaults("workshop").intro, updatedAt: t })
      .where(eq(postIndexCopy.kind, "workshop"));
    console.log("Updated workshops page intro.");
  }

  console.log(inserted === 0 ? "Starter workshops already present." : `Added ${inserted} starter workshop(s).`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
