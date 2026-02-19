import Link from "next/link";

type CampaignContainerProps = {
  params: { id: string };
};

export default function CampaignContainer({ params }: CampaignContainerProps) {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <Link href="/campaigns" className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Back to campaigns
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Campaign Container</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Campaign ID: {params.id}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Character Sheets", description: "Manage campaign character data." },
            { title: "Wiki", description: "Track lore, places, and NPCs." },
            { title: "Notes", description: "Campaign notes, secrets, and recaps." },
            { title: "Assets", description: "Links, files, and references." },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{card.title}</h2>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{card.description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
