"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
    setTokenChecked(true);
  }, []);

  if (!tokenChecked) {
    return (
      <div style={{ maxWidth: 400, margin: "auto", padding: "2rem" }}>
        <h1>Reset Password</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: "auto", padding: "2rem" }}>
        <h1>Reset Password</h1>
        <p style={{ color: "red" }}>Invalid or missing reset token. Please request a new password reset.</p>
        <Link href="/auth/signin" style={{ color: "#0066cc" }}>
          Back to Sign In
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: "2rem" }}>
      <h1>Reset Password</h1>

      {success ? (
        <div>
          <p style={{ color: "green", marginBottom: "1rem" }}>
            Password reset successful! You can now sign in with your new password.
          </p>
          <Link href="/auth/signin" style={{ color: "#0066cc" }}>
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: "8px", boxSizing: "border-box" }}
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: "8px", boxSizing: "border-box" }}
            required
            minLength={8}
          />
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 8 }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}
