import type { Metadata } from "next";
import { AppSidebar } from "../sidebar";

export const metadata: Metadata = {
  title: "Safely App | Settings",
  description: "Manage care workspace settings.",
};

export default function SettingsPage() {
  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <AppSidebar activePage="settings" />

        <section className="care-main" aria-label="Settings workspace">
          <div className="care-board settings-board">
            <header className="care-board-header">
              <div>
                <p className="care-board-eyebrow">Workspace</p>
                <h1>Settings</h1>
              </div>
            </header>

            <section className="care-detail-view" aria-label="Workspace settings">
              <article className="care-detail-card">
                <div>
                  <p className="care-detail-kicker">Defaults</p>
                  <h2>Care workspace</h2>
                  <p>Basic notification, roster, and rule preferences will live here.</p>
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
