import type { Artwork } from "@/db";
import { parseFeaturedArtworkMode } from "@/lib/featuredArtwork";

type AdminFeaturedArtworkFieldProps = {
  mode: string | null | undefined;
  artworkId: string | null | undefined;
  pieces: Pick<Artwork, "id" | "title" | "image">[];
  listingSurface?: "portfolio" | "series";
  hasUploadedImage?: boolean;
};

export function AdminFeaturedArtworkField({
  mode,
  artworkId,
  pieces,
  listingSurface = "portfolio",
  hasUploadedImage = false,
}: AdminFeaturedArtworkFieldProps) {
  const parsedMode = parseFeaturedArtworkMode(mode);
  const selectedId = artworkId ?? "";
  const listingName = listingSurface === "series" ? "Series" : "Portfolio";
  const pageName = listingSurface === "series" ? "medium’s page" : "Portfolio page";

  return (
    <fieldset data-admin-section={`${listingName} listing card`} className="space-y-4 border border-line bg-paper/40 p-4">
      <legend className="px-1 text-sm font-medium text-ink">{listingName} listing card</legend>
      <p className="text-xs leading-relaxed text-muted">
        Choose the picture on the {pageName}: the card image uploaded above, one fixed painting, or a random painting
        each time a visitor opens the page. This does not change the large image inside the gallery.
      </p>
      <div className="space-y-2 text-sm text-ink/90">
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="featuredArtworkMode"
            value="upload"
            defaultChecked={parsedMode === "upload"}
            className="mt-1"
          />
          <span>
            Use the uploaded card image
            <span className="block text-xs text-muted">
              {hasUploadedImage
                ? "Shows the image in the card image box above."
                : "Upload a card image above first. Until then a random painting shows."}
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="featuredArtworkMode"
            value="static"
            defaultChecked={parsedMode === "static"}
          />
          Fixed piece
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="featuredArtworkMode"
            value="random"
            defaultChecked={parsedMode === "random"}
          />
          Random from portfolio
        </label>
      </div>
      {pieces.length > 0 ? (
        <label className="block text-sm text-muted">
          Fixed piece
          <select
            name="featuredArtworkId"
            defaultValue={selectedId}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          >
            <option value="">— Select a piece —</option>
            {pieces.map((piece) => (
              <option key={piece.id} value={piece.id}>
                {piece.title}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-xs text-muted">Add paintings to this gallery before choosing a fixed piece.</p>
      )}
    </fieldset>
  );
}
