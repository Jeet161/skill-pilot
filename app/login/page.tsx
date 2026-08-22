"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Mail, Lock, User, Eye, EyeOff,
  ArrowRight, Loader2, AlertCircle
} from "lucide-react";

type Mode = "login" | "register";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Show error from NextAuth redirect (e.g. wrong password)
  useEffect(() => {
    const e = params.get("error");
    if (e === "CredentialsSignin") setError("Invalid email or password.");
    else if (e) setError("Authentication failed. Please try again.");
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      // Auto-sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Registered! Please sign in.");
        setMode("login");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      return;
    }

    // Login mode
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  const toggleMode = () => {
    setMode(m => m === "login" ? "register" : "login");
    setError("");
    setPassword("");
  };

  return (
    <div className="relative rounded-2xl border border-white/8 bg-[#0c1220]/80 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

      <div className="p-8 md:p-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/25 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="font-mono text-lg font-bold tracking-widest text-white uppercase">
            SkillPilot
          </span>
          <p className="text-xs text-white/40 mt-1 tracking-wide">
            Adaptive AI Assessment Engine
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-white/[0.03] border border-white/8 p-1 mb-8">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              id={`tab-${m}`}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === m
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <input
                    id="input-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full bg-white/[0.04] border border-white/10 text-white placeholder-white/20 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                id="input-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/10 text-white placeholder-white/20 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                id="input-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"}
                className="w-full bg-white/[0.04] border border-white/10 text-white placeholder-white/20 rounded-xl pl-10 pr-11 py-3 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            id="btn-submit-auth"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Sign In" : "Create Account"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Bottom toggle */}
        <p className="text-center text-xs text-white/30 mt-6">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            id="btn-toggle-mode"
            onClick={toggleMode}
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen bg-[#080d19] flex items-center justify-center overflow-hidden px-4">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-[300px] w-[300px] rounded-full bg-blue-600/5 blur-[100px]" />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 bg-[#0c1220]/80 rounded-2xl border border-white/8 backdrop-blur-xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-xs text-muted mt-2">Loading authentication...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/20 mt-6">
          SkillPilot — Know what you know.
        </p>
      </motion.div>
    </main>
  );
}
