"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUsuario(u);
      if (!u) router.push("/login");
    });
    return unsub;
  }, [router]);

  // undefined = todavía no sabemos si hay sesión o no (evita un flash del
  // contenido admin antes de confirmar que el usuario está autenticado)
  if (usuario === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Verificando sesión…</p>
      </div>
    );
  }

  if (!usuario) {
    // El useEffect ya está redirigiendo a /login, esto es solo el
    // instante intermedio.
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-6">
        <span className="text-xs text-zinc-400">{usuario.email}</span>
        <button
          type="button"
          onClick={() => void signOut(auth)}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
        >
          Cerrar sesión
        </button>
      </div>
      {children}
    </div>
  );
}
