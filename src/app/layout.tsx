import type { Metadata } from "next";
import { Outfit, Lora } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import { StudentProvider } from "@/contexts/StudentContextSimple";
import { GroupsProvider } from "@/contexts/GroupsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from "@/components/providers";
import { AIChat } from "@/components/ai/AIChat";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ThemeInitializer from "@/components/ThemeInitializer";

// Outfit - Modern, premium, distinctive sans-serif
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Lora - Refined, editorial serif for high-contrast pairing
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: {
    default: "YEHA - Youth Education & Skills Management",
    template: "%s | YEHA Training",
  },
  description: "Comprehensive SSETA NVC Level 2 Training Management Platform for facilitators to manage students, training sites, assessments, and curriculum delivery.",
  keywords: "SSETA, NVC Level 2, training management, learnership, skills development, education, attendance tracking, assessment management, POE, South Africa",
  authors: [{ name: "YEHA Training" }],
  creator: "YEHA Training",
  publisher: "YEHA Training",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://yeha.training',
    siteName: 'YEHA Training Management',
    title: 'YEHA - Youth Education & Skills Management',
    description: 'Comprehensive SSETA NVC Level 2 Training Management Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YEHA Training Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YEHA - Youth Education & Skills Management',
    description: 'Comprehensive SSETA NVC Level 2 Training Management Platform',
    images: ['/og-image.png'],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://yeha.training'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${outfit.variable} ${lora.variable} font-sans antialiased bg-white text-slate-900`}>
        <ErrorBoundary>
          <Providers>
            <ThemeInitializer />
            <MainLayout>
              {children}
              <AIChat />
            </MainLayout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
