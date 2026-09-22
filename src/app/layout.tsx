import type { Metadata } from "next";
import { Providers, SiteFooter, SiteHeader } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "E-commerce", template: "%s | E-commerce" },
  description: "A modern e-commerce storefront",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteHeader />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
