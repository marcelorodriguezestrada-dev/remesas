"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-zinc-100"
      >
        <h1 className="mb-6 text-xl font-semibold text-zinc-900">
          Acceso admin
        </h1>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-green-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
