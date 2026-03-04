export const dynamic = "force-dynamic";

export default function ResourcesPage() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto w-full max-w-6xl">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Resources</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Community-driven cross-system content that can be added to your systems or campaigns.
        </p>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Planned Scope</h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            This area is intended to use Cross System Definitions from systems to support shared resources like items,
            monsters, locations, NPCs, weapons, armor, and other community-generated content.
          </p>
        </div>
      </main>
    </div>
  );
}
