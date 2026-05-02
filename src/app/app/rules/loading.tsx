import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/app" },
  { label: "Roster", href: "/app?view=roster" },
  { label: "Alerts", href: "/app?view=alerts" },
  { label: "Rules", href: "/app/rules", active: true },
];

function SkeletonLine({ className = "" }: Readonly<{ className?: string }>) {
  return <span className={`skeleton-line ${className}`} />;
}

export default function RulesLoading() {
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

        <section className="care-main rules-main" aria-label="Rules loading">
          <div className="rules-workspace rules-skeleton" aria-busy="true" aria-label="Loading rules">
            <section className="rule-builder">
              <div className="rule-builder-preview">
                <div className="person-chip-large skeleton-dark">
                  <SkeletonLine className="avatar" />
                  <div>
                    <SkeletonLine className="w-28" />
                    <SkeletonLine className="w-44" />
                  </div>
                </div>
                <div className="signal-card">
                  <SkeletonLine className="w-40" />
                  <SkeletonLine className="w-36 tall" />
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-3-4" />
                </div>
              </div>

              <div className="rule-form">
                <div className="rules-form-grid">
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <div className="skeleton-field" key={item}>
                      <SkeletonLine className="w-16" />
                      <SkeletonLine className="field" />
                    </div>
                  ))}
                </div>
                <SkeletonLine className="textarea" />
                <div className="rule-form-footer">
                  <SkeletonLine className="w-44" />
                  <SkeletonLine className="button" />
                </div>
              </div>
            </section>

            <section className="rules-content-grid">
              <div className="rules-table-panel">
                <div className="panel-heading">
                  <div>
                    <SkeletonLine className="w-28 tall" />
                    <SkeletonLine className="w-40" />
                  </div>
                </div>
                <div className="rules-list">
                  {[0, 1, 2, 3, 4].map((item) => (
                    <article className="stored-rule skeleton-rule" key={item}>
                      <SkeletonLine className="avatar square" />
                      <div>
                        <SkeletonLine className="w-32" />
                        <SkeletonLine className="w-56" />
                        <div className="stored-rule-meta">
                          <SkeletonLine className="pill" />
                          <SkeletonLine className="pill small" />
                          <SkeletonLine className="pill note" />
                        </div>
                      </div>
                      <SkeletonLine className="avatar square" />
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
