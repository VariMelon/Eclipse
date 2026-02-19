"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  visibility: "gm_only" | "moderator" | "public";
}

interface CampaignNotesProps {
  params: { id: string };
}

export default function CampaignNotesPage({ params }: CampaignNotesProps) {
  const { status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"GM" | "MODERATOR" | "PLAYER" | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"gm_only" | "moderator" | "public">("public");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchNotes();
    }
  }, [status, router, params.id]);

  async function fetchNotes() {
    try {
      // For now, we'll show a placeholder
      // In a real implementation, this would fetch from an API
      const res = await fetch(`/api/campaigns/${params.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
      }
      setNotes([]);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNote() {
    if (!title.trim() || !content.trim()) return;

    setCreating(true);
    try {
      // TODO: Implement note creation API
      const newNote: Note = {
        id: Math.random().toString(),
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        visibility,
      };
      setNotes([newNote, ...notes]);
      setTitle("");
      setContent("");
      setVisibility("public");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating note:", error);
    } finally {
      setCreating(false);
    }
  }

  const canCreateGMNotes = userRole === "GM";
  const canCreateModeratorNotes = userRole === "GM" || userRole === "MODERATOR";

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
            <Link href={`/campaigns/${params.id}`} className="text-xs font-medium text-zinc-500">
              ← Back to Campaign
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Campaign Notes
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Private notes, session recaps, and campaign secrets
            </p>
            {userRole && (
              <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Your Role: <span className="font-semibold">{userRole}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
          >
            Add Note
          </button>
        </div>

        {/* Role-Based Access Info */}
        <div className="mb-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Access Levels:</strong> GM can access all notes • Moderators access moderator & player notes • Players access their own notes only
          </p>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">No notes yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Create First Note
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{note.title}</h3>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {note.content}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {note.visibility === "gm_only"
                      ? "GM Only"
                      : note.visibility === "moderator"
                        ? "Moderator"
                        : "Shared"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-zinc-950 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Add Note
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Session 5 Recap"
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
                  placeholder="Write your note here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as "gm_only" | "moderator" | "public")}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="public">My Notes (Private)</option>
                  {canCreateModeratorNotes && (
                    <option value="moderator">Moderators & Above</option>
                  )}
                  {canCreateGMNotes && (
                    <option value="gm_only">GM Only</option>
                  )}
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setTitle("");
                  setContent("");
                  setVisibility("public");
                }}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
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
