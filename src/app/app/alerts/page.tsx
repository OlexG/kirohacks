import type { Metadata } from "next";
import { CarePage } from "../care-page";

export const metadata: Metadata = {
  title: "Safely App | Alerts",
  description: "Review active senior safety alerts and notification routing.",
};

export default function AlertsPage() {
  return <CarePage view="alerts" />;
}
