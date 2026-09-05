import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.scss";

const LoginPage = () => {
  // Track what the user types in each field
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Track an error message to show if login fails
  const [error, setError] = useState("");
  // Track whether a request is in flight (to disable the button / show "Signing in...")
  const [submitting, setSubmitting] = useState(false);

  // Grab the login function from our AuthContext
  const { login } = useAuth();

  // Runs when the form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();        // stop the browser's default full-page reload on submit
    setError("");              // clear any old error
    setSubmitting(true);       // we're now sending

    try {
      await login(email, password); // calls the API, stores token, sets user
      // (navigation to the dashboard comes once we add routing)
    } catch (err) {
      // login() throws if credentials are bad — show the message
      setError(err.message);
    } finally {
      setSubmitting(false);    // done, whether success or failure
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Welcome back</h1>
        <p className="login__subtitle">Sign in to see where you stand.</p>

        <form className="login__form" onSubmit={handleSubmit}>
          <label className="login__label">
            Email
            <input
              type="email"
              className="login__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </label>

          <label className="login__label">
            Password
            <input
              type="password"
              className="login__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {/* Only show the error box if there's an error */}
          {error && <p className="login__error">{error}</p>}

          <button
            type="submit"
            className="login__button"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;