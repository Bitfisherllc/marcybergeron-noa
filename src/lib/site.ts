export const SITE_NAME = "Marcy Bergeron-Noa";
export const SITE_DOMAIN = "MarcyBergeron-Noa.com";
export const SITE_URL = `https://${SITE_DOMAIN.toLowerCase()}`;

/** Admin “view live site” — set `NEXT_PUBLIC_SITE_URL` if the custom domain isn’t live yet. */
export const LIVE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE_URL).replace(/\/$/, "");

export const CONTACT = {
  email: "marcynoaart@gmail.com",
  phone: "617 515 7915",
  studioLines: [
    "Porter Mill Studios",
    "Suite 105",
    "95 Rantoul St.",
    "Beverly, MA 01915",
  ],
  instagram: "https://www.instagram.com/marcysartspace/",
  facebook: "https://www.facebook.com/marcy.bergeron",
} as const;

/** Porter Mill / Rantoul St — used for maps, directions, and distance. */
export const STUDIO = {
  latitude: 42.55876,
  longitude: -70.87948,
  mapsSearchQuery: "Porter Mill Studios, 95 Rantoul St, Beverly, MA 01915",
} as const;

export const LEGACY_SITE = "https://www.mbergeronnoa.com/";
