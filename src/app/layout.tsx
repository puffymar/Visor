import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VISOR — Global Conflict Monitor",
  description: "Real-time global conflict and attack monitoring dashboard with live data from trusted sources.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "VISOR" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#080b12] min-h-[100dvh]">
        {children}
      </body>
    </html>
  );
}
