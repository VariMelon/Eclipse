import Link from "next/link";

export default function Home() {
  const links = [
    { label: "Sign In", href: "/auth/signin" },
    { label: "Sign Up", href: "/auth/signup" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Eclipse Home</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Access authentication and your dashboard.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Navigation</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md border border-zinc-200 px-4 py-3 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                <span className="font-medium">{link.label}</span>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{link.href}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
