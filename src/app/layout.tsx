import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { SITE_DOMAIN, SITE_NAME, SITE_URL } from "@/lib/site";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Abstract Artist Portfolio`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Explore the abstract paintings, art series, and studio work of Marcy Bergeron-Noa.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: `${SITE_NAME} | Abstract Artist Portfolio`,
    description:
      "Explore the abstract paintings, art series, and studio work of Marcy Bergeron-Noa.",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${cormorant.variable} h-full`}>
      <head>
        <link rel="dns-prefetch" href="https://static.wixstatic.com" />
        <meta name="author" content={SITE_NAME} />
        <meta name="publisher" content={SITE_DOMAIN} />
      </head>
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
