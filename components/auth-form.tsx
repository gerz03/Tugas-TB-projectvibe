"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      username: form.get("username"),
      email: form.get("email"),
      password: form.get("password")
    };
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not authenticate.");
      router.push("/profile");
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not authenticate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">{isRegister ? "Save your scores and track your football knowledge." : "Sign in to continue your football journey."}</p>
      <form className="auth-form" onSubmit={submit}>
        {isRegister && (
          <>
            <label htmlFor="username">Username</label>
            <input className="search" id="username" name="username" minLength={3} maxLength={30} autoComplete="username" required />
          </>
        )}
        <label htmlFor="email">Email</label>
        <input className="search" id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">Password</label>
        <input className="search" id="password" name="password" type="password" minLength={isRegister ? 8 : 1} maxLength={72} autoComplete={isRegister ? "new-password" : "current-password"} required />
        {error && <p role="alert">{error}</p>}
        <button className="button accent" type="submit" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button>
      </form>
      <p className="muted">
        {isRegister ? "Already have an account? " : "New to Football Identity? "}
        <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
      </p>
    </section>
  );
}
