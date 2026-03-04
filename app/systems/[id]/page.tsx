"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface System {
  id: string;
  name: string;
  description: string | null;
  tags: unknown;
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
  skills: any;
  backgrounds: any;
  currencies: any;
  features: any;
  featuresClass: any;
  featuresRace: any;
  tools: any;
  magicApplications: any;
  spells: any;
  weapons: any;
  armor: any;
  items: any;
  crossSystemDefinitions: any;
  statBlocks: any;
  levelUpCriteria: any;
}

type BlockKey =
  | "diceSystem"
  | "statBlocks"
  | "skills"
  | "characterCreationRules"
  | "npcCreationRules"
  | "monsterCreationRules"
  | "environmentCreationRules"
  | "races"
  | "classes"
  | "backgrounds"
  | "currencies"
  | "features"
  | "featuresClass"
  | "featuresRace"
  | "tools"
  | "magicApplications"
  | "spells"
  | "weapons"
  | "armor"
  | "items"
  | "levelUpCriteria"
  | "crossSystemDefinitions";

type WizardDraft = {
  title: string;
  summary: string;
  tags: string;
};

type FieldType = "text" | "number" | "boolean" | "textArray" | "json" | "select";

type BuilderField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
};

type BuilderConfig = {
  mode: "object" | "list";
  itemLabel?: string;
  fields: BuilderField[];
};

type DiceBuilderState = {
  diceTypes: string[];
  defaultDie: string;
  coinFlip: boolean;
  criticalThreshold: string;
  newDieInput: string;
};

type AttributeDefinitionRow = {
  id: string;
  name: string;
  shorthand: string;
};

type AttributeModifierBuilderState = {
  baseScore: string;
  baseModifier: string;
  pointsPerModifier: string;
};

type SkillCalculationMode = "defaultDice" | "customDice" | "numeric";

type SkillDefinitionRow = {
  id: string;
  name: string;
  attribute: string;
  calculationMode: SkillCalculationMode;
  customDice: string;
  numericBase: string;
};

type CurrencyDefinitionRow = {
  id: string;
  name: string;
  short: string;
};

type CurrencyConversionRow = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  ratio: string;
};

type EquipmentKeywordRow = {
  id: string;
  name: string;
  effect: string;
  attribute: string;
  additionalDamageProfile: boolean;
  proficiency: boolean;
  modifier: boolean;
  modifierTarget: string;
  modifierValue: string;
};

type EquipmentItemRow = {
  id: string;
  name: string;
  attribute: string;
  andAttributes: string[];
  orAttributes: string[];
  armorValue: string;
  dodgeValue: string;
  damageDiceCount: string;
  damageDie: string;
  damageFlat: string;
  additionalDamageDiceCount: string;
  additionalDamageDie: string;
  rangeMin: string;
  rangeMax: string;
  keywords: string[];
};

type ClassResourceType =
  | "currency"
  | "featureClass"
  | "featureChoice"
  | "statBonus"
  | "resistance"
  | "item"
  | "languages"
  | "proficiencyStat"
  | "proficiencySkill"
  | "proficiencyStatPlus"
  | "proficiencyWeapon"
  | "proficiencyArmor"
  | "proficiencyTool";

type ClassResourceFormRow = {
  id: string;
  type: ClassResourceType;
  label: string;
  definition: string;
  amount: string;
};

type ClassLevelForm = {
  id: string;
  level: number;
  resources: ClassResourceFormRow[];
};

type ClassFormState = {
  name: string;
  hitDie: string;
  hitPointsAtFirstLevel: string;
  hitPointsModifierStat: string;
  skillProficiencyOptions: string[];
  skillProficiencyChoices: string;
  resources: ClassResourceFormRow[];
  levels: ClassLevelForm[];
};

const BLOCKS: Array<{
  key: BlockKey;
  label: string;
  template: unknown;
}> = [
  {
    key: "diceSystem",
    label: "Dice",
    template: { types: ["d4", "d6", "d8", "d10", "d12", "d20"], default: "d20", coinFlip: true },
  },
  {
    key: "statBlocks",
    label: "Attributes",
    template: {
      attributes: [
        { name: "Strength", shorthand: "STR" },
        { name: "Dexterity", shorthand: "DEX" },
      ],
      modifiers: {
        type: "linear",
        baseScore: 8,
        baseModifier: -1,
        pointsPerModifier: 2,
      },
    },
  },
  {
    key: "skills",
    label: "Skills",
    template: [
      {
        name: "Acrobatics",
        attribute: "STR",
        calculation: {
          mode: "defaultDice",
        },
      },
    ],
  },
  {
    key: "currencies",
    label: "Currencies",
    template: [{ name: "Gold", short: "gp" }, { name: "Silver", short: "sp" }],
  },
  {
    key: "tools",
    label: "Tools",
    template: [
      { name: "Thieves' Tools", attribute: "DEX" },
      { name: "Alchemy Kit", attribute: "INT" },
    ],
  },
  {
    key: "weapons",
    label: "Weapons",
    template: {
      keywords: [],
      items: [{ name: "Longsword", damage: { times: 1, die: "d8" }, attribute: "STR", keywords: ["Martial"] }],
    },
  },
  {
    key: "armor",
    label: "Armor",
    template: {
      keywords: [],
      items: [{ name: "Chain Mail", armorValue: "16", attribute: "STR", keywords: ["Loud"] }],
    },
  },
  {
    key: "items",
    label: "Items",
    template: [{ name: "Potion of Healing" }],
  },
  {
    key: "characterCreationRules",
    label: "Character Creation",
    template: {
      nameFieldType: "openText",
      pronounsFieldType: "openText",
      alignmentFieldType: "openText",
      classSource: "system.classes",
      backgroundSource: "system.backgrounds",
      resourcesSource: {
        mode: "merge",
        from: ["backgrounds.resources", "classes.resources"],
      },
    },
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
    template: [{ name: "Fighter", hitDie: "d10", primaryStats: ["STR"], resources: { stamina: 2 } }],
  },
  {
    key: "backgrounds",
    label: "Backgrounds",
    template: [{ name: "Soldier", description: "Trained combatant", resources: { gold: 10, rations: 3 } }],
  },
  {
    key: "features",
    label: "Features",
    template: [{ name: "Darkvision", summary: "See in dim light" }],
  },
  {
    key: "featuresClass",
    label: "Features (Class)",
    template: [{ name: "Second Wind", summary: "Regain HP once per short rest" }],
  },
  {
    key: "featuresRace",
    label: "Features (Race)",
    template: [{ name: "Darkvision", summary: "See in dim light" }],
  },
  {
    key: "magicApplications",
    label: "Magic (Application)",
    template: [{ name: "Fire Bolt", application: "Damage", summary: "Single-target ranged damage" }],
  },
  {
    key: "spells",
    label: "Magic (School)",
    template: [{ name: "Magic Missile", level: 1, school: "Evocation" }],
  },
  {
    key: "levelUpCriteria",
    label: "Level Up Criteria",
    template: { method: "xp", milestones: false },
  },
  {
    key: "crossSystemDefinitions",
    label: "Cross System Definitions",
    template: { tags: ["Fantasy", "d20"], notes: "Compatibility and conversion rules" },
  },
];

const BLOCK_HINTS: Record<BlockKey, string[]> = {
  diceSystem: [
    "Use `types` as an array (e.g. [\"d4\", \"d6\", \"d20\"]).",
    "Set `default` for the main roll die (e.g. \"d20\").",
    "Optional: include `criticalThreshold` for crit rules.",
    "Optional: include `coinFlip` for binary checks (true/false).",
  ],
  statBlocks: [
    "Add attributes with full names and optional shorthand (e.g. Strength / STR).",
    "Define linear modifier rules (base score, base modifier, points per +1).",
    "Example: base 10, modifier 0, every 2 points = +1 modifier.",
  ],
  skills: [
    "Add each skill with a name and linked attribute (e.g. Acrobatics -> STR).",
    "Choose calculation mode: Default Dice, Custom Dice, or Numeric.",
    "Examples: DefaultDice+STR, d4+STR, 2+STR.",
    "These skills are used by class proficiency resources and level-up grants.",
  ],
  characterCreationRules: [
    "Use open-text fields for name, pronouns, and alignment.",
    "Set `classSource` to use your system classes.",
    "Set `backgroundSource` to use your new backgrounds block.",
    "Set `resourcesSource` to merge background and class resources.",
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
    "Optional: include `resources` object for character setup.",
  ],
  backgrounds: [
    "Use an array of background objects with `name`.",
    "Include `description` for narrative context.",
    "Use `resources` object for starting inventory/currency/etc.",
  ],
  currencies: [
    "Use an array with `name` and optional short code (e.g. gp).",
    "Classes can reference these currencies in Additional Resources.",
  ],
  features: [
    "Use an array with `name` and optional summary.",
    "Classes can reference these entries directly.",
  ],
  featuresClass: [
    "Use an array with class feature definitions (`name`, optional summary).",
    "Use this for reusable class-only feature catalog entries.",
  ],
  featuresRace: [
    "Use an array with race feature definitions (`name`, optional summary).",
    "Use this for reusable race-only feature catalog entries.",
  ],
  tools: [
    "Use an array with `name` and optional `attribute`.",
    "Each tool is a one-off proficiency target.",
    "Optional: add `attribute` to tie tool checks to a stat modifier.",
    "Examples: Thieves' Tools (DEX), Alchemy Kit (INT).",
  ],
  magicApplications: [
    "Use an array with `name`, `application`, and optional summary.",
    "Applications can describe intent such as damage, healing, utility, or control.",
  ],
  spells: [
    "Use an array with `name`, `level`, and `school`.",
    "Optional: add casting time/range/components fields.",
    "This block represents magic categorized by school.",
  ],
  weapons: [
    "Step 1: define keywords with effects and optional attribute overrides.",
    "Examples: Slashing, Martial, Finesse, Versatile.",
    "Step 2: define weapons with damage (amount + die from Dice block), range, and keywords.",
    "Use additional attributes as AND or OR modifier options.",
    "Use keywords to apply effects and proficiency grouping.",
  ],
  armor: [
    "Step 1: define keywords with effects and optional attribute overrides.",
    "Examples: Loud, Stalwart, Flexible.",
    "Step 2: define armor with optional armor/dodge values and keywords.",
    "Use additional attributes as AND or OR modifier options.",
    "Use keywords to apply effects and proficiency grouping.",
  ],
  items: [
    "Use an array with `name` and optional `attribute`.",
    "Each item can be configured as a one-off definition.",
    "Optional: add `attribute` to tie item checks to a stat modifier.",
    "Example: Potion of Healing.",
  ],
  levelUpCriteria: [
    "Define your progression method (e.g. `method`: xp/milestone).",
    "Include thresholds or milestone requirements.",
    "Optional: store table data in nested arrays.",
  ],
  crossSystemDefinitions: [
    "Store shared terms, tags, and compatibility notes used across blocks.",
    "Use structured key/value data for import or conversion definitions.",
  ],
};

const BLOCK_BUILDERS: Record<BlockKey, BuilderConfig> = {
  diceSystem: {
    mode: "object",
    fields: [],
  },
  statBlocks: {
    mode: "object",
    fields: [],
  },
  skills: {
    mode: "list",
    itemLabel: "Skill",
    fields: [],
  },
  characterCreationRules: {
    mode: "object",
    fields: [
      { key: "nameFieldType", label: "Name Field", type: "select", options: ["openText"] },
      { key: "pronounsFieldType", label: "Pronouns Field", type: "select", options: ["openText"] },
      { key: "alignmentFieldType", label: "Alignment Field", type: "select", options: ["openText"] },
      { key: "classSource", label: "Class Source", type: "select", options: ["system.classes"] },
      { key: "backgroundSource", label: "Background Source", type: "select", options: ["system.backgrounds"] },
      { key: "resourcesSource", label: "Resources Source", type: "json", placeholder: "mode: merge\nfrom: backgrounds.resources, classes.resources" },
    ],
  },
  npcCreationRules: {
    mode: "object",
    fields: [
      { key: "defaultDisposition", label: "Default Disposition", type: "text", placeholder: "neutral" },
      { key: "generateBackground", label: "Generate Background", type: "boolean" },
    ],
  },
  monsterCreationRules: {
    mode: "object",
    fields: [
      { key: "challengeRatings", label: "Challenge Ratings", type: "textArray", placeholder: "1/4, 1/2, 1, 2, 3" },
      { key: "scaling", label: "Scaling", type: "text", placeholder: "linear" },
    ],
  },
  environmentCreationRules: {
    mode: "object",
    fields: [
      { key: "biomes", label: "Biomes", type: "textArray", placeholder: "forest, desert, urban" },
      { key: "hazardsEnabled", label: "Hazards Enabled", type: "boolean" },
    ],
  },
  races: {
    mode: "list",
    itemLabel: "Race",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Human" },
      { key: "bonuses", label: "Bonuses", type: "json", placeholder: "One per line: key: value" },
    ],
  },
  classes: {
    mode: "list",
    itemLabel: "Class",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Fighter" },
      { key: "hitDie", label: "Hit Die", type: "text", placeholder: "d10" },
      { key: "primaryStats", label: "Primary Stats", type: "textArray", placeholder: "STR" },
      { key: "resources", label: "Resources", type: "json", placeholder: "One per line: key: value" },
    ],
  },
  backgrounds: {
    mode: "list",
    itemLabel: "Background",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Soldier" },
      { key: "description", label: "Description", type: "text", placeholder: "Trained combatant" },
      { key: "resources", label: "Resources", type: "json", placeholder: "One per line: key: value" },
    ],
  },
  currencies: {
    mode: "list",
    itemLabel: "Currency",
    fields: [],
  },
  features: {
    mode: "list",
    itemLabel: "Feature",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Darkvision" },
      { key: "summary", label: "Summary", type: "text", placeholder: "See in dim light" },
    ],
  },
  featuresClass: {
    mode: "list",
    itemLabel: "Class Feature",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Second Wind" },
      { key: "summary", label: "Summary", type: "text", placeholder: "Regain HP once per short rest" },
    ],
  },
  featuresRace: {
    mode: "list",
    itemLabel: "Race Feature",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Darkvision" },
      { key: "summary", label: "Summary", type: "text", placeholder: "See in dim light" },
    ],
  },
  tools: {
    mode: "list",
    itemLabel: "Tool",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Thieves' Tools" },
      { key: "attribute", label: "Attribute (optional)", type: "text", placeholder: "DEX" },
    ],
  },
  magicApplications: {
    mode: "list",
    itemLabel: "Magic Application",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Fire Bolt" },
      { key: "application", label: "Application", type: "text", placeholder: "Damage" },
      { key: "summary", label: "Summary", type: "text", placeholder: "Single-target ranged damage" },
    ],
  },
  spells: {
    mode: "list",
    itemLabel: "Magic",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Magic Missile" },
      { key: "level", label: "Level", type: "number", placeholder: "1" },
      { key: "school", label: "School", type: "text", placeholder: "Evocation" },
    ],
  },
  weapons: {
    mode: "list",
    itemLabel: "Weapon",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Longsword" },
      { key: "attribute", label: "Attribute (optional)", type: "text", placeholder: "STR" },
    ],
  },
  armor: {
    mode: "list",
    itemLabel: "Armor",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Chain Mail" },
      { key: "attribute", label: "Attribute (optional)", type: "text", placeholder: "STR" },
    ],
  },
  items: {
    mode: "list",
    itemLabel: "Item",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "Potion of Healing" },
      { key: "attribute", label: "Attribute (optional)", type: "text", placeholder: "INT" },
    ],
  },
  levelUpCriteria: {
    mode: "object",
    fields: [
      { key: "method", label: "Method", type: "text", placeholder: "xp" },
      { key: "milestones", label: "Milestones", type: "boolean" },
    ],
  },
  crossSystemDefinitions: {
    mode: "object",
    fields: [
      { key: "tags", label: "Tags", type: "textArray", placeholder: "Fantasy, d20" },
      { key: "notes", label: "Notes", type: "text", placeholder: "Compatibility and conversion rules" },
    ],
  },
};

const CLASS_RESOURCE_OPTIONS: Array<{ value: ClassResourceType; label: string }> = [
  { value: "currency", label: "Currency" },
  { value: "featureClass", label: "Features (Class)" },
  { value: "featureChoice", label: "Features" },
  { value: "statBonus", label: "Stat Bonus" },
  { value: "resistance", label: "Resistances" },
  { value: "item", label: "Item" },
  { value: "languages", label: "Languages" },
  { value: "proficiencyStat", label: "Proficiency (Stats)" },
  { value: "proficiencySkill", label: "Proficiency (Skills)" },
  { value: "proficiencyStatPlus", label: "Proficiency (Ex)" },
  { value: "proficiencyWeapon", label: "Proficiency (Weapons)" },
  { value: "proficiencyArmor", label: "Proficiency (Armor)" },
  { value: "proficiencyTool", label: "Proficiency (Tools)" },
];

const DISCOVERABILITY_TAG_SUGGESTIONS = [
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Narrative",
  "Crunchy",
  "Rules-Light",
  "Solo-Friendly",
  "Campaign",
  "One-Shot",
  "Beginner-Friendly",
];

function parseSystemTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry, index, list) => list.findIndex((candidate) => candidate.toLowerCase() === entry.toLowerCase()) === index);
}

function isDiceStyleBlock(key: BlockKey) {
  return (
    key === "diceSystem" ||
    key === "statBlocks" ||
    key === "skills" ||
    key === "currencies" ||
    key === "tools" ||
    key === "weapons" ||
    key === "armor" ||
    key === "items"
  );
}

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
  const [wizardObjectValues, setWizardObjectValues] = useState<Record<string, string>>({});
  const [wizardListItems, setWizardListItems] = useState<Array<Record<string, string>>>([]);
  const [diceBuilder, setDiceBuilder] = useState<DiceBuilderState>({
    diceTypes: [],
    defaultDie: "",
    coinFlip: false,
    criticalThreshold: "",
    newDieInput: "",
  });
  const [attributeRows, setAttributeRows] = useState<AttributeDefinitionRow[]>([]);
  const [attributeModifierBuilder, setAttributeModifierBuilder] = useState<AttributeModifierBuilderState>({
    baseScore: "8",
    baseModifier: "-1",
    pointsPerModifier: "2",
  });
  const [skillRows, setSkillRows] = useState<SkillDefinitionRow[]>([]);
  const [currencyRows, setCurrencyRows] = useState<CurrencyDefinitionRow[]>([]);
  const [currencyConversionRows, setCurrencyConversionRows] = useState<CurrencyConversionRow[]>([]);
  const [weaponKeywordRows, setWeaponKeywordRows] = useState<EquipmentKeywordRow[]>([]);
  const [weaponItemRows, setWeaponItemRows] = useState<EquipmentItemRow[]>([]);
  const [armorKeywordRows, setArmorKeywordRows] = useState<EquipmentKeywordRow[]>([]);
  const [armorItemRows, setArmorItemRows] = useState<EquipmentItemRow[]>([]);
  const [wizardDraft, setWizardDraft] = useState<WizardDraft>({
    title: "",
    summary: "",
    tags: "",
  });
  const [classWizardOpen, setClassWizardOpen] = useState(false);
  const [editingClassIndex, setEditingClassIndex] = useState<number | null>(null);
  const [savingClassWizard, setSavingClassWizard] = useState(false);
  const [classForm, setClassForm] = useState<ClassFormState>(createEmptyClassForm());
  const [classSkillOptionInput, setClassSkillOptionInput] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
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
      setTagsInput(parseSystemTags(data.system.tags).join(", "));
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

    const parsedTags = parseTagsInput(tagsInput);

    try {
      const res = await fetch(`/api/systems/${systemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          tags: parsedTags,
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
    const useDefaultTemplate = isDiceStyleBlock(block.key) && (currentValue === null || currentValue === undefined);
    const sourceValue = useDefaultTemplate ? block.template : currentValue;
    setWizardBlock(block);
    const initialDraft = buildDraftFromValue(block.label, sourceValue);
    setWizardDraft(
      isDiceStyleBlock(block.key)
        ? {
            ...initialDraft,
            title: "",
            summary: initialDraft.summary,
          }
        : initialDraft
    );
    const initialBuilder = buildBuilderStateFromValue(block.key, sourceValue);
    setWizardObjectValues(initialBuilder.objectValues);
    setWizardListItems(initialBuilder.listItems);
    setDiceBuilder(buildDiceBuilderFromValue(sourceValue));
    const initialAttributes = buildAttributeBuilderFromValue(sourceValue);
    setAttributeRows(initialAttributes.rows);
    setAttributeModifierBuilder(initialAttributes.modifiers);
    setSkillRows(buildSkillBuilderFromValue(sourceValue));
    const initialCurrencies = buildCurrencyBuilderFromValue(sourceValue);
    setCurrencyRows(initialCurrencies.rows);
    setCurrencyConversionRows(initialCurrencies.conversions);
    const initialWeapons = buildEquipmentBuilderFromValue(sourceValue);
    setWeaponKeywordRows(block.key === "weapons" ? initialWeapons.keywords : []);
    setWeaponItemRows(block.key === "weapons" ? initialWeapons.items : []);
    const initialArmor = buildEquipmentBuilderFromValue(sourceValue);
    setArmorKeywordRows(block.key === "armor" ? initialArmor.keywords : []);
    setArmorItemRows(block.key === "armor" ? initialArmor.items : []);
    setWizardStep(isDiceStyleBlock(block.key) ? 2 : 1);
    setWizardOpen(true);
    setError("");
    setSuccessMessage("");
  }

  async function handleDeleteWizardBlock() {
    if (!wizardBlock || !system) {
      return;
    }

    const shouldDelete = window.confirm(`Delete ${wizardBlock.label} configuration?`);
    if (!shouldDelete) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      setSavingWizard(true);
      const res = await fetch(`/api/systems/${systemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [wizardBlock.key]: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || `Failed to delete ${wizardBlock.label}`);
        return;
      }

      const data = await res.json();
      setSystem(data.system);
      setWizardOpen(false);
      setWizardBlock(null);
      setWizardStep(1);
      setSuccessMessage(`${wizardBlock.label} deleted successfully.`);
    } catch {
      setError(`Failed to delete ${wizardBlock.label}`);
    } finally {
      setSavingWizard(false);
    }
  }

  function applyWizardPreset(mode: "blank" | "current" | "template") {
    if (!wizardBlock || !system) {
      return;
    }

    if (mode === "blank") {
      setWizardDraft({ title: wizardBlock.label, summary: "", tags: "" });
      const blankBuilder = buildBuilderStateFromValue(wizardBlock.key, null);
      setWizardObjectValues(blankBuilder.objectValues);
      setWizardListItems(blankBuilder.listItems);
      setDiceBuilder(buildDiceBuilderFromValue(null));
      const blankAttributes = buildAttributeBuilderFromValue(null);
      setAttributeRows(blankAttributes.rows);
      setAttributeModifierBuilder(blankAttributes.modifiers);
      setSkillRows(buildSkillBuilderFromValue(null));
      const blankCurrencies = buildCurrencyBuilderFromValue(null);
      setCurrencyRows(blankCurrencies.rows);
      setCurrencyConversionRows(blankCurrencies.conversions);
      const blankEquipment = buildEquipmentBuilderFromValue(null);
      setWeaponKeywordRows(wizardBlock.key === "weapons" ? blankEquipment.keywords : []);
      setWeaponItemRows(wizardBlock.key === "weapons" ? blankEquipment.items : []);
      setArmorKeywordRows(wizardBlock.key === "armor" ? blankEquipment.keywords : []);
      setArmorItemRows(wizardBlock.key === "armor" ? blankEquipment.items : []);
    }

    if (mode === "current") {
      setWizardDraft(buildDraftFromValue(wizardBlock.label, system[wizardBlock.key]));
      const currentBuilder = buildBuilderStateFromValue(wizardBlock.key, system[wizardBlock.key]);
      setWizardObjectValues(currentBuilder.objectValues);
      setWizardListItems(currentBuilder.listItems);
      setDiceBuilder(buildDiceBuilderFromValue(system[wizardBlock.key]));
      const currentAttributes = buildAttributeBuilderFromValue(system[wizardBlock.key]);
      setAttributeRows(currentAttributes.rows);
      setAttributeModifierBuilder(currentAttributes.modifiers);
      setSkillRows(buildSkillBuilderFromValue(system[wizardBlock.key]));
      const currentCurrencies = buildCurrencyBuilderFromValue(system[wizardBlock.key]);
      setCurrencyRows(currentCurrencies.rows);
      setCurrencyConversionRows(currentCurrencies.conversions);
      const currentEquipment = buildEquipmentBuilderFromValue(system[wizardBlock.key]);
      setWeaponKeywordRows(wizardBlock.key === "weapons" ? currentEquipment.keywords : []);
      setWeaponItemRows(wizardBlock.key === "weapons" ? currentEquipment.items : []);
      setArmorKeywordRows(wizardBlock.key === "armor" ? currentEquipment.keywords : []);
      setArmorItemRows(wizardBlock.key === "armor" ? currentEquipment.items : []);
    }

    if (mode === "template") {
      setWizardDraft({
        title: wizardBlock.label,
        summary: `Starter template for ${wizardBlock.label.toLowerCase()}`,
        tags: "",
      });
      const templateBuilder = buildBuilderStateFromValue(wizardBlock.key, wizardBlock.template);
      setWizardObjectValues(templateBuilder.objectValues);
      setWizardListItems(templateBuilder.listItems);
      setDiceBuilder(buildDiceBuilderFromValue(wizardBlock.template));
      const templateAttributes = buildAttributeBuilderFromValue(wizardBlock.template);
      setAttributeRows(templateAttributes.rows);
      setAttributeModifierBuilder(templateAttributes.modifiers);
      setSkillRows(buildSkillBuilderFromValue(wizardBlock.template));
      const templateCurrencies = buildCurrencyBuilderFromValue(wizardBlock.template);
      setCurrencyRows(templateCurrencies.rows);
      setCurrencyConversionRows(templateCurrencies.conversions);
      const templateEquipment = buildEquipmentBuilderFromValue(wizardBlock.template);
      setWeaponKeywordRows(wizardBlock.key === "weapons" ? templateEquipment.keywords : []);
      setWeaponItemRows(wizardBlock.key === "weapons" ? templateEquipment.items : []);
      setArmorKeywordRows(wizardBlock.key === "armor" ? templateEquipment.keywords : []);
      setArmorItemRows(wizardBlock.key === "armor" ? templateEquipment.items : []);
    }

    setWizardStep(2);
  }

  function handleObjectFieldChange(key: string, value: string) {
    setWizardObjectValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddListItem() {
    if (!wizardBlock) {
      return;
    }

    const config = BLOCK_BUILDERS[wizardBlock.key];
    const emptyItem = Object.fromEntries(
      config.fields.map((field) => [field.key, field.type === "boolean" ? "false" : ""])
    );

    setWizardListItems((prev) => [...prev, emptyItem]);
  }

  function handleRemoveListItem(index: number) {
    setWizardListItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleListFieldChange(index: number, key: string, value: string) {
    setWizardListItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  }

  async function handleWizardSave() {
    if (!wizardBlock || !system) {
      return;
    }

    setError("");
    setSuccessMessage("");

    const parsedData =
      wizardBlock.key === "diceSystem"
        ? parseDiceBuilderToValue(diceBuilder)
        : wizardBlock.key === "statBlocks"
          ? parseAttributeBuilderToValue(attributeRows, attributeModifierBuilder)
          : wizardBlock.key === "skills"
            ? parseSkillBuilderToValue(skillRows)
            : wizardBlock.key === "currencies"
              ? parseCurrencyBuilderToValue(currencyRows, currencyConversionRows)
              : wizardBlock.key === "weapons"
                ? parseEquipmentBuilderToValue(weaponKeywordRows, weaponItemRows, "Weapon", damageDieOptions)
                : wizardBlock.key === "armor"
                  ? parseEquipmentBuilderToValue(armorKeywordRows, armorItemRows, "Armor", [])
        : parseBuilderToValue(wizardBlock.key, wizardObjectValues, wizardListItems);
    if (parsedData.error) {
      setError(parsedData.error);
      setWizardStep(
        ["currencies", "weapons", "armor"].includes(wizardBlock.key) && wizardStep === 3 ? 3 : 2
      );
      return;
    }

    const includeTitle = !isDiceStyleBlock(wizardBlock.key);
    const nextTitle = includeTitle ? wizardDraft.title.trim() : "";
    const nextSummary = wizardDraft.summary.trim();
    const nextTags = wizardDraft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payloadValue =
      !nextTitle &&
      !nextSummary &&
      nextTags.length === 0 &&
      parsedData.value === null
        ? null
        : {
            title: includeTitle ? (nextTitle || null) : null,
            summary: nextSummary || null,
            tags: nextTags,
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

  function openClassWizard(index: number | null) {
    if (!system) {
      return;
    }

    const classes = extractClassesList(system.classes);
    const existingClass = index !== null ? classes[index] : null;
    setClassForm(existingClass ? buildClassFormFromValue(existingClass, index ?? 0) : createEmptyClassForm());
    setClassSkillOptionInput("");
    setEditingClassIndex(index);
    setClassWizardOpen(true);
    setError("");
    setSuccessMessage("");
  }

  function addClassResourceRow() {
    setClassForm((prev) => ({
      ...prev,
      resources: [
        ...prev.resources,
        createEmptyClassResourceRow(),
      ],
    }));
  }

  function updateClassResourceRow(rowId: string, patch: Partial<ClassResourceFormRow>) {
    setClassForm((prev) => ({
      ...prev,
      resources: prev.resources.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    }));
  }

  function removeClassResourceRow(rowId: string) {
    setClassForm((prev) => ({
      ...prev,
      resources: prev.resources.filter((row) => row.id !== rowId),
    }));
  }

  function addClassSkillOption() {
    const skillName = classSkillOptionInput.trim();
    if (!skillName) {
      return;
    }

    setClassForm((prev) => {
      if (prev.skillProficiencyOptions.some((option) => option.toLowerCase() === skillName.toLowerCase())) {
        return prev;
      }

      return {
        ...prev,
        skillProficiencyOptions: [...prev.skillProficiencyOptions, skillName],
      };
    });
    setClassSkillOptionInput("");
  }

  function removeClassSkillOption(skillName: string) {
    setClassForm((prev) => ({
      ...prev,
      skillProficiencyOptions: prev.skillProficiencyOptions.filter((option) => option !== skillName),
    }));
  }

  function addClassLevel() {
    setClassForm((prev) => ({
      ...prev,
      levels: [...prev.levels, createEmptyClassLevel(getNextClassLevel(prev.levels))],
    }));
  }

  function removeClassLevel(levelId: string) {
    setClassForm((prev) => ({
      ...prev,
      levels: prev.levels.filter((level) => level.id !== levelId),
    }));
  }

  function addLevelResourceRow(levelId: string) {
    setClassForm((prev) => ({
      ...prev,
      levels: prev.levels.map((level) =>
        level.id === levelId
          ? { ...level, resources: [...level.resources, createEmptyClassResourceRow()] }
          : level
      ),
    }));
  }

  function updateLevelResourceRow(levelId: string, rowId: string, patch: Partial<ClassResourceFormRow>) {
    setClassForm((prev) => ({
      ...prev,
      levels: prev.levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              resources: level.resources.map((resource) =>
                resource.id === rowId ? { ...resource, ...patch } : resource
              ),
            }
          : level
      ),
    }));
  }

  function removeLevelResourceRow(levelId: string, rowId: string) {
    setClassForm((prev) => ({
      ...prev,
      levels: prev.levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              resources: level.resources.filter((resource) => resource.id !== rowId),
            }
          : level
      ),
    }));
  }

  async function handleSaveClassWizard() {
    if (!system) {
      return;
    }

    if (!classForm.name.trim()) {
      setError("Class name is required.");
      return;
    }

    const classValue = classFormToValue(classForm);
    if (classValue.error || !classValue.value) {
      setError(classValue.error || "Class name is required.");
      return;
    }

    const existingClasses = extractClassesList(system.classes);
    const nextClasses = [...existingClasses];
    if (editingClassIndex === null) {
      nextClasses.push(classValue.value);
    } else {
      nextClasses[editingClassIndex] = classValue.value;
    }

    const classesPayload = buildWrappedListPayload(system.classes, nextClasses, "Classes");

    try {
      setSavingClassWizard(true);
      const res = await fetch(`/api/systems/${systemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classes: classesPayload }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to save class.");
        return;
      }

      const data = await res.json();
      setSystem(data.system);
      setClassWizardOpen(false);
      setEditingClassIndex(null);
      setClassForm(createEmptyClassForm());
      setSuccessMessage(editingClassIndex === null ? "Class added successfully." : "Class updated successfully.");
    } catch {
      setError("Failed to save class.");
    } finally {
      setSavingClassWizard(false);
    }
  }

  async function handleDeleteClass(index: number) {
    if (!system) {
      return;
    }

    const existingClasses = extractClassesList(system.classes);
    if (index < 0 || index >= existingClasses.length) {
      return;
    }

    const target = existingClasses[index];
    const targetName = typeof target.name === "string" ? target.name : `Class ${index + 1}`;
    const shouldDelete = window.confirm(`Delete class "${targetName}"?`);
    if (!shouldDelete) {
      return;
    }

    const nextClasses = existingClasses.filter((_, classIndex) => classIndex !== index);
    const classesPayload = buildWrappedListPayload(system.classes, nextClasses, "Classes");

    try {
      const res = await fetch(`/api/systems/${systemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classes: classesPayload }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to delete class.");
        return;
      }

      const data = await res.json();
      setSystem(data.system);
      setSuccessMessage(`Deleted ${targetName}.`);
    } catch {
      setError("Failed to delete class.");
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
  const systemTags = parseSystemTags(system.tags);
  const selectedTags = parseTagsInput(tagsInput);
  const classResourceLabelOptions = buildClassResourceLabelOptions(system);
  const classPrimaryStatOptions = extractPrimaryStatNames(system.statBlocks);
  const classSkillOptions = extractSkillNames(system.skills);
  const configuredDice = buildDiceBuilderFromValue(system.diceSystem);
  const damageDieOptions = uniqueStrings([
    ...configuredDice.diceTypes,
    ...(configuredDice.coinFlip ? ["coinFlip"] : []),
    "flatDamage",
  ]);
  const currencyNameOptions = Array.from(
    new Set(
      currencyRows
        .map((currency) => currency.name.trim())
        .filter(Boolean)
    )
  );
  const weaponKeywordOptions = Array.from(
    new Set(
      weaponKeywordRows
        .map((keyword) => keyword.name.trim())
        .filter(Boolean)
    )
  );
  const armorKeywordOptions = Array.from(
    new Set(
      armorKeywordRows
        .map((keyword) => keyword.name.trim())
        .filter(Boolean)
    )
  );

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
                <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded px-3 py-2"
                  placeholder="Fantasy, Rules-Light, Campaign"
                />
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Suggested tags for discoverability:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DISCOVERABILITY_TAG_SUGGESTIONS.map((suggestedTag) => {
                    const isSelected = selectedTags.some((tag) => tag.toLowerCase() === suggestedTag.toLowerCase());

                    return (
                      <button
                        key={suggestedTag}
                        type="button"
                        onClick={() => {
                          const nextTags = isSelected
                            ? selectedTags.filter((tag) => tag.toLowerCase() !== suggestedTag.toLowerCase())
                            : [...selectedTags, suggestedTag];
                          setTagsInput(nextTags.join(", "));
                        }}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200"
                            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {suggestedTag}
                      </button>
                    );
                  })}
                </div>
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
                    setTagsInput(parseSystemTags(system.tags).join(", "));
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
              <div className="pt-1">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Tags</p>
                {systemTags.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {systemTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">No tags added.</p>
                )}
              </div>
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
            Each block has a system to help you create a friendly, structured configuration for your game. Please contact support if you have a specific mechanic you can not find a block for or if you want to suggest improvements to existing blocks.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {BLOCKS.map((block) => {
              if (block.key === "classes") {
                return (
                  <ClassesRuleSection
                    key={block.key}
                    value={system.classes}
                    isOwner={isOwner}
                    onAddClass={() => openClassWizard(null)}
                    onEditClass={(index) => openClassWizard(index)}
                    onDeleteClass={(index) => handleDeleteClass(index)}
                  />
                );
              }

              return (
                <RuleSection
                  key={block.key}
                  blockKey={block.key}
                  title={block.label}
                  hasContent={Boolean(system[block.key])}
                  value={system[block.key]}
                  isOwner={isOwner}
                  summaryOnly={isDiceStyleBlock(block.key)}
                  onConfigure={() => openWizard(block)}
                />
              );
            })}
          </div>
        </div>

        {classWizardOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 max-h-[90vh] overflow-y-auto my-auto">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {editingClassIndex === null ? "Add Class" : "Edit Class"}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Name is required. Other fields are optional unless marked *.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setClassWizardOpen(false);
                    setEditingClassIndex(null);
                  }}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Name *
                  </label>
                  <input
                    value={classForm.name}
                    onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="Fighter"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Hit Die
                    </label>
                    <input
                      value={classForm.hitDie}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, hitDie: e.target.value }))}
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="d10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Hit Points at 1st Level
                    </label>
                    <input
                      value={classForm.hitPointsAtFirstLevel}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, hitPointsAtFirstLevel: e.target.value }))}
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Hit Points Modifier (optional)
                  </label>
                  <select
                    value={classForm.hitPointsModifierStat}
                    onChange={(e) => setClassForm((prev) => ({ ...prev, hitPointsModifierStat: e.target.value }))}
                    className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">None</option>
                    {classPrimaryStatOptions.map((stat) => (
                      <option key={stat} value={stat}>
                        {stat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Skill Proficiency Options
                  </label>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Define starting class skill choices. Use Additional Resources for level-based skill proficiency gains.
                  </p>

                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <select
                      value={classSkillOptionInput}
                      onChange={(e) => setClassSkillOptionInput(e.target.value)}
                      className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="">Select a skill</option>
                      {classSkillOptions.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={addClassSkillOption}
                      className="rounded border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      + Add Skill
                    </button>
                  </div>

                  {classForm.skillProficiencyOptions.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {classForm.skillProficiencyOptions.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-2 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                        >
                          {skill}
                          <button
                            onClick={() => removeClassSkillOption(skill)}
                            className="text-red-700 dark:text-red-300"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">No skill options selected.</p>
                  )}

                  <div className="mt-3 max-w-[220px]">
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Player Can Choose *
                    </label>
                    <input
                      value={classForm.skillProficiencyChoices}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, skillProficiencyChoices: e.target.value }))}
                      className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      placeholder="2"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Additional Resources
                    </label>
                    <button
                      onClick={addClassResourceRow}
                      className="rounded border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      + Add Resource
                    </button>
                  </div>

                  <div className="space-y-2">
                    {classForm.resources.map((resource) => (
                      <div key={resource.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Type
                            </label>
                            <select
                              value={resource.type}
                              onChange={(e) =>
                                updateClassResourceRow(resource.id, {
                                  type: e.target.value as ClassResourceType,
                                  label: "",
                                  definition: "",
                                  amount: "",
                                })
                              }
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            >
                              {CLASS_RESOURCE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {classResourceUsesLabel(resource.type) ? (
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                Label {classResourceLabelRequired(resource.type) ? "*" : ""}
                              </label>
                              {classResourceLabelMode(resource.type) === "select" ? (
                                <select
                                  value={resource.label}
                                  onChange={(e) => updateClassResourceRow(resource.id, { label: e.target.value })}
                                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                >
                                  <option value="">
                                    {classResourceLabelOptions[resource.type].length > 0
                                      ? "Select option"
                                      : "No options configured yet"}
                                  </option>
                                  {classResourceLabelOptions[resource.type].map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={resource.label}
                                  onChange={(e) => updateClassResourceRow(resource.id, { label: e.target.value })}
                                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  placeholder={resource.type === "resistance" ? "e.g. Fire" : "Feature name"}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="rounded border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                              This type does not require a label.
                            </div>
                          )}
                        </div>

                        {resource.type === "featureClass" && (
                          <div className="mt-2">
                            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Definition *
                            </label>
                            <textarea
                              value={resource.definition}
                              onChange={(e) => updateClassResourceRow(resource.id, { definition: e.target.value })}
                              rows={2}
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                              placeholder="Describe this class feature"
                            />
                          </div>
                        )}

                        {classResourceUsesAmount(resource.type) && (
                          <div className="mt-2">
                            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Amount {classResourceAmountRequired(resource.type) ? "*" : "(optional)"}
                            </label>
                            <input
                              value={resource.amount}
                              onChange={(e) => updateClassResourceRow(resource.id, { amount: e.target.value })}
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                              placeholder={resource.type === "currency" ? "5" : resource.type === "resistance" ? "-2 or 2" : ""}
                            />
                          </div>
                        )}

                        <button
                          onClick={() => removeClassResourceRow(resource.id)}
                          className="mt-2 rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                        >
                          Remove Resource
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Level Progression (optional)
                    </label>
                    <button
                      onClick={addClassLevel}
                      className="rounded border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      + Add Level
                    </button>
                  </div>

                  <div className="space-y-3">
                    {classForm.levels.map((level) => (
                      <div key={level.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Level {level.level}</p>
                          <button
                            onClick={() => removeClassLevel(level.id)}
                            className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                          >
                            Remove Level
                          </button>
                        </div>

                        <button
                          onClick={() => addLevelResourceRow(level.id)}
                          className="mb-2 rounded border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          + Add Level Resource
                        </button>

                        <div className="space-y-2">
                          {level.resources.map((resource) => (
                            <div key={resource.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                              <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    Type
                                  </label>
                                  <select
                                    value={resource.type}
                                    onChange={(e) =>
                                      updateLevelResourceRow(level.id, resource.id, {
                                        type: e.target.value as ClassResourceType,
                                        label: "",
                                        definition: "",
                                        amount: "",
                                      })
                                    }
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  >
                                    {CLASS_RESOURCE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {classResourceUsesLabel(resource.type) ? (
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                      Label {classResourceLabelRequired(resource.type) ? "*" : ""}
                                    </label>
                                    {classResourceLabelMode(resource.type) === "select" ? (
                                      <select
                                        value={resource.label}
                                        onChange={(e) => updateLevelResourceRow(level.id, resource.id, { label: e.target.value })}
                                        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                      >
                                        <option value="">
                                          {classResourceLabelOptions[resource.type].length > 0
                                            ? "Select option"
                                            : "No options configured yet"}
                                        </option>
                                        {classResourceLabelOptions[resource.type].map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        value={resource.label}
                                        onChange={(e) => updateLevelResourceRow(level.id, resource.id, { label: e.target.value })}
                                        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                        placeholder={resource.type === "resistance" ? "e.g. Fire" : "Feature name"}
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div className="rounded border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                                    This type does not require a label.
                                  </div>
                                )}
                              </div>

                              {resource.type === "featureClass" && (
                                <div className="mt-2">
                                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    Definition *
                                  </label>
                                  <textarea
                                    value={resource.definition}
                                    onChange={(e) => updateLevelResourceRow(level.id, resource.id, { definition: e.target.value })}
                                    rows={2}
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                    placeholder="Describe this class feature"
                                  />
                                </div>
                              )}

                              {classResourceUsesAmount(resource.type) && (
                                <div className="mt-2">
                                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    Amount {classResourceAmountRequired(resource.type) ? "*" : "(optional)"}
                                  </label>
                                  <input
                                    value={resource.amount}
                                    onChange={(e) => updateLevelResourceRow(level.id, resource.id, { amount: e.target.value })}
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                    placeholder={resource.type === "currency" ? "5" : resource.type === "resistance" ? "-2 or 2" : ""}
                                  />
                                </div>
                              )}

                              <button
                                onClick={() => removeLevelResourceRow(level.id, resource.id)}
                                className="mt-2 rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                              >
                                Remove Level Resource
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setClassWizardOpen(false);
                      setEditingClassIndex(null);
                    }}
                    className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClassWizard}
                    disabled={savingClassWizard}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingClassWizard ? "Saving..." : editingClassIndex === null ? "Add Class" : "Save Class"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {wizardOpen && wizardBlock && (
          <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 max-h-[90vh] overflow-y-auto my-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {wizardBlock.label} Wizard
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {["currencies", "weapons", "armor"].includes(wizardBlock.key)
                      ? `Step ${wizardStep === 2 ? 1 : 2} of 2`
                      : isDiceStyleBlock(wizardBlock.key)
                        ? "Configure this block"
                        : `Step ${wizardStep} of 3`}
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

              {wizardStep === 1 && !isDiceStyleBlock(wizardBlock.key) && (
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
                  {!isDiceStyleBlock(wizardBlock.key) && (
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
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                      Summary
                    </label>
                    <textarea
                      value={wizardDraft.summary}
                      onChange={(e) => setWizardDraft((prev) => ({ ...prev, summary: e.target.value }))}
                      rows={3}
                      placeholder={
                        isDiceStyleBlock(wizardBlock.key)
                          ? "Describe how this block should behave."
                          : undefined
                      }
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
                      placeholder={
                        isDiceStyleBlock(wizardBlock.key)
                          ? "e.g. d20, critical hits, narrative, beginner-friendly"
                          : undefined
                      }
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                      Configuration
                    </label>
                    <div className="mb-2 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                      <p className="font-semibold mb-1">Hints for {wizardBlock.label}</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {BLOCK_HINTS[wizardBlock.key].map((hint) => (
                          <li key={hint}>{hint}</li>
                        ))}
                      </ul>
                    </div>

                    {wizardBlock.key === "diceSystem" ? (
                      <div className="space-y-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Dice Types
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {diceBuilder.diceTypes.map((die) => (
                              <span
                                key={die}
                                className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800"
                              >
                                {die}
                                <button
                                  onClick={() =>
                                    setDiceBuilder((prev) => {
                                      const nextTypes = prev.diceTypes.filter((value) => value !== die);
                                      return {
                                        ...prev,
                                        diceTypes: nextTypes,
                                        defaultDie: prev.defaultDie === die ? (nextTypes[0] || "") : prev.defaultDie,
                                      };
                                    })
                                  }
                                  className="text-zinc-500 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={diceBuilder.newDieInput}
                              onChange={(e) =>
                                setDiceBuilder((prev) => ({ ...prev, newDieInput: e.target.value }))
                              }
                              placeholder="e.g. d20"
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            />
                            <button
                              onClick={() => {
                                const nextDie = diceBuilder.newDieInput.trim().toLowerCase();
                                if (!nextDie) return;
                                setDiceBuilder((prev) => {
                                  if (prev.diceTypes.includes(nextDie)) {
                                    return { ...prev, newDieInput: "" };
                                  }
                                  const nextTypes = [...prev.diceTypes, nextDie];
                                  return {
                                    ...prev,
                                    diceTypes: nextTypes,
                                    defaultDie: prev.defaultDie || nextDie,
                                    newDieInput: "",
                                  };
                                });
                              }}
                              className="rounded bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                            >
                              Add Die
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Default Die
                          </label>
                          <select
                            value={diceBuilder.defaultDie}
                            onChange={(e) =>
                              setDiceBuilder((prev) => ({ ...prev, defaultDie: e.target.value }))
                            }
                            className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            <option value="">Select default die</option>
                            {diceBuilder.diceTypes.map((die) => (
                              <option key={die} value={die}>
                                {die}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            id="coinFlip"
                            type="checkbox"
                            checked={diceBuilder.coinFlip}
                            onChange={(e) =>
                              setDiceBuilder((prev) => ({ ...prev, coinFlip: e.target.checked }))
                            }
                          />
                          <label htmlFor="coinFlip" className="text-xs text-zinc-700 dark:text-zinc-300">
                            Enable Coin Flip
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Critical Threshold (optional)
                          </label>
                          <input
                            value={diceBuilder.criticalThreshold}
                            onChange={(e) =>
                              setDiceBuilder((prev) => ({ ...prev, criticalThreshold: e.target.value }))
                            }
                            placeholder="e.g. 20"
                            className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                      </div>
                    ) : wizardBlock.key === "statBlocks" ? (
                      <div className="space-y-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Attribute Types
                            </label>
                            <button
                              onClick={() => setAttributeRows((prev) => [...prev, createEmptyAttributeRow()])}
                              className="rounded border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                              + Add Attribute
                            </button>
                          </div>

                          {attributeRows.length === 0 ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Add at least one attribute (example: Strength / STR).
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {attributeRows.map((attribute) => (
                                <div key={attribute.id} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                                  <input
                                    value={attribute.name}
                                    onChange={(e) =>
                                      setAttributeRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === attribute.id ? { ...entry, name: e.target.value } : entry
                                        )
                                      )
                                    }
                                    placeholder="Attribute name (e.g. Strength)"
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                  <input
                                    value={attribute.shorthand}
                                    onChange={(e) =>
                                      setAttributeRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === attribute.id ? { ...entry, shorthand: e.target.value } : entry
                                        )
                                      )
                                    }
                                    placeholder="Shorthand (optional, e.g. STR)"
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                  <button
                                    onClick={() =>
                                      setAttributeRows((prev) => prev.filter((entry) => entry.id !== attribute.id))
                                    }
                                    className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Modifier Definitions
                          </label>
                          <div className="grid gap-2 md:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-[10px] uppercase text-zinc-500">Base Score</label>
                              <input
                                value={attributeModifierBuilder.baseScore}
                                onChange={(e) =>
                                  setAttributeModifierBuilder((prev) => ({ ...prev, baseScore: e.target.value }))
                                }
                                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                placeholder="10"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] uppercase text-zinc-500">Base Modifier</label>
                              <input
                                value={attributeModifierBuilder.baseModifier}
                                onChange={(e) =>
                                  setAttributeModifierBuilder((prev) => ({ ...prev, baseModifier: e.target.value }))
                                }
                                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] uppercase text-zinc-500">Points Per +1</label>
                              <input
                                value={attributeModifierBuilder.pointsPerModifier}
                                onChange={(e) =>
                                  setAttributeModifierBuilder((prev) => ({ ...prev, pointsPerModifier: e.target.value }))
                                }
                                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                placeholder="2"
                              />
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            Example: score 16 gives modifier {computeLinearModifierPreview(16, attributeModifierBuilder)}.
                          </p>
                        </div>
                      </div>
                    ) : wizardBlock.key === "skills" ? (
                      <div className="space-y-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Skill Definitions
                          </label>
                          <button
                            onClick={() => setSkillRows((prev) => [...prev, createEmptySkillRow()])}
                            className="rounded border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            + Add Skill
                          </button>
                        </div>

                        {skillRows.length === 0 ? (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Add at least one skill (example: Acrobatics linked to STR).
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {skillRows.map((skill) => (
                              <div key={skill.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                                <div className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                                  <input
                                    value={skill.name}
                                    onChange={(e) =>
                                      setSkillRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === skill.id ? { ...entry, name: e.target.value } : entry
                                        )
                                      )
                                    }
                                    placeholder="Skill name (e.g. Acrobatics)"
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                  <select
                                    value={skill.attribute}
                                    onChange={(e) =>
                                      setSkillRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === skill.id ? { ...entry, attribute: e.target.value } : entry
                                        )
                                      )
                                    }
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  >
                                    <option value="">
                                      {classPrimaryStatOptions.length > 0 ? "Select attribute" : "No attributes configured"}
                                    </option>
                                    {classPrimaryStatOptions.map((attribute) => (
                                      <option key={attribute} value={attribute}>
                                        {attribute}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => setSkillRows((prev) => prev.filter((entry) => entry.id !== skill.id))}
                                    className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                                  >
                                    Remove
                                  </button>
                                </div>

                                <div className="mt-2 grid gap-2 md:grid-cols-[220px_1fr_auto]">
                                  <select
                                    value={skill.calculationMode}
                                    onChange={(e) =>
                                      setSkillRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === skill.id
                                            ? { ...entry, calculationMode: e.target.value as SkillCalculationMode }
                                            : entry
                                        )
                                      )
                                    }
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  >
                                    <option value="defaultDice">Default Dice</option>
                                    <option value="customDice">Custom Dice</option>
                                    <option value="numeric">Numeric</option>
                                  </select>

                                  {skill.calculationMode === "customDice" ? (
                                    <input
                                      value={skill.customDice}
                                      onChange={(e) =>
                                        setSkillRows((prev) =>
                                          prev.map((entry) =>
                                            entry.id === skill.id ? { ...entry, customDice: e.target.value } : entry
                                          )
                                        )
                                      }
                                      placeholder="d4"
                                      className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                  ) : skill.calculationMode === "numeric" ? (
                                    <input
                                      value={skill.numericBase}
                                      onChange={(e) =>
                                        setSkillRows((prev) =>
                                          prev.map((entry) =>
                                            entry.id === skill.id ? { ...entry, numericBase: e.target.value } : entry
                                          )
                                        )
                                      }
                                      placeholder="2"
                                      className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                  ) : (
                                    <p className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                                      Uses system default dice.
                                    </p>
                                  )}
                                </div>

                                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                  Expression: {formatSkillExpression(skill)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : wizardBlock.key === "currencies" ? (
                      <div className="space-y-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Step 1: Currency Definitions
                          </label>
                          <button
                            onClick={() => setCurrencyRows((prev) => [...prev, createEmptyCurrencyRow()])}
                            className="rounded border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            + Add Currency
                          </button>
                        </div>

                        {currencyRows.length === 0 ? (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Add at least one currency (example: Gold / gp).
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {currencyRows.map((currency) => (
                              <div key={currency.id} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                                <input
                                  value={currency.name}
                                  onChange={(e) =>
                                    setCurrencyRows((prev) =>
                                      prev.map((entry) =>
                                        entry.id === currency.id ? { ...entry, name: e.target.value } : entry
                                      )
                                    )
                                  }
                                  placeholder="Currency name (e.g. Gold)"
                                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                />
                                <input
                                  value={currency.short}
                                  onChange={(e) =>
                                    setCurrencyRows((prev) =>
                                      prev.map((entry) =>
                                        entry.id === currency.id ? { ...entry, short: e.target.value } : entry
                                      )
                                    )
                                  }
                                  placeholder="Short code (optional, e.g. gp)"
                                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                />
                                <button
                                  onClick={() =>
                                    setCurrencyRows((prev) => prev.filter((entry) => entry.id !== currency.id))
                                  }
                                  className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : wizardBlock.key === "weapons" || wizardBlock.key === "armor" ? (
                      <div className="space-y-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Step 1: Keyword Definitions
                          </label>
                          <button
                            onClick={() =>
                              wizardBlock.key === "weapons"
                                ? setWeaponKeywordRows((prev) => [...prev, createEmptyEquipmentKeywordRow()])
                                : setArmorKeywordRows((prev) => [...prev, createEmptyEquipmentKeywordRow()])
                            }
                            className="rounded border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            + Add Keyword
                          </button>
                        </div>

                        {(wizardBlock.key === "weapons" ? weaponKeywordRows : armorKeywordRows).length === 0 ? (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Optional: add keywords (example: Martial, Slashing, Loud, Stalwart).
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {(wizardBlock.key === "weapons" ? weaponKeywordRows : armorKeywordRows).map((keyword) => (
                              <div key={keyword.id} className="rounded border border-zinc-200 p-2 dark:border-zinc-800">
                                <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                                  <input
                                    value={keyword.name}
                                    onChange={(e) =>
                                      wizardBlock.key === "weapons"
                                        ? setWeaponKeywordRows((prev) =>
                                            prev.map((entry) =>
                                              entry.id === keyword.id ? { ...entry, name: e.target.value } : entry
                                            )
                                          )
                                        : setArmorKeywordRows((prev) =>
                                            prev.map((entry) =>
                                              entry.id === keyword.id ? { ...entry, name: e.target.value } : entry
                                            )
                                          )
                                    }
                                    placeholder="Keyword name"
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                  <input
                                    value={keyword.effect}
                                    onChange={(e) =>
                                      wizardBlock.key === "weapons"
                                        ? setWeaponKeywordRows((prev) =>
                                            prev.map((entry) =>
                                              entry.id === keyword.id ? { ...entry, effect: e.target.value } : entry
                                            )
                                          )
                                        : setArmorKeywordRows((prev) =>
                                            prev.map((entry) =>
                                              entry.id === keyword.id ? { ...entry, effect: e.target.value } : entry
                                            )
                                          )
                                    }
                                    placeholder="Definition"
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                  <button
                                    onClick={() =>
                                      wizardBlock.key === "weapons"
                                        ? setWeaponKeywordRows((prev) => prev.filter((entry) => entry.id !== keyword.id))
                                        : setArmorKeywordRows((prev) => prev.filter((entry) => entry.id !== keyword.id))
                                    }
                                    className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-3">
                                  {wizardBlock.key === "weapons" && (
                                    <label className="inline-flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                      <input
                                        type="checkbox"
                                        checked={keyword.additionalDamageProfile}
                                        onChange={(e) =>
                                          setWeaponKeywordRows((prev) =>
                                            prev.map((entry) =>
                                              entry.id === keyword.id
                                                ? { ...entry, additionalDamageProfile: e.target.checked }
                                                : entry
                                            )
                                          )
                                        }
                                      />
                                      Additional Damage Profile
                                    </label>
                                  )}

                                  <label className="inline-flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                    <input
                                      type="checkbox"
                                      checked={keyword.proficiency}
                                      onChange={(e) =>
                                        wizardBlock.key === "weapons"
                                          ? setWeaponKeywordRows((prev) =>
                                              prev.map((entry) =>
                                                entry.id === keyword.id
                                                  ? { ...entry, proficiency: e.target.checked }
                                                  : entry
                                              )
                                            )
                                          : setArmorKeywordRows((prev) =>
                                              prev.map((entry) =>
                                                entry.id === keyword.id
                                                  ? { ...entry, proficiency: e.target.checked }
                                                  : entry
                                              )
                                            )
                                      }
                                    />
                                    Proficiency
                                  </label>

                                  <label className="inline-flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                    <input
                                      type="checkbox"
                                      checked={keyword.modifier}
                                      onChange={(e) =>
                                        wizardBlock.key === "weapons"
                                          ? setWeaponKeywordRows((prev) =>
                                              prev.map((entry) =>
                                                entry.id === keyword.id
                                                  ? {
                                                      ...entry,
                                                      modifier: e.target.checked,
                                                      modifierTarget: e.target.checked ? entry.modifierTarget : "",
                                                      modifierValue: e.target.checked ? entry.modifierValue : "",
                                                    }
                                                  : entry
                                              )
                                            )
                                          : setArmorKeywordRows((prev) =>
                                              prev.map((entry) =>
                                                entry.id === keyword.id
                                                  ? {
                                                      ...entry,
                                                      modifier: e.target.checked,
                                                      modifierTarget: e.target.checked ? entry.modifierTarget : "",
                                                      modifierValue: e.target.checked ? entry.modifierValue : "",
                                                    }
                                                  : entry
                                              )
                                            )
                                      }
                                    />
                                    Modifier
                                  </label>
                                </div>

                                {keyword.modifier && (
                                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr]">
                                    <select
                                      value={keyword.modifierTarget}
                                      onChange={(e) =>
                                        wizardBlock.key === "weapons"
                                          ? setWeaponKeywordRows((prev) =>
                                              prev.map((entry) =>
                                                entry.id === keyword.id
                                                  ? { ...entry, modifierTarget: e.target.value }
                                                  : entry
                                              )
                                            )
                                          : setArmorKeywordRows((prev) =>
                                              prev.map((entry) =>
                                                entry.id === keyword.id
                                                  ? { ...entry, modifierTarget: e.target.value }
                                                  : entry
                                              )
                                            )
                                      }
                                      className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                    >
                                      <option value="">Select modifier target</option>
                                      {classPrimaryStatOptions.map((attribute) => (
                                        <option key={`modifier-attr-${attribute}`} value={`attribute:${attribute}`}>
                                          Attribute: {attribute}
                                        </option>
                                      ))}
                                      {classSkillOptions.map((skill) => (
                                        <option key={`modifier-skill-${skill}`} value={`skill:${skill}`}>
                                          Skill: {skill}
                                        </option>
                                      ))}
                                      <option value="value:damageIncrease">Value: Damage Increase</option>
                                      <option value="value:armorValue">Value: Armor Value</option>
                                      <option value="value:dodgeValue">Value: Dodge Value</option>
                                    </select>

                                    <input
                                      value={keyword.modifierValue}
                                      onChange={(e) =>
                                        wizardBlock.key === "weapons"
                                          ? setWeaponKeywordRows((prev) =>
                                              prev.map((entry) =>
                                                entry.id === keyword.id
                                                  ? { ...entry, modifierValue: e.target.value }
                                                  : entry
                                              )
                                            )
                                          : setArmorKeywordRows((prev) =>
                                              prev.map((entry) =>
                                                entry.id === keyword.id
                                                  ? { ...entry, modifierValue: e.target.value }
                                                  : entry
                                              )
                                            )
                                      }
                                      placeholder="Modifier definition"
                                      className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : BLOCK_BUILDERS[wizardBlock.key].mode === "list" ? (
                      <div className="space-y-3">
                        {wizardListItems.map((item, index) => (
                          <div
                            key={`item-${index}`}
                            className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                {BLOCK_BUILDERS[wizardBlock.key].itemLabel || "Item"} {index + 1}
                              </p>
                              <button
                                onClick={() => handleRemoveListItem(index)}
                                className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                              >
                                Remove Item
                              </button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              {BLOCK_BUILDERS[wizardBlock.key].fields.map((field) => (
                                <div key={`${index}-${field.key}`}>
                                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    {field.label}
                                  </label>
                                  {[
                                    "tools",
                                    "weapons",
                                    "armor",
                                    "items",
                                  ].includes(wizardBlock.key) && field.key === "attribute" ? (
                                    <select
                                      value={item[field.key] ?? ""}
                                      onChange={(e) => handleListFieldChange(index, field.key, e.target.value)}
                                      className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                    >
                                      <option value="">None</option>
                                      {classPrimaryStatOptions.map((attribute) => (
                                        <option key={attribute} value={attribute}>
                                          {attribute}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <BuilderFieldInput
                                      field={field}
                                      value={item[field.key] ?? ""}
                                      onChange={(value) => handleListFieldChange(index, field.key, value)}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={handleAddListItem}
                          className="rounded bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                        >
                          + Add Item
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {BLOCK_BUILDERS[wizardBlock.key].fields.map((field) => (
                          <div key={field.key}>
                            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {field.label}
                            </label>
                            <BuilderFieldInput
                              field={field}
                              value={wizardObjectValues[field.key] ?? ""}
                              onChange={(value) => handleObjectFieldChange(field.key, value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {!isDiceStyleBlock(wizardBlock.key) ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleDeleteWizardBlock}
                          disabled={savingWizard}
                          className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                        >
                          Delete Block
                        </button>
                        {["currencies", "weapons", "armor"].includes(wizardBlock.key) ? (
                          <button
                            onClick={() => setWizardStep(3)}
                            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                          >
                            Continue
                          </button>
                        ) : (
                          <button
                            onClick={handleWizardSave}
                            disabled={savingWizard}
                            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            {savingWizard ? "Saving..." : "Save Block"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {wizardStep === 3 && wizardBlock.key === "currencies" && (
                <div className="space-y-4">
                  <div className="space-y-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Step 2: Conversion Ratios
                      </label>
                      <button
                        onClick={() =>
                          setCurrencyConversionRows((prev) => [
                            ...prev,
                            createEmptyCurrencyConversionRow(currencyNameOptions[0] || "", currencyNameOptions[1] || ""),
                          ])
                        }
                        disabled={currencyNameOptions.length < 2}
                        className="rounded border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        + Add Conversion
                      </button>
                    </div>

                    {currencyNameOptions.length < 2 ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Add at least two currencies in step 1 to define conversions.
                      </p>
                    ) : currencyConversionRows.length === 0 ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Optional: add conversions like 1 Gold = 100 Silver.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {currencyConversionRows.map((conversion) => (
                          <div key={conversion.id} className="grid gap-2 md:grid-cols-[1fr_1fr_180px_auto]">
                            <select
                              value={conversion.fromCurrency}
                              onChange={(e) =>
                                setCurrencyConversionRows((prev) =>
                                  prev.map((entry) =>
                                    entry.id === conversion.id
                                      ? { ...entry, fromCurrency: e.target.value }
                                      : entry
                                  )
                                )
                              }
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            >
                              <option value="">From currency</option>
                              {currencyNameOptions.map((name) => (
                                <option key={`from-${name}`} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={conversion.toCurrency}
                              onChange={(e) =>
                                setCurrencyConversionRows((prev) =>
                                  prev.map((entry) =>
                                    entry.id === conversion.id
                                      ? { ...entry, toCurrency: e.target.value }
                                      : entry
                                  )
                                )
                              }
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            >
                              <option value="">To currency</option>
                              {currencyNameOptions.map((name) => (
                                <option key={`to-${name}`} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>

                            <input
                              value={conversion.ratio}
                              onChange={(e) =>
                                setCurrencyConversionRows((prev) =>
                                  prev.map((entry) =>
                                    entry.id === conversion.id
                                      ? { ...entry, ratio: e.target.value }
                                      : entry
                                  )
                                )
                              }
                              placeholder="Ratio (e.g. 100)"
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            />

                            <button
                              onClick={() =>
                                setCurrencyConversionRows((prev) =>
                                  prev.filter((entry) => entry.id !== conversion.id)
                                )
                              }
                              className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

              {wizardStep === 3 && (wizardBlock.key === "weapons" || wizardBlock.key === "armor") && (
                <div className="space-y-4">
                  <div className="space-y-3 rounded border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Step 2: {wizardBlock.key === "weapons" ? "Weapon" : "Armor"} Definitions
                      </label>
                      <button
                        onClick={() =>
                          wizardBlock.key === "weapons"
                            ? setWeaponItemRows((prev) => [...prev, createEmptyEquipmentItemRow()])
                            : setArmorItemRows((prev) => [...prev, createEmptyEquipmentItemRow()])
                        }
                        className="rounded border border-zinc-300 px-2 py-1 text-[10px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        + Add {wizardBlock.key === "weapons" ? "Weapon" : "Armor"}
                      </button>
                    </div>

                    {(wizardBlock.key === "weapons" ? weaponItemRows : armorItemRows).length === 0 ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Add at least one {wizardBlock.key === "weapons" ? "weapon" : "armor"} definition.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {(wizardBlock.key === "weapons" ? weaponItemRows : armorItemRows).map((item) => (
                          <div key={item.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                              <input
                                value={item.name}
                                onChange={(e) =>
                                  wizardBlock.key === "weapons"
                                    ? setWeaponItemRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === item.id ? { ...entry, name: e.target.value } : entry
                                        )
                                      )
                                    : setArmorItemRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === item.id ? { ...entry, name: e.target.value } : entry
                                        )
                                      )
                                }
                                placeholder={`${wizardBlock.key === "weapons" ? "Weapon" : "Armor"} name`}
                                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                              />
                              <button
                                onClick={() =>
                                  wizardBlock.key === "weapons"
                                    ? setWeaponItemRows((prev) => prev.filter((entry) => entry.id !== item.id))
                                    : setArmorItemRows((prev) => prev.filter((entry) => entry.id !== item.id))
                                }
                                className="rounded border border-red-300 px-2 py-1 text-[10px] text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                              >
                                Remove
                              </button>
                            </div>

                            {wizardBlock.key === "armor" ? (
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <input
                                  value={item.armorValue}
                                  onChange={(e) =>
                                    setArmorItemRows((prev) =>
                                      prev.map((entry) =>
                                        entry.id === item.id ? { ...entry, armorValue: e.target.value } : entry
                                      )
                                    )
                                  }
                                  placeholder="Armor value"
                                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                />
                                <input
                                  value={item.dodgeValue}
                                  onChange={(e) =>
                                    setArmorItemRows((prev) =>
                                      prev.map((entry) =>
                                        entry.id === item.id ? { ...entry, dodgeValue: e.target.value } : entry
                                      )
                                    )
                                  }
                                  placeholder="Dodge value"
                                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="mt-2 grid gap-2 md:grid-cols-3">
                                  <input
                                    value={item.damageDiceCount}
                                    onChange={(e) =>
                                      setWeaponItemRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === item.id ? { ...entry, damageDiceCount: e.target.value } : entry
                                        )
                                      )
                                    }
                                    placeholder="Dice or Damage Amount"
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                  <select
                                    value={item.damageDie}
                                    onChange={(e) =>
                                      setWeaponItemRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === item.id ? { ...entry, damageDie: e.target.value } : entry
                                        )
                                      )
                                    }
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  >
                                    <option value="">
                                      {damageDieOptions.length > 0 ? "Select damage die" : "No dice configured"}
                                    </option>
                                    {damageDieOptions.map((die) => (
                                      <option key={die} value={die}>
                                        {die === "coinFlip" ? "Coin Flip" : die === "flatDamage" ? "Flat Damage" : die}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                  <input
                                    value={item.rangeMin}
                                    onChange={(e) =>
                                      setWeaponItemRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === item.id ? { ...entry, rangeMin: e.target.value } : entry
                                        )
                                      )
                                    }
                                    placeholder="Range min"
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                  <input
                                    value={item.rangeMax}
                                    onChange={(e) =>
                                      setWeaponItemRows((prev) =>
                                        prev.map((entry) =>
                                          entry.id === item.id ? { ...entry, rangeMax: e.target.value } : entry
                                        )
                                      )
                                    }
                                    placeholder="Range max"
                                    className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                  />
                                </div>
                              </>
                            )}

                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-[10px] uppercase text-zinc-500">Modifiers (AND)</p>
                                <div className="flex flex-wrap gap-1">
                                  {classPrimaryStatOptions.map((attribute) => {
                                    const isSelected = item.andAttributes.includes(attribute);
                                    return (
                                      <button
                                        key={`${item.id}-and-${attribute}`}
                                        onClick={() => {
                                          if (wizardBlock.key === "weapons") {
                                            setWeaponItemRows((prev) =>
                                              prev.map((entry) => {
                                                if (entry.id !== item.id) {
                                                  return entry;
                                                }
                                                const andAttributes = isSelected
                                                  ? entry.andAttributes.filter((candidate) => candidate !== attribute)
                                                  : [...entry.andAttributes, attribute];
                                                return { ...entry, andAttributes: uniqueStrings(andAttributes) };
                                              })
                                            );
                                          } else {
                                            setArmorItemRows((prev) =>
                                              prev.map((entry) => {
                                                if (entry.id !== item.id) {
                                                  return entry;
                                                }
                                                const andAttributes = isSelected
                                                  ? entry.andAttributes.filter((candidate) => candidate !== attribute)
                                                  : [...entry.andAttributes, attribute];
                                                return { ...entry, andAttributes: uniqueStrings(andAttributes) };
                                              })
                                            );
                                          }
                                        }}
                                        className={`rounded border px-2 py-1 text-[10px] ${
                                          isSelected
                                            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                        }`}
                                      >
                                        {attribute}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <p className="mb-1 text-[10px] uppercase text-zinc-500">Modifiers (OR)</p>
                                <div className="flex flex-wrap gap-1">
                                  {classPrimaryStatOptions.map((attribute) => {
                                    const isSelected = item.orAttributes.includes(attribute);
                                    return (
                                      <button
                                        key={`${item.id}-or-${attribute}`}
                                        onClick={() => {
                                          if (wizardBlock.key === "weapons") {
                                            setWeaponItemRows((prev) =>
                                              prev.map((entry) => {
                                                if (entry.id !== item.id) {
                                                  return entry;
                                                }
                                                const orAttributes = isSelected
                                                  ? entry.orAttributes.filter((candidate) => candidate !== attribute)
                                                  : [...entry.orAttributes, attribute];
                                                return { ...entry, orAttributes: uniqueStrings(orAttributes) };
                                              })
                                            );
                                          } else {
                                            setArmorItemRows((prev) =>
                                              prev.map((entry) => {
                                                if (entry.id !== item.id) {
                                                  return entry;
                                                }
                                                const orAttributes = isSelected
                                                  ? entry.orAttributes.filter((candidate) => candidate !== attribute)
                                                  : [...entry.orAttributes, attribute];
                                                return { ...entry, orAttributes: uniqueStrings(orAttributes) };
                                              })
                                            );
                                          }
                                        }}
                                        className={`rounded border px-2 py-1 text-[10px] ${
                                          isSelected
                                            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                        }`}
                                      >
                                        {attribute}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2">
                              <p className="mb-1 text-[10px] uppercase text-zinc-500">Assign Keywords</p>
                              {(wizardBlock.key === "weapons" ? weaponKeywordOptions : armorKeywordOptions).length === 0 ? (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  No keywords defined in step 1.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {(wizardBlock.key === "weapons" ? weaponKeywordOptions : armorKeywordOptions).map((keywordName) => {
                                    const isSelected = item.keywords.includes(keywordName);
                                    return (
                                      <button
                                        key={`${item.id}-${keywordName}`}
                                        onClick={() => {
                                          if (wizardBlock.key === "weapons") {
                                            setWeaponItemRows((prev) =>
                                              prev.map((entry) => {
                                                if (entry.id !== item.id) {
                                                  return entry;
                                                }
                                                const nextKeywords = isSelected
                                                  ? entry.keywords.filter((keyword) => keyword !== keywordName)
                                                  : [...entry.keywords, keywordName];
                                                return { ...entry, keywords: nextKeywords };
                                              })
                                            );
                                          } else {
                                            setArmorItemRows((prev) =>
                                              prev.map((entry) => {
                                                if (entry.id !== item.id) {
                                                  return entry;
                                                }
                                                const nextKeywords = isSelected
                                                  ? entry.keywords.filter((keyword) => keyword !== keywordName)
                                                  : [...entry.keywords, keywordName];
                                                return { ...entry, keywords: nextKeywords };
                                              })
                                            );
                                          }
                                        }}
                                        className={`rounded border px-2 py-1 text-[10px] ${
                                          isSelected
                                            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                        }`}
                                      >
                                        {keywordName}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {wizardBlock.key === "weapons" && item.keywords.some((keywordName) => {
                              const keyword = weaponKeywordRows.find(
                                (candidate) => candidate.name.trim().toLowerCase() === keywordName.trim().toLowerCase()
                              );
                              return Boolean(keyword?.additionalDamageProfile);
                            }) && (
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <input
                                  value={item.additionalDamageDiceCount}
                                  onChange={(e) =>
                                    setWeaponItemRows((prev) =>
                                      prev.map((entry) =>
                                        entry.id === item.id
                                          ? { ...entry, additionalDamageDiceCount: e.target.value }
                                          : entry
                                      )
                                    )
                                  }
                                  placeholder="Dice or Damage Amount"
                                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                />
                                <select
                                  value={item.additionalDamageDie}
                                  onChange={(e) =>
                                    setWeaponItemRows((prev) =>
                                      prev.map((entry) =>
                                        entry.id === item.id
                                          ? { ...entry, additionalDamageDie: e.target.value }
                                          : entry
                                      )
                                    )
                                  }
                                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                                >
                                  <option value="">
                                    {damageDieOptions.length > 0 ? "Select damage die" : "No dice configured"}
                                  </option>
                                  {damageDieOptions.map((die) => (
                                    <option key={`additional-${item.id}-${die}`} value={die}>
                                      {die === "coinFlip" ? "Coin Flip" : die === "flatDamage" ? "Flat Damage" : die}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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

              {wizardStep === 3 && !isDiceStyleBlock(wizardBlock.key) && (
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
{formatJson(parseBuilderToValue(wizardBlock.key, wizardObjectValues, wizardListItems).value) || "(no structured data)"}
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

function extractBlockData(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "data" in (value as Record<string, unknown>)
  ) {
    return (value as Record<string, unknown>).data;
  }

  return value;
}

function buildDiceBuilderFromValue(value: unknown): DiceBuilderState {
  const data = extractBlockData(value);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      diceTypes: [],
      defaultDie: "",
      coinFlip: false,
      criticalThreshold: "",
      newDieInput: "",
    };
  }

  const diceData = data as {
    types?: unknown;
    default?: unknown;
    coinFlip?: unknown;
    criticalThreshold?: unknown;
  };

  const diceTypes = Array.isArray(diceData.types)
    ? diceData.types.filter((item): item is string => typeof item === "string")
    : [];

  return {
    diceTypes,
    defaultDie: typeof diceData.default === "string" ? diceData.default : "",
    coinFlip: Boolean(diceData.coinFlip),
    criticalThreshold:
      typeof diceData.criticalThreshold === "number" || typeof diceData.criticalThreshold === "string"
        ? String(diceData.criticalThreshold)
        : "",
    newDieInput: "",
  };
}

function parseDiceBuilderToValue(builder: DiceBuilderState) {
  const types = builder.diceTypes.filter(Boolean);

  if (types.length === 0) {
    return {
      value: null as unknown,
      error: "Add at least one die type.",
    };
  }

  const defaultDie = builder.defaultDie || types[0];
  if (!types.includes(defaultDie)) {
    return {
      value: null as unknown,
      error: "Default die must be one of the added dice types.",
    };
  }

  let criticalThreshold: number | undefined;
  if (builder.criticalThreshold.trim()) {
    const parsed = Number(builder.criticalThreshold.trim());
    if (Number.isNaN(parsed)) {
      return {
        value: null as unknown,
        error: "Critical threshold must be a valid number.",
      };
    }
    criticalThreshold = parsed;
  }

  return {
    value: {
      types,
      default: defaultDie,
      coinFlip: builder.coinFlip,
      ...(criticalThreshold !== undefined && { criticalThreshold }),
    },
    error: null as string | null,
  };
}

function createEmptyAttributeRow(): AttributeDefinitionRow {
  return {
    id: `attribute-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    shorthand: "",
  };
}

function buildAttributeBuilderFromValue(value: unknown): {
  rows: AttributeDefinitionRow[];
  modifiers: AttributeModifierBuilderState;
} {
  const data = extractBlockData(value);
  const defaultModifiers: AttributeModifierBuilderState = {
    baseScore: "8",
    baseModifier: "-1",
    pointsPerModifier: "2",
  };

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      rows: [],
      modifiers: defaultModifiers,
    };
  }

  const dataObject = data as Record<string, unknown>;
  let rows: AttributeDefinitionRow[] = [];

  if (Array.isArray(dataObject.attributes)) {
    rows = dataObject.attributes
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
      .map((entry, index) => ({
        id: `attribute-${index}-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof entry.name === "string" ? entry.name : "",
        shorthand: typeof entry.shorthand === "string" ? entry.shorthand : "",
      }));
  } else if (dataObject.primaryStats && typeof dataObject.primaryStats === "object" && !Array.isArray(dataObject.primaryStats)) {
    rows = Object.keys(dataObject.primaryStats as Record<string, unknown>).map((key, index) => ({
      id: `attribute-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name: key,
      shorthand: key,
    }));
  }

  const modifiersSource =
    dataObject.modifiers && typeof dataObject.modifiers === "object" && !Array.isArray(dataObject.modifiers)
      ? (dataObject.modifiers as Record<string, unknown>)
      : null;

  const modifiers: AttributeModifierBuilderState = {
    baseScore:
      typeof modifiersSource?.baseScore === "number" || typeof modifiersSource?.baseScore === "string"
        ? String(modifiersSource.baseScore)
        : defaultModifiers.baseScore,
    baseModifier:
      typeof modifiersSource?.baseModifier === "number" || typeof modifiersSource?.baseModifier === "string"
        ? String(modifiersSource.baseModifier)
        : defaultModifiers.baseModifier,
    pointsPerModifier:
      typeof modifiersSource?.pointsPerModifier === "number" || typeof modifiersSource?.pointsPerModifier === "string"
        ? String(modifiersSource.pointsPerModifier)
        : defaultModifiers.pointsPerModifier,
  };

  return {
    rows,
    modifiers,
  };
}

function parseAttributeBuilderToValue(rows: AttributeDefinitionRow[], modifiers: AttributeModifierBuilderState) {
  const attributes = rows
    .map((row) => ({
      name: row.name.trim(),
      shorthand: row.shorthand.trim(),
    }))
    .filter((row) => row.name);

  if (attributes.length === 0) {
    return {
      value: null as unknown,
      error: "Add at least one attribute.",
    };
  }

  const duplicateName = attributes.find(
    (attribute, index) =>
      attributes.findIndex((candidate) => candidate.name.toLowerCase() === attribute.name.toLowerCase()) !== index
  );
  if (duplicateName) {
    return {
      value: null as unknown,
      error: `Duplicate attribute name: ${duplicateName.name}`,
    };
  }

  const shorthandConflict = attributes.find(
    (attribute, index) =>
      attribute.shorthand &&
      attributes.findIndex(
        (candidate) =>
          candidate.shorthand && candidate.shorthand.toLowerCase() === attribute.shorthand.toLowerCase()
      ) !== index
  );

  if (shorthandConflict) {
    return {
      value: null as unknown,
      error: `Duplicate attribute shorthand: ${shorthandConflict.shorthand}`,
    };
  }

  const baseScore = Number(modifiers.baseScore.trim());
  const baseModifier = Number(modifiers.baseModifier.trim());
  const pointsPerModifier = Number(modifiers.pointsPerModifier.trim());

  if (Number.isNaN(baseScore)) {
    return {
      value: null as unknown,
      error: "Base score must be a valid number.",
    };
  }

  if (Number.isNaN(baseModifier)) {
    return {
      value: null as unknown,
      error: "Base modifier must be a valid number.",
    };
  }

  if (Number.isNaN(pointsPerModifier) || pointsPerModifier <= 0) {
    return {
      value: null as unknown,
      error: "Points per +1 modifier must be a number greater than 0.",
    };
  }

  return {
    value: {
      attributes,
      modifiers: {
        type: "linear",
        baseScore,
        baseModifier,
        pointsPerModifier,
      },
    },
    error: null as string | null,
  };
}

function computeLinearModifierPreview(score: number, modifiers: AttributeModifierBuilderState): string {
  const baseScore = Number(modifiers.baseScore.trim());
  const baseModifier = Number(modifiers.baseModifier.trim());
  const pointsPerModifier = Number(modifiers.pointsPerModifier.trim());

  if (Number.isNaN(baseScore) || Number.isNaN(baseModifier) || Number.isNaN(pointsPerModifier) || pointsPerModifier <= 0) {
    return "—";
  }

  const modifier = baseModifier + Math.floor((score - baseScore) / pointsPerModifier);
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}

function createEmptySkillRow(): SkillDefinitionRow {
  return {
    id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    attribute: "",
    calculationMode: "defaultDice",
    customDice: "d4",
    numericBase: "0",
  };
}

function buildSkillBuilderFromValue(value: unknown): SkillDefinitionRow[] {
  const data = extractBlockData(value);
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry, index) => {
      const calculationSource =
        entry.calculation && typeof entry.calculation === "object" && !Array.isArray(entry.calculation)
          ? (entry.calculation as Record<string, unknown>)
          : null;

      const legacyDice = typeof entry.dice === "string" ? entry.dice.trim() : "";
      const legacyBase = typeof entry.base === "number" || typeof entry.base === "string" ? String(entry.base) : "";

      const calculationMode: SkillCalculationMode =
        calculationSource && calculationSource.mode === "customDice"
          ? "customDice"
          : calculationSource && calculationSource.mode === "numeric"
            ? "numeric"
            : legacyDice
              ? "customDice"
              : legacyBase
                ? "numeric"
                : "defaultDice";

      return {
        id: `skill-${index}-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof entry.name === "string" ? entry.name : "",
        attribute:
          typeof entry.attribute === "string"
            ? entry.attribute
            : typeof entry.modifierStat === "string"
              ? entry.modifierStat
              : "",
        calculationMode,
        customDice:
          typeof calculationSource?.dice === "string"
            ? calculationSource.dice
            : legacyDice || "d4",
        numericBase:
          typeof calculationSource?.base === "number" || typeof calculationSource?.base === "string"
            ? String(calculationSource.base)
            : legacyBase || "0",
      };
    });
}

function parseSkillBuilderToValue(rows: SkillDefinitionRow[]) {
  const parsedSkills: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const name = row.name.trim();
    const attribute = row.attribute.trim();
    if (!name) {
      continue;
    }

    if (!attribute) {
      return {
        value: null as unknown,
        error: `Select an attribute for ${name}.`,
      };
    }

    const calculation: Record<string, unknown> = {
      mode: row.calculationMode,
    };

    if (row.calculationMode === "customDice") {
      if (!row.customDice.trim()) {
        return {
          value: null as unknown,
          error: `Set a dice value for ${name} (example: d4).`,
        };
      }
      calculation.dice = row.customDice.trim();
    }

    if (row.calculationMode === "numeric") {
      const base = Number(row.numericBase.trim());
      if (Number.isNaN(base)) {
        return {
          value: null as unknown,
          error: `Set a numeric base value for ${name}.`,
        };
      }
      calculation.base = base;
    }

    parsedSkills.push({
      name,
      attribute,
      modifierStat: attribute,
      calculation,
    });
  }

  if (parsedSkills.length === 0) {
    return {
      value: null as unknown,
      error: "Add at least one skill.",
    };
  }

  const duplicateName = parsedSkills.find(
    (skill, index) =>
      parsedSkills.findIndex(
        (candidate) =>
          String(candidate.name).toLowerCase() === String(skill.name).toLowerCase()
      ) !== index
  );

  if (duplicateName) {
    return {
      value: null as unknown,
      error: `Duplicate skill name: ${String(duplicateName.name)}`,
    };
  }

  return {
    value: parsedSkills,
    error: null as string | null,
  };
}

function formatSkillExpression(row: SkillDefinitionRow): string {
  const attribute = row.attribute.trim() || "ATTR";

  if (row.calculationMode === "customDice") {
    const dice = row.customDice.trim() || "d4";
    return `${dice}+${attribute}`;
  }

  if (row.calculationMode === "numeric") {
    const base = row.numericBase.trim() || "0";
    return `${base}+${attribute}`;
  }

  return `DefaultDice+${attribute}`;
}

function createEmptyCurrencyRow(): CurrencyDefinitionRow {
  return {
    id: `currency-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    short: "",
  };
}

function createEmptyCurrencyConversionRow(fromCurrency = "", toCurrency = ""): CurrencyConversionRow {
  return {
    id: `currency-conversion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fromCurrency,
    toCurrency,
    ratio: "",
  };
}

function buildCurrencyBuilderFromValue(value: unknown): {
  rows: CurrencyDefinitionRow[];
  conversions: CurrencyConversionRow[];
} {
  const data = extractBlockData(value);
  if (!data) {
    return { rows: [], conversions: [] };
  }

  const parsedData =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as { currencies?: unknown; conversions?: unknown })
      : null;

  const currencyList = Array.isArray(data)
    ? data
    : Array.isArray(parsedData?.currencies)
      ? parsedData.currencies
      : [];

  const conversionList = Array.isArray(parsedData?.conversions) ? parsedData.conversions : [];

  const rows = currencyList
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry, index) => ({
      id: `currency-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name: typeof entry.name === "string" ? entry.name : "",
      short: typeof entry.short === "string" ? entry.short : "",
    }));

  const conversions = conversionList
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry, index) => ({
      id: `currency-conversion-${index}-${Math.random().toString(36).slice(2, 8)}`,
      fromCurrency:
        typeof entry.fromCurrency === "string"
          ? entry.fromCurrency
          : typeof entry.from === "string"
            ? entry.from
            : "",
      toCurrency:
        typeof entry.toCurrency === "string"
          ? entry.toCurrency
          : typeof entry.to === "string"
            ? entry.to
            : "",
      ratio:
        typeof entry.ratio === "number" || typeof entry.ratio === "string"
          ? String(entry.ratio)
          : typeof entry.rate === "number" || typeof entry.rate === "string"
            ? String(entry.rate)
            : "",
    }));

  return { rows, conversions };
}

function parseCurrencyBuilderToValue(rows: CurrencyDefinitionRow[], conversionRows: CurrencyConversionRow[]) {
  const currencies = rows
    .map((row) => ({
      name: row.name.trim(),
      short: row.short.trim(),
    }))
    .filter((row) => row.name);

  if (currencies.length === 0) {
    return {
      value: null as unknown,
      error: "Add at least one currency.",
    };
  }

  const duplicateName = currencies.find(
    (currency, index) =>
      currencies.findIndex(
        (candidate) => candidate.name.toLowerCase() === currency.name.toLowerCase()
      ) !== index
  );

  if (duplicateName) {
    return {
      value: null as unknown,
      error: `Duplicate currency name: ${duplicateName.name}`,
    };
  }

  const currencyNameMap = new Map<string, string>();
  for (const currency of currencies) {
    currencyNameMap.set(currency.name.toLowerCase(), currency.name);
  }

  const conversions: Array<{ fromCurrency: string; toCurrency: string; ratio: number }> = [];

  for (const row of conversionRows) {
    const fromCurrency = row.fromCurrency.trim();
    const toCurrency = row.toCurrency.trim();
    const ratioText = row.ratio.trim();

    if (!fromCurrency && !toCurrency && !ratioText) {
      continue;
    }

    if (!fromCurrency || !toCurrency) {
      return {
        value: null as unknown,
        error: "Select both from and to currency for each conversion.",
      };
    }

    if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
      return {
        value: null as unknown,
        error: "Conversion currencies must be different.",
      };
    }

    const resolvedFrom = currencyNameMap.get(fromCurrency.toLowerCase());
    const resolvedTo = currencyNameMap.get(toCurrency.toLowerCase());

    if (!resolvedFrom || !resolvedTo) {
      return {
        value: null as unknown,
        error: "Conversions must reference currencies defined in step 1.",
      };
    }

    const ratio = Number(ratioText);
    if (Number.isNaN(ratio) || ratio <= 0) {
      return {
        value: null as unknown,
        error: `Conversion ratio for ${resolvedFrom} to ${resolvedTo} must be a number greater than 0.`,
      };
    }

    conversions.push({
      fromCurrency: resolvedFrom,
      toCurrency: resolvedTo,
      ratio,
    });
  }

  const duplicateConversion = conversions.find(
    (conversion, index) =>
      conversions.findIndex(
        (candidate) =>
          candidate.fromCurrency.toLowerCase() === conversion.fromCurrency.toLowerCase() &&
          candidate.toCurrency.toLowerCase() === conversion.toCurrency.toLowerCase()
      ) !== index
  );

  if (duplicateConversion) {
    return {
      value: null as unknown,
      error: `Duplicate conversion: ${duplicateConversion.fromCurrency} to ${duplicateConversion.toCurrency}`,
    };
  }

  return {
    value: {
      currencies,
      conversions,
    },
    error: null as string | null,
  };
}

function createEmptyEquipmentKeywordRow(): EquipmentKeywordRow {
  return {
    id: `equipment-keyword-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    effect: "",
    attribute: "",
    additionalDamageProfile: false,
    proficiency: false,
    modifier: false,
    modifierTarget: "",
    modifierValue: "",
  };
}

function createEmptyEquipmentItemRow(): EquipmentItemRow {
  return {
    id: `equipment-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    attribute: "",
    andAttributes: [],
    orAttributes: [],
    armorValue: "",
    dodgeValue: "",
    damageDiceCount: "",
    damageDie: "",
    damageFlat: "",
    additionalDamageDiceCount: "",
    additionalDamageDie: "",
    rangeMin: "",
    rangeMax: "",
    keywords: [],
  };
}

function buildEquipmentBuilderFromValue(value: unknown): {
  keywords: EquipmentKeywordRow[];
  items: EquipmentItemRow[];
} {
  const data = extractBlockData(value);
  if (!data) {
    return { keywords: [], items: [] };
  }

  const parsedData =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as { keywords?: unknown; items?: unknown })
      : null;

  const itemList = Array.isArray(data)
    ? data
    : Array.isArray(parsedData?.items)
      ? parsedData.items
      : [];

  const keywordList = Array.isArray(parsedData?.keywords) ? parsedData.keywords : [];

  const keywords = keywordList
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry, index) => {
      const modifier =
        entry.modifier && typeof entry.modifier === "object" && !Array.isArray(entry.modifier)
          ? (entry.modifier as Record<string, unknown>)
          : null;

      return {
        id: `equipment-keyword-${index}-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof entry.name === "string" ? entry.name : "",
        effect:
          typeof entry.effect === "string"
            ? entry.effect
            : typeof entry.summary === "string"
              ? entry.summary
              : "",
        attribute: typeof entry.attribute === "string" ? entry.attribute : "",
        additionalDamageProfile: Boolean((entry as Record<string, unknown>).additionalDamageProfile),
        proficiency:
          Boolean((entry as Record<string, unknown>).proficiency) ||
          Boolean((entry as Record<string, unknown>).isProficiency),
        modifier: Boolean(modifier),
        modifierTarget:
          typeof modifier?.target === "string"
            ? modifier.target
            : typeof modifier?.type === "string"
              ? modifier.type
              : "",
        modifierValue:
          typeof modifier?.value === "string" || typeof modifier?.value === "number"
            ? String(modifier.value)
            : "",
      };
    });

  const items = itemList
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry, index) => {
      const damage =
        entry.damage && typeof entry.damage === "object" && !Array.isArray(entry.damage)
          ? (entry.damage as Record<string, unknown>)
          : null;
      const range =
        entry.range && typeof entry.range === "object" && !Array.isArray(entry.range)
          ? (entry.range as Record<string, unknown>)
          : null;
      const additionalDamage =
        entry.additionalDamage && typeof entry.additionalDamage === "object" && !Array.isArray(entry.additionalDamage)
          ? (entry.additionalDamage as Record<string, unknown>)
          : null;

      return {
        id: `equipment-item-${index}-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof entry.name === "string" ? entry.name : "",
        attribute:
          typeof entry.attribute === "string"
            ? entry.attribute
            : typeof (entry.modifierAttributes as Record<string, unknown> | undefined)?.base === "string"
              ? String((entry.modifierAttributes as Record<string, unknown>).base)
              : "",
        andAttributes: Array.isArray((entry.modifierAttributes as Record<string, unknown> | undefined)?.and)
          ? ((entry.modifierAttributes as Record<string, unknown>).and as unknown[]).filter(
              (attribute): attribute is string => typeof attribute === "string"
            )
          : [],
        orAttributes: Array.isArray((entry.modifierAttributes as Record<string, unknown> | undefined)?.or)
          ? ((entry.modifierAttributes as Record<string, unknown>).or as unknown[]).filter(
              (attribute): attribute is string => typeof attribute === "string"
            )
          : [],
        armorValue:
          typeof entry.armorValue === "number" || typeof entry.armorValue === "string"
            ? String(entry.armorValue)
            : "",
        dodgeValue:
          typeof entry.dodgeValue === "number" || typeof entry.dodgeValue === "string"
            ? String(entry.dodgeValue)
            : "",
        damageDiceCount:
          typeof damage?.times === "number" || typeof damage?.times === "string"
            ? String(damage.times)
            : typeof damage?.flat === "number" || typeof damage?.flat === "string"
              ? String(damage.flat)
            : typeof entry.damageDiceCount === "number" || typeof entry.damageDiceCount === "string"
              ? String(entry.damageDiceCount)
              : typeof entry.damageFlat === "number" || typeof entry.damageFlat === "string"
                ? String(entry.damageFlat)
              : (() => {
                  const legacyDamageDice =
                    typeof damage?.dice === "string"
                      ? damage.dice
                      : typeof entry.damageDice === "string"
                        ? entry.damageDice
                        : "";
                  const legacyMatch = legacyDamageDice.match(/^(\d+)[x*]?(d\d+|coinflip)$/i);
                  return legacyMatch ? legacyMatch[1] : "";
                })(),
        damageDie:
          typeof damage?.die === "string"
            ? damage.die.toLowerCase() === "coinflip"
              ? "coinFlip"
              : damage.die.toLowerCase()
            : typeof damage?.flat === "number" || typeof damage?.flat === "string"
              ? "flatDamage"
            : (() => {
                const legacyDamageDice =
                  typeof damage?.dice === "string"
                    ? damage.dice
                    : typeof entry.damageDice === "string"
                      ? entry.damageDice
                      : "";
                const legacyMatch = legacyDamageDice.match(/^(\d+)[x*]?(d\d+|coinflip)$/i);
                if (!legacyMatch) {
                  if (typeof entry.damageFlat === "number" || typeof entry.damageFlat === "string") {
                    return "flatDamage";
                  }
                  return "";
                }
                return legacyMatch[2].toLowerCase() === "coinflip" ? "coinFlip" : legacyMatch[2].toLowerCase();
              })(),
        damageFlat:
          typeof damage?.flat === "number" || typeof damage?.flat === "string"
            ? String(damage.flat)
            : typeof entry.damageFlat === "number" || typeof entry.damageFlat === "string"
              ? String(entry.damageFlat)
              : "",
        additionalDamageDiceCount:
          typeof additionalDamage?.times === "number" || typeof additionalDamage?.times === "string"
            ? String(additionalDamage.times)
            : typeof additionalDamage?.flat === "number" || typeof additionalDamage?.flat === "string"
              ? String(additionalDamage.flat)
              : "",
        additionalDamageDie:
          typeof additionalDamage?.die === "string"
            ? additionalDamage.die.toLowerCase() === "coinflip"
              ? "coinFlip"
              : additionalDamage.die.toLowerCase()
            : typeof additionalDamage?.flat === "number" || typeof additionalDamage?.flat === "string"
              ? "flatDamage"
              : "",
        rangeMin:
          typeof range?.min === "number" || typeof range?.min === "string"
            ? String(range.min)
            : typeof entry.rangeMin === "number" || typeof entry.rangeMin === "string"
              ? String(entry.rangeMin)
              : "",
        rangeMax:
          typeof range?.max === "number" || typeof range?.max === "string"
            ? String(range.max)
            : typeof entry.rangeMax === "number" || typeof entry.rangeMax === "string"
              ? String(entry.rangeMax)
              : "",
        keywords: Array.isArray(entry.keywords)
          ? entry.keywords.filter((keyword): keyword is string => typeof keyword === "string")
          : [],
      };
    });

  return { keywords, items };
}

function parseEquipmentBuilderToValue(
  keywordRows: EquipmentKeywordRow[],
  itemRows: EquipmentItemRow[],
  blockLabel: "Weapon" | "Armor",
  allowedDamageDice: string[]
) {
  const keywords = keywordRows
    .map((row) => ({
      name: row.name.trim(),
      effect: row.effect.trim(),
      attribute: row.attribute.trim(),
      additionalDamageProfile: row.additionalDamageProfile,
      proficiency: row.proficiency,
      modifier: row.modifier,
      modifierTarget: row.modifierTarget.trim(),
      modifierValue: row.modifierValue.trim(),
    }))
    .filter((row) => row.name);

  const invalidModifierKeyword = keywords.find(
    (keyword) => keyword.modifier && (!keyword.modifierTarget || !keyword.modifierValue)
  );

  if (invalidModifierKeyword) {
    return {
      value: null as unknown,
      error: `${blockLabel} keyword ${invalidModifierKeyword.name} needs both modifier target and modifier value.`,
    };
  }

  const duplicateKeyword = keywords.find(
    (keyword, index) =>
      keywords.findIndex((candidate) => candidate.name.toLowerCase() === keyword.name.toLowerCase()) !== index
  );

  if (duplicateKeyword) {
    return {
      value: null as unknown,
      error: `Duplicate ${blockLabel.toLowerCase()} keyword: ${duplicateKeyword.name}`,
    };
  }

  const keywordLookup = new Map<string, string>();
  const keywordMeta = new Map<string, { additionalDamageProfile: boolean; proficiency: boolean }>();
  for (const keyword of keywords) {
    keywordLookup.set(keyword.name.toLowerCase(), keyword.name);
    keywordMeta.set(keyword.name.toLowerCase(), {
      additionalDamageProfile: keyword.additionalDamageProfile,
      proficiency: keyword.proficiency,
    });
  }

  const parsedKeywords = keywords.map((keyword) => ({
    name: keyword.name,
    effect: keyword.effect,
    additionalDamageProfile: keyword.additionalDamageProfile,
    proficiency: keyword.proficiency,
    ...(keyword.modifier
      ? {
          modifier: {
            target: keyword.modifierTarget,
            value: keyword.modifierValue,
          },
        }
      : {}),
  }));

  const items: Array<Record<string, unknown>> = [];

  for (const row of itemRows) {
    const name = row.name.trim();
    if (!name) {
      continue;
    }

    const item: Record<string, unknown> = { name };
    const attribute = row.attribute.trim();
    if (attribute) {
      item.attribute = attribute;
    }

    const andAttributes = uniqueStrings(row.andAttributes.map((entry) => entry.trim()).filter(Boolean));
    const orAttributes = uniqueStrings(row.orAttributes.map((entry) => entry.trim()).filter(Boolean));
    if (andAttributes.length > 0 || orAttributes.length > 0 || attribute) {
      item.modifierAttributes = {
        ...(attribute ? { base: attribute } : {}),
        ...(andAttributes.length > 0 ? { and: andAttributes } : {}),
        ...(orAttributes.length > 0 ? { or: orAttributes } : {}),
      };
    }

    if (blockLabel === "Armor") {
      const armorValueText = row.armorValue.trim();
      if (armorValueText) {
        const armorValue = Number(armorValueText);
        if (Number.isNaN(armorValue)) {
          return {
            value: null as unknown,
            error: `${blockLabel} armor value for ${name} must be a valid number.`,
          };
        }
        item.armorValue = armorValue;
      }

      const dodgeValueText = row.dodgeValue.trim();
      if (dodgeValueText) {
        const dodgeValue = Number(dodgeValueText);
        if (Number.isNaN(dodgeValue)) {
          return {
            value: null as unknown,
            error: `${blockLabel} dodge value for ${name} must be a valid number.`,
          };
        }
        item.dodgeValue = dodgeValue;
      }
    }

    if (blockLabel === "Weapon") {
      const damageDiceCountText = row.damageDiceCount.trim();
      const damageDie = row.damageDie.trim();

      if ((damageDiceCountText && !damageDie) || (!damageDiceCountText && damageDie)) {
        return {
          value: null as unknown,
          error: `${blockLabel} damage for ${name} requires both amount and die type.`,
        };
      }

      if (damageDie && !allowedDamageDice.map((entry) => entry.toLowerCase()).includes(damageDie.toLowerCase())) {
        return {
          value: null as unknown,
          error: `${blockLabel} damage die for ${name} must be selected from Dice settings.`,
        };
      }

      const damage: Record<string, unknown> = {};
      if (damageDiceCountText && damageDie) {
        const damageDiceCount = Number(damageDiceCountText);
        if (Number.isNaN(damageDiceCount) || damageDiceCount <= 0 || !Number.isInteger(damageDiceCount)) {
          return {
            value: null as unknown,
            error: `${blockLabel} damage amount for ${name} must be a positive whole number.`,
          };
        }
        if (damageDie === "flatDamage") {
          damage.flat = damageDiceCount;
        } else {
          damage.times = damageDiceCount;
          damage.die = damageDie;
        }
      }

      if (Object.keys(damage).length > 0) {
        item.damage = damage;
      }

      const rangeMinText = row.rangeMin.trim();
      const rangeMaxText = row.rangeMax.trim();
      if (rangeMinText || rangeMaxText) {
        const range: Record<string, number> = {};

        if (rangeMinText) {
          const rangeMin = Number(rangeMinText);
          if (Number.isNaN(rangeMin)) {
            return {
              value: null as unknown,
              error: `${blockLabel} range minimum for ${name} must be a valid number.`,
            };
          }
          range.min = rangeMin;
        }

        if (rangeMaxText) {
          const rangeMax = Number(rangeMaxText);
          if (Number.isNaN(rangeMax)) {
            return {
              value: null as unknown,
              error: `${blockLabel} range maximum for ${name} must be a valid number.`,
            };
          }
          range.max = rangeMax;
        }

        if (range.min !== undefined && range.max !== undefined && range.min > range.max) {
          return {
            value: null as unknown,
            error: `${blockLabel} range for ${name} cannot have minimum above maximum.`,
          };
        }

        item.range = range;
      }
    }

    const resolvedKeywords = uniqueStrings(
      row.keywords
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .map((keyword) => keywordLookup.get(keyword.toLowerCase()) || keyword)
    );

    const missingKeyword = resolvedKeywords.find((keyword) => !keywordLookup.has(keyword.toLowerCase()));
    if (missingKeyword) {
      return {
        value: null as unknown,
        error: `${blockLabel} ${name} references unknown keyword: ${missingKeyword}.`,
      };
    }

    if (resolvedKeywords.length > 0) {
      item.keywords = resolvedKeywords;
    }

    if (blockLabel === "Weapon") {
      const supportsAdditionalDamageProfile = resolvedKeywords.some(
        (keyword) => keywordMeta.get(keyword.toLowerCase())?.additionalDamageProfile
      );

      if (supportsAdditionalDamageProfile) {
        const additionalDamageDiceCountText = row.additionalDamageDiceCount.trim();
        const additionalDamageDie = row.additionalDamageDie.trim();

        if ((additionalDamageDiceCountText && !additionalDamageDie) || (!additionalDamageDiceCountText && additionalDamageDie)) {
          return {
            value: null as unknown,
            error: `Additional damage for ${name} requires both amount and die type.`,
          };
        }

        if (additionalDamageDiceCountText && additionalDamageDie) {
          if (
            !allowedDamageDice.map((entry) => entry.toLowerCase()).includes(additionalDamageDie.toLowerCase())
          ) {
            return {
              value: null as unknown,
              error: `Additional damage die for ${name} must be selected from Dice settings.`,
            };
          }

          const additionalDamageCount = Number(additionalDamageDiceCountText);
          if (Number.isNaN(additionalDamageCount) || additionalDamageCount <= 0 || !Number.isInteger(additionalDamageCount)) {
            return {
              value: null as unknown,
              error: `Additional damage amount for ${name} must be a positive whole number.`,
            };
          }

          item.additionalDamage =
            additionalDamageDie === "flatDamage"
              ? { flat: additionalDamageCount }
              : { times: additionalDamageCount, die: additionalDamageDie };
        }
      }
    }

    items.push(item);
  }

  if (items.length === 0) {
    return {
      value: null as unknown,
      error: `Add at least one ${blockLabel.toLowerCase()}.`,
    };
  }

  const duplicateItem = items.find(
    (item, index) =>
      items.findIndex(
        (candidate) =>
          String(candidate.name).toLowerCase() === String(item.name).toLowerCase()
      ) !== index
  );

  if (duplicateItem) {
    return {
      value: null as unknown,
      error: `Duplicate ${blockLabel.toLowerCase()} name: ${String(duplicateItem.name)}`,
    };
  }

  return {
    value: {
      keywords: parsedKeywords,
      items,
    },
    error: null as string | null,
  };
}

function parseBuilderField(field: BuilderField, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: null as unknown, error: null as string | null };
  }

  if (field.type === "text" || field.type === "select") {
    return { value, error: null as string | null };
  }

  if (field.type === "number") {
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      return { value: null as unknown, error: `${field.label} must be a valid number.` };
    }
    return { value: parsed, error: null as string | null };
  }

  if (field.type === "boolean") {
    return { value: trimmed === "true", error: null as string | null };
  }

  if (field.type === "textArray") {
    return {
      value: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      error: null as string | null,
    };
  }

  if (field.type === "json") {
    return { value: parseFlexibleStructuredInput(trimmed), error: null as string | null };
  }

  return { value: trimmed, error: null as string | null };
}

function parseBuilderToValue(
  blockKey: BlockKey,
  objectValues: Record<string, string>,
  listItems: Array<Record<string, string>>
) {
  const config = BLOCK_BUILDERS[blockKey];

  if (config.mode === "list") {
    const parsedList: Record<string, unknown>[] = [];

    for (const item of listItems) {
      const parsedItem: Record<string, unknown> = {};
      for (const field of config.fields) {
        const parsed = parseBuilderField(field, item[field.key] ?? "");
        if (parsed.error) {
          return { value: null as unknown, error: parsed.error };
        }
        if (parsed.value !== null) {
          parsedItem[field.key] = parsed.value;
        }
      }

      if (Object.keys(parsedItem).length > 0) {
        parsedList.push(parsedItem);
      }
    }

    return {
      value: parsedList.length > 0 ? parsedList : null,
      error: null as string | null,
    };
  }

  const parsedObject: Record<string, unknown> = {};
  for (const field of config.fields) {
    const parsed = parseBuilderField(field, objectValues[field.key] ?? "");
    if (parsed.error) {
      return { value: null as unknown, error: parsed.error };
    }
    if (parsed.value !== null) {
      parsedObject[field.key] = parsed.value;
    }
  }

  return {
    value: Object.keys(parsedObject).length > 0 ? parsedObject : null,
    error: null as string | null,
  };
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
    };
  }

  if (value === null || value === undefined) {
    return {
      title: defaultTitle,
      summary: "",
      tags: "",
    };
  }

  return {
    title: defaultTitle,
    summary: "",
    tags: "",
  };
}

function builderValueToInputString(field: BuilderField, value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (field.type === "boolean") {
    return value ? "true" : "false";
  }

  if (field.type === "textArray" && Array.isArray(value)) {
    return value.map(String).join(", ");
  }

  if (field.type === "json") {
    return structuredValueToInputString(value);
  }

  return String(value);
}

function parseScalarValue(value: string): string | number | boolean {
  const trimmed = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (trimmed.toLowerCase() === "true") {
    return true;
  }
  if (trimmed.toLowerCase() === "false") {
    return false;
  }
  return trimmed;
}

function parseFlexibleStructuredInput(input: string): unknown {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const lines = trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 0 && lines.every((line) => line.includes("|"))) {
      const rows = lines
        .map((line) => {
          const [name, derivedFrom, formula] = line.split("|").map((part) => part.trim());
          const row: Record<string, string> = {};
          if (name) row.name = name;
          if (derivedFrom) row.derivedFrom = derivedFrom;
          if (formula) row.formula = formula;
          return row;
        })
        .filter((row) => Object.keys(row).length > 0);

      if (rows.length > 0) {
        return rows;
      }
    }

    const pairCandidates = (lines.length > 0 ? lines : trimmed.split(",")).map((entry) => entry.trim()).filter(Boolean);
    if (pairCandidates.every((entry) => entry.includes(":") || entry.includes("="))) {
      const record: Record<string, string | number | boolean | string[]> = {};
      for (const entry of pairCandidates) {
        const separatorIndex = Math.max(entry.indexOf(":"), entry.indexOf("="));
        const key = entry.slice(0, separatorIndex).trim();
        const rawValue = entry.slice(separatorIndex + 1).trim();
        if (!key) {
          continue;
        }

        if (rawValue.includes(",")) {
          record[key] = rawValue
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        } else {
          record[key] = parseScalarValue(rawValue);
        }
      }

      if (Object.keys(record).length > 0) {
        return record;
      }
    }

    if (lines.length > 1) {
      return lines;
    }

    return trimmed;
  }
}

function structuredValueToInputString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    if (
      value.every(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          ("name" in (item as Record<string, unknown>) ||
            "derivedFrom" in (item as Record<string, unknown>) ||
            "formula" in (item as Record<string, unknown>))
      )
    ) {
      return value
        .map((item) => {
          const row = item as Record<string, unknown>;
          const name = typeof row.name === "string" ? row.name : "";
          const derivedFrom = typeof row.derivedFrom === "string" ? row.derivedFrom : "";
          const formula = typeof row.formula === "string" ? row.formula : "";
          return [name, derivedFrom, formula].filter(Boolean).join(" | ");
        })
        .filter(Boolean)
        .join("\n");
    }

    if (value.every((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean")) {
      return value.map(String).join("\n");
    }

    return "";
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries
      .map(([key, entryValue]) => {
        if (
          typeof entryValue === "string" ||
          typeof entryValue === "number" ||
          typeof entryValue === "boolean"
        ) {
          return `${key}: ${String(entryValue)}`;
        }
        if (Array.isArray(entryValue) && entryValue.every((item) => typeof item === "string")) {
          return `${key}: ${entryValue.join(", ")}`;
        }
        return `${key}:`;
      })
      .join("\n");
  }

  return String(value);
}

function buildBuilderStateFromValue(blockKey: BlockKey, value: unknown) {
  const dataSource = extractBlockData(value);
  const config = BLOCK_BUILDERS[blockKey];

  if (config.mode === "list") {
    if (!Array.isArray(dataSource)) {
      return {
        objectValues: {} as Record<string, string>,
        listItems: [] as Array<Record<string, string>>,
      };
    }

    const listItems = dataSource
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
      .map((item) =>
        Object.fromEntries(
          config.fields.map((field) => {
            const fallbackValue =
              field.key === "category" && item[field.key] === undefined && blockKey !== "currencies"
                ? item.type
                : item[field.key];
            return [field.key, builderValueToInputString(field, fallbackValue)];
          })
        )
      );

    return {
      objectValues: {} as Record<string, string>,
      listItems,
    };
  }

  const sourceObject =
    dataSource && typeof dataSource === "object" && !Array.isArray(dataSource)
      ? (dataSource as Record<string, unknown>)
      : {};

  const objectValues = Object.fromEntries(
    config.fields.map((field) => [field.key, builderValueToInputString(field, sourceObject[field.key])])
  );

  return {
    objectValues,
    listItems: [] as Array<Record<string, string>>,
  };
}

function createEmptyClassForm(): ClassFormState {
  return {
    name: "",
    hitDie: "",
    hitPointsAtFirstLevel: "",
    hitPointsModifierStat: "",
    skillProficiencyOptions: [],
    skillProficiencyChoices: "",
    resources: [],
    levels: [],
  };
}

function createEmptyClassResourceRow(): ClassResourceFormRow {
  return {
    id: `resource-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "currency",
    label: "",
    definition: "",
    amount: "",
  };
}

function createEmptyClassLevel(level: number): ClassLevelForm {
  return {
    id: `level-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    resources: [],
  };
}

function getNextClassLevel(levels: ClassLevelForm[]) {
  if (levels.length === 0) {
    return 2;
  }

  return Math.max(...levels.map((entry) => entry.level)) + 1;
}

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractClassesList(value: unknown): Record<string, unknown>[] {
  const data = extractBlockData(value);
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)
  );
}

function buildClassFormFromValue(value: Record<string, unknown>, index: number): ClassFormState {
  const resources =
    value.resources && typeof value.resources === "object" && !Array.isArray(value.resources)
      ? (value.resources as Record<string, unknown>)
      : {};

  const legacySkillOptions: string[] = [];
  let legacySkillChoices = "";

  const resourceRows: ClassResourceFormRow[] = Object.entries(resources).flatMap(([type, items]) => {
    if (!Array.isArray(items)) {
      return [];
    }

    const mappedType = mapLegacyResourceType(type);

    return items
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .flatMap((item, itemIndex) => {
        if (mappedType === "proficiencySkill") {
          if (typeof item.label === "string" && item.label.trim()) {
            legacySkillOptions.push(item.label.trim());
          }
          if (!legacySkillChoices && (typeof item.amount === "number" || typeof item.amount === "string")) {
            legacySkillChoices = String(item.amount);
          }
          return [];
        }

        return {
          id: `resource-${index}-${type}-${itemIndex}`,
          type: mappedType,
          label: typeof item.label === "string" ? item.label : "",
          definition: typeof item.definition === "string" ? item.definition : "",
          amount:
            typeof item.amount === "number" || typeof item.amount === "string" ? String(item.amount) : "",
        };
      });
  });

  const skillProficienciesSource =
    value.skillProficiencies && typeof value.skillProficiencies === "object" && !Array.isArray(value.skillProficiencies)
      ? (value.skillProficiencies as Record<string, unknown>)
      : null;

  const skillProficiencyOptions = uniqueStrings([
    ...(Array.isArray(skillProficienciesSource?.options)
      ? skillProficienciesSource.options.filter((entry): entry is string => typeof entry === "string")
      : []),
    ...legacySkillOptions,
  ]);

  const skillProficiencyChoices =
    typeof skillProficienciesSource?.choose === "number" || typeof skillProficienciesSource?.choose === "string"
      ? String(skillProficienciesSource.choose)
      : legacySkillChoices;

  const hpAtFirstLevel = value.hitPointsAtFirstLevel;
  let hitPointsAtFirstLevel = "";
  let hitPointsModifierStat = "";

  if (typeof hpAtFirstLevel === "number" || typeof hpAtFirstLevel === "string") {
    hitPointsAtFirstLevel = String(hpAtFirstLevel);
  } else if (hpAtFirstLevel && typeof hpAtFirstLevel === "object" && !Array.isArray(hpAtFirstLevel)) {
    const hpObject = hpAtFirstLevel as Record<string, unknown>;
    if (typeof hpObject.value === "number" || typeof hpObject.value === "string") {
      hitPointsAtFirstLevel = String(hpObject.value);
    }
    if (typeof hpObject.modifierStat === "string") {
      hitPointsModifierStat = hpObject.modifierStat;
    }
  }

  const levels = Array.isArray(value.levels)
    ? value.levels
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry, levelIndex) => {
          const levelNumber = typeof entry.level === "number" ? entry.level : levelIndex + 2;
          const levelResourcesSource =
            entry.resources && typeof entry.resources === "object" && !Array.isArray(entry.resources)
              ? (entry.resources as Record<string, unknown>)
              : {};

          const levelResources = Object.entries(levelResourcesSource).flatMap(([type, items]) => {
            if (!Array.isArray(items)) {
              return [];
            }

            const mappedType = mapLegacyResourceType(type);
            if (mappedType === "proficiencyStat") {
              return [];
            }

            return items
              .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
              .map((item, itemIndex) => ({
                id: `resource-level-${levelIndex}-${type}-${itemIndex}`,
                type: mappedType,
                label: typeof item.label === "string" ? item.label : "",
                definition: typeof item.definition === "string" ? item.definition : "",
                amount:
                  typeof item.amount === "number" || typeof item.amount === "string"
                    ? String(item.amount)
                    : "",
              }));
          });

          return {
            id: `level-${index}-${levelIndex}`,
            level: levelNumber,
            resources: levelResources,
          };
        })
    : [];

  return {
    name: typeof value.name === "string" ? value.name : "",
    hitDie: typeof value.hitDie === "string" ? value.hitDie : "",
    hitPointsAtFirstLevel,
    hitPointsModifierStat,
    skillProficiencyOptions,
    skillProficiencyChoices,
    resources: resourceRows,
    levels,
  };
}

function buildClassResourcesPayload(rows: ClassResourceFormRow[]) {
  const resources: Record<string, Array<Record<string, string | number>>> = {};

  for (const resource of rows) {
    if (resource.type === "proficiencyStat") {
      continue;
    }

    if (classResourceLabelRequired(resource.type) && !resource.label.trim()) {
      return {
        resources: null,
        error: `Select a label for ${getClassResourceTypeLabel(resource.type)}.`,
      };
    }

    if (resource.type === "featureClass" && !resource.definition.trim()) {
      return {
        resources: null,
        error: "Definition is required for Features (Class).",
      };
    }

    if (classResourceAmountRequired(resource.type) && !resource.amount.trim()) {
      return {
        resources: null,
        error: `Amount is required for ${getClassResourceTypeLabel(resource.type)}.`,
      };
    }

    if (resource.amount.trim() && classResourceAmountMustBeSignedNumber(resource.type)) {
      const amountNumber = Number(resource.amount.trim());
      if (Number.isNaN(amountNumber)) {
        return {
          resources: null,
          error: `${getClassResourceTypeLabel(resource.type)} amount must be a valid positive or negative number.`,
        };
      }
    }

    if (resource.amount.trim() && classResourceAmountMustBePositiveInteger(resource.type)) {
      const amountNumber = Number(resource.amount.trim());
      if (!Number.isInteger(amountNumber) || amountNumber < 1) {
        return {
          resources: null,
          error: `${getClassResourceTypeLabel(resource.type)} amount must be a positive whole number.`,
        };
      }
    }

    const resourceEntry: Record<string, string | number> = {};

    if (classResourceUsesLabel(resource.type) && resource.label.trim()) {
      resourceEntry.label = resource.label.trim();
    }

    if (resource.amount.trim()) {
      const numericAmount = Number(resource.amount.trim());
      resourceEntry.amount = Number.isNaN(numericAmount) ? resource.amount.trim() : numericAmount;
    }

    if (resource.type === "featureClass") {
      resourceEntry.definition = resource.definition.trim();
    }

    if (Object.keys(resourceEntry).length === 0) {
      continue;
    }

    const key = mapResourceTypeToKey(resource.type);
    if (!resources[key]) {
      resources[key] = [];
    }

    const existingIndex = resources[key].findIndex((entry) => {
      const existingLabel = typeof entry.label === "string" ? entry.label.trim().toLowerCase() : "";
      const nextLabel = typeof resourceEntry.label === "string" ? resourceEntry.label.trim().toLowerCase() : "";

      if (classResourceUsesLabel(resource.type)) {
        return existingLabel !== "" && nextLabel !== "" && existingLabel === nextLabel;
      }

      return true;
    });

    if (existingIndex >= 0) {
      const existing = resources[key][existingIndex];
      const existingAmount = typeof existing.amount === "number" ? existing.amount : Number(existing.amount);
      const nextAmount = typeof resourceEntry.amount === "number" ? resourceEntry.amount : Number(resourceEntry.amount);

      if (!Number.isNaN(existingAmount) && !Number.isNaN(nextAmount)) {
        existing.amount = existingAmount + nextAmount;
      } else if (existing.amount === undefined && resourceEntry.amount !== undefined) {
        existing.amount = resourceEntry.amount;
      }

      if (existing.definition === undefined && resourceEntry.definition !== undefined) {
        existing.definition = resourceEntry.definition;
      }

      if (existing.label === undefined && resourceEntry.label !== undefined) {
        existing.label = resourceEntry.label;
      }
    } else {
      resources[key].push(resourceEntry);
    }
  }

  return {
    resources,
    error: null as string | null,
  };
}

function classFormToValue(form: ClassFormState): {
  value: Record<string, unknown> | null;
  error: string | null;
} {
  if (!form.name.trim()) {
    return {
      value: null,
      error: "Class name is required.",
    };
  }

  const baseResources = buildClassResourcesPayload(form.resources);
  if (baseResources.error || !baseResources.resources) {
    return {
      value: null,
      error: baseResources.error || "Invalid resources.",
    };
  }

  const value: Record<string, unknown> = {
    name: form.name.trim(),
  };

  if (form.hitDie.trim()) {
    value.hitDie = form.hitDie.trim();
  }

  if (form.hitPointsAtFirstLevel.trim()) {
    const hpValue = Number(form.hitPointsAtFirstLevel.trim());
    if (Number.isNaN(hpValue)) {
      return {
        value: null,
        error: "Hit Points at 1st Level must be a valid number.",
      };
    }

    value.hitPointsAtFirstLevel = {
      value: hpValue,
      ...(form.hitPointsModifierStat && { modifierStat: form.hitPointsModifierStat }),
    };
  }

  if (Object.keys(baseResources.resources).length > 0) {
    value.resources = baseResources.resources;
  }

  const skillOptions = uniqueStrings(form.skillProficiencyOptions.map((option) => option.trim()).filter(Boolean));
  const skillChoiceCountRaw = form.skillProficiencyChoices.trim();

  if (skillOptions.length > 0 || skillChoiceCountRaw) {
    const skillChoiceCount = Number(skillChoiceCountRaw);
    if (!skillChoiceCountRaw || !Number.isInteger(skillChoiceCount) || skillChoiceCount < 1) {
      return {
        value: null,
        error: "Skill proficiency choice count must be a positive whole number.",
      };
    }

    if (skillOptions.length === 0) {
      return {
        value: null,
        error: "Add at least one skill proficiency option.",
      };
    }

    if (skillChoiceCount > skillOptions.length) {
      return {
        value: null,
        error: "Skill proficiency choice count cannot exceed available skill options.",
      };
    }

    value.skillProficiencies = {
      options: skillOptions,
      choose: skillChoiceCount,
    };
  }

  if (form.levels.length > 0) {
    const levelNumbers = form.levels.map((entry) => entry.level);
    if (new Set(levelNumbers).size !== levelNumbers.length) {
      return {
        value: null,
        error: "Each level entry must have a unique level number.",
      };
    }

    const levelEntries: Array<Record<string, unknown>> = [];
    for (const level of form.levels) {
      const levelResources = buildClassResourcesPayload(level.resources);
      if (levelResources.error || !levelResources.resources) {
        return {
          value: null,
          error: `Level ${level.level}: ${levelResources.error || "invalid resources"}`,
        };
      }

      const levelEntry: Record<string, unknown> = { level: level.level };
      if (Object.keys(levelResources.resources).length > 0) {
        levelEntry.resources = levelResources.resources;
      }
      levelEntries.push(levelEntry);
    }

    value.levels = levelEntries.sort((a, b) => Number(a.level) - Number(b.level));
  }

  return {
    value,
    error: null as string | null,
  };
}

function mapLegacyResourceType(input: string): ClassResourceType {
  switch (input) {
    case "currency":
      return "currency";
    case "featuresClass":
    case "featureClass":
      return "featureClass";
    case "features":
    case "featureChoice":
    case "feature":
      return "featureChoice";
    case "statBonuses":
    case "statBonus":
      return "statBonus";
    case "resistances":
    case "resistance":
      return "resistance";
    case "items":
    case "item":
      return "item";
    case "languages":
      return "languages";
    case "proficienciesStats":
    case "proficiencyStat":
      return "proficiencyStat";
    case "proficienciesSkills":
    case "proficiencySkill":
      return "proficiencySkill";
    case "proficienciesStatsPlus":
    case "proficiencyStatPlus":
      return "proficiencyStatPlus";
    case "proficienciesWeapons":
    case "proficiencyWeapon":
      return "proficiencyWeapon";
    case "proficienciesArmor":
    case "proficiencyArmor":
      return "proficiencyArmor";
    case "proficienciesTools":
    case "proficiencyTool":
      return "proficiencyTool";
    default:
      return "featureChoice";
  }
}

function mapResourceTypeToKey(type: ClassResourceType): string {
  switch (type) {
    case "currency":
      return "currency";
    case "featureClass":
      return "featuresClass";
    case "featureChoice":
      return "features";
    case "statBonus":
      return "statBonuses";
    case "resistance":
      return "resistances";
    case "item":
      return "items";
    case "languages":
      return "languages";
    case "proficiencyStat":
      return "proficienciesStats";
    case "proficiencySkill":
      return "proficienciesSkills";
    case "proficiencyStatPlus":
      return "proficienciesStatsPlus";
    case "proficiencyWeapon":
      return "proficienciesWeapons";
    case "proficiencyArmor":
      return "proficienciesArmor";
    case "proficiencyTool":
      return "proficienciesTools";
  }
}

function classResourceUsesLabel(type: ClassResourceType) {
  return !["languages", "featureChoice"].includes(type);
}

function classResourceLabelMode(type: ClassResourceType): "none" | "text" | "select" {
  if (!classResourceUsesLabel(type)) {
    return "none";
  }
  if (type === "featureClass") {
    return "text";
  }
  if (type === "resistance") {
    return "text";
  }
  return "select";
}

function classResourceLabelRequired(type: ClassResourceType) {
  return classResourceUsesLabel(type);
}

function classResourceAmountRequired(type: ClassResourceType) {
  return ["currency", "featureChoice", "statBonus", "resistance", "item", "languages", "proficiencyStatPlus"].includes(type);
}

function classResourceUsesAmount(type: ClassResourceType) {
  return ![
    "featureClass",
    "proficiencyStat",
    "proficiencySkill",
    "proficiencyWeapon",
    "proficiencyArmor",
    "proficiencyTool",
  ].includes(type);
}

function classResourceAmountMustBeSignedNumber(type: ClassResourceType) {
  return type === "resistance";
}

function classResourceAmountMustBePositiveInteger(type: ClassResourceType) {
  return type === "proficiencyStatPlus";
}

function getClassResourceTypeLabel(type: ClassResourceType) {
  return CLASS_RESOURCE_OPTIONS.find((option) => option.value === type)?.label || type;
}

function extractNamedOptions(value: unknown): string[] {
  const data = extractBlockData(value);
  const list =
    data && typeof data === "object" && !Array.isArray(data) && Array.isArray((data as { currencies?: unknown }).currencies)
      ? (data as { currencies: unknown[] }).currencies
      : data && typeof data === "object" && !Array.isArray(data) && Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
      : data;

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return "";
      }
      const obj = entry as Record<string, unknown>;
      return typeof obj.name === "string" ? obj.name.trim() : "";
    })
    .filter(Boolean);
}

function extractEquipmentKeywordNames(value: unknown): string[] {
  const data = extractBlockData(value);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return [];
  }

  const keywords = (data as Record<string, unknown>).keywords;
  if (!Array.isArray(keywords)) {
    return [];
  }

  return keywords
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return "";
      }
      const name = (entry as Record<string, unknown>).name;
      return typeof name === "string" ? name.trim() : "";
    })
    .filter(Boolean);
}

function extractEquipmentProficiencyKeywordNames(value: unknown): string[] {
  const data = extractBlockData(value);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return [];
  }

  const keywords = (data as Record<string, unknown>).keywords;
  if (!Array.isArray(keywords)) {
    return [];
  }

  return keywords
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return "";
      }
      const keyword = entry as Record<string, unknown>;
      const isProficiency = Boolean(keyword.proficiency) || Boolean(keyword.isProficiency);
      if (!isProficiency) {
        return "";
      }
      return typeof keyword.name === "string" ? keyword.name.trim() : "";
    })
    .filter(Boolean);
}

function extractCategoryOptions(value: unknown, categoryKey = "type"): string[] {
  const list = extractBlockData(value);
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return "";
      }
      const obj = entry as Record<string, unknown>;
      return typeof obj[categoryKey] === "string" ? obj[categoryKey].trim() : "";
    })
    .filter(Boolean);
}

function extractPrimaryStatNames(statBlocksValue: unknown): string[] {
  const statBlocks = extractBlockData(statBlocksValue);
  if (!statBlocks || typeof statBlocks !== "object" || Array.isArray(statBlocks)) {
    return [];
  }

  const attributes = (statBlocks as Record<string, unknown>).attributes;
  if (Array.isArray(attributes)) {
    const parsedAttributes = attributes
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
      .map((entry) => {
        const shorthand = typeof entry.shorthand === "string" ? entry.shorthand.trim() : "";
        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        return shorthand || name;
      })
      .filter(Boolean);

    if (parsedAttributes.length > 0) {
      return parsedAttributes;
    }
  }

  const primaryStats = (statBlocks as Record<string, unknown>).primaryStats;
  if (Array.isArray(primaryStats)) {
    return primaryStats.filter((entry): entry is string => typeof entry === "string");
  }
  if (primaryStats && typeof primaryStats === "object" && !Array.isArray(primaryStats)) {
    return Object.keys(primaryStats as Record<string, unknown>);
  }
  return [];
}

function extractSkillNames(skillsValue: unknown): string[] {
  const skills = extractBlockData(skillsValue);
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return "";
      }
      const name = (entry as Record<string, unknown>).name;
      return typeof name === "string" ? name.trim() : "";
    })
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildClassResourceLabelOptions(system: System): Record<ClassResourceType, string[]> {
  const currencies = extractNamedOptions(system.currencies);
  const features = extractNamedOptions(system.features);
  const items = extractNamedOptions(system.items);
  const primaryStats = extractPrimaryStatNames(system.statBlocks);
  const skills = extractSkillNames(system.skills);
  const weapons = extractNamedOptions(system.weapons);
  const weaponKeywords = extractEquipmentProficiencyKeywordNames(system.weapons);
  const armor = extractNamedOptions(system.armor);
  const armorKeywords = extractEquipmentProficiencyKeywordNames(system.armor);
  const tools = extractNamedOptions(system.tools);

  return {
    currency: uniqueStrings(currencies),
    featureClass: [],
    featureChoice: [],
    statBonus: uniqueStrings(primaryStats),
    resistance: [],
    item: uniqueStrings(items),
    languages: [],
    proficiencyStat: uniqueStrings(primaryStats),
    proficiencySkill: uniqueStrings(skills),
    proficiencyStatPlus: uniqueStrings(primaryStats),
    proficiencyWeapon: uniqueStrings([...weapons, ...weaponKeywords]),
    proficiencyArmor: uniqueStrings([...armor, ...armorKeywords]),
    proficiencyTool: uniqueStrings(tools),
  };
}

function buildWrappedListPayload(previous: unknown, data: Record<string, unknown>[], defaultTitle: string) {
  if (
    previous &&
    typeof previous === "object" &&
    !Array.isArray(previous) &&
    ("title" in previous || "summary" in previous || "tags" in previous || "data" in previous)
  ) {
    const previousObject = previous as Record<string, unknown>;
    return {
      title: typeof previousObject.title === "string" ? previousObject.title : defaultTitle,
      summary: typeof previousObject.summary === "string" ? previousObject.summary : null,
      tags: Array.isArray(previousObject.tags)
        ? previousObject.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      data,
      updatedAt: new Date().toISOString(),
    };
  }

  return data;
}

function RuleSection({
  blockKey,
  title,
  hasContent,
  value,
  isOwner,
  summaryOnly = false,
  onConfigure,
}: {
  blockKey: BlockKey;
  title: string;
  hasContent: boolean;
  value: unknown;
  isOwner: boolean;
  summaryOnly?: boolean;
  onConfigure: () => void;
}) {
  const preview = getBlockPreview(value);
  const namedListSummaryText = ["tools", "weapons", "armor", "items"].includes(blockKey)
    ? extractNamedOptions(value).join(", ")
    : "";
  const summaryText =
    ["tools", "weapons", "armor", "items"].includes(blockKey)
      ? namedListSummaryText
      : preview?.summary?.trim()
        ? preview.summary
        : "";

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
          {isOwner ? "Edit" : "View Only"}
        </button>
      </div>

      {hasContent && preview && (
        <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {summaryOnly ? (
            <>
              {summaryText ? <p className="text-xs text-zinc-600 dark:text-zinc-400">{summaryText}</p> : null}
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ClassesRuleSection({
  value,
  isOwner,
  onAddClass,
  onEditClass,
  onDeleteClass,
}: {
  value: unknown;
  isOwner: boolean;
  onAddClass: () => void;
  onEditClass: (index: number) => void;
  onDeleteClass: (index: number) => void;
}) {
  const classes = extractClassesList(value);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 md:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Classes</h3>
          <span
            className={`mt-2 inline-block text-xs px-2 py-1 rounded ${
              classes.length > 0
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {classes.length > 0 ? `${classes.length} configured` : "Not set"}
          </span>
        </div>
        {isOwner && (
          <button
            onClick={onAddClass}
            className="rounded-lg bg-blue-600 text-white px-3 py-2 text-xs hover:bg-blue-700"
          >
            Add Class
          </button>
        )}
      </div>

      {classes.length > 0 ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {classes.map((classItem, index) => {
            const className = typeof classItem.name === "string" ? classItem.name : `Class ${index + 1}`;
            const hitDie = typeof classItem.hitDie === "string" ? classItem.hitDie : "";
            const primaryStats = Array.isArray(classItem.primaryStats)
              ? classItem.primaryStats.filter((item): item is string => typeof item === "string")
              : [];

            return (
              <div key={`${className}-${index}`} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{className}</p>
                {hitDie && <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Hit Die: {hitDie}</p>}
                {primaryStats.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Primary Stats: {primaryStats.join(", ")}
                  </p>
                )}

                {isOwner && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => onEditClass(index)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Edit Class
                    </button>
                    <button
                      onClick={() => onDeleteClass(index)}
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
                    >
                      Delete Class
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Add classes one at a time. You can edit each class individually later.
        </p>
      )}
    </div>
  );
}

function BuilderFieldInput({
  field,
  value,
  onChange,
}: {
  field: BuilderField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "boolean") {
    return (
      <select
        value={value || "false"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Select an option</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "json") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={field.placeholder}
        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900"
      />
    );
  }

  return (
    <input
      type={field.type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
    />
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
