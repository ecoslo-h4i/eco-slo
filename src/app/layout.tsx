import type { Metadata } from "next";
import { Cardo, Mulish } from "next/font/google";
import "./globals.css";

const cardo = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cardo",
});

//! Update metadata to match your project
export const metadata: Metadata = {
  title: "Home - ECOSLO",
  description: "Tree Map and Management System",
};

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-mulish",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <html lang="en">
        <body className={`${cardo.variable} ${mulish.variable} font-mulish`}>{children}</body>
      </html>
    </>
  );
}
