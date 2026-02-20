"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function CampaignWikiPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const campaignId = (Array.isArray(rawId) ? rawId[0] : rawId || "") as string;
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && campaignId) {
      fetchWikiEntries();
    }
  }, [status, router, campaignId]);

  async function fetchWikiEntries() {
    try {
      // For now, we'll show a placeholder
      // In a real implementation, this would fetch from an API
      setEntries([]);
    } catch (error) {
      console.error("Error fetching wiki entries:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEntry() {
    if (!title.trim() || !content.trim()) return;

    setCreating(true);
    try {
      // TODO: Implement wiki entry creation API
      const newEntry: WikiEntry = {
        id: Math.random().toString(),
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setEntries([newEntry, ...entries]);
      setTitle("");
      setContent("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating wiki entry:", error);
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
              Campaign Wiki
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Track world-building, lore, NPCs, and locations
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
          >
            Add Entry
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">No wiki entries yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Create First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{entry.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {entry.content}
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-zinc-950 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Add Wiki Entry
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., The Lost City"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Content
                </label>
                <textarea
                  placeholder="Write your wiki entry here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setTitle("");
                  setContent("");
                }}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEntry}
                disabled={creating || !title.trim() || !content.trim()}
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
