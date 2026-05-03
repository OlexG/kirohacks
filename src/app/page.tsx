import Image from "next/image";

const seniors = [
  {
    name: "Eleanor",
    age: 82,
    status: "Stable",
    detail: "Last seen 2 min ago",
    heartRate: "72 bpm",
    color: "status-stable",
  },
  {
    name: "Arthur",
    age: 79,
    status: "Warning",
    detail: "Heart rate elevated",
    heartRate: "118 bpm",
    color: "status-review",
  },
  {
    name: "Mae",
    age: 88,
    status: "Urgent",
    detail: "Fall detected",
    heartRate: "96 bpm",
    color: "status-urgent",
  },
  {
    name: "Sam",
    age: 84,
    status: "Offline",
    detail: "Watch disconnected",
    heartRate: "--",
    color: "status-offline",
  },
];

const features = [
  {
    label: "Fall risk and mobility",
    title: "Catch instability before it becomes a crisis",
    body: "Watch and HealthKit signals feed fall-risk scores, gait changes, location snapshots, and hard-fall events into the same care view.",
    accent: "tone-ink",
    metric: "2,500+",
    metricLabel: "fall-risk observations",
  },
  {
    label: "Care operations",
    title: "Keep the response queue impossible to miss",
    body: "Active alerts stay visible with the person, signal, metric, next step, watch status, and acknowledgement state close at hand.",
    accent: "tone-sand",
    metric: "Live",
    metricLabel: "roster and alert refresh",
  },
  {
    label: "Rule diagrams",
    title: "Turn raw watch data into care-team actions",
    body: "Create and pause rules for fall events, instability, walking steadiness, heart rate, steps, offline watches, and medication follow-up.",
    accent: "tone-stone",
    metric: "16",
    metricLabel: "configured care rules",
  },
];

const timeline = [
  {
    time: "Today",
    title: "Review the live roster",
    items: ["See every senior by care state", "Check watch batteries and last-seen status", "Open profile-level context"],
  },
  {
    time: "Next",
    title: "Connect safety signals",
    items: ["Ingest watch alert webhooks", "Track fall-risk and gait observations", "Capture location when the watch reports it"],
  },
  {
    time: "Then",
    title: "Tune the response workflow",
    items: ["Create diagram-based monitoring rules", "Surface missed medication alerts", "Route urgent events to the right caretaker"],
  },
];

function HeartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M12 21s-7.5-4.7-9.6-9.2C.9 8.5 2.7 5 6.2 5c2 0 3.3 1.1 3.9 2.1C10.7 6.1 12 5 14 5c3.5 0 5.3 3.5 3.8 6.8C15.5 16.3 12 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WatchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M8.8 2h6.4l.7 3.1A5.8 5.8 0 0 1 19 10.2v3.6a5.8 5.8 0 0 1-3.1 5.1l-.7 3.1H8.8l-.7-3.1A5.8 5.8 0 0 1 5 13.8v-3.6a5.8 5.8 0 0 1 3.1-5.1L8.8 2Zm3.2 5a4 4 0 0 0-4 4v2a4 4 0 1 0 8 0v-2a4 4 0 0 0-4-4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M12 2 1.8 20h20.4L12 2Zm1 15h-2v-2h2v2Zm0-4h-2V8h2v5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="eyebrow">Care overview</p>
          <h2>Live senior roster</h2>
        </div>
        <div className="live-pill">
          <span />
          Live
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-list" aria-label="Senior status list">
          {seniors.map((senior) => (
            <article className="senior-row" key={senior.name}>
              <div className={`status-dot ${senior.color}`} />
              <div>
                <h3>{senior.name}</h3>
                <p>
                  Age {senior.age} · {senior.detail}
                </p>
              </div>
              <div className="senior-metric">
                <strong>{senior.heartRate}</strong>
                <span>{senior.status}</span>
              </div>
            </article>
          ))}
        </section>

        <aside className="alert-panel" aria-label="Urgent alert">
          <div className="alert-header">
            <AlertIcon />
            <span>Urgent alert</span>
          </div>
          <h3>Fall risk elevated</h3>
          <p>Watch data reported instability, location context, and no caretaker acknowledgement yet.</p>
          <div className="response-row">
            <span>Unacknowledged</span>
            <strong>2 min</strong>
          </div>
        </aside>
      </div>

      <div className="rules-strip" aria-label="Custom alert rules">
        <div>
          <span>Heart rate at/above 115</span>
          <strong>Arthur</strong>
        </div>
        <div>
          <span>Instability score over 80</span>
          <strong>Mae</strong>
        </div>
        <div>
          <span>Watch offline after 30 min</span>
          <strong>Sam</strong>
        </div>
      </div>
    </div>
  );
}

function MiniProductPanel({
  type,
}: Readonly<{
  type: "alerts" | "vitals" | "rules";
}>) {
  if (type === "alerts") {
    return (
      <div className="mini-panel">
        <div className="mini-panel-header">
          <AlertIcon />
          <span>Alert queue</span>
        </div>
        <div className="queue-item urgent">
          <strong>Instability score critical</strong>
          <span>Needs acknowledgement</span>
        </div>
        <div className="queue-item warning">
          <strong>Medication not administered</strong>
          <span>Review the medication log</span>
        </div>
        <div className="queue-item stable">
          <strong>Watch location received</strong>
          <span>Accuracy and speed attached</span>
        </div>
      </div>
    );
  }

  if (type === "vitals") {
    return (
      <div className="mini-panel vitals-panel">
        <div className="mini-panel-header">
          <HeartIcon />
          <span>Vitals trend</span>
        </div>
        <div className="chart">
          <span className="bar h-12" />
          <span className="bar h-16" />
          <span className="bar h-10" />
          <span className="bar h-20 warning" />
          <span className="bar h-14" />
          <span className="bar h-24 urgent" />
        </div>
        <div className="vital-summary">
          <strong>Mobility and heart-rate signals</strong>
          <span>Reviewed across the active roster</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mini-panel rules-panel">
      <div className="mini-panel-header">
        <WatchIcon />
        <span>Rule builder</span>
      </div>
      <div className="rule-line">
        <span>If</span>
        <strong>instability score</strong>
        <span>is above</span>
        <strong>80/100</strong>
      </div>
      <div className="rule-line">
        <span>Then</span>
        <strong>create urgent alert</strong>
      </div>
      <div className="rule-line">
        <span>Route to</span>
        <strong>care team</strong>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="home-page min-h-screen overflow-hidden">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Home">
          <Image
            className="brand-icon"
            src="/brand/elsa-icon.png"
            alt=""
            width={38}
            height={38}
            priority
          />
          <span className="brand-copy">
            <strong>Elsa</strong>
            <small>Elder-living safety assistant</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/app/dashboard">Demo</a>
        </nav>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <p className="announcement">Elsa: Elder-living safety assistant</p>
          <h1>A real-time safety assistant for seniors and the people who care for them</h1>
          <p>
            Monitor fall risk, mobility changes, heart-rate events, watch connectivity, medication
            follow-up, and custom safety rules from one calm caretaker workspace.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="/app/dashboard">
              Open demo
            </a>
            <a className="secondary-button" href="#platform">
              How it works
            </a>
          </div>
          <div className="trust-row" aria-label="Product highlights">
            <span>Live care dashboard</span>
            <span>Rule-based escalation</span>
            <span>Medication and mobility context</span>
          </div>
        </div>
        <div id="app" className="hero-visual" aria-label="Safety dashboard preview">
          <div className="floating-card left-note">
            <WatchIcon />
            <span>Watch online</span>
          </div>
          <DashboardPreview />
          <div className="floating-card right-note">
            <AlertIcon />
            <span>Fall event detected</span>
          </div>
        </div>
      </section>

      <section id="platform" className="module-section">
        <div className="section-heading">
          <p className="eyebrow">Get to know Elsa</p>
          <h2>One workspace for every care signal</h2>
          <p>
            Give caretakers a focused view of active alerts, watch status, fall-risk observations,
            profile context, medications, and rules that need a human response.
          </p>
        </div>
        <div className="feature-stack">
          {features.map((feature, index) => (
            <article className="feature-block" key={feature.title}>
              <div>
                <span className={`feature-label ${feature.accent}`}>{feature.label}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
                <div className="metric-box">
                  <strong>{feature.metric}</strong>
                  <span>{feature.metricLabel}</span>
                </div>
              </div>
              <MiniProductPanel
                type={index === 0 ? "alerts" : index === 1 ? "vitals" : "rules"}
              />
            </article>
          ))}
        </div>
      </section>

      <section id="alerts" className="support-section">
        <div className="support-visual" aria-hidden="true">
          <div className="watch-face">
            <span className="watch-heart">72</span>
            <span>bpm</span>
          </div>
          <div className="signal-line one" />
          <div className="signal-line two" />
          <div className="signal-line three" />
        </div>
        <div className="support-copy">
          <p className="eyebrow">Built for caretakers</p>
          <h2>Urgent events stay visible until someone responds</h2>
          <p>
            Each alert keeps the critical context close: who it affects, what triggered it, when it
            happened, what to do next, and whether a caretaker has acknowledged it.
          </p>
          <div className="check-list">
            <span>Fall detection alerts</span>
            <span>Fall-risk and gait alerts</span>
            <span>Heart-rate and step rules</span>
            <span>Watch offline alerts</span>
            <span>Missed medication alerts</span>
            <span>Location snapshots</span>
            <span>Care-team next steps</span>
          </div>
        </div>
      </section>

      <section id="setup" className="timeline-section">
        <div className="section-heading">
          <p className="eyebrow">Operational flow</p>
          <h2>Go from signal to response without losing context</h2>
        </div>
        <div className="timeline-grid">
          {timeline.map((step) => (
            <article className="timeline-card" key={step.time}>
              <span>{step.time}</span>
              <h3>{step.title}</h3>
              {step.items.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="demo-section">
        <div>
          <p className="eyebrow">Care team ready</p>
          <h2>Open the working care operations demo</h2>
          <p>
            Explore the live roster, active alert room, person profiles, medication schedule, and
            diagram-based monitoring rules already wired into the app.
          </p>
        </div>
        <a className="primary-button" href="/app/dashboard">
          Open demo
        </a>
      </section>

      <footer className="site-footer">
        <div className="footer-columns">
          <div>
            <a className="brand" href="#top" aria-label="Home">
              <Image
                className="brand-icon"
                src="/brand/elsa-icon.png"
                alt=""
                width={38}
                height={38}
              />
              <span className="brand-copy">
                <strong>Elsa</strong>
                <small>Elder-living safety assistant</small>
              </span>
            </a>
            <p>
              Elder-living safety operations for seniors, families, and professional care teams.
            </p>
          </div>
          <div>
            <h3>Platform</h3>
            <a href="#platform">Overview</a>
            <a href="#alerts">Alerts</a>
            <a href="#setup">Setup</a>
          </div>
          <div>
            <h3>Signals</h3>
            <a href="#alerts">Falls</a>
            <a href="#alerts">Heart rate</a>
            <a href="#alerts">Movement</a>
            <a href="#alerts">Medications</a>
          </div>
          <div>
            <h3>Care</h3>
            <a href="#demo">Family teams</a>
            <a href="#demo">Assisted living</a>
            <a href="#demo">Emergency contacts</a>
          </div>
        </div>
        <div className="footer-illustration" aria-hidden="true">
          <span className="house roof" />
          <span className="house body" />
          <span className="person first" />
          <span className="person second" />
          <span className="ground" />
        </div>
      </footer>
    </main>
  );
}
