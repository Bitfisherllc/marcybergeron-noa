import { SITE_NAME } from "@/lib/site";

export const HOME_SECTION_KEYS = [
  "hero",
  "featured_series",
  "journal",
  "artist_words",
  "selected_works",
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export type HomeSectionCopy = {
  eyebrow: string;
  title: string;
  quote: string;
  body: string;
  visible: boolean;
};

/** Sections Marcy can show or hide on the public home page. */
export const HOME_TOGGLEABLE_SECTIONS = ["featured_series", "journal", "selected_works"] as const;
export type HomeToggleableSection = (typeof HOME_TOGGLEABLE_SECTIONS)[number];

export function isHomeToggleableSection(key: string): key is HomeToggleableSection {
  return (HOME_TOGGLEABLE_SECTIONS as readonly string[]).includes(key);
}

export const HOME_SECTION_DEFAULTS: Record<HomeSectionKey, HomeSectionCopy> = {
  hero: {
    eyebrow: "Abstract paintings",
    title: "Paintings that listen beneath the surface....",
    quote: "",
    body: `${SITE_NAME} works in layers—color, mark, and silence—searching for direction, solace, and connection. This portfolio is organized as a set of doorways: each series is a room with its own light.`,
    visible: true,
  },
  featured_series: {
    eyebrow: "",
    title: "Featured series",
    quote: "",
    body: `A quiet map of the work—each card holds an image, a title, and a short excerpt before you enter. Choose up to three series below; if none are selected, the first three series by Admin → Series sort order are shown.`,
    visible: false,
  },
  journal: {
    eyebrow: "",
    title: "Journal",
    quote: "",
    body: "Exhibitions, studio notes, and memberships—short reads from the news section.",
    visible: false,
  },
  artist_words: {
    eyebrow: "",
    title: "In the artist’s words",
    quote: "Layers hold what memory cannot name.",
    body: "The paintings in this series depict the search for direction, orientation, destination, meaning, clarity and connection.",
    visible: true,
  },
  selected_works: {
    eyebrow: "",
    title: "Selected works",
    quote: "",
    body: "Three paintings from the studio—an invitation to look closely before you choose a doorway. Each piece holds a pause in the larger search: color, mark, and the quiet that lives between layers.",
    visible: false,
  },
};
