/**
 * Seeds the database and downloads full-resolution artwork from the legacy Wix CDN
 * (same files referenced on https://www.mbergeronnoa.com/).
 *
 * Run: `npm run db:push` then `DATABASE_URL=... npm run seed`
 */
import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { asc, eq, sql } from "drizzle-orm";
import { captionSubtitle } from "../src/components/ArtCaption";
import * as schema from "../src/db/schema";
import { artwork, post, series } from "../src/db/schema";
import type { AppDb } from "../src/db/index";
import { closeDb, getDb } from "../src/db/index";

const now = () => new Date();

type SeedArt = {
  title: string;
  medium: string;
  size: string;
  year?: string;
  sourceUrl: string;
};

type SeedSeries = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredSourceUrl: string;
  sortOrder: number;
  works: SeedArt[];
};

const SERIES: SeedSeries[] = [
  {
    slug: "wayfinding",
    title: "Wayfinding",
    excerpt:
      "The paintings in this series depict the search for direction, orientation, destination, meaning, clarity and connection.",
    content: `Wayfinding is the process of using spatial and environmental information to understand one's position, navigate to a destination, follow a route, and better understand physical space.

The paintings in this series depict the search for direction, orientation, destination, meaning, clarity and connection.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_7cfe3e74591948779ca8416fcfde8a5a~mv2.jpg",
    sortOrder: 0,
    works: [
      {
        title: "The Heart of the Matter",
        medium: "Oil & cold wax on board",
        size: '20" × 20"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_cb19d434370947768db473e0b7e9af7e~mv2.jpg",
      },
      {
        title: "Hovering Close to the Edge",
        medium: "Oil & cold wax on board",
        size: '18" × 24"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_3672322b665a42daa155fc086e35288b~mv2.jpg",
      },
      {
        title: "Night Blindness",
        medium: "Oil & cold wax on board",
        size: '24" × 32"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_7cfe3e74591948779ca8416fcfde8a5a~mv2.jpg",
      },
      {
        title: "Course Correction",
        medium: "Oil & cold wax on board",
        size: '20" × 20"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_7757c895a908460590bd546fb8bb727c~mv2.jpg",
      },
      {
        title: "Conduit",
        medium: "Oil & cold wax on board",
        size: '20" × 20"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_d47aa018608a4ba3b037b7e0ce4f5f8c~mv2.jpg",
      },
      {
        title: "Convergence",
        medium: "Oil & cold wax on board",
        size: '20" × 20"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_8956a6d586104f98b040c91fed1965a0~mv2.jpg",
      },
    ],
  },
  {
    slug: "beyond-the-surface",
    title: "Beyond the Surface",
    excerpt:
      "Beyond the Surface is a group of multilayered paintings that invite the viewer to peer beneath the surface, observing both the explicit and the implied.",
    content: `Beyond the Surface is a group of multilayered paintings that invite the viewer to peer beneath the surface, observing both the explicit and the implied.

"Seek that which is away from the surface  
Dig further, refrain to linger on surface  
Deep across the ocean blue  
See the beauty and the true  
Beyond the surface...."  
— Jasmin A`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_35213e48c07940f783ac6e1ecbc05a67~mv2.jpg",
    sortOrder: 1,
    works: [
      {
        title: "Things We Left Unsaid",
        medium: "Pigments, paper, oil & cold wax on board",
        size: '24" × 36"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_35213e48c07940f783ac6e1ecbc05a67~mv2.jpg",
      },
      {
        title: "Flesh Wound",
        medium: "Encaustic on board",
        size: '16" × 16"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_79660873fe72468697a23849453efcdc~mv2.jpg",
      },
      {
        title: "Skin Deep",
        medium: "Encaustic on board",
        size: '12" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_6e580791400b43e294241eb149068572~mv2.jpg",
      },
      {
        title: "Delia's Jewelry Box",
        medium: "Encaustic on board",
        size: '24" × 24"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_752fcfac7fb04cda87afad8ba9d818f5~mv2.png",
      },
      {
        title: "Upon Reflection",
        medium: "Encaustic on board",
        size: '12" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_d72fdcedff424bb5846839ea5e21d487~mv2.jpg",
      },
      {
        title: "Outbreak",
        medium: "Encaustic on board",
        size: '14" × 14"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_4472ba5d693f4eb899875090bc71e030~mv2.jpg",
      },
      {
        title: "Dehiscence",
        medium: "Encaustic on board",
        size: '12" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_b1484423d0a34ea78e24655210d09fbe~mv2.jpg",
      },
      {
        title: "Night's Call Diptych",
        medium: "Oil & cold wax on board",
        size: '6" × 24" each',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_0ec60de600ab4fc8bada52dd0c08df65~mv2.jpg",
      },
      {
        title: "Tumble",
        medium: "Oil & cold wax on board",
        size: '10" × 10"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_6a7efeb075214572883783b3ba391871~mv2.jpg",
      },
      {
        title: "Heiwa",
        medium: "Oil & cold wax on board",
        size: '12" × 24" each',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_30c1747124f94848a498e55a7ca5a34b~mv2.jpg",
      },
    ],
  },
  {
    slug: "in-search-of-solace",
    title: "In Search of Solace",
    excerpt:
      "Paintings inspired by the strength, quiet escape, comfort and safety found in the natural world.",
    content: `Paintings inspired by the strength, quiet escape, comfort and safety found in the natural world.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_07dfacaf47d84eaea23768f20e3b03a1~mv2.jpg",
    sortOrder: 2,
    works: [
      {
        title: "After the Storm",
        medium: "Pastel, encaustic on board",
        size: 'Triptych 6" × 24" each',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_b448fce460b2475c9d67ec3f568a8a7e~mv2.jpg",
      },
      {
        title: "Winter Quiet #1",
        medium: "Oil & cold wax on board",
        size: '24" × 24"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_cd337508e4d84139aaef5afb9e61893e~mv2.jpg",
      },
      {
        title: "Winter Quiet #2",
        medium: "Oil & cold wax on board",
        size: '24" × 24"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_07dfacaf47d84eaea23768f20e3b03a1~mv2.jpg",
      },
      {
        title: "Safe Harbor",
        medium: "Pastel, encaustic on board",
        size: '16" × 16"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_56500d2c1c65458e9bb5e1bf544e546d~mv2.jpg",
      },
      {
        title: "Skin Deep",
        medium: "Encaustic",
        size: '12" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_f407c26b44e34ba79e2b3ab9a654ebc5~mv2.jpg",
      },
      {
        title: "Healing Waters",
        medium: "Encaustic on board",
        size: '10" × 10"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_b975978b7d494fbc8416c01bfd0ebeec~mv2.jpg",
      },
      {
        title: "Tempest",
        medium: "Encaustic on board",
        size: '8" × 8"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_260e4287144f406794c8ca0d50bb12b5~mv2.jpg",
      },
      {
        title: "Cleansed",
        medium: "Oil & cold wax on board",
        size: '6" × 6"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_2ef5b96007754993997c36836dbcf582~mv2.jpg",
      },
      {
        title: "Hiding",
        medium: "Encaustic on board",
        size: '10" × 10"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_453a85f16cb644eeaf929c9e6f58e99a~mv2.jpg",
      },
      {
        title: "Horizon",
        medium: "Encaustic",
        size: '10" × 10"',
        year: "2020",
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_7d3470c5711c41d9992ffca1e11e3a29~mv2.png",
      },
    ],
  },
  {
    slug: "diastole",
    title: "Diastole",
    excerpt:
      "A collection of paintings capturing the still moment of pause as day slides into night—evoking the heart’s brief rest between beats.",
    content: `A collection of paintings capturing the still moment of pause as day slides into night, evoking the essential fleeting moment of pause the heart muscle requires between beats, known as diastole.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_62ffe6b17807417ea88acff698db2703~mv2.jpg",
    sortOrder: 3,
    works: [
      {
        title: "Golden Hour",
        medium: "Pastel, oil & cold wax on paper",
        size: '9" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_62ffe6b17807417ea88acff698db2703~mv2.jpg",
      },
      {
        title: "Rise Up",
        medium: "Pastel, oil & cold wax on paper",
        size: '9" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_ac2eef2ce0284f84b07b9bf048c59312~mv2.jpg",
      },
      {
        title: "Coalesce",
        medium: "Pastel, oil & cold wax on paper",
        size: '9" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_a15458a9f7134197826a115d6ccc4728~mv2.jpg",
      },
      {
        title: "Storm Approaching",
        medium: "Pastel, oil & cold wax on paper",
        size: '9" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_8b32936a669846e4820643f7ba857378~mv2.jpg",
      },
      {
        title: "Calm",
        medium: "Pastel, oil & cold wax on paper",
        size: '9" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_ae9b3f73a37d42b682dd5268f3504b18~mv2.jpg",
      },
      {
        title: "Fusion",
        medium: "Pastel, oil & cold wax on paper",
        size: '9" × 12"',
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_ac32cc172675455b8e9543c4e757ad31~mv2.jpg",
      },
    ],
  },
  {
    slug: "3-dimensional-works",
    title: "3 Dimensional Works",
    excerpt:
      "Relief and dimensional pieces where encaustic and oil lift away from the plane—objects that hold shadow, edge, and weight.",
    content: `Three-dimensional works where material builds into form—oil and encaustic mounted on board, shaped to catch light and cast quiet shadow.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_53591ff0b19a4ffb9555ef8243c7f565~mv2.jpg",
    sortOrder: 4,
    works: [
      {
        title: "Beautiful, Unbroken",
        medium: "Oil & encaustic mounted on board",
        size: "",
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_53591ff0b19a4ffb9555ef8243c7f565~mv2.jpg",
      },
      {
        title: "Old Souls",
        medium: "Oil & encaustic mounted on board",
        size: "",
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_2457faaf711d44b690c515b91df950e0~mv2.jpg",
      },
      {
        title: "Shroud",
        medium: "Oil & encaustic mounted on board",
        size: "",
        sourceUrl:
          "https://static.wixstatic.com/media/8c4e46_c282ee3fa6a04fa18f6cbc5e390b7587~mv2.jpg",
      },
    ],
  },
  {
    slug: "new-work",
    title: "New Work",
    excerpt:
      "Recent paintings and studies—layers still in motion, surfaces that arrive before language catches up.",
    content: `This is a place for work that is still unfolding—recent finishes, studio studies, and experiments that belong together before they settle into a longer series.

You can add images and copy anytime in the admin under **Series → New Work**.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_07dfacaf47d84eaea23768f20e3b03a1~mv2.jpg",
    sortOrder: 5,
    works: [],
  },
  {
    slug: "stick-season",
    title: "Stick Season",
    excerpt:
      "Placeholder series—excerpt and gallery pieces will be filled in as this body of work takes shape.",
    content: `**Stick Season** is reserved as a placeholder gallery on the site. Replace this statement, featured image, and works in the admin when you are ready to publish the series.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_35213e48c07940f783ac6e1ecbc05a67~mv2.jpg",
    sortOrder: 6,
    works: [],
  },
  {
    slug: "standing-tall-as-trees",
    title: "Standing Tall as Trees",
    excerpt:
      "Placeholder series—excerpt and gallery pieces will be filled in as this body of work takes shape.",
    content: `**Standing Tall as Trees** is reserved as a placeholder gallery on the site. Replace this statement, featured image, and works in the admin when you are ready to publish the series.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_b448fce460b2475c9d67ec3f568a8a7e~mv2.jpg",
    sortOrder: 7,
    works: [],
  },
  {
    slug: "born-in-france",
    title: "Born in France",
    excerpt:
      "Placeholder series—excerpt and gallery pieces will be filled in as this body of work takes shape.",
    content: `**Born in France** is reserved as a placeholder gallery on the site. Replace this statement, featured image, and works in the admin when you are ready to publish the series.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_8956a6d586104f98b040c91fed1965a0~mv2.jpg",
    sortOrder: 8,
    works: [],
  },
  {
    slug: "symphony-of-scars",
    title: "Symphony of Scars",
    excerpt:
      "Placeholder series—excerpt and gallery pieces will be filled in as this body of work takes shape.",
    content: `**Symphony of Scars** is reserved as a placeholder gallery on the site. Replace this statement, featured image, and works in the admin when you are ready to publish the series.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_7757c895a908460590bd546fb8bb727c~mv2.jpg",
    sortOrder: 9,
    works: [],
  },
  {
    slug: "2026-works-on-paper-collage",
    title: "2026 Works on paper collage",
    excerpt:
      "New work on paper and collage from 2026—layers, cut edges, and studio experiments as the year unfolds.",
    content: `This series gathers **2026** work on **paper** and in **collage**—material studies, finished pieces, and studio notes as the calendar turns.

Add images and refine this statement anytime in the admin under **Series → 2026 Works on paper collage**. Files you place in \`public/uploads/2026-works-on-paper-collage/\` can be wired to artworks there.`,
    featuredSourceUrl:
      "https://static.wixstatic.com/media/8c4e46_ae9b3f73a37d42b682dd5268f3504b18~mv2.jpg",
    sortOrder: 10,
    works: [],
  },
];

function extFromUrl(url: string) {
  const m = url.match(/~mv2\.(jpg|jpeg|png)/i);
  return (m?.[1] ?? "jpg").toLowerCase();
}

async function downloadTo(url: string, destAbs: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; MarcyBergeron-Noa.com/1.0; +https://marcybergeron-noa.com/)",
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destAbs), { recursive: true });
  await fs.writeFile(destAbs, buf);
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function galleryStatusHtml(status: string): string {
  if (status === "sold") return `<div class="text-xs tracking-wide text-muted">Sold</div>`;
  if (status === "available") return `<div class="text-xs tracking-wide text-muted">Available</div>`;
  if (!status || status === "unknown") return "";
  return `<div class="text-xs tracking-wide text-muted">${escapeHtmlText(status)}</div>`;
}

type GallerySeedRow = {
  image: string;
  alt: string;
  title: string;
  medium: string;
  size: string;
  year: string;
  description: string;
  status: string;
  seriesTitle: string;
};

function markdownGallery(rows: GallerySeedRow[]): string {
  if (rows.length === 0) return "";
  const figures = rows
    .map((r) => {
      const subtitle = captionSubtitle({ medium: r.medium, size: r.size, year: r.year });
      const excerptBlock = r.description.trim()
        ? `<div class="mt-3 text-sm leading-relaxed text-muted">${escapeHtmlText(r.description.trim())}</div>`
        : `<div class="mt-3 text-sm leading-relaxed text-ink/50 italic">Further notes for this piece appear with the full listing under <strong>${escapeHtmlText(r.seriesTitle)}</strong> in the Art section.</div>`;
      return `<figure class="post-gallery__card border border-line bg-white/30 p-4">
  <div class="post-gallery__media border border-line">
    <img class="post-gallery__thumb" src="${escapeAttr(r.image)}" alt="${escapeAttr(r.alt)}" loading="lazy" decoding="async" />
  </div>
  <figcaption class="mt-4 max-w-prose space-y-1">
    <div class="font-serif text-lg font-medium tracking-tight text-ink">${escapeHtmlText(r.title)}</div>
    <div class="text-sm font-normal leading-relaxed text-muted">${escapeHtmlText(subtitle || "—")}</div>${galleryStatusHtml(r.status) ? `\n    ${galleryStatusHtml(r.status)}` : ""}
    ${excerptBlock}
  </figcaption>
</figure>`;
    })
    .join("\n");
  return `\n\n<div class="post-gallery">\n${figures}\n</div>\n\n`;
}

type BlogDef = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string;
  intro: string;
  outro?: string;
  galleryOffset: number;
  publishedAt: Date;
  /** When set, used instead of the first artwork in the gallery slice. */
  featuredImage?: string;
};

async function seedPosts(db: AppDb, t: Date) {
  const artRows = await db
    .select({
      image: artwork.image,
      alt: artwork.alt,
      title: artwork.title,
      medium: artwork.medium,
      size: artwork.size,
      year: artwork.year,
      description: artwork.description,
      status: artwork.status,
      seriesTitle: series.title,
    })
    .from(artwork)
    .innerJoin(series, eq(artwork.seriesId, series.id))
    .orderBy(asc(series.sortOrder), asc(artwork.sortOrder));

  if (artRows.length === 0) {
    console.log("No artwork rows; skipping blog seed.");
    return;
  }

  const pick = (offset: number, count: number): GallerySeedRow[] => {
    const out: GallerySeedRow[] = [];
    for (let i = 0; i < count; i++) {
      out.push(artRows[(offset + i) % artRows.length]!);
    }
    return out;
  };

  const exhibitionPosts: BlogDef[] = [
    {
      slug: "porter-mill-common-thread",
      title: "A Common Thread — four artists, one connection",
      excerpt:
        "Curating and contributing to Porter Mill Gallery’s group exhibition “A Common Thread, 4 Artists: 1 Connection” in Beverly, MA.",
      category: "Exhibitions",
      tags: "Porter Mill Gallery, Beverly MA, group show",
      intro: `Porter Mill has long been a place where disciplined studio practice meets conversation across disciplines. **“A Common Thread, 4 Artists: 1 Connection”** was an invitation to place four distinct voices in one room and let the echoes between them do the teaching.

I joined as curator and as a participant—thinking about rhythm across the walls, pause between pieces, and the quiet through-line that carried from encaustic to oil to mixed surfaces.`,
      outro:
        "The works below are pulled from several ongoing series—surfaces built in layers, marks that change tempo depending on where you stand.",
      galleryOffset: 0,
      publishedAt: new Date("2025-01-18T15:00:00.000Z"),
    },
    {
      slug: "porter-mill-celebrating-small-works",
      title: "Celebrating Small Works at Porter Mill Gallery",
      excerpt:
        "A reflection on Porter Mill Gallery’s “Celebrating Small Works” in Beverly—and what intimacy of scale asks of a painting.",
      category: "Exhibitions",
      tags: "Porter Mill Gallery, small works, Beverly MA",
      intro: `**“Celebrating Small Works”** at Porter Mill asked for paintings that hold their presence without shouting across distance. Small pieces reward slow proximity: edges you can almost hear, pressure that reads differently at eighteen inches than across a long gallery wall.`,
      outro: "Here are a few pieces shown at similar intimate scales—each a conversation held close.",
      galleryOffset: 4,
      publishedAt: new Date("2025-02-05T15:00:00.000Z"),
    },
    {
      slug: "marblehead-emerging-new-artists",
      title: "Emerging New Artists at Marblehead Arts Association",
      excerpt:
        "Notes from the Marblehead Arts Association Gallery’s “Emerging New Artists Show”—showing new work alongside contemporaries on the coast.",
      category: "Exhibitions",
      tags: "Marblehead Arts Association, emerging artists",
      intro: `The **Marblehead Arts Association** gallery has a particular north-light clarity. In the **“Emerging New Artists Show”**, I was glad to hang work among painters who were still naming their habits in public—risk, tenderness, a willingness to leave the first solution unfinished.`,
      outro: "Images below sample recent directions in encaustic, oil, and cold wax from the studio.",
      galleryOffset: 8,
      publishedAt: new Date("2025-03-12T15:00:00.000Z"),
    },
    {
      slug: "berta-walker-learning-medium-opportunity",
      title: "Learning / Medium / Opportunity at Berta Walker Gallery",
      excerpt:
        "Provincetown, MA—reflections on Berta Walker Gallery’s “Learning/Medium/Opportunity” exhibition on the outer Cape.",
      category: "Exhibitions",
      tags: "Berta Walker Gallery, Provincetown MA, Cape Cod",
      intro: `**“Learning/Medium/Opportunity”** at Berta Walker Gallery arrives with the salt-light of Provincetown—the town’s long teaching tradition, the sea at the end of the street, the community that treats painting as a craft you renew every season.

The title reads like a three-step studio mantra: keep learning, honor the medium, recognize opportunity when it knocks quietly.`,
      outro: "Below: recent paintings that traveled with me, in spirit or in fact, toward that bright coast.",
      galleryOffset: 12,
      publishedAt: new Date("2025-04-20T15:00:00.000Z"),
    },
  ];

  const affiliationPosts: BlogDef[] = [
    {
      slug: "membership-marblehead-arts-association",
      title: "Juried membership: Marblehead Arts Association",
      excerpt:
        "What juried membership at the Marblehead Arts Association has meant for studio discipline, exhibition rhythm, and community—north of Boston.",
      category: "Affiliations",
      tags: "Marblehead Arts Association, juried member, community",
      intro: `Juried membership at the **Marblehead Arts Association** anchors a piece of my practice off the easel: installation deadlines, hanging standards, neighbors whose eyes you trust on critique night.

Marblehead’s coastal light finds its way into conversations about color—what reads as subtle indoors may declare itself differently by the harbor.`,
      outro: "A small gallery of recent work—places where MAA conversations have nudged a surface or clarified a finish.",
      galleryOffset: 2,
      publishedAt: new Date("2025-05-10T15:00:00.000Z"),
    },
    {
      slug: "membership-rocky-neck-cultural-center",
      title: "Juried membership: Rocky Neck Cultural Center",
      excerpt:
        "Rocky Neck in Gloucester—historic artist colony energy, Atlantic air, and what juried membership offers outside the studio door.",
      category: "Affiliations",
      tags: "Rocky Neck Cultural Center, Gloucester MA, juried member",
      intro: `**Rocky Neck Cultural Center** sits in one of New England’s oldest working-artist neighborhoods. Juried membership here links my work to a shoreline rhythm—tides, fog-bank grays, the blunt honesty painters borrow from boats and weather.`,
      outro: "Paintings below lean toward atmosphere and edge—subjects Rocky Neck seems to insist upon.",
      galleryOffset: 7,
      publishedAt: new Date("2025-06-01T15:00:00.000Z"),
    },
    {
      slug: "membership-cambridge-arts-association",
      title: "Juried membership: Cambridge Arts Association",
      excerpt:
        "Cambridge, MA—urban density, academic cross-currents, and the Cambridge Arts Association as a juried home for abstract painting.",
      category: "Affiliations",
      tags: "Cambridge Arts Association, juried member, Boston area",
      intro: `The **Cambridge Arts Association** brings together a wide orbit—science nearby, theater nearby, languages of form that span continents. As a juried member, I value the overlap: painters who read differently than I do, and who still care about the same slow questions of surface, silence, and pressure.`,
      outro: "Studio pieces following lines of inquiry I return to before a CAA conversation.",
      galleryOffset: 14,
      publishedAt: new Date("2025-06-22T15:00:00.000Z"),
    },
    {
      slug: "membership-yellow-chair-salon",
      title: "Juried membership: Yellow Chair Salon",
      excerpt:
        "Yellow Chair Salon (YCS)—juried membership, online symposia and mentorship, and how it connects to studio practice.",
      category: "Affiliations",
      tags: "Yellow Chair Salon, juried member, community, YCS",
      intro: `**Yellow Chair Salon** gathers painters who treat interior critique as hospitality—chairs pulled close, small rooms, opinions offered with care. Juried membership keeps one foot in that kind of honesty: the kind that improves a painting overnight and still respects you in the morning.

## About Yellow Chair Salon (YCS)

According to **[Yellow Chair Salon](https://www.yellowchairsalon.com/)**, **The Yellow Chair Salon (YCS)** is an online artist community and professional development platform founded by artist **Michael David**. YCS offers **virtual residencies**, **workshops (Symposia!)**, **mentorships**, and **exhibitions** for contemporary artists worldwide—centered on building **sustainable artistic careers** through curated sessions, critical dialogue, and engagement with distinguished guest artists and critics.

For announcements and news, follow **[@yellowchairsalon](https://www.instagram.com/yellowchairsalon/)** on Instagram.`,
      outro: "Works that have passed through salon-level scrutiny—layers adjusted after second and third glances.",
      galleryOffset: 18,
      publishedAt: new Date("2025-07-14T15:00:00.000Z"),
    },
  ];

  const studioPost: BlogDef = {
    slug: "studio-porter-mill-beverly",
    title: "At home in the studio — Porter Mill, Beverly",
    excerpt:
      "New studio …… #cleanslate #endlesspossibilities #bringit — notes from Porter Mill (1895), open studios, and the building’s artist community.",
    category: "Studio",
    tags: "Porter Mill, Beverly MA, studio, open studios",
    featuredImage: "/images/studio.webp",
    intro: `When the boxes finally emptied and the floor read clean again, I took a breath and let the room tell me what it wanted. The first walks across that square of daylight became a reset.

*New studio …… #cleanslate #endlesspossibilities #bringit*

## About the building

The history and visitor information below are summarized from **Porter Mill Studios’** own “About Porter Mill” page: [About Porter Mill | Porter Mill Studios](https://www.portermillstudios.com/about-porter-mill).

**Porter Mill** was first occupied in **1895** and was associated with Beverly’s famous shoe industry. Through the years, the building has housed Decron Plastics, Superior Hat Company, Superior Real Estate, Criterion Shoe Company, Lion Leather and Plastic, and Porter Sewing Machine Corporation.

Today Porter Mill is home to a wide range of artists working in a variety of styles and media. Offerings include **drawing, painting, ceramics, glass work, photography, jewelry, fashion**, and more. The building hosts **biannual open studios**, allowing the public to tour studios, meet the artists, and purchase art where it is created. The lobby and first-floor vitrine feature **rotating exhibitions** of Porter Mill artists.

For current exhibitions and events, follow Porter Mill on **[Facebook](https://www.facebook.com/PorterMillBeverly/)** and on Instagram **@porter_mill_studios** (see Porter Mill’s site for the latest handle and links).

To inquire about **studio availability** at the building, email [studios.portermill@gmail.com](mailto:studios.portermill@gmail.com).`,
    outro:
      "A few in-progress pieces from the shelves—color tests, surfaces still deciding what they want to become.",
    galleryOffset: 19,
    publishedAt: new Date("2025-08-12T15:00:00.000Z"),
  };

  const all = [...exhibitionPosts, ...affiliationPosts, studioPost];
  await db.insert(post).values(
    all.map((p) => ({
      id: nanoid(),
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: `${p.intro}${markdownGallery(pick(p.galleryOffset, 4))}${p.outro ? `\n\n${p.outro}` : ""}`,
      featuredImage: p.featuredImage ?? artRows[p.galleryOffset % artRows.length]!.image,
      published: true,
      publishedAt: p.publishedAt,
      category: p.category,
      tags: p.tags,
      createdAt: t,
      updatedAt: p.publishedAt,
    })),
  );

  console.log(`Seeded ${all.length} published blog posts.`);
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Set DATABASE_URL (e.g. Railway Postgres), then run: npm run seed");
    process.exit(1);
  }
  const db = getDb();
  const t = now();

  await db.execute(
    sql.raw(`TRUNCATE TABLE
      home_selected_artwork_slot,
      home_featured_post_slot,
      home_featured_series_slot,
      home_slideshow,
      home_section,
      artwork,
      post,
      series,
      contact_message,
      mailing_list_signup
    RESTART IDENTITY CASCADE`),
  );

  for (const s of SERIES) {
    const sid = nanoid();
    const featExt = extFromUrl(s.featuredSourceUrl);
    const featDisk = `/uploads/${s.slug}/featured.${featExt}`;
    await downloadTo(s.featuredSourceUrl, path.join(process.cwd(), "public", featDisk.slice(1)));

    await db.insert(series).values({
      id: sid,
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt,
      content: s.content,
      featuredImage: featDisk,
      sortOrder: s.sortOrder,
      createdAt: t,
      updatedAt: t,
    });

    let order = 0;
    for (const w of s.works) {
      const ext = extFromUrl(w.sourceUrl);
      const safeName = `${String(order + 1).padStart(2, "0")}-${w.title
        .replace(/[^\w]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase()}.${ext}`;
      const disk = `/uploads/${s.slug}/${safeName}`;
      await downloadTo(w.sourceUrl, path.join(process.cwd(), "public", disk.slice(1)));
      const line2 = [w.medium, w.size, w.year].filter(Boolean).join(" · ");
      await db.insert(artwork).values({
        id: nanoid(),
        seriesId: sid,
        title: w.title,
        medium: w.medium,
        size: w.size,
        year: w.year ?? "",
        description: "",
        image: disk,
        alt: `${w.title} — ${line2}`.trim(),
        status: "unknown",
        sortOrder: order++,
        createdAt: t,
        updatedAt: t,
      });
    }
  }

  await seedPosts(db, t);

  console.log("Seed complete. Images saved under public/uploads/. ");
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb().catch(() => {});
  process.exit(1);
});
