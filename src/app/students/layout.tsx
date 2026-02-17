import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Management | YEHA Training',
  description: 'View and manage all students enrolled in SSETA NVC Level 2 training programs. Track attendance, assessments, and progress.',
  keywords: 'student management, training, SSETA, NVC Level 2, learners, education',
};

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
