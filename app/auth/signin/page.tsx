"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: "2rem" }}>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit}>
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
          Sign In
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p style={{ marginTop: 12 }}>
        Need an account? <a href="/auth/signup">Sign up</a>
      </p>
    </div>
  );
}