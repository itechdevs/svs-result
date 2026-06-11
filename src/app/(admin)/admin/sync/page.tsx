import type { Metadata } from "next";
import SyncManagementClient from "@/components/admin/SyncManagementClient";

export const metadata: Metadata = { title: "Data Sync - Admin" };

export default function SyncManagementPage() {
  return <SyncManagementClient />;
}
