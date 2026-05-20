import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

const cruinn = localFont({
  src: [
    {
      path: "../shared/assets/fonts/Cruinn-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../shared/assets/fonts/Cruinn-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

const unbounded = localFont({
  src: "../shared/assets/fonts/Unbounded-Regular.ttf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Petto",
    template: "%s · Petto",
  },
  description: "Petto — объявления и посты о питомцах",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: "Petto",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${cruinn.variable} ${unbounded.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
