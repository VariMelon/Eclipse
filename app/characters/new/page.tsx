"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Campaign {
  id: string;
  name: string;
  system?: {
    id: string;
    name: string;
  };
}

interface System {
  id: string;
  name: string;
}

export default function NewCharacterPage() {
  const { status } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [level, setLevel] = useState("1");
  const [campaignId, setCampaignId] = useState("");
  const [systemId, setSystemId] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadData();
    }
  }, [status, router]);

  async function loadData() {
    setLoading(true);
    try {
      const [campaignsRes, systemsRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/systems"),
      ]);

      if (!campaignsRes.ok) throw new Error("Failed to fetch campaigns");
      if (!systemsRes.ok) throw new Error("Failed to fetch systems");

      const campaignsData = await campaignsRes.json();
      const systemsData = await systemsRes.json();

      setCampaigns(Array.isArray(campaignsData.campaigns) ? campaignsData.campaigns : []);
      setSystems(Array.isArray(systemsData.systems) ? systemsData.systems : []);
    } catch (err) {
      console.error("Failed to load character creation data:", err);
      setCampaigns([]);
      setSystems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Character name is required");
      return;
    }

    const selectedCampaign = campaignId
      ? campaigns.find((campaign) => campaign.id === campaignId)
      : null;
    const resolvedSystemId = campaignId
      ? selectedCampaign?.system?.id || ""
      : systemId;

    if (!campaignId && !resolvedSystemId) {
      setError("System selection is required for global characters");
      return;
    }

    if (campaignId && !resolvedSystemId) {
      setError("The selected campaign does not have a system assigned");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          level: parseInt(level, 10),
          stats: {},
          campaignId: campaignId || undefined,
          systemId: resolvedSystemId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create character");
      }

      const newCharacter = await res.json();
      router.push(`/characters/${newCharacter.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create character");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-40 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="h-48 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
          </div>
        </div>
      </div>
    );
  }

  const selectedCampaign = campaignId
    ? campaigns.find((campaign) => campaign.id === campaignId)
    : null;
  const campaignSystemId = selectedCampaign?.system?.id || "";
  const systemRequiredMissing = !campaignId && !systemId;
  const campaignSystemMissing = !!campaignId && !campaignSystemId;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <Link href="/characters" className="text-xs font-medium text-zinc-500">
            ← Back to Characters
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Create Character
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create a new character with an optional campaign assignment
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Character Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lyra Starfall"
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
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Campaign (optional)
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">No campaign (global character)</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {campaigns.length === 0 && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  No campaigns available. You can assign later.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                System
              </label>
              <select
                value={campaignId ? campaignSystemId : systemId}
                onChange={(e) => setSystemId(e.target.value)}
                disabled={!!campaignId}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800"
              >
                <option value="">
                  {campaignId ? "No system assigned to campaign" : "Select a system"}
                </option>
                {!campaignId && systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
              {campaignId ? (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Campaign characters use the campaign's system automatically.
                </p>
              ) : (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  System selection is required for global characters.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/characters"
              className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancel
            </Link>
            <button
              onClick={handleCreate}
              disabled={saving || !name.trim() || systemRequiredMissing || campaignSystemMissing}
              className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              {saving ? "Creating..." : "Create Character"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
