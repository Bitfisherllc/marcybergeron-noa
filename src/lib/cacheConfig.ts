/** Default ISR window for public pages backed by Postgres content. */
export const SITE_REVALIDATE_SECONDS = 300;

export const CACHE_TAGS = {
  series: "series",
  artwork: "artwork",
  posts: "posts",
  home: "home",
} as const;

/** Next.js 16 requires a cache life profile as the second argument. */
export const CACHE_REVALIDATE_PROFILE = "max" as const;
