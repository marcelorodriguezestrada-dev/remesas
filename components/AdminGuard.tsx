"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const SECCIONES = [
  { href: "/admin/dashboard", etiqueta: "Dashboard" },
  { href: "/admin/marketing", etiqueta: "Marketing" },
  { href: "/admin/analisis", etiqueta: "Análisis" },
  { href: "/admin/funnel", etiqueta: "Funnel" },
  { href: "/admin/competencia", etiqueta: "Competencia" },
];

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
      <nav className="mx-auto mt-3 flex max-w-2xl gap-1 overflow-x-auto px-4">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={[
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium",
              pathname?.startsWith(s.href)
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-100",
            ].join(" ")}
          >
            {s.etiqueta}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
