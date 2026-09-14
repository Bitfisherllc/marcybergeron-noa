import type { MediumGallerySlug } from "@/lib/mediumGalleries";

/** Starting About paragraphs for public portfolio galleries. Admin-editable via series `content`. */
export const MEDIUM_GALLERY_ABOUT: Record<MediumGallerySlug, string> = {
  "Oil and Cold Wax":
    "Oil and cold wax, built in layers without heat. Surfaces stay open longer—pressed, scraped, and drawn back into—in the studio at Porter Mill in Beverly.",
  "Encaustic Paintings on Panel":
    "Encaustic on panel: pigmented wax fused with heat until the surface holds light in its layers. The work is made at Porter Mill in Beverly, where the medium’s depth and restraint set the pace.",
  "Wax Based Collage on Panel":
    "Paper, pigment, and wax on panel—collage fused into the surface rather than sitting on top of it. Cut edges and wax find a common ground in the studio at Porter Mill.",
  "Encaustic Monotypes":
    "Pigmented wax on a heated plate, then a single pull. Each monotype is its own record of pressure, temperature, and timing—work that belongs as much to the plate as to the paper.",
  Sculpture:
    "Work that lifts away from the plane—oil, encaustic, and mixed surfaces shaped to catch light and cast quiet shadow. These pieces are made in the studio at Porter Mill, where material is allowed to become form.",
  "The Studio":
    "The studio at Porter Mill in Beverly is where the work is made—encaustic, oil, cold wax, and pastel, in series that unfold over time. This gallery is a look at that room: tables, tools, and the ordinary light in which paintings take shape.",
};

export function mediumGalleryAbout(slug: string): string | null {
  if (slug in MEDIUM_GALLERY_ABOUT) return MEDIUM_GALLERY_ABOUT[slug as MediumGallerySlug];
  return null;
}
