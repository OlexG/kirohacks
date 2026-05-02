import type { Metadata } from "next";
import { CarePage } from "../care-page";

export const metadata: Metadata = {
  title: "Elsa App | Roster",
  description: "Review monitored seniors by current care status.",
};

export default function RosterPage() {
  return <CarePage view="roster" />;
}
