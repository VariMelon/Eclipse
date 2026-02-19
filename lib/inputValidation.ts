import fs from "fs";
import path from "path";

type ValidationResult = {
  ok: boolean;
  error?: string;
};

const DANGEROUS_CHARACTER_PATTERN = /[\u0000-\u001F\u007F*%_?]/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function loadBlockedWordsFromFile(): string[] {
  try {
    const blockedWordsPath = path.join(process.cwd(), "config", "blocked-words.txt");
    const fileContents = fs.readFileSync(blockedWordsPath, "utf8");

    return fileContents
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch {
    return [];
  }
}

const BLOCKED_WORDS = [
  ...new Set([
    ...loadBlockedWordsFromFile(),
    ...(process.env.INPUT_BLACKLIST_WORDS || "")
      .split(",")
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean),
  ]),
];

function findBlockedWord(value: string): string | null {
  const normalized = value.toLowerCase();

  for (const blockedWord of BLOCKED_WORDS) {
    if (normalized.includes(blockedWord)) {
      return blockedWord;
    }
  }

  return null;
}

function validateText(value: string, path: string): ValidationResult {
  if (DANGEROUS_CHARACTER_PATTERN.test(value)) {
    return {
      ok: false,
      error: `Input field '${path}' contains forbidden characters.`,
    };
  }

  const blockedWord = findBlockedWord(value);
  if (blockedWord) {
    return {
      ok: false,
      error: `Input field '${path}' contains a blocked term.`,
    };
  }

  return { ok: true };
}

export function validateUserInput(input: unknown, path = "root"): ValidationResult {
  if (typeof input === "string") {
    return validateText(input, path);
  }

  if (Array.isArray(input)) {
    for (let index = 0; index < input.length; index += 1) {
      const result = validateUserInput(input[index], `${path}[${index}]`);
      if (!result.ok) {
        return result;
      }
    }
    return { ok: true };
  }

  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>);
    for (const [key, value] of entries) {
      const result = validateUserInput(value, path === "root" ? key : `${path}.${key}`);
      if (!result.ok) {
        return result;
      }
    }
  }

  return { ok: true };
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value);
}

export function isValidUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function isStringLengthBetween(value: string, min: number, max: number) {
  return value.length >= min && value.length <= max;
}
