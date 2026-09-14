export const POST_KINDS = ["news", "workshop"] as const;

export type PostKind = (typeof POST_KINDS)[number];

export function parsePostKind(value: unknown): PostKind {
  return value === "workshop" ? "workshop" : "news";
}

export function postPublicBasePath(kind: PostKind): "/news" | "/workshops" {
  return kind === "workshop" ? "/workshops" : "/news";
}

export function postPublicHref(kind: PostKind, slug: string): string {
  return `${postPublicBasePath(kind)}/${encodeURIComponent(slug)}`;
}

export function postAdminBasePath(kind: PostKind): "/admin/posts" | "/admin/workshops" {
  return kind === "workshop" ? "/admin/workshops" : "/admin/posts";
}

export type PostIndexHeader = {
  eyebrow: string;
  heading: string;
  intro: string;
};

export function postKindCopy(kind: PostKind) {
  if (kind === "workshop") {
    return {
      eyebrow: "Workshops",
      heading: "Workshops",
      intro:
        "Explore your creativity with immersive, small-group art workshops at Porter Mill Studios. These hands-on, two-day intensives combine demonstrations, guided practice, and individual studio time in a relaxed and supportive environment. Designed for all experience levels, each workshop offers the opportunity to learn new techniques, experiment with materials, and create your own unique work.",
      emptyAll:
        "No published workshops yet. When you are ready, add your first entry in the site admin under Workshops.",
      emptyFiltered: (name: string) => `No published workshops in ${name} yet.`,
      cardPlaceholder: "Workshop",
      nextHeading: "Next workshop",
      viewAll: "View all workshops →",
      back: "← Back to workshops",
      moreEyebrow: "Workshops",
      moreAria: "Next workshops",
      adminTitle: "Workshops",
      adminNew: "New workshop",
      adminEdit: "Edit workshop",
      adminSave: "Save workshop",
      adminIntro: "Drafts stay private until published.",
      adminUrlHint: "Public URL becomes /workshops/[slug].",
      adminMenuEyebrow: "Workshops",
      adminMenuTitle: "Workshops",
      adminMenuBlurb: "Dates, details, and class notes",
      metaTitle: "Workshops",
      metaDescription: "Workshops with Marcy Bergeron-Noa—dates, details, and how to join.",
      categoryNavLabel: "Filter workshops by category",
      categorySectionHint: "Choose a category on each workshop. Add more names here whenever you need them.",
    };
  }

  return {
    eyebrow: "News",
    heading: "Journal",
    intro:
      "Exhibitions, studio notes, new work, press, and teaching updates—published here as posts are added in the admin area.",
    emptyAll: "No published posts yet. When you are ready, add your first entry in the site admin under Posts.",
    emptyFiltered: (name: string) => `No published posts in ${name} yet.`,
    cardPlaceholder: "Post",
    nextHeading: "Next article",
    viewAll: "View all posts →",
    back: "← Back to news",
    moreEyebrow: "News",
    moreAria: "Next articles",
    adminTitle: "Posts",
    adminNew: "New post",
    adminEdit: "Edit post",
    adminSave: "Save post",
    adminIntro: "Drafts stay private until published.",
    adminUrlHint: "Public URL becomes /news/[slug].",
    adminMenuEyebrow: "News",
    adminMenuTitle: "Posts",
    adminMenuBlurb: "Exhibitions, updates, press",
    metaTitle: "News",
    metaDescription: "Exhibitions, studio updates, and announcements from Marcy Bergeron-Noa.",
    categoryNavLabel: "Filter posts by category",
    categorySectionHint: "Choose a category on each post. Add more names here whenever you need them.",
  };
}

export function postIndexHeaderDefaults(kind: PostKind): PostIndexHeader {
  const copy = postKindCopy(kind);
  return {
    eyebrow: copy.eyebrow,
    heading: copy.heading,
    intro: copy.intro,
  };
}
