import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secondary Mark Entry | Teacher",
};

export default function SecondaryMarkEntryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Secondary Mark Entry</h1>
        <p className="text-muted-foreground">
          Enter Internal, Theory, and Practical marks for Secondary levels (Grades 6-10).
        </p>
      </div>
      
      <div className="rounded-md border p-8 text-center text-muted-foreground bg-muted/20">
        <p>Secondary Mark Entry interface will be rendered here.</p>
        <p className="text-sm mt-2">Features include practical sub-heading mark entry (which auto-sums) and internal/theory direct marks entry.</p>
      </div>
    </div>
  );
}
