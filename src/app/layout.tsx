import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { StudentProvider } from "@/contexts/StudentContextSimple";
import { GroupsProvider } from "@/contexts/GroupsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Plus Jakarta Sans - distinctive, professional, readable
// Per design skills: avoid Inter, Roboto, Arial
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "YEHA - Youth Education & Skills Management",
  description: "Comprehensive SSETA NVC Level 2 Training Management Platform",
  keywords: "SSETA,NVC,training,education,skills development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${plusJakarta.variable} font-sans antialiased bg-background text-text`}>
        <ErrorBoundary>
          <AuthProvider>
            <GroupsProvider>
              <StudentProvider>
                <div className="min-h-screen bg-background">
                  <Sidebar />
                  {/* Main content with dynamic margin for sidebar */}
                  <main className="transition-all duration-300 ease-out ml-[260px] min-h-screen">
                    <div className="p-6 page-enter">
                      {children}
                    </div>
                  </main>
                </div>
              </StudentProvider>
            </GroupsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
