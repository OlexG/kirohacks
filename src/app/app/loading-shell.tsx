import { AppSidebar, type AppPage } from "./sidebar";

const columnTitles = ["Stable", "Watch List", "Active Alerts", "Offline"];

function SkeletonLine({ className = "" }: Readonly<{ className?: string }>) {
  return <span className={`skeleton-line ${className}`} />;
}

function SeniorSkeletonCard({ index }: Readonly<{ index: number }>) {
  return (
    <article className="care-person-card senior-skeleton-card" aria-hidden="true">
      <div className="care-person-top">
        <SkeletonLine className="avatar senior-avatar" />
        <div className="senior-skeleton-copy">
          <SkeletonLine className={index % 3 === 0 ? "w-40 tall" : "w-32 tall"} />
          <SkeletonLine className={index % 2 === 0 ? "w-56" : "w-44"} />
        </div>
      </div>
      <div className="senior-skeleton-meta">
        <SkeletonLine className="pill small" />
        <SkeletonLine className="pill" />
      </div>
    </article>
  );
}

export function AppLoadingShell({ activePage }: Readonly<{ activePage?: AppPage }>) {
  return (
    <main className="care-app-page">
      <div className="care-app-shell">
        <AppSidebar activePage={activePage} />

        <section className="care-main" aria-label="Seniors loading">
          <div className="care-board senior-skeleton-board" aria-busy="true" aria-label="Loading seniors">
            <header className="care-board-header">
              <div>
                <SkeletonLine className="w-32" />
                <SkeletonLine className="w-40 tall" />
              </div>
              <div className="senior-skeleton-status">
                <SkeletonLine className="avatar tiny" />
                <div>
                  <SkeletonLine className="w-28" />
                  <SkeletonLine className="w-20" />
                </div>
              </div>
            </header>

            <div className="care-columns senior-skeleton-columns">
              {columnTitles.map((title, columnIndex) => (
                <section className="care-column" key={title}>
                  <div className="care-column-body">
                    <div className="care-column-title senior-skeleton-title">
                      <SkeletonLine className="w-28 tall" />
                      <SkeletonLine className="w-20" />
                    </div>
                    <div className="care-person-list">
                      {[0, 1, 2, 3, 4].map((item) => (
                        <SeniorSkeletonCard index={columnIndex + item} key={`${title}-${item}`} />
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
