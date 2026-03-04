type ResourceEntry = {
  label: string;
  amount: number;
  definition?: string;
};

type ResourceAccumulator = Record<string, Record<string, ResourceEntry>>;

const RESOURCE_BLOCK_KEYS = [
  "races",
  "classes",
  "backgrounds",
  "features",
  "items",
  "spells",
  "weapons",
  "armor",
  "tools",
] as const;

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

function normalizeLabel(label: string) {
  return label.trim().toLowerCase();
}

function asNumber(value: unknown) {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function extractCurrencyMap(system: Record<string, unknown>) {
  const currenciesBlock = extractBlockData(system.currencies);
  const map = new Map<string, string>();

  if (!Array.isArray(currenciesBlock)) {
    return map;
  }

  for (const entry of currenciesBlock) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const name = (entry as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim()) {
      map.set(name.trim().toLowerCase(), name.trim());
    }
  }

  return map;
}

function ensureTypeBucket(acc: ResourceAccumulator, type: string) {
  if (!acc[type]) {
    acc[type] = {};
  }

  return acc[type];
}

function addEntry(acc: ResourceAccumulator, type: string, label: string, amount: number, definition?: string) {
  const bucket = ensureTypeBucket(acc, type);
  const normalized = normalizeLabel(label || "unlabeled");

  if (!bucket[normalized]) {
    bucket[normalized] = {
      label: label || "Unlabeled",
      amount: 0,
    };
  }

  bucket[normalized].amount += amount;
  if (!bucket[normalized].definition && definition) {
    bucket[normalized].definition = definition;
  }
}

function mergeResourceObject(
  resourceObject: Record<string, unknown>,
  currencyMap: Map<string, string>,
  acc: ResourceAccumulator
) {
  for (const [key, value] of Object.entries(resourceObject)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          continue;
        }

        const obj = item as Record<string, unknown>;
        const label = typeof obj.label === "string" ? obj.label : "Unlabeled";
        const amount = asNumber(obj.amount);
        const definition = typeof obj.definition === "string" ? obj.definition : undefined;
        addEntry(acc, key, label, amount, definition);
      }
      continue;
    }

    if (typeof value === "number" || typeof value === "string") {
      const normalizedKey = key.trim().toLowerCase();
      const isCurrency = currencyMap.has(normalizedKey);
      const type = isCurrency ? "currency" : "misc";
      const label = isCurrency ? (currencyMap.get(normalizedKey) as string) : key;
      const amount = asNumber(value);
      addEntry(acc, type, label, amount);
    }
  }
}

function collectResourceObjects(node: unknown): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];

  function walk(value: unknown) {
    if (!value || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        walk(entry);
      }
      return;
    }

    const obj = value as Record<string, unknown>;
    if (obj.resources && typeof obj.resources === "object" && !Array.isArray(obj.resources)) {
      found.push(obj.resources as Record<string, unknown>);
    }

    for (const nested of Object.values(obj)) {
      walk(nested);
    }
  }

  walk(node);
  return found;
}

export function mergeSystemResources(system: Record<string, unknown>) {
  const currencyMap = extractCurrencyMap(system);
  const accumulator: ResourceAccumulator = {};

  for (const blockKey of RESOURCE_BLOCK_KEYS) {
    const blockValue = extractBlockData(system[blockKey]);
    const resourceObjects = collectResourceObjects(blockValue);

    for (const resourceObject of resourceObjects) {
      mergeResourceObject(resourceObject, currencyMap, accumulator);
    }
  }

  return Object.fromEntries(
    Object.entries(accumulator).map(([type, byLabel]) => [
      type,
      Object.values(byLabel).sort((a, b) => a.label.localeCompare(b.label)),
    ])
  );
}
