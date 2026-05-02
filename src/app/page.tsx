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
    label: "Fall detection",
    title: "Know the moment someone needs help",
    body: "Apple Watch fall events surface immediately in the care dashboard, with severity, location context, and acknowledgement status.",
    accent: "tone-ink",
    metric: "12 sec",
    metricLabel: "median alert time",
  },
  {
    label: "Vitals monitoring",
    title: "Spot concerning health changes sooner",
    body: "Heart rate, movement, and watch connectivity are summarized into simple safety states for every senior in your care.",
    accent: "tone-sand",
    metric: "24/7",
    metricLabel: "watch signal review",
  },
  {
    label: "Custom rules",
    title: "Tune alerts around each person",
    body: "Create thresholds for heart rate, inactivity, night hours, offline devices, and escalation paths for different caretakers.",
    accent: "tone-stone",
    metric: "4",
    metricLabel: "alert levels",
  },
];

const timeline = [
  {
    time: "Today",
    title: "Add your care list",
    items: ["Invite caretakers", "Create senior profiles", "Assign emergency contacts"],
  },
  {
    time: "Day 3",
    title: "Connect safety signals",
    items: ["Import Apple Watch-style data", "Review baseline vitals", "Confirm notification routing"],
  },
  {
    time: "Day 7",
    title: "Run a safer routine",
    items: ["Customize alert rules", "Track acknowledgement", "Review weekly safety summaries"],
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
          <h2>4 seniors monitored</h2>
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
          <h3>Fall detected: Mae</h3>
          <p>Apple Watch reported a hard fall at 10:42 AM. No response received yet.</p>
          <div className="response-row">
            <span>Unacknowledged</span>
            <strong>2 min</strong>
          </div>
        </aside>
      </div>

      <div className="rules-strip" aria-label="Custom alert rules">
        <div>
          <span>Heart rate over 115</span>
          <strong>Arthur</strong>
        </div>
        <div>
          <span>No movement for 45 min</span>
          <strong>Eleanor</strong>
        </div>
        <div>
          <span>Watch offline</span>
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
          <strong>Mae fell in the kitchen</strong>
          <span>Needs acknowledgement</span>
        </div>
        <div className="queue-item warning">
          <strong>Arthur heart rate high</strong>
          <span>118 bpm for 6 minutes</span>
        </div>
        <div className="queue-item stable">
          <strong>Eleanor check-in complete</strong>
          <span>Normal movement pattern</span>
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
          <strong>3 readings outside normal range</strong>
          <span>Across 4 monitored seniors</span>
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
        <strong>heart rate</strong>
        <span>is above</span>
        <strong>115 bpm</strong>
      </div>
      <div className="rule-line">
        <span>Then</span>
        <strong>notify primary caretaker</strong>
      </div>
      <div className="rule-line">
        <span>Escalate after</span>
        <strong>3 minutes</strong>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="home-page min-h-screen overflow-hidden">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Home">
          <span className="brand-mark">
            <HeartIcon />
          </span>
          <span>Safely</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/app">Demo</a>
        </nav>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <p className="announcement">Apple Watch safety signals for care teams</p>
          <h1>A real-time dashboard for seniors and the people who care for them</h1>
          <p>
            Monitor fall events, heart rate changes, watch connectivity, and custom safety rules
            from one calm caretaker workspace.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="/app">
              Demo
            </a>
            <a className="secondary-button" href="#platform">
              How it works
            </a>
          </div>
          <div className="trust-row" aria-label="Product highlights">
            <span>Real-time alerts</span>
            <span>Custom thresholds</span>
            <span>Care team handoff</span>
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
          <p className="eyebrow">Get to know Safely</p>
          <h2>One workspace for every care signal</h2>
          <p>
            Give caretakers a focused view of Apple Watch events, senior status, and the alerts
            that need a human response.
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
            happened, and whether a caretaker has acknowledged it.
          </p>
          <div className="check-list">
            <span>Fall detection alerts</span>
            <span>Heart rate threshold alerts</span>
            <span>Watch offline alerts</span>
            <span>Inactivity alerts</span>
          </div>
        </div>
      </section>

      <section id="setup" className="timeline-section">
        <div className="section-heading">
          <p className="eyebrow">Launch plan</p>
          <h2>Go from idea to working demo quickly</h2>
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
          <h2>Make the first version feel real</h2>
          <p>
            Start with Apple Watch-style sample data, then connect live HealthKit workflows once
            the product shape is clear.
          </p>
        </div>
        <a className="primary-button" href="/app">
          Book demo
        </a>
      </section>

      <footer className="site-footer">
        <div className="footer-columns">
          <div>
            <a className="brand" href="#top" aria-label="Home">
              <span className="brand-mark">
                <HeartIcon />
              </span>
              <span>Safely</span>
            </a>
            <p>Real-time safety monitoring for seniors, families, and professional care teams.</p>
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
