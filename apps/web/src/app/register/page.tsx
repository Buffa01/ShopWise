"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getHomePathForRole, register, setAccessToken } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await register({
        name: name || undefined,
        businessName,
        email,
        password
      });
      setAccessToken(response.accessToken);
      router.push(getHomePathForRole(response.user.role));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">ShopWise</p>
        <h1>Create account</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Name
            <input
              autoComplete="name"
              name="name"
              onChange={(event) => setName(event.target.value)}
              type="text"
              value={name}
            />
          </label>
          <label>
            Business name
            <input
              autoComplete="organization"
              minLength={2}
              name="businessName"
              onChange={(event) => setBusinessName(event.target.value)}
              required
              type="text"
              value={businessName}
            />
          </label>
          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="auth-alt">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

