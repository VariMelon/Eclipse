"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Campaign {
  id: string;
  name: string;
  subtitle?: string;
  systemId?: string;
  system?: {
    id: string;
    name: string;
  };
  createdBy: string;
  createdByName?: string;
}

interface System {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  creator: {
    id: string;
    name: string;
  };
  _count: {
    campaigns: number;
  };
}

export default function CampaignsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignSubtitle, setCampaignSubtitle] = useState("");
  const [campaignSystemId, setCampaignSystemId] = useState("");
  const [creating, setCreating] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadCampaigns();
      loadSystems();
    }
  }, [status, router]);

  async function loadCampaigns() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to load campaigns");
      const data = await res.json();
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
    } catch (err) {
      setError("Failed to load campaigns. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSystems() {
    try {
      const res = await fetch("/api/systems");
      if (!res.ok) throw new Error("Failed to load systems");
      const data = await res.json();
      setSystems(Array.isArray(data.systems) ? data.systems : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateCampaign() {
    if (!campaignName.trim()) {
      setError("Campaign name is required");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName.trim(),
          subtitle: campaignSubtitle.trim() || undefined,
          systemId: campaignSystemId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create campaign");
      }

      const data = await res.json();
      setCampaigns([...campaigns, data]);
      setCampaignName("");
      setCampaignSubtitle("");
      setCampaignSystemId("");
      setShowCreateModal(false);
      router.push(`/campaigns/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  }

  async function handleImportCampaign() {
    if (!importFile) {
      setError("Please select a file to import");
      return;
    }

    setImporting(true);
    setError("");

    try {
      const fileContent = await importFile.text();
      const importData = JSON.parse(fileContent);

      const res = await fetch("/api/campaigns/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to import campaign");
      }

      const data = await res.json();
      await loadCampaigns();
      setShowCreateModal(false);
      setImportFile(null);
      setImportMode(false);
      router.push(`/campaigns/${data.campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import campaign");
    } finally {
      setImporting(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
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
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Campaigns</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Create and manage your TTRPG campaigns
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition dark:bg-white dark:text-black dark:hover:bg-zinc-100 flex-shrink-0"
          >
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Campaigns Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.length === 0 ? (
            <div className="col-span-full rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">No campaigns yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                  {campaign.name}
                </h2>
                {campaign.subtitle && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {campaign.subtitle}
                  </p>
                )}
                {campaign.system && (
                  <p className="mt-2 inline-block rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {campaign.system.name}
                  </p>
                )}
                {campaign.createdByName && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    GM: {campaign.createdByName}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-950 shadow-lg">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {importMode ? "Import Campaign" : "Create New Campaign"}
              </h2>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setImportMode(false);
                    setError("");
                    setImportFile(null);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    !importMode
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                      : "bg-zinc-100 text-zinc600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  Create New
                </button>
                <button
                  onClick={() => {
                    setImportMode(true);
                    setError("");
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    importMode
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  Import from File
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            {!importMode ? (
              <>
                <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lost Caverns"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g., A Journey Through Darkness"
                  value={campaignSubtitle}
                  onChange={(e) => setCampaignSubtitle(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  TTRPG System
                </label>
                <select
                  value={campaignSystemId}
                  onChange={(e) => setCampaignSystemId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-white"
                >
                  <option value="">None (create system first)</option>
                  {systems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.name} {system.isPublic ? "(Public)" : "(Your system)"}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Create systems in the <Link href="/systems" className="underline">Systems page</Link> first
                </p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCampaignName("");
                  setCampaignSubtitle("");
                  setCampaignSystemId("");
                  setError("");
                }}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={creating}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Campaign Data File (.json)
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700"
                />
                {importFile && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>
              <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Import a campaign export file (.json) to create a new campaign with all data. Members will only be added if they exist in the system.
                </p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setImportFile(null);
                  setImportMode(false);
                  setError("");
                }}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCampaign}
                disabled={importing || !importFile}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </>
        )}
          </div>
        </div>
      )}
    </div>
  );
}
