import Image from "next/image";
import Link from "next/link";

export type AppPage = "dashboard" | "roster" | "alerts" | "rules" | "profile" | "settings" | "admin";

const workspaceItems = [
  { label: "Dashboard", short: "D", href: "/app/dashboard", page: "dashboard" },
  { label: "Roster", short: "R", href: "/app/roster", page: "roster" },
  { label: "Alerts", short: "A", href: "/app/alerts", page: "alerts" },
  { label: "Rules", short: "R", href: "/app/rules", page: "rules" },
] satisfies Array<{ label: string; short: string; href: string; page: AppPage }>;

const accountItems = [
  { label: "Profile", short: "P", href: "/app/profile", page: "profile" },
  { label: "Settings", short: "S", href: "/app/settings", page: "settings" },
  { label: "Admin", short: "Ad", href: "/admin", page: "admin" },
] satisfies Array<{ label: string; short: string; href: string; page: AppPage }>;

function SidebarLink({
  activePage,
  href,
  label,
  page,
  short,
}: Readonly<{
  activePage?: AppPage;
  href: string;
  label: string;
  page: AppPage;
  short: string;
}>) {
  const active = activePage === page;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`care-sidebar-link${active ? " active" : ""}`}
      href={href}
    >
      <span aria-hidden="true">{short}</span>
      {label}
    </Link>
  );
}

export function AppSidebar({ activePage }: Readonly<{ activePage?: AppPage }>) {
  return (
    <aside className="care-sidebar" aria-label="Application navigation">
      <Link className="care-sidebar-brand" href="/" aria-label="Elsa home">
        <span>
          <Image src="/brand/elsa-icon.png" alt="" width={38} height={38} aria-hidden="true" />
        </span>
        <span>
          <strong>Elsa</strong>
          <small>Elder-living safety assistant</small>
        </span>
      </Link>

      <nav className="care-sidebar-nav" aria-label="Care workspace">
        {workspaceItems.map((item) => (
          <SidebarLink activePage={activePage} key={item.label} {...item} />
        ))}
      </nav>

      <nav className="care-sidebar-bottom" aria-label="Account">
        {accountItems.map((item) => (
          <SidebarLink activePage={activePage} key={item.label} {...item} />
        ))}
      </nav>
    </aside>
  );
}
