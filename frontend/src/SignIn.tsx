
import { useState, type FormEvent } from "react";
import "./SignIn.css";

type Props = {
  onSignIn: (name: string) => void;
};

export default function SignIn({ onSignIn }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignUp ? "signup" : "login";

      const payload = isSignUp
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(
        `http://localhost:8080/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();
      let data: { name?: string; message?: string } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed. Check your details."
        );
      }

      onSignIn(data.name || name.trim() || email.trim());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cannot connect to backend. Check Spring Boot on port 8080."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-icon">₹</div>
        <p className="auth-eyebrow">PERSONAL FINANCE WORKSPACE</p>

        <h1>Expense Tracker</h1>

        <p className="auth-subtitle">
          {isSignUp
            ? "Create your account to get started."
            : "Welcome back! Sign in to manage your money."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoComplete="name"
                required
              />
            </>
          )}

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              isSignUp ? "Minimum 8 characters" : "Enter your password"
            }
            minLength={isSignUp ? 8 : undefined}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp
            ? "Already have an account?"
            : "New to Expense Tracker?"}{" "}
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setIsSignUp((current) => !current);
              setError("");
            }}
          >
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </p>

        <p className="auth-footer">
          Track your expenses. Plan your future.
        </p>
      </section>
    </main>
  );
}
