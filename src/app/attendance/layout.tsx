import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Attendance Tracking | YEHA Training',
  description: 'Track daily attendance, mark registers, and generate attendance reports for SSETA training programs.',
  keywords: 'attendance tracking, attendance register, learner attendance, training attendance',
};

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
