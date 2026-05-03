import type { Metadata } from "next";
import { connection } from "next/server";
import { getCareNotificationAdminState } from "@/lib/care-notification-seeds";
import { AppSidebar } from "../app/sidebar";
import { resetNotificationsAction } from "./actions";

export const metadata: Metadata = {
  title: "Elsa App | Admin",
  description: "Admin tools for notification seed data.",
};

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminPage() {
  await connection();
  const { activeCount, notifications, seedCount, totalCount } = await getCareNotificationAdminState();

  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <AppSidebar activePage="admin" />

        <section className="care-main" aria-label="Admin workspace">
          <div className="care-board admin-board">
            <header className="care-board-header">
              <div>
                <p className="care-board-eyebrow">Operations</p>
                <h1>Admin</h1>
              </div>
              <div className="care-board-status" aria-label="Notification seed status">
                <span aria-hidden="true" />
                <div>
                  <strong>{seedCount}/{totalCount} seeded</strong>
                  <small>{activeCount} active notifications</small>
                </div>
              </div>
            </header>

            <section className="care-detail-view admin-detail-view" aria-label="Notification admin tools">
              <article className="care-detail-card admin-reset-card">
                <div>
                  <p className="care-detail-kicker">Notification seed</p>
                  <h2>Reset generated notifications</h2>
                  <p>
                    Wipe the current notification rows and restore the Sabawoon seed set used by
                    the rules demo.
                  </p>
                </div>

                <div className="admin-stat-grid" aria-label="Notification counts">
                  <div>
                    <span>Total</span>
                    <strong>{totalCount}</strong>
                  </div>
                  <div>
                    <span>Active</span>
                    <strong>{activeCount}</strong>
                  </div>
                  <div>
                    <span>Seeded</span>
                    <strong>{seedCount}</strong>
                  </div>
                </div>

                <form action={resetNotificationsAction}>
                  <button className="care-detail-action" type="submit">
                    Reset to seed set
                  </button>
                </form>
              </article>

              <article className="care-detail-card admin-notification-card">
                <div>
                  <p className="care-detail-kicker">Current rows</p>
                  <h2>Notifications</h2>
                </div>

                <div className="admin-notification-list">
                  {notifications.map((notification) => (
                    <div
                      className={`admin-notification-row ${notification.severity}`}
                      key={notification.alert_key}
                    >
                      <div>
                        <span>{notification.severity}</span>
                        <strong>{notification.title}</strong>
                        <small>{notification.signal_label}</small>
                      </div>
                      <div>
                        <span>{notification.status}</span>
                        <strong>{notification.metric_value}</strong>
                        <time dateTime={notification.updated_at}>
                          {formatUpdatedAt(notification.updated_at)}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
