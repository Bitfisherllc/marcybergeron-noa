import { CONTACT } from "@/lib/site";

export const ABOUT_SECTION_KEYS = [
  "hero",
  "artist_statement",
  "biography",
  "education",
  "exhibitions",
  "affiliations",
  "studio",
] as const;

export type AboutSectionKey = (typeof ABOUT_SECTION_KEYS)[number];

export type AboutSectionCopy = {
  eyebrow: string;
  title: string;
  body: string;
};

export const ABOUT_PORTRAIT_DEFAULT = {
  image: "/images/bio.webp",
  alt: "Portrait of Marcy Bergeron-Noa in the studio",
} as const;

export const ABOUT_SECTION_DEFAULTS: Record<AboutSectionKey, AboutSectionCopy> = {
  hero: {
    eyebrow: "About",
    title: "Marcy Bergeron-Noa",
    body: "Abstract painter working in encaustic, oil, cold wax, and pastel—based in Beverly, Massachusetts.",
  },
  artist_statement: {
    eyebrow: "",
    title: "Artist statement",
    body: `Marcy Bergeron-Noa’s abstract paintings move between observation and intuition—layering encaustic, oil, cold wax, and pastel to build surfaces that reward slow looking.

Her work is organized in series that trace recurring questions: how we find direction, what rests beneath the visible, where solace lives in landscape and memory, and how rhythm appears in small daily shifts.`,
  },
  biography: {
    eyebrow: "",
    title: "Biography",
    body: `Marcy Bergeron-Noa is a Massachusetts-based abstract artist working primarily in encaustic, oil, and cold wax. Her practice is grounded in continued study and studio discipline, with a focus on material depth, restrained color, and tactile surfaces.

She maintains a studio at Porter Mill in Beverly, MA, where she develops bodies of work as discrete series—each with its own language, but connected by an ongoing search for clarity and connection.`,
  },
  education: {
    eyebrow: "",
    title: "Education, workshops, and classes",
    body: `- Peabody Essex Museum — Still life drawing (2001)
- Montserrat College of Art Continuing Education, Beverly, MA (2006–2012) — oil (still life and figure), pastel, landscape in acrylic, acrylic painting, mixed media with Maria Malatesta, encaustic with Kim Bernard
- Truro Center for the Arts, Truro, MA — International Encaustic Conference (2007–2020), including pre/post conference workshops with Tracy Spadafora, Sandi Miot, Lia Rothstein, Laura Moriarty, and others
- Annual Maine Encaustic Retreat — with Kim Bernard (2011–2015) and Dietland Vander Schaaf (2015–2019)
- Introduction to Cold Wax — San Miguel de Allende, MX (3/2020) with Jerry McLaughlin
- Cold Wax Academy (9/2020–present) with Jerry McLaughlin & Rebecca Crowell`,
  },
  exhibitions: {
    eyebrow: "",
    title: "Selected exhibitions",
    body: `- Porter Mill Gallery — curator and contributor, “A Common Thread, 4 Artists: 1 Connection” (Beverly, MA)
- Porter Mill Gallery — “Celebrating Small Works” (Beverly, MA)
- Marblehead Arts Association Gallery — “Emerging New Artists Show” (Marblehead, MA)
- Berta Walker Gallery — “Learning/Medium/Opportunity” (Provincetown, MA)`,
  },
  affiliations: {
    eyebrow: "",
    title: "Affiliations (juried member)",
    body: `- Marblehead Arts Association
- Rocky Neck Cultural Center
- Cambridge Arts Association
- Yellow Chair Salon`,
  },
  studio: {
    eyebrow: "",
    title: "Studio",
    body: CONTACT.studioLines.join("\n"),
  },
};
