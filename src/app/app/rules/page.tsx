import type { Metadata } from "next";
import { connection } from "next/server";
import { listCarePeople } from "@/lib/care-people";
import { listCareRules } from "@/lib/care-rules";
import { AppSidebar } from "../sidebar";
import { RulesWorkspace } from "./rules-client";

export const metadata: Metadata = {
  title: "Elsa App | Rules",
  description: "Configure Apple Watch and HealthKit monitoring rules.",
};

export default async function RulesPage() {
  await connection();
  const [rules, people] = await Promise.all([listCareRules(), listCarePeople()]);

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <AppSidebar activePage="rules" />

        <section className="care-main rules-main" aria-label="Rules workspace">
          <div className="care-board rules-board">
            <header className="care-board-header">
              <div>
                <p className="care-board-eyebrow">Care operations</p>
                <h1>Rules</h1>
              </div>
              <div className="care-board-status" aria-label="Rules data source">
                <span aria-hidden="true" />
                <div>
                  <strong>Rule builder</strong>
                  <small>Active rule set</small>
                </div>
              </div>
            </header>
            <RulesWorkspace people={people} rules={rules} />
          </div>
        </section>
      </div>
    </main>
  );
}
