"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  diceSystem: any;
  characterCreationRules: any;
  npcCreationRules: any;
  monsterCreationRules: any;
  environmentCreationRules: any;
  races: any;
  classes: any;
  spells: any;
  weapons: any;
  armor: any;
  items: any;
  statBlocks: any;
  levelUpCriteria: any;
  levelUpEffects: any;
}

export default function SystemDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const systemId = params?.id as string;

  const [system, setSystem] = useState<System | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && systemId) {
      loadSystem();
    }
  }, [status, systemId, router]);

  async function loadSystem() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/systems/${systemId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("System not found");
        } else if (res.status === 403) {
          setError("You don't have access to this system");
        } else {
          throw new Error("Failed to load system");
        }
        return;
      }
      const data = await res.json();
      setSystem(data.system);
      setName(data.system.name);
      setDescription(data.system.description || "");
      setIsPublic(data.system.isPublic);
    } catch (err) {
      setError("Failed to load system. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBasicInfo() {
    if (!name.trim()) {
      setError("System name is required");
      return;
    }

    try {
      const res = await fetch(`/api/systems/${systemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          isPublic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSystem(data.system);
        setIsEditing(false);
        setError("");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update system");
      }
    } catch (err) {
      setError("Failed to update system");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="h-64 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !system) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
          <button
            onClick={() => router.push("/systems")}
            className="mt-4 rounded-lg bg-zinc-600 text-white px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Back to Systems
          </button>
        </div>
      </div>
    );
  }

  if (!system) {
    return null;
  }

  const isOwner = session && session.user ? session.user.id === system.creator.id : false;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {system.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                By {system.creator.name}
              </p>
              {system.isPublic && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded dark:bg-green-900 dark:text-green-200">
                  Public
                </span>
              )}
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
                {system._count.campaigns} campaign{system._count.campaigns !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push("/systems")}
            className="rounded-lg bg-zinc-600 text-white px-4 py-2 text-sm hover:bg-zinc-700 transition"
          >
            Back to Systems
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 mb-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Basic Information
            </h2>
            {isOwner && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    Make this system public
                  </span>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveBasicInfo}
                  className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setName(system.name);
                    setDescription(system.description || "");
                    setIsPublic(system.isPublic);
                    setError("");
                  }}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-zinc-600 dark:text-zinc-400">
                {system.description || "No description provided"}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Created {new Date(system.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Game Rules Section - Coming Soon */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Game Rules & Content
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <RuleSection title="Dice System" hasContent={!!system.diceSystem} isOwner={isOwner} />
            <RuleSection title="Stat Blocks" hasContent={!!system.statBlocks} isOwner={isOwner} />
            <RuleSection title="Character Creation" hasContent={!!system.characterCreationRules} isOwner={isOwner} />
            <RuleSection title="NPC Creation" hasContent={!!system.npcCreationRules} isOwner={isOwner} />
            <RuleSection title="Monster Creation" hasContent={!!system.monsterCreationRules} isOwner={isOwner} />
            <RuleSection title="Environment Creation" hasContent={!!system.environmentCreationRules} isOwner={isOwner} />
            <RuleSection title="Races" hasContent={!!system.races} isOwner={isOwner} />
            <RuleSection title="Classes" hasContent={!!system.classes} isOwner={isOwner} />
            <RuleSection title="Spells" hasContent={!!system.spells} isOwner={isOwner} />
            <RuleSection title="Weapons" hasContent={!!system.weapons} isOwner={isOwner} />
            <RuleSection title="Armor" hasContent={!!system.armor} isOwner={isOwner} />
            <RuleSection title="Items" hasContent={!!system.items} isOwner={isOwner} />
            <RuleSection title="Level Up Criteria" hasContent={!!system.levelUpCriteria} isOwner={isOwner} />
            <RuleSection title="Level Up Effects" hasContent={!!system.levelUpEffects} isOwner={isOwner} />
          </div>
          <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Coming Soon:</strong> Detailed system configuration wizards will be available in a future update.
              For now, you can manage the basic information above.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function RuleSection({ title, hasContent, isOwner }: { title: string; hasContent: boolean; isOwner: boolean }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
        <span
          className={`text-xs px-2 py-1 rounded ${
            hasContent
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {hasContent ? "Configured" : "Not set"}
        </span>
      </div>
    </div>
  );
}
