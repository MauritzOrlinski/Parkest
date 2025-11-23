import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  };

  async function loginWithBackend(email, password) {
    const tokenRes = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: email, // FastAPI OAuth2PasswordRequestForm uses "username"
        password,
      }),
    });

    if (!tokenRes.ok) {
      let detail = "Login failed. Check your credentials.";
      try {
        const data = await tokenRes.json();
        if (data.detail) detail = data.detail;
      } catch {
        // ignore
      }
      throw new Error(detail);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const meRes = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meRes.ok) {
      throw new Error("Failed to fetch user profile.");
    }

    const user = await meRes.json();

    onLogin({
      ...user,
      token: accessToken,
    });

    navigate("/map");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!form.email || !form.password || (mode === "register" && !form.name)) {
        throw new Error("Please fill in all required fields.");
      }

      if (mode === "register") {
        const res = await fetch(`${API_BASE_URL}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            name: form.name,
          }),
        });

        if (!res.ok) {
          let detail = "Registration failed.";
          try {
            const data = await res.json();
            if (data.detail) detail = data.detail;
          } catch {
            // ignore
          }
          throw new Error(detail);
        }

        await loginWithBackend(form.email, form.password);
      } else {
        await loginWithBackend(form.email, form.password);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Welcome back" : "Create your account";
  const subtitle =
    mode === "login"
      ? "Sign in to see your live parking-aware ETA and time saved."
      : "Join the private beta and start tracking how much time you really save.";

  return (
    <div className="screen auth-screen">
      <header className="header landing-header auth-header">
        <div className="landing-logo-group">
          <div className="logo-mark">PB</div>
          <div className="logo-text">
            <h1 className="logo">Parkiest</h1>
            <p className="logo-tagline">Time-aware parking planner</p>
          </div>
        </div>

        <div className="landing-header-actions">
          <Link to="/" className="text-link landing-header-link">
            Back to landing
          </Link>
        </div>
      </header>

      <main className="screen-main auth-main">
        <section className="card auth-card">
          <p className="pill-badge auth-pill">
            {mode === "login" ? "Secure sign-in" : "1-minute setup"}
          </p>

          <h2 className="auth-title">{title}</h2>
          <p className="auth-subtitle">{subtitle}</p>

          <div className="auth-toggle">
            <button
              type="button"
              className={`auth-tab ${mode === "login" ? "auth-tab--active" : ""}`}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "register" ? "auth-tab--active" : ""}`}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Register
            </button>
          </div>

          <form className="form auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="form-group">
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input
                  className={`input ${error ? "input-error" : ""}`}
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                className={`input ${error ? "input-error" : ""}`}
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                className={`input ${error ? "input-error" : ""}`}
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                ? "Login"
                : "Create account"}
            </button>
          </form>

          <p className="auth-helper">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Login
                </button>
              </>
            )}
          </p>

          <p className="auth-footnote">
            By continuing you agree that Parkiest will safely store your account data
            to calculate time saved.
          </p>
        </section>
      </main>
    </div>
  );
}

export default AuthPage;
