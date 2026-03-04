import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VISOR — Global Conflict Monitor",
  description: "Real-time global conflict and attack monitoring dashboard with live data from trusted sources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#080b12]">
        {children}
      </body>
    </html>
  );
}
