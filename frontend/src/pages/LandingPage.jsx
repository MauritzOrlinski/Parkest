import React from "react";
import { Link } from "react-router-dom";

function LandingPage({ isLoggedIn }) {
  return (
    <div className="screen landing-screen">
      <header className="header landing-header">
        <div className="landing-logo-group">
          <div className="logo-mark">PB</div>
          <div className="logo-text">
            <h1 className="logo">Parkiest</h1>
            <p className="logo-tagline">Time-aware parking planner</p>
          </div>
        </div>

        <div className="landing-header-actions">
          {isLoggedIn ? (
            <Link to="/map" className="text-link landing-header-link">
              Open app →
            </Link>
          ) : (
            <Link to="/auth" className="text-link landing-header-link">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="screen-main landing-main">
        {/* HERO */}
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="pill-badge">New • Private beta</p>
            <h2 className="hero-title">
              Know your <span className="hero-highlight">real</span> arrival time.
            </h2>
            <p className="hero-subtitle">
              Parkiest factors in how long it actually takes you to find a spot,
              so your ETA finally matches reality — not just what the navigation says.
            </p>

            <div className="hero-actions">
              {isLoggedIn ? (
                <>
                  <Link to="/map" className="btn-primary">
                    Open app
                  </Link>
                  <Link to="/profile" className="btn-ghost">
                    View my stats
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth" className="btn-primary">
                    Get started free
                  </Link>
                  <Link to="/map" className="btn-ghost">
                    Try live map (demo)
                  </Link>
                </>
              )}
            </div>

            <div className="hero-metrics-row">
              <div className="hero-metric">
                <span className="hero-metric-number">10–15 min</span>
                <span className="hero-metric-label">typical time wasted parking</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-number">4 min</span>
                <span className="hero-metric-label">avg. time saved per trip</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-number">100%</span>
                <span className="hero-metric-label">control over your schedule</span>
              </div>
            </div>
          </div>

          {/* “Phone” preview card */}
          <div className="landing-hero-preview">
            <div className="landing-phone-shell">
              <div className="landing-phone-header">
                <span className="landing-phone-dot" />
                <span className="landing-phone-dot" />
                <span className="landing-phone-dot" />
              </div>
              <div className="landing-phone-map-skeleton">
                <div className="landing-phone-road" />
                <div className="landing-phone-road landing-phone-road-secondary" />
                <div className="landing-phone-pin" />
              </div>
              <div className="landing-phone-stats">
                <div className="landing-phone-stat">
                  <span className="landing-phone-stat-label">ETA</span>
                  <span className="landing-phone-stat-value">18 min</span>
                </div>
                <div className="landing-phone-stat">
                  <span className="landing-phone-stat-label">Parking search</span>
                  <span className="landing-phone-stat-value">6 min</span>
                </div>
                <div className="landing-phone-stat">
                  <span className="landing-phone-stat-label">Time saved</span>
                  <span className="landing-phone-stat-value positive">+4 min</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECONDARY SECTION */}
        <section className="landing-secondary">
          <h3 className="landing-secondary-title">Why drivers use Parkiest</h3>
          <div className="landing-secondary-grid">
            <div className="landing-secondary-card">
              <p className="landing-secondary-label">Plan smarter</p>
              <p className="landing-secondary-text">
                See realistic travel time that includes your typical parking search for
                each area.
              </p>
            </div>
            <div className="landing-secondary-card">
              <p className="landing-secondary-label">Arrive on time</p>
              <p className="landing-secondary-text">
                Decide when to leave without guessing &mdash; avoid being “just 10 min
                late” every time.
              </p>
            </div>
            <div className="landing-secondary-card">
              <p className="landing-secondary-label">Choose the best mode</p>
              <p className="landing-secondary-text">
                Quickly see if driving, biking or public transport actually gets you
                there fastest.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer landing-footer">
        <p className="footer-text">
          © {new Date().getFullYear()} Parkiest · Built for people who hate being
          late
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
