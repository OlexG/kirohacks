import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { listCarePeople } from "@/lib/care-people";
import { listCareRules } from "@/lib/care-rules";
import { RulesWorkspace } from "./rules-client";

export const metadata: Metadata = {
  title: "Safely App | Rules",
  description: "Configure Apple Watch and HealthKit monitoring rules.",
};

const navItems = [
  { label: "Dashboard", href: "/app" },
  { label: "Roster", href: "/app" },
  { label: "Alerts", href: "/app" },
  { label: "Rules", href: "/app/rules", active: true },
  { label: "Care Teams", href: "/app" },
  { label: "Reports", href: "/app" },
];

export default async function RulesPage() {
  await connection();
  const [rules, people] = await Promise.all([listCareRules(), listCarePeople()]);

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <aside className="care-sidebar" aria-label="Application navigation">
          <Link className="care-sidebar-brand" href="/">
            <span>Sa</span>
            <div>
              <strong>Safely</strong>
              <small>Care operations</small>
            </div>
          </Link>
          <nav className="care-sidebar-nav" aria-label="Workspace pages">
            {navItems.map((item) => (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={item.active ? "active" : undefined}
                href={item.href}
                key={item.label}
              >
                <span aria-hidden="true">{item.label.slice(0, 1)}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="care-sidebar-status">
            <span />
            <div>
              <strong>Live monitoring</strong>
              <small>Rules backed by Supabase</small>
            </div>
          </div>
        </aside>

        <section className="care-main rules-main" aria-label="Rules workspace">
          <RulesWorkspace people={people} rules={rules} />
        </section>
      </div>
    </main>
  );
}
