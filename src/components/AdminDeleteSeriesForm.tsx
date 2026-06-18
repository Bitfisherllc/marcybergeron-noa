"use client";

import { useMemo, useState } from "react";
import { adminBtnDanger } from "@/components/AdminLink";
import type { SeriesDeleteImpact } from "@/lib/seriesDelete";

type GalleryOption = { id: string; title: string };

type Props = {
  action: (formData: FormData) => Promise<void>;
  impact: SeriesDeleteImpact;
  portfolioOptions: GalleryOption[];
  mediumOptions: GalleryOption[];
  returnTo?: string;
  /** Where to send the browser after a successful delete (defaults to admin series list). */
  redirectAfter?: string;
  compact?: boolean;
  /** On public site pages: show impact explanation below the delete button. */
  explainBelow?: boolean;
};

function ArtworkList({ items, label }: { items: { id: string; title: string }[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-medium tracking-wide text-ink/80 uppercase">{label}</p>
      <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-sm text-muted">
        {items.map((item) => (
          <li key={item.id}>· {item.title}</li>
        ))}
      </ul>
    </div>
  );
}

function DeleteImpactExplanation({
  impact,
  needsPrimaryReassign,
  canOfferMediumReassign,
}: {
  impact: SeriesDeleteImpact;
  needsPrimaryReassign: boolean;
  canOfferMediumReassign: boolean;
}) {
  return (
    <div className="max-w-prose space-y-3 text-sm text-muted">
      {needsPrimaryReassign ? (
        <p>
          <span className="text-ink/90">{impact.primaryArtworks.length}</span>{" "}
          {impact.primaryArtworks.length === 1 ? "painting uses" : "paintings use"} this gallery as its primary home
          and would be removed from the site unless you move {impact.primaryArtworks.length === 1 ? "it" : "them"}{" "}
          first.
        </p>
      ) : (
        <p>Deleting this gallery removes its public page. No paintings will be permanently deleted.</p>
      )}
      {impact.membershipOnlyArtworks.length > 0 ? (
        <p>
          <span className="text-ink/90">{impact.membershipOnlyArtworks.length}</span> more{" "}
          {impact.membershipOnlyArtworks.length === 1 ? "painting appears" : "paintings appear"} here but{" "}
          {impact.membershipOnlyArtworks.length === 1 ? "has" : "have"} another primary portfolio —{" "}
          {impact.membershipOnlyArtworks.length === 1 ? "it will" : "they will"} stay on the site and only disappear
          from this gallery.
        </p>
      ) : null}
      {canOfferMediumReassign ? (
        <p>
          <span className="text-ink/90">{impact.mediumAssignments.length}</span>{" "}
          {impact.mediumAssignments.length === 1 ? "painting is" : "paintings are"} listed under this medium and can
          optionally be moved to another medium gallery.
        </p>
      ) : null}
      <p>This cannot be undone.</p>
    </div>
  );
}

export function AdminDeleteSeriesForm({
  action,
  impact,
  portfolioOptions,
  mediumOptions,
  returnTo,
  redirectAfter,
  compact = false,
  explainBelow = false,
}: Props) {
  const needsPrimaryReassign = impact.primaryArtworks.length > 0;
  const canOfferMediumReassign =
    impact.isMediumGallery && impact.mediumAssignments.length > 0 && !needsPrimaryReassign;

  const [reassignType, setReassignType] = useState<"portfolio" | "medium" | "none">(
    needsPrimaryReassign ? "portfolio" : "none",
  );
  const [reassignTargetId, setReassignTargetId] = useState("");

  const destinationOptions = useMemo(
    () => (reassignType === "medium" ? mediumOptions : portfolioOptions),
    [mediumOptions, portfolioOptions, reassignType],
  );

  const showDestination = needsPrimaryReassign || (canOfferMediumReassign && reassignType === "medium");
  const mediumOptionDisabled = needsPrimaryReassign && !impact.canReassignPrimaryToMediumOnly;

  const isValid = useMemo(() => {
    if (needsPrimaryReassign) {
      if (reassignType === "none") return false;
      if (mediumOptionDisabled && reassignType === "medium") return false;
      return Boolean(reassignTargetId);
    }
    if (canOfferMediumReassign && reassignType === "medium") {
      return Boolean(reassignTargetId);
    }
    return true;
  }, [canOfferMediumReassign, mediumOptionDisabled, needsPrimaryReassign, reassignTargetId, reassignType]);

  return (
    <form
      action={action}
      className={compact ? "space-y-3" : "space-y-4"}
      onSubmit={(e) => {
        if (!isValid) {
          e.preventDefault();
          return;
        }
        const summary = needsPrimaryReassign
          ? `Delete “${impact.title}” and move ${impact.primaryArtworks.length} painting(s) to the selected gallery?`
          : `Delete “${impact.title}”?`;
        if (!confirm(summary)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={impact.seriesId} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {redirectAfter ? <input type="hidden" name="redirectAfter" value={redirectAfter} /> : null}
      <input type="hidden" name="reassignType" value={reassignType} />

      {!compact && !explainBelow ? (
        <DeleteImpactExplanation
          impact={impact}
          needsPrimaryReassign={needsPrimaryReassign}
          canOfferMediumReassign={canOfferMediumReassign}
        />
      ) : null}

      {!compact && !explainBelow ? (
        <>
          <ArtworkList items={impact.primaryArtworks} label="Paintings that need a new home" />
          <ArtworkList items={impact.membershipOnlyArtworks} label="Paintings that will stay on the site" />
          <ArtworkList items={impact.mediumAssignments} label="Medium listings affected" />
        </>
      ) : compact && needsPrimaryReassign ? (
        <p className="text-xs text-red-800">
          {impact.primaryArtworks.length} painting{impact.primaryArtworks.length === 1 ? "" : "s"} need reassignment
          before delete.
        </p>
      ) : null}

      {needsPrimaryReassign || canOfferMediumReassign ? (
        <fieldset className="space-y-3 border border-line bg-white/40 p-4">
          <legend className="px-1 text-sm text-muted">
            {needsPrimaryReassign ? "Move affected paintings to" : "Medium reassignment (optional)"}
          </legend>

          {needsPrimaryReassign ? (
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 text-sm text-ink/90">
                <input
                  type="radio"
                  name="reassignTypeChoice"
                  className="mt-1"
                  checked={reassignType === "portfolio"}
                  onChange={() => {
                    setReassignType("portfolio");
                    setReassignTargetId("");
                  }}
                />
                <span>Another portfolio gallery</span>
              </label>
              <label className={`flex items-start gap-2.5 text-sm ${mediumOptionDisabled ? "text-muted" : "text-ink/90"}`}>
                <input
                  type="radio"
                  name="reassignTypeChoice"
                  className="mt-1"
                  checked={reassignType === "medium"}
                  disabled={mediumOptionDisabled}
                  onChange={() => {
                    setReassignType("medium");
                    setReassignTargetId("");
                  }}
                />
                <span>
                  Another medium gallery
                  {mediumOptionDisabled ? (
                    <span className="mt-1 block text-xs text-muted">
                      Not available — at least one affected painting has no other portfolio. Use a portfolio gallery
                      instead.
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-muted">
                      Primary portfolio becomes another series this painting already belongs to.
                    </span>
                  )}
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 text-sm text-ink/90">
                <input
                  type="radio"
                  name="reassignTypeChoice"
                  className="mt-1"
                  checked={reassignType === "none"}
                  onChange={() => {
                    setReassignType("none");
                    setReassignTargetId("");
                  }}
                />
                <span>Remove medium listing only</span>
              </label>
              <label className="flex items-start gap-2.5 text-sm text-ink/90">
                <input
                  type="radio"
                  name="reassignTypeChoice"
                  className="mt-1"
                  checked={reassignType === "medium"}
                  onChange={() => {
                    setReassignType("medium");
                    setReassignTargetId("");
                  }}
                />
                <span>Move to another medium gallery</span>
              </label>
            </div>
          )}

          {showDestination ? (
            <label className="block text-sm text-muted">
              {reassignType === "medium" ? "Medium gallery" : "Portfolio gallery"}
              <select
                required
                name="reassignTargetId"
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="">Choose…</option>
                {destinationOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </fieldset>
      ) : null}

      <button type="submit" className={adminBtnDanger} disabled={!isValid}>
        Delete gallery
      </button>

      {explainBelow ? (
        <>
          <DeleteImpactExplanation
            impact={impact}
            needsPrimaryReassign={needsPrimaryReassign}
            canOfferMediumReassign={canOfferMediumReassign}
          />
          <ArtworkList items={impact.primaryArtworks} label="Paintings that need a new home" />
          <ArtworkList items={impact.membershipOnlyArtworks} label="Paintings that will stay on the site" />
        </>
      ) : null}
    </form>
  );
}
