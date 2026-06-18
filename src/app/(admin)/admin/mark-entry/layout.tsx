import { MarksProvider } from '@/contexts/marks-context';

export default function AdminMarkEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarksProvider>{children}</MarksProvider>;
}
