import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Assessment Management | YEHA Training',
  description: 'Manage formative and summative assessments, POE tracking, and moderation for SSETA NVC Level 2 training.',
  keywords: 'assessment management, POE, portfolio of evidence, formative assessment, summative assessment, moderation',
};

export default function AssessmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
