"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentAppUser } from "@/lib/supabase/users";

type LoginFormProps = {
  isSupabaseConfigured: boolean;
};

export function LoginForm({ isSupabaseConfigured }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setErrorMessage(
        "Supabase is not configured yet. Add your project URL and publishable key in .env.local first.",
      );
      setMessage(null);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const authUser = data.user;

      if (!authUser) {
        setErrorMessage("Login succeeded, but the user session could not be loaded.");
        return;
      }

      const appUser = await ensureCurrentAppUser(supabase, authUser.id, authUser.email ?? null);

      setMessage("Login successful. Redirecting...");
      router.push(appUser.is_admin ? "/admin" : "/profile");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong while logging in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="team@vhpi.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      <button type="submit" className="login-button auth-submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Log in"}
      </button>

      {message ? <p className="form-message form-message-success">{message}</p> : null}
      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
    </form>
  );
}
