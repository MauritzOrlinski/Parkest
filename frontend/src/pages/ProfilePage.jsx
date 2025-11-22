import React from "react";
import { Link } from "react-router-dom";

function formatMinutesToHoursMinutes(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return "0 min";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}min`;
}

function ProfilePage({ user, onLogout }) {
  const stats = user?.stats || {};

  return (
    <div className="screen profile-screen">
      <header className="header header--with-back profile-header">
        <Link to="/map" className="back-link profile-back-link">
          ←
        </Link>
        <div className="profile-header-center">
          <h1 className="logo profile-logo">My stats</h1>
          <p className="profile-header-subtitle">Parking-aware time saved overview</p>
        </div>
      </header>

      <main className="screen-main profile-main">
        {/* Profile identity card */}
        <section className="card profile-card">
          <h2 className="profile-name">{user?.name || "Driver"}</h2>

          <div className="profile-email">
            <p>{user?.email || "test@email.com"}</p>
            <p>
              Driving with Parking Buddy since{" "}
              <span className="profile-email-highlight">private beta</span>
            </p>
        </div>

        </section>

        {/* Time saved summary */}
        <section className="card profile-card profile-summary-card">
          <h3 className="card-title profile-card-title">
            Time saved by smarter parking
          </h3>
          <p className="profile-highlight-number">
            {formatMinutesToHoursMinutes(stats.totalTimeSavedMinutes)}
          </p>
          <p className="profile-highlight-subtext">
            Estimated time you didn&apos;t spend circling for parking, based on your
            tracked trips.
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Trips tracked</p>
              <p className="stat-value">{stats.tripsTracked ?? 0}</p>
              <p className="stat-subtext">drives with parking data</p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Last 7 days</p>
              <p className="stat-value">
                {formatMinutesToHoursMinutes(stats.lastWeekTimeSavedMinutes)}
              </p>
              <p className="stat-subtext">time saved this week</p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Before Parking Buddy</p>
              <p className="stat-value">
                {stats.avgParkingSearchBeforeMinutes ?? 0} min
              </p>
              <p className="stat-subtext">average parking search</p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Now with Parking Buddy</p>
              <p className="stat-value">
                {stats.avgParkingSearchNowMinutes ?? 0} min
              </p>
              <p className="stat-subtext">average parking search</p>
            </div>
          </div>
        </section>

        {/* Roadmap / upcoming */}
        <section className="card profile-card">
          <h3 className="card-title profile-card-title">Coming soon</h3>
          <ul className="feature-list profile-feature-list">
            <li>🔮 Forecast travel time incl. parking for a new trip</li>
            <li>🗺️ See hotspots where parking usually takes longer</li>
            <li>📆 Compare workdays vs weekends and spot patterns</li>
          </ul>
        </section>

        <button className="btn-danger full-width profile-logout-btn" onClick={onLogout}>
          Log out
        </button>
      </main>
    </div>
  );
}

export default ProfilePage;
