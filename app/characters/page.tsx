"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Character {
  id: string;
  name: string;
  level: number;
  campaignId?: string;
  campaign?: { id: string; name: string };
}

export default function CharactersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalCharacters, setGlobalCharacters] = useState<Character[]>([]);
  const [campaignCharacters, setCampaignCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchCharacters();
    }
  }, [status, router]);

  async function fetchCharacters() {
    try {
      const res = await fetch("/api/characters");
      if (!res.ok) throw new Error("Failed to fetch characters");
      const data = await res.json();
      setCharacters(data.characters || []);
      
      // Separate global and campaign characters
      const global = (data.characters || []).filter((c: Character) => !c.campaignId);
      const withCampaign = (data.characters || []).filter((c: Character) => c.campaignId);
      
      setGlobalCharacters(global);
      setCampaignCharacters(withCampaign);
    } catch (error) {
      console.error("Error fetching characters:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-10 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Characters</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Manage all your characters across campaigns
            </p>
          </div>
          <Link
            href="/characters/new"
            className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
          >
            Create Character
          </Link>
        </div>

        {/* Global Characters Section */}
        {globalCharacters.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Global Characters
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {globalCharacters.map((char) => (
                <Link
                  key={char.id}
                  href={`/characters/${char.id}`}
                  className="group rounded-lg border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                    {char.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Level {char.level}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Not assigned to a campaign
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Campaign Characters Section */}
        {campaignCharacters.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Campaign Characters
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campaignCharacters.map((char) => (
                <Link
                  key={char.id}
                  href={`/characters/${char.id}`}
                  className="group rounded-lg border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                    {char.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Level {char.level}
                  </p>
                  {char.campaign && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      in <span className="font-semibold">{char.campaign.name}</span>
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {characters.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">No characters yet</p>
            <Link
              href="/characters/new"
              className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Create your first character
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
