"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Character {
  id: string;
  name: string;
  level: number;
  campaignId: string;
}

export default function CampaignCharactersPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const campaignId = (Array.isArray(rawId) ? rawId[0] : rawId || "") as string;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignName, setCampaignName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [characterLevel, setCharacterLevel] = useState("1");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && campaignId) {
      fetchCharacters();
    }
  }, [status, router, campaignId]);

  async function fetchCharacters() {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/characters`);
      if (!res.ok) throw new Error("Failed to fetch characters");
      const data = await res.json();
      setCharacters(data.characters || []);
      setCampaignName(data.campaignName || "Campaign");
    } catch (error) {
      console.error("Error fetching characters:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCharacter() {
    if (!characterName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: characterName.trim(),
          level: parseInt(characterLevel),
          stats: {},
          campaignId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create character");
      const newChar = await res.json();
      setCharacters([...characters, newChar]);
      setCharacterName("");
      setCharacterLevel("1");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating character:", error);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href={`/campaigns/${campaignId}`} className="text-xs font-medium text-zinc-500">
              ← Back to Campaign
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Character Sheets
            </h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
          >
            Create Character
          </button>
        </div>

        {characters.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">No characters in this campaign yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Create First Character
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {characters.map((char) => (
              <div
                key={char.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{char.name}</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Level {char.level}</p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/characters/${char.id}`}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Character Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-950 shadow-lg">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Create New Character
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Character Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Aragorn"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Starting Level
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={characterLevel}
                  onChange={(e) => setCharacterLevel(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCharacterName("");
                  setCharacterLevel("1");
                }}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCharacter}
                disabled={creating || !characterName.trim()}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
