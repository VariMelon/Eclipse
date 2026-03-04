"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface System {
  id: string;
  name: string;
  description: string | null;
  tags: unknown;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  isFavorited: boolean;
  creator: {
    id: string;
    name: string;
  };
  _count: {
    campaigns: number;
  };
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function SystemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemName, setSystemName] = useState("");
  const [systemDescription, setSystemDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");
  const [favoriteLoadingById, setFavoriteLoadingById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadSystems();
    }
  }, [status, router]);

  async function loadSystems() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/systems");
      if (!res.ok) throw new Error("Failed to load systems");
      const data = await res.json();
      setSystems(Array.isArray(data.systems) ? data.systems : []);
    } catch (err) {
      setError("Failed to load systems. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSystem() {
    if (!systemName.trim()) {
      setError("System name is required");
      return;
    }

    try {
      const response = await fetch("/api/systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: systemName,
          description: systemDescription || null,
          isPublic,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setSystemName("");
        setSystemDescription("");
        setIsPublic(false);
        setError("");
        loadSystems();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create system");
      }
    } catch {
      setError("Failed to create system");
    }
  }

  async function handleDeleteSystem(systemId: string) {
    if (!confirm("Are you sure you want to delete this system?")) {
      return;
    }

    try {
      const response = await fetch(`/api/systems/${systemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadSystems();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete system");
      }
    } catch {
      alert("Failed to delete system");
    }
  }

  async function handleToggleFavorite(systemId: string, nextValue: boolean) {
    setFavoriteLoadingById((prev) => ({ ...prev, [systemId]: true }));
    try {
      const response = await fetch(`/api/systems/${systemId}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to update favorite");
        return;
      }

      setSystems((prev) =>
        prev.map((system) =>
          system.id === systemId ? { ...system, isFavorited: nextValue } : system
        )
      );
    } catch {
      setError("Failed to update favorite");
    } finally {
      setFavoriteLoadingById((prev) => ({ ...prev, [systemId]: false }));
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSystems = useMemo(() => {
    if (!normalizedQuery) {
      return systems;
    }

    return systems.filter((system) => {
      const tags = parseTags(system.tags);
      return (
        system.name.toLowerCase().includes(normalizedQuery) ||
        (system.description || "").toLowerCase().includes(normalizedQuery) ||
        tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [systems, normalizedQuery]);

  const favoriteSystems = filteredSystems.filter((s) => s.isFavorited);
  const ownedSystems = session
    ? filteredSystems.filter((s) => s.creator.id === session.user.id)
    : [];
  const publicSystems = session
    ? filteredSystems.filter((s) => s.creator.id !== session.user.id)
    : [];

  function SystemCard({ system, ownerView }: { system: System; ownerView: boolean }) {
    const tags = parseTags(system.tags);

    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 md:p-6 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => handleToggleFavorite(system.id, !system.isFavorited)}
                disabled={favoriteLoadingById[system.id]}
                className={`mt-0.5 text-lg leading-none transition ${
                  system.isFavorited
                    ? "text-amber-500"
                    : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                } disabled:opacity-60`}
                aria-label={system.isFavorited ? "Remove from favorites" : "Add to favorites"}
                title={system.isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                {system.isFavorited ? "★" : "☆"}
              </button>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {system.name}
              </h3>
            </div>

            {system.description && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{system.description}</p>
            )}

            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.slice(0, 6).map((tag) => (
                  <span
                    key={`${system.id}-${tag}`}
                    className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => router.push(`/systems/${system.id}`)}
              className={`${
                ownerView ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-600 hover:bg-zinc-700"
              } rounded-lg text-white px-4 py-2 text-sm transition`}
            >
              {ownerView ? "Edit" : "View"}
            </button>
            {ownerView && (
              <button
                onClick={() => handleDeleteSystem(system.id)}
                className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={system._count.campaigns > 0}
                title={
                  system._count.campaigns > 0
                    ? "Cannot delete system used by campaigns"
                    : "Delete system"
                }
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{system.isPublic ? "Public" : "Private"}</span>
            <span>
              {system._count.campaigns} campaign{system._count.campaigns !== 1 ? "s" : ""}
            </span>
            {!ownerView && <span>By {system.creator.name}</span>}
            <span>Created {formatDate(system.createdAt)}</span>
            <span>Updated {formatDate(system.updatedAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              TTRPG Systems
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Create and manage game systems for your campaigns
            </p>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="Search systems by title, description, or tags"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {favoriteSystems.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Favorites
            </h2>
            <div className="grid gap-4">
              {favoriteSystems.map((system) => (
                <SystemCard
                  key={`favorite-${system.id}`}
                  system={system}
                  ownerView={system.creator.id === session?.user.id}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Your Systems
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Create System
            </button>
          </div>
          {ownedSystems.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-zinc-600 dark:text-zinc-400">
                No systems found.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ownedSystems.map((system) => (
                <SystemCard key={system.id} system={system} ownerView />
              ))}
            </div>
          )}
        </div>

        {publicSystems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Public Systems
            </h2>
            <div className="grid gap-4">
              {publicSystems.map((system) => (
                <SystemCard key={system.id} system={system} ownerView={false} />
              ))}
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Create New System
              </h2>

              {error && (
                <div className="bg-red-100 dark:bg-red-950 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                  System Name *
                </label>
                <input
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded px-3 py-2"
                  placeholder="e.g., Dungeons & Dragons 5e"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                  Description
                </label>
                <textarea
                  value={systemDescription}
                  onChange={(e) => setSystemDescription(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded px-3 py-2"
                  rows={3}
                  placeholder="Brief description of the system"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    Make this system public (anyone can use it for campaigns)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSystemName("");
                    setSystemDescription("");
                    setIsPublic(false);
                    setError("");
                  }}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSystem}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create System
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
