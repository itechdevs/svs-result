import { MarksProvider } from '@/contexts/marks-context';

/**
 * Layout that wraps all mark-entry routes (overview + student detail) 
 * so they share the same MarksContext for two-way sync.
 */
export default function MarkEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarksProvider>{children}</MarksProvider>;
}
