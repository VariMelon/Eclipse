"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      router.push("/auth/signin");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: "2rem" }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
          required
        />
        <button type="submit" style={{ width: "100%", padding: 8 }}>
          Sign Up
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p style={{ marginTop: 12 }}>
        Already have an account? <a href="/auth/signin">Sign in</a>
      </p>
    </div>
  );
}