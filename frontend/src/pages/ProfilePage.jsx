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
    <div className="screen">
      <header className="header header--with-back">
        <Link to="/" className="back-link">
          ←
        </Link>
        <h1 className="logo">My stats</h1>
      </header>

      <main className="screen-main">
        {/* Profile header */}
        <section className="card">
          <div className="avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <h2 className="profile-name">{user?.name || "Driver"}</h2>
          <p className="profile-email">{user?.email}</p>
        </section>

        {/* Time saved summary */}
        <section className="card">
          <h3 className="card-title">Time saved by smarter parking</h3>
          <p className="profile-highlight-number">
            {formatMinutesToHoursMinutes(stats.totalTimeSavedMinutes)}
          </p>
          <p className="profile-highlight-subtext">
            Thanks to estimating parking search time before you leave.
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
              <p className="stat-label">Before ParkTime</p>
              <p className="stat-value">
                {stats.avgParkingSearchBeforeMinutes ?? 0} min
              </p>
              <p className="stat-subtext">average parking search</p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Now with ParkTime</p>
              <p className="stat-value">
                {stats.avgParkingSearchNowMinutes ?? 0} min
              </p>
              <p className="stat-subtext">average parking search</p>
            </div>
          </div>
        </section>

        {/* Future section / placeholder for upcoming features */}
        <section className="card">
          <h3 className="card-title">Coming soon</h3>
          <ul className="feature-list">
            <li>🔮 Forecast travel time incl. parking for a new trip</li>
            <li>🗺️ See hotspots where parking usually takes longer</li>
            <li>📆 Compare workdays vs weekends</li>
          </ul>
        </section>

        <button className="btn-danger full-width" onClick={onLogout}>
          Log out
        </button>
      </main>
    </div>
  );
}

export default ProfilePage;
