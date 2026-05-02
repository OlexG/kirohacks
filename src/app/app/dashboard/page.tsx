import type { Metadata } from "next";
import { CarePage } from "../care-page";

export const metadata: Metadata = {
  title: "Safely App | Dashboard",
  description: "Manage seniors, watch signals, and caretaker alerts.",
};

export default function DashboardPage() {
  return <CarePage view="dashboard" />;
}
