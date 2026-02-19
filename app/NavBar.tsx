"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "My Info" },
  { href: "/friends", label: "Friends" },
  { href: "/campaigns", label: "Campaigns" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname || "/";

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
  }

  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
            E
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Eclipse</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Campaign hub</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const active = currentPath === link.href || currentPath.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
