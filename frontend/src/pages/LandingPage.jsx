import React from "react";
import { Link } from "react-router-dom";

function LandingPage({ isLoggedIn }) {
  return (
    <div className="screen">
      <header className="header">
        <h1 className="logo">ParkTime</h1>
      </header>

      <main className="screen-main">
        <section className="hero">
          <h2 className="hero-title">Stop wasting time parking ⏱️</h2>
          <p className="hero-subtitle">
            ParkTime estimates your total travel time by including how long it
            usually takes you to find a parking spot — so you can leave at the
            right moment and arrive relaxed.
          </p>
        </section>

        <section className="hero-actions">
          {isLoggedIn ? (
            <>
              <Link className="btn-primary" to="/profile">
                View my stats
              </Link>
              <Link className="btn-secondary" to="/map">
                Open parking map
              </Link>
            </>
          ) : (
            <>
              <Link className="btn-primary" to="/auth">
                Get started
              </Link>
              <Link className="btn-secondary" to="/map">
                Try the map
              </Link>
              <a className="btn-ghost" href="#features">
                How it saves your time
              </a>
            </>
          )}
        </section>

        <section id="features" className="card">
          <h3 className="card-title">How it works</h3>
          <ul className="feature-list">
            <li>📍 Track trips & parking search time</li>
            <li>📊 Learn your typical “parking overhead” per area</li>
            <li>⏰ See how much time you’ve already saved</li>
          </ul>
        </section>

        <section className="card">
          <h3 className="card-title">Why it matters</h3>
          <ul className="feature-list">
            <li>✅ Leave home at realistic times</li>
            <li>✅ Fewer late arrivals & less stress</li>
            <li>✅ Make smarter decisions: drive, bike or public transport</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p className="footer-text">© {new Date().getFullYear()} ParkTime</p>
      </footer>
    </div>
  );
}

export default LandingPage;
