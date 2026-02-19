"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Campaign = { id: string; name: string; createdBy: string };

type CampaignsResponse = Campaign[];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState("");

  async function loadCampaigns() {
    setError("");
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? (data as CampaignsResponse) : []);
    } catch {
      setError("Failed to load campaigns.");
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Campaigns</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Explore your campaigns and open each container to manage sheets, notes, and wiki content.
          </p>
        </header>

        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No campaigns yet.</p>
          ) : (
            campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{campaign.name}</h2>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Campaign container</p>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
