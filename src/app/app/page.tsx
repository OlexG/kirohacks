import type { Metadata } from "next";
import { connection } from "next/server";
import { listActiveCareAlerts } from "@/lib/care-alerts";
import { listCarePeople } from "@/lib/care-people";
import { getDemoProfile } from "@/lib/profiles";
import { RosterClient, type CareView } from "./roster-client";

export const metadata: Metadata = {
  title: "Safely App | Dashboard",
  description: "Manage seniors, watch signals, and caretaker alerts.",
};

type AppPageSearchParams = Promise<{ view?: string | string[] }>;

function resolveInitialView(searchParams: Awaited<AppPageSearchParams>): CareView {
  const view = Array.isArray(searchParams.view) ? searchParams.view[0] : searchParams.view;

  if (view === "alerts" || view === "roster") {
    return view;
  }

  return "dashboard";
}

export default async function AppPage({ searchParams }: Readonly<{ searchParams: AppPageSearchParams }>) {
  await connection();
  const initialView = resolveInitialView(await searchParams);
  const [alerts, people, profile] = await Promise.all([
    listActiveCareAlerts(),
    listCarePeople(),
    getDemoProfile(),
  ]);

  return <RosterClient alerts={alerts} initialView={initialView} key={initialView} people={people} profile={profile} />;
}
