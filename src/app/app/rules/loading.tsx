import { AppSidebar } from "../sidebar";

function SkeletonLine({ className = "" }: Readonly<{ className?: string }>) {
  return <span className={`skeleton-line ${className}`} />;
}

export default function RulesLoading() {
  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <AppSidebar activePage="rules" />

        <section className="care-main rules-main" aria-label="Rules loading">
          <div className="care-board rules-board">
            <header className="care-board-header">
              <div>
                <SkeletonLine className="w-32" />
                <SkeletonLine className="w-20 tall" />
              </div>
              <div className="care-board-status" aria-label="Loading rules data source">
                <SkeletonLine className="avatar tiny" />
                <div>
                  <SkeletonLine className="w-28" />
                  <SkeletonLine className="w-40" />
                </div>
              </div>
            </header>

            <div className="rules-workspace rules-skeleton" aria-busy="true" aria-label="Loading rules">
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
          </div>
        </section>
      </div>
    </main>
  );
}
