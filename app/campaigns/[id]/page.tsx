"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  name: string;
  createdBy: string;
}

type CampaignContainerProps = {
  params: { id: string };
};

export default function CampaignContainer({ params }: CampaignContainerProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchCampaign();
    }
  }, [status, router]);

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${params.id}`);
      if (!res.ok) throw new Error("Campaign not found");
      const data = await res.json();
      setCampaign(data);
    } catch (error) {
      console.error("Error fetching campaign:", error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { label: "Overview", href: `/campaigns/${params.id}`, id: "overview" },
    { label: "Character Sheets", href: `/campaigns/${params.id}/characters`, id: "characters" },
    { label: "Wiki", href: `/campaigns/${params.id}/wiki`, id: "wiki" },
    { label: "Notes", href: `/campaigns/${params.id}/notes`, id: "notes" },
    { label: "Assets", href: `/campaigns/${params.id}/assets`, id: "assets" },
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
          <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {campaign?.name || "Campaign"}
          </h1>
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
                href={`/campaigns/${params.id}/characters`}
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
                href={`/campaigns/${params.id}/wiki`}
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
                href={`/campaigns/${params.id}/notes`}
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
                href={`/campaigns/${params.id}/assets`}
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
