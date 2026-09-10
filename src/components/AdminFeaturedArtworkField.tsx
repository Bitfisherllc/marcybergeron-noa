import type { Artwork } from "@/db";
import { parseFeaturedArtworkMode } from "@/lib/featuredArtwork";

type AdminFeaturedArtworkFieldProps = {
  mode: string | null | undefined;
  artworkId: string | null | undefined;
  pieces: Pick<Artwork, "id" | "title" | "image">[];
  listingSurface?: "portfolio" | "series";
};

export function AdminFeaturedArtworkField({
  mode,
  artworkId,
  pieces,
  listingSurface = "portfolio",
}: AdminFeaturedArtworkFieldProps) {
  const parsedMode = parseFeaturedArtworkMode(mode);
  const selectedId = artworkId ?? "";
  const listingName = listingSurface === "series" ? "Series" : "Portfolio";

  return (
    <fieldset className="space-y-4 border border-line bg-paper/40 p-4">
      <legend className="px-1 text-sm font-medium text-ink">{listingName} listing card</legend>
      <p className="text-xs leading-relaxed text-muted">
        Image on the main {listingName} page. Choose a fixed painting, or rotate randomly when the visitor refreshes
        the page. This does not change the large image inside the gallery.
      </p>
      <div className="space-y-2 text-sm text-ink/90">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="featuredArtworkMode"
            value="random"
            defaultChecked={parsedMode === "random"}
          />
          Random from portfolio
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
