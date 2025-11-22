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
    // 1) Get token from /token
    const tokenRes = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: email, 
        password,
      }),
    });

    if (!tokenRes.ok) {
      let detail = "Login failed. Check your credentials.";
      try {
        const data = await tokenRes.json();
        if (data.detail) detail = data.detail;
      } catch {
        // ignore parsing error, use default
      }
      throw new Error(detail);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2) Fetch current user from /users/me
    const meRes = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meRes.ok) {
      throw new Error("Failed to fetch user profile.");
    }

    const user = await meRes.json();

    // 3) Call onLogin with user + token
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
        // 1) Register user
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
            // ignore parse error
          }
          throw new Error(detail);
        }

        // 2) After successful registration, log them in
        await loginWithBackend(form.email, form.password);
      } else {
        // mode === "login"
        await loginWithBackend(form.email, form.password);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <header className="header">
        <h1 className="logo">Parking Buddy</h1>
      </header>

      <main className="screen-main">
        <div className="card">
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

          <form className="form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="form-group">
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input
                  className="input"
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
                className="input"
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
                className="input"
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

            <button type="submit" className="btn-primary" disabled={loading}>
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
        </div>

        <Link to="/" className="text-link small-link">
          ← Back to landing
        </Link>
      </main>
    </div>
  );
}

export default AuthPage;
