import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Groups & Training Sites | YEHA Training',
  description: 'Manage training groups, cohorts, and workplace training sites for SSETA NVC Level 2 programs.',
  keywords: 'training groups, cohorts, training sites, workplace learning, SSETA',
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
