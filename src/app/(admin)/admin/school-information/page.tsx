import type { Metadata } from "next";
import { SchoolInformationSetup } from "@/components/admin/SchoolInformationSetup";

export const metadata: Metadata = { title: "School Information" };

export default function SchoolInformationPage() {
  return <SchoolInformationSetup />;
}
