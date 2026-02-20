"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMessage("Email verified! You can now sign in.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      const normalizedError = res.error.toLowerCase();
      if (normalizedError === "email_not_verified" || normalizedError === "emailnotverified") {
        setError("Please verify your email before signing in. Check your inbox for the verification link.");
      } else {
        setError("Invalid username or password");
      }
    } else {
      router.push("/dashboard");
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError("Please enter your email address");
      return;
    }

    setForgotLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (res.ok) {
        setSuccessMessage("Password reset email has been sent. Check your inbox.");
        setShowForgotPassword(false);
        setForgotEmail("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: "2rem" }}>
      <h1>Sign In</h1>

      {successMessage && (
        <p style={{ color: "green", marginBottom: "1rem", padding: "0.5rem", backgroundColor: "#e8f5e9", borderRadius: "4px" }}>
          {successMessage}
        </p>
      )}

      {!showForgotPassword ? (
        <>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: 8, padding: "8px", boxSizing: "border-box" }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: 8, padding: "8px", boxSizing: "border-box" }}
              required
            />
            <button type="submit" style={{ width: "100%", padding: 8 }}>
              Sign In
            </button>
          </form>

          {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={{
                background: "none",
                border: "none",
                color: "#0066cc",
                cursor: "pointer",
                textDecoration: "underline",
                marginBottom: 12,
                display: "block",
                width: "100%",
              }}
            >
              Forgot password?
            </button>
            <p>
              Need an account? <a href="/auth/signup">Sign up</a>
            </p>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={handleForgotPassword}>
            <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <input
              type="email"
              placeholder="Email address"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: 8, padding: "8px", boxSizing: "border-box" }}
              required
            />
            <button type="submit" disabled={forgotLoading} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
              {forgotLoading ? "Sending..." : "Send Reset Email"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setError("");
                setForgotEmail("");
              }}
              style={{
                width: "100%",
                padding: 8,
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Back to Sign In
            </button>
          </form>

          {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        </>
      )}
    </div>
  );
}