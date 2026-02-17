import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports & Analytics | YEHA Training',
  description: 'Generate compliance reports, progress tracking, and analytics for SSETA training programs.',
  keywords: 'training reports, compliance reports, analytics, progress tracking, SSETA reporting',
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
