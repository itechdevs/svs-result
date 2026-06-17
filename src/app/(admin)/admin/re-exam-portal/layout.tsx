import { MarksProvider } from '@/contexts/marks-context';

export default function ReExamPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarksProvider>{children}</MarksProvider>;
}
