"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface System {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
  _count: {
    campaigns: number;
  };
}

export default function SystemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [systemName, setSystemName] = useState("");
  const [systemDescription, setSystemDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

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
    } catch (error) {
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
    } catch (error) {
      alert("Failed to delete system");
    }
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

  const ownedSystems = session ? systems.filter((s) => s.creator.id === session.user.id) : [];
  const publicSystems = session ? systems.filter((s) => s.creator.id !== session.user.id) : [];

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              TTRPG Systems
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Create and manage game systems for your campaigns
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition dark:bg-white dark:text-black dark:hover:bg-zinc-100"
          >
            Create System
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Owned Systems */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Your Systems
          </h2>
          {ownedSystems.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-zinc-600 dark:text-zinc-400">
                No systems created yet. Create your first system to get started!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ownedSystems.map((system) => (
                <div
                  key={system.id}
                  className="rounded-lg border border-zinc-200 bg-white p-6 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          {system.name}
                        </h3>
                        {system.isPublic && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded dark:bg-green-900 dark:text-green-200">
                            Public
                          </span>
                        )}
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
                          {system._count.campaigns} campaign{system._count.campaigns !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {system.description && (
                        <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                          {system.description}
                        </p>
                      )}
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        Created {new Date(system.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/systems/${system.id}`)}
                        className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Public Systems */}
        {publicSystems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Public Systems
            </h2>
            <div className="grid gap-4">
              {publicSystems.map((system) => (
                <div
                  key={system.id}
                  className="rounded-lg border border-zinc-200 bg-white p-6 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          {system.name}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
                          {system._count.campaigns} campaign{system._count.campaigns !==1 ? "s" : ""}
                        </span>
                      </div>
                      {system.description && (
                        <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                          {system.description}
                        </p>
                      )}
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        By {system.creator.name} • Created{" "}
                        {new Date(system.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/systems/${system.id}`)}
                      className="rounded-lg bg-zinc-600 text-white px-4 py-2 text-sm hover:bg-zinc-700 transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create System Modal */}
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
