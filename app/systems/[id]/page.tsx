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

type BlockKey =
  | "diceSystem"
  | "statBlocks"
  | "characterCreationRules"
  | "npcCreationRules"
  | "monsterCreationRules"
  | "environmentCreationRules"
  | "races"
  | "classes"
  | "spells"
  | "weapons"
  | "armor"
  | "items"
  | "levelUpCriteria"
  | "levelUpEffects";

type WizardDraft = {
  title: string;
  summary: string;
  tags: string;
  dataJson: string;
};

const BLOCKS: Array<{
  key: BlockKey;
  label: string;
  template: unknown;
}> = [
  {
    key: "diceSystem",
    label: "Dice System",
    template: { types: ["d4", "d6", "d8", "d10", "d12", "d20"], default: "d20" },
  },
  {
    key: "statBlocks",
    label: "Stat Blocks",
    template: { stats: ["STR", "DEX", "CON", "INT", "WIS", "CHA"], min: 1, max: 20 },
  },
  {
    key: "characterCreationRules",
    label: "Character Creation",
    template: { startingLevel: 1, pointBuy: 27, allowFeatsAtLevel1: false },
  },
  {
    key: "npcCreationRules",
    label: "NPC Creation",
    template: { defaultDisposition: "neutral", generateBackground: true },
  },
  {
    key: "monsterCreationRules",
    label: "Monster Creation",
    template: { challengeRatings: ["1/4", "1/2", "1", "2", "3"], scaling: "linear" },
  },
  {
    key: "environmentCreationRules",
    label: "Environment Creation",
    template: { biomes: ["forest", "desert", "urban"], hazardsEnabled: true },
  },
  {
    key: "races",
    label: "Races",
    template: [{ name: "Human", bonuses: { any: 1 } }],
  },
  {
    key: "classes",
    label: "Classes",
    template: [{ name: "Fighter", hitDie: "d10", primaryStats: ["STR"] }],
  },
  {
    key: "spells",
    label: "Spells",
    template: [{ name: "Magic Missile", level: 1, school: "Evocation" }],
  },
  {
    key: "weapons",
    label: "Weapons",
    template: [{ name: "Longsword", damage: "1d8", type: "slashing" }],
  },
  {
    key: "armor",
    label: "Armor",
    template: [{ name: "Chain Mail", ac: 16, type: "heavy" }],
  },
  {
    key: "items",
    label: "Items",
    template: [{ name: "Potion of Healing", rarity: "common" }],
  },
  {
    key: "levelUpCriteria",
    label: "Level Up Criteria",
    template: { method: "xp", milestones: false },
  },
  {
    key: "levelUpEffects",
    label: "Level Up Effects",
    template: { hpIncrease: "classHitDie", proficiencyAt: [5, 9, 13, 17] },
  },
];

const BLOCK_HINTS: Record<BlockKey, string[]> = {
  diceSystem: [
    "Use `types` as an array (e.g. [\"d4\", \"d6\", \"d20\"]).",
    "Set `default` for the main roll die (e.g. \"d20\").",
    "Optional: include `criticalThreshold` for crit rules.",
  ],
  statBlocks: [
    "Use `stats` as an ordered array (e.g. [\"STR\", \"DEX\", \"CON\"]).",
    "Optional: set `min` and `max` value limits.",
    "Optional: include modifiers formula details in extra keys.",
  ],
  characterCreationRules: [
    "Include onboarding values like `startingLevel`.",
    "Add generation systems such as `pointBuy` or roll method.",
    "Use booleans for toggles (e.g. `allowFeatsAtLevel1`).",
  ],
  npcCreationRules: [
    "Set defaults such as `defaultDisposition`.",
    "Use booleans for generation options like `generateBackground`.",
    "Add any weighted tables under nested keys.",
  ],
  monsterCreationRules: [
    "Use `challengeRatings` as an array of allowed CR values.",
    "Include scaling rules under keys like `scaling`.",
    "Optional: separate boss/elite generation under nested objects.",
  ],
  environmentCreationRules: [
    "Use `biomes` as an array of supported environment types.",
    "Set toggles like `hazardsEnabled` for generation behavior.",
    "Optional: add weather or travel rule objects.",
  ],
  races: [
    "Use an array of race objects with `name`.",
    "Include stat bonuses in nested objects (e.g. `bonuses`).",
    "Optional: add traits/features arrays per race.",
  ],
  classes: [
    "Use an array of class objects with `name` and hit dice.",
    "Include progression info (features by level) in nested keys.",
    "Optional: add subclasses and prerequisites.",
  ],
  spells: [
    "Use an array with `name`, `level`, and `school`.",
    "Optional: add casting time/range/components fields.",
    "Keep level values consistent with your system scale.",
  ],
  weapons: [
    "Use an array with `name`, `damage`, and weapon `type`.",
    "Optional: include tags/properties (e.g. finesse, heavy).",
    "Optional: separate melee/ranged groups.",
  ],
  armor: [
    "Use an array with `name`, `ac`, and armor `type`.",
    "Optional: include strength requirements or stealth penalties.",
    "Keep AC schema consistent across armor entries.",
  ],
  items: [
    "Use an array with `name` and `rarity`.",
    "Optional: include category, weight, and value fields.",
    "Use nested effect objects for consumables/magic items.",
  ],
  levelUpCriteria: [
    "Define your progression method (e.g. `method`: xp/milestone).",
    "Include thresholds or milestone requirements.",
    "Optional: store table data in nested arrays.",
  ],
  levelUpEffects: [
    "Define what changes on level-up (HP, prof bonus, features).",
    "Use arrays for level milestones (e.g. proficiency increases).",
    "Optional: separate global vs class-specific effects.",
  ],
};

export default function SystemDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const systemId = params?.id as string;

  const [system, setSystem] = useState<System | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [savingWizard, setSavingWizard] = useState(false);
  const [wizardBlock, setWizardBlock] = useState<(typeof BLOCKS)[number] | null>(null);
  const [wizardDraft, setWizardDraft] = useState<WizardDraft>({
    title: "",
    summary: "",
    tags: "",
    dataJson: "",
  });

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

  function openWizard(block: (typeof BLOCKS)[number]) {
    if (!system) {
      return;
    }

    const currentValue = system[block.key];
    setWizardBlock(block);
    setWizardDraft(buildDraftFromValue(block.label, currentValue));
    setWizardStep(1);
    setWizardOpen(true);
    setError("");
    setSuccessMessage("");
  }

  function applyWizardPreset(mode: "blank" | "current" | "template") {
    if (!wizardBlock || !system) {
      return;
    }

    if (mode === "blank") {
      setWizardDraft({ title: wizardBlock.label, summary: "", tags: "", dataJson: "" });
    }

    if (mode === "current") {
      setWizardDraft(buildDraftFromValue(wizardBlock.label, system[wizardBlock.key]));
    }

    if (mode === "template") {
      setWizardDraft({
        title: wizardBlock.label,
        summary: `Starter template for ${wizardBlock.label.toLowerCase()}`,
        tags: "",
        dataJson: formatJson(wizardBlock.template),
      });
    }

    setWizardStep(2);
  }

  async function handleWizardSave() {
    if (!wizardBlock || !system) {
      return;
    }

    setError("");
    setSuccessMessage("");

    const parsedData = parseJsonOrNull(wizardBlock.label, wizardDraft.dataJson);
    if (parsedData.error) {
      setError(parsedData.error);
      setWizardStep(2);
      return;
    }

    const payloadValue =
      !wizardDraft.title.trim() &&
      !wizardDraft.summary.trim() &&
      !wizardDraft.tags.trim() &&
      parsedData.value === null
        ? null
        : {
            title: wizardDraft.title.trim() || null,
            summary: wizardDraft.summary.trim() || null,
            tags: wizardDraft.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            data: parsedData.value,
            updatedAt: new Date().toISOString(),
          };

    try {
      setSavingWizard(true);
      const res = await fetch(`/api/systems/${systemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [wizardBlock.key]: payloadValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || `Failed to update ${wizardBlock.label}`);
        return;
      }

      const data = await res.json();
      setSystem(data.system);
      setWizardOpen(false);
      setWizardBlock(null);
      setWizardStep(1);
      setSuccessMessage(`${wizardBlock.label} updated successfully.`);
    } catch {
      setError(`Failed to update ${wizardBlock.label}`);
    } finally {
      setSavingWizard(false);
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

        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
            {successMessage}
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

        {/* Game Rules Wizards */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Game Rules & Content
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Each block has a guided wizard to help you create friendly, structured configuration.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {BLOCKS.map((block) => (
              <RuleSection
                key={block.key}
                title={block.label}
                hasContent={Boolean(system[block.key])}
                value={system[block.key]}
                isOwner={isOwner}
                onConfigure={() => openWizard(block)}
              />
            ))}
          </div>
        </div>

        {wizardOpen && wizardBlock && (
          <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {wizardBlock.label} Wizard
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Step {wizardStep} of 3
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWizardOpen(false);
                    setWizardBlock(null);
                    setWizardStep(1);
                  }}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Close
                </button>
              </div>

              {wizardStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    Choose how to start this block:
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <button
                      onClick={() => applyWizardPreset("blank")}
                      className="rounded-lg border border-zinc-300 px-3 py-3 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Start Blank
                    </button>
                    <button
                      onClick={() => applyWizardPreset("current")}
                      className="rounded-lg border border-zinc-300 px-3 py-3 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Use Current
                    </button>
                    <button
                      onClick={() => applyWizardPreset("template")}
                      className="rounded-lg border border-zinc-300 px-3 py-3 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Starter Template
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                      Title
                    </label>
                    <input
                      value={wizardDraft.title}
                      onChange={(e) => setWizardDraft((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                      Summary
                    </label>
                    <textarea
                      value={wizardDraft.summary}
                      onChange={(e) => setWizardDraft((prev) => ({ ...prev, summary: e.target.value }))}
                      rows={3}
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                      Tags (comma-separated)
                    </label>
                    <input
                      value={wizardDraft.tags}
                      onChange={(e) => setWizardDraft((prev) => ({ ...prev, tags: e.target.value }))}
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                      Structured Data (JSON)
                    </label>
                    <div className="mb-2 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                      <p className="font-semibold mb-1">Hints for {wizardBlock.label}</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {BLOCK_HINTS[wizardBlock.key].map((hint) => (
                          <li key={hint}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                    <textarea
                      value={wizardDraft.dataJson}
                      onChange={(e) => setWizardDraft((prev) => ({ ...prev, dataJson: e.target.value }))}
                      rows={10}
                      placeholder='Example: {"key": "value"}'
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Preview</p>
                    <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">
                      <strong>Title:</strong> {wizardDraft.title || "(none)"}
                    </p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
                      <strong>Summary:</strong> {wizardDraft.summary || "(none)"}
                    </p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
                      <strong>Tags:</strong> {wizardDraft.tags || "(none)"}
                    </p>
                    <pre className="mt-3 overflow-x-auto rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-900 dark:text-zinc-100">
{wizardDraft.dataJson.trim() || "(no structured data)"}
                    </pre>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleWizardSave}
                      disabled={savingWizard}
                      className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingWizard ? "Saving..." : "Save Block"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function parseJsonOrNull(sectionLabel: string, input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { value: null, error: null as string | null };
  }

  try {
    return { value: JSON.parse(trimmed), error: null as string | null };
  } catch {
    return {
      value: null,
      error: `${sectionLabel} contains invalid JSON.`,
    };
  }
}

function buildDraftFromValue(defaultTitle: string, value: unknown): WizardDraft {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("title" in value || "summary" in value || "tags" in value || "data" in value)
  ) {
    const obj = value as {
      title?: string | null;
      summary?: string | null;
      tags?: string[];
      data?: unknown;
    };

    return {
      title: obj.title || defaultTitle,
      summary: obj.summary || "",
      tags: Array.isArray(obj.tags) ? obj.tags.join(", ") : "",
      dataJson: formatJson(obj.data),
    };
  }

  if (value === null || value === undefined) {
    return {
      title: defaultTitle,
      summary: "",
      tags: "",
      dataJson: "",
    };
  }

  return {
    title: defaultTitle,
    summary: "",
    tags: "",
    dataJson: formatJson(value),
  };
}

function RuleSection({
  title,
  hasContent,
  value,
  isOwner,
  onConfigure,
}: {
  title: string;
  hasContent: boolean;
  value: unknown;
  isOwner: boolean;
  onConfigure: () => void;
}) {
  const preview = getBlockPreview(value);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
          <span
            className={`mt-2 inline-block text-xs px-2 py-1 rounded ${
              hasContent
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {hasContent ? "Configured" : "Not set"}
          </span>
        </div>
        <button
          onClick={onConfigure}
          disabled={!isOwner}
          className="rounded-lg bg-blue-600 text-white px-3 py-2 text-xs hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isOwner ? "Run Wizard" : "View Only"}
        </button>
      </div>

      {hasContent && preview && (
        <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {preview.title && (
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {preview.title}
            </p>
          )}
          {preview.summary && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{preview.summary}</p>
          )}
          {preview.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {preview.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {preview.dataSnippet && (
            <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[10px] text-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
{preview.dataSnippet}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function getBlockPreview(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as {
      title?: unknown;
      summary?: unknown;
      tags?: unknown;
      data?: unknown;
    };

    const title = typeof obj.title === "string" ? obj.title : "";
    const summary = typeof obj.summary === "string" ? obj.summary : "";
    const tags = Array.isArray(obj.tags)
      ? obj.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
    const dataSource = "data" in obj ? obj.data : value;
    const dataSnippet = toCompactJsonSnippet(dataSource);

    return { title, summary, tags, dataSnippet };
  }

  return {
    title: "",
    summary: "",
    tags: [] as string[],
    dataSnippet: toCompactJsonSnippet(value),
  };
}

function toCompactJsonSnippet(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  try {
    const json = JSON.stringify(value, null, 2);
    const lines = json.split("\n");
    const previewLines = lines.slice(0, 6);
    return lines.length > 6 ? `${previewLines.join("\n")}\n...` : json;
  } catch {
    return "";
  }
}
