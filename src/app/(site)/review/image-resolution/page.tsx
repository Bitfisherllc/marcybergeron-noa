import type { Metadata } from "next";
import { ImageResolutionReportView } from "@/components/ImageResolutionReportView";
import { IMAGE_RESOLUTION_REPORT_PATH, getImageResolutionReport } from "@/lib/imageResolutionReport";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Image resolution review",
  description: "Unlisted review of photographs that are smaller than the site displays them.",
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}${IMAGE_RESOLUTION_REPORT_PATH}` },
};

export default async function ImageResolutionReviewPage() {
  const report = await getImageResolutionReport();
  return <ImageResolutionReportView report={report} />;
}
