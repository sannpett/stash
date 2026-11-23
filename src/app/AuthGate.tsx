import { FormEvent, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { StoreProvider } from "./store";
import { isSupabaseConfigured, supabase } from "./supabase";

type AuthMode = "sign-in" | "sign-up" | "recovery";

const authRedirectUrl = () => new URL(import.meta.env.BASE_URL, window.location.origin).toString();

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      setError("");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!supabase) return <StoreProvider>{children}</StoreProvider>;
  if (loading) return <div className="app-loading">Checking your account…</div>;
  if (error && !session) return <AuthScreen initialError={error} />;
  if (!session) return <AuthScreen />;
  return <StoreProvider userId={session.user.id}>{children}</StoreProvider>;
}

function AuthScreen({ initialError = "" }: { initialError?: string }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim(), username: username.trim().toLowerCase() },
            emailRedirectTo: authRedirectUrl(),
          },
        });
        if (authError) throw authError;
        if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
      } else if (mode === "recovery") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authRedirectUrl(),
        });
        if (authError) throw authError;
        setMessage("If an account exists for that email, a password reset link is on its way.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
      }
    } catch (authError) {
      const detail = authError instanceof Error ? authError.message : "";
      setError(
        /email rate limit|too many requests|429/i.test(detail)
          ? "Supabase’s built-in email sender allows only 2 auth emails per hour. Wait up to an hour before trying again, or configure custom SMTP for ongoing testing."
          : detail || "Authentication failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <img src="/favicon.png" alt="" width="42" height="42" />
        <p className="eyebrow">WELCOME TO</p>
        <h1>stash</h1>
        <p className="muted">
          {mode === "sign-up"
            ? "Create an account to keep your savings in sync."
            : mode === "recovery"
              ? "We’ll email you a secure password reset link."
              : "Sign in to see your savings and goals."}
        </p>
        <form onSubmit={submit}>
          {mode === "sign-up" && (
            <>
              <label className="field">
                DISPLAY NAME
                <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoComplete="name" />
              </label>
              <label className="field">
                USERNAME
                <input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" autoComplete="username" />
              </label>
            </>
          )}
          <label className="field">
            EMAIL
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          {mode !== "recovery" && (
            <label className="field">
              PASSWORD
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} />
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="primary wide" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "sign-up" ? "Create account" : mode === "recovery" ? "Send reset link" : "Sign in"}
          </button>
        </form>
        <div className="auth-links">
          {mode === "sign-in" ? (
            <>
              <button onClick={() => { setMode("recovery"); setError(""); }}>Forgot password?</button>
              <button onClick={() => { setMode("sign-up"); setError(""); }}>Create account</button>
            </>
          ) : (
            <button onClick={() => { setMode("sign-in"); setError(""); setMessage(""); }}>Back to sign in</button>
          )}
        </div>
        <small className="muted">Savings are self-reported. Stash does not hold or move funds.</small>
      </section>
    </main>
  );
}
