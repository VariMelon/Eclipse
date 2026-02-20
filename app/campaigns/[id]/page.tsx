"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  name: string;
  subtitle?: string;
  system?: string;
  createdByName?: string;
  createdBy: string;
  createdAt?: string;
  isGM?: boolean;
}

export default function CampaignContainer() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const rawId = params?.id;
  const campaignId = (Array.isArray(rawId) ? rawId[0] : rawId || "") as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGM, setIsGM] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && campaignId) {
      fetchCampaign();
    }
  }, [status, router, campaignId]);

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Campaign not found");
      const data = await res.json();
      setCampaign(data);
      const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
      const sessionUsername = session?.user?.name;
      const isCreator = data.createdBy && sessionUserId && data.createdBy === sessionUserId;
      const isCreatorByName = data.createdByName && sessionUsername && data.createdByName === sessionUsername;
      setIsGM(data.isGM === true || isCreator || isCreatorByName);
    } catch (error) {
      console.error("Error fetching campaign:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCampaign() {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete campaign");
      }

      router.push("/campaigns");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert(error instanceof Error ? error.message : "Failed to delete campaign");
      setDeleting(false);
    }
  }

  async function handleExportCampaign() {
    setExporting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/export`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to export campaign");
      }

      // Trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campaign?.name || "campaign"}_export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting campaign:", error);
      alert(error instanceof Error ? error.message : "Failed to export campaign");
    } finally {
      setExporting(false);
    }
  }

  const tabs = [
    { label: "Overview", href: `/campaigns/${campaignId}`, id: "overview" },
    { label: "Character Sheets", href: `/campaigns/${campaignId}/characters`, id: "characters" },
    { label: "Wiki", href: `/campaigns/${campaignId}/wiki`, id: "wiki" },
    { label: "Notes", href: `/campaigns/${campaignId}/notes`, id: "notes" },
    { label: "Assets", href: `/campaigns/${campaignId}/assets`, id: "assets" },
    { label: "Members", href: `/campaigns/${campaignId}/members`, id: "members" },
  ];

  const isActive = (href: string) => pathname === href;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="grid gap-4 grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/campaigns"
            className="text-xs font-medium uppercase tracking-widest text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ← Back to Campaigns
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {campaign?.name || "Campaign"}
              </h1>
              {campaign?.subtitle && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {campaign.subtitle}
                </p>
              )}
              {campaign?.createdByName && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  GM: {campaign.createdByName}
                </p>
              )}
            </div>
            {isGM && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportCampaign}
                  disabled={exporting}
                  className="px-3 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-medium disabled:opacity-50 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                >
                  {exporting ? "Exporting..." : "Export Data"}
                </button>
                <button
                  onClick={handleDeleteCampaign}
                  disabled={deleting}
                  className="px-3 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium disabled:opacity-50 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                >
                  {deleting ? "Deleting..." : "Delete Campaign"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 px-6 py-4 sticky top-[73px] z-40">
        <div className="mx-auto max-w-6xl flex overflow-x-auto gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-t-md border-b-2 transition ${
                isActive(tab.href)
                  ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Overview
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Welcome to {campaign?.name}. Use the tabs above to manage campaign content.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href={`/campaigns/${campaignId}/characters`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="text-2xl mb-2">🎲</div>
                <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                  Character Sheets
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Manage and create character sheets for this campaign
                </p>
              </Link>

              <Link
                href={`/campaigns/${campaignId}/wiki`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="text-2xl mb-2">📖</div>
                <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                  Campaign Wiki
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Track lore, locations, NPCs, and world-building
                </p>
              </Link>

              <Link
                href={`/campaigns/${campaignId}/notes`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                  Notes
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Private notes, session recaps, and secrets
                </p>
              </Link>

              <Link
                href={`/campaigns/${campaignId}/assets`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="text-2xl mb-2">📁</div>
                <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                  Assets
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Upload and manage campaign assets and references
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
