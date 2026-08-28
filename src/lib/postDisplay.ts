type PostDateFields = {
  category: string;
  showDate: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};

export function formatPostDate(d: Date | null | undefined, style: "short" | "long" = "long") {
  if (!d) return "";
  return new Intl.DateTimeFormat(
    "en-US",
    style === "short"
      ? { year: "numeric", month: "short", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric" },
  ).format(d);
}

export function postCategoryLine(post: PostDateFields, style: "short" | "long" = "long") {
  if (!post.showDate) return post.category;
  const date = formatPostDate(post.publishedAt ?? post.updatedAt, style);
  return date ? `${post.category} · ${date}` : post.category;
}
