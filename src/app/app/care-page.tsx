import { connection } from "next/server";
import { listActiveCareAlerts } from "@/lib/care-alerts";
import { listCarePeople } from "@/lib/care-people";
import { getDemoProfile } from "@/lib/profiles";
import { RosterClient, type CareView } from "./roster-client";

export async function CarePage({ view }: Readonly<{ view: CareView }>) {
  await connection();
  const [alerts, people, profile] = await Promise.all([
    listActiveCareAlerts(),
    listCarePeople(),
    getDemoProfile(),
  ]);

  return <RosterClient alerts={alerts} initialView={view} people={people} profile={profile} />;
}
