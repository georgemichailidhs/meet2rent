import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meet2Rent - Digital Platform for Long-Term Rentals in Greece",
  description: "Revolutionary digital platform for long-term property rentals in Greece. Find, certify, and rent completely online with full digital processes for both landlords and tenants.",
  keywords: "Greece rentals, Athens apartments, long-term rental, digital platform, property rental, tenant verification, landlord services",
  openGraph: {
    title: "Meet2Rent - Greece's Premier Rental Platform",
    description: "Find your perfect home or rent out your property with Greece's most trusted digital rental platform",
    url: "https://meet2rent.app",
    siteName: "Meet2Rent",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Meet2Rent - Property Rentals in Greece</title>
        <meta name="description" content="Digital platform for long-term property rentals in Greece" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
