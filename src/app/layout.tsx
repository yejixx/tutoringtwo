import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TutorHub - Find Expert Tutors Online",
  description: "Connect with qualified tutors for personalized learning. Book sessions, track progress, and achieve your educational goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${sourceSans.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <EmailVerificationBanner />
          <Header />
          <main className="flex-1 bg-slate-50">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
