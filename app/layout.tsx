import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vision Health Pioneers Internal System",
  description: "Internal system for startups management",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
