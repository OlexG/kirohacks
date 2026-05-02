import type { Metadata } from "next";
import { connection } from "next/server";
import { getDemoProfile } from "@/lib/profiles";
import { AppSidebar } from "../sidebar";

export const metadata: Metadata = {
  title: "Elsa App | Profile",
  description: "Manage the demo caregiver profile.",
};

export default async function ProfilePage() {
  await connection();
  const profile = await getDemoProfile();

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <AppSidebar activePage="profile" />

        <section className="care-main" aria-label="Profile workspace">
          <div className="care-board profile-board">
            <header className="care-board-header">
              <div>
                <p className="care-board-eyebrow">Account</p>
                <h1>Profile</h1>
              </div>
            </header>

            <section className="care-detail-view" aria-label="Caregiver profile">
              <article className="care-detail-card">
                <div>
                  <p className="care-detail-kicker">Caregiver</p>
                  <h2>{profile?.display_name ?? "Demo Caregiver"}</h2>
                  <p>{profile?.notification_number ?? "No notification number saved yet."}</p>
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
