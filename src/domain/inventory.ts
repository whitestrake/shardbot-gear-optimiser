import type { CatalogItem } from './types';

export type InventoryQuantities = Record<string, number>;

export interface InventoryParseResult {
  quantities: InventoryQuantities;
  invalidLines: string[];
}

export function parseInventoryText(text: string): InventoryQuantities {
  return parseInventoryTextWithValidation(text).quantities;
}

export function parseInventoryTextWithValidation(
  text: string,
  items: readonly CatalogItem[] = [],
): InventoryParseResult {
  const quantities: InventoryQuantities = {};
  const invalidLines: string[] = [];
  const knownNames = new Set(
    items.flatMap((item) => [normalizeInventoryName(item.id), normalizeInventoryName(item.name)]),
  );

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const parsed = parseInventoryLine(line);
    if (!parsed) {
      continue;
    }

    const { name, quantity } = parsed;
    if (knownNames.size > 0 && !knownNames.has(normalizeInventoryName(name))) {
      invalidLines.push(line);
      continue;
    }
    quantities[name] = (quantities[name] ?? 0) + quantity;
  }

  return { quantities, invalidLines };
}

export function filterItemsByInventory(items: CatalogItem[], quantities: InventoryQuantities): CatalogItem[] {
  const availableQuantities = new Map<string, number>();

  for (const [name, quantity] of Object.entries(quantities)) {
    const normalizedName = normalizeInventoryName(name);
    availableQuantities.set(normalizedName, (availableQuantities.get(normalizedName) ?? 0) + quantity);
  }

  return items.filter((item) => {
    const normalizedId = normalizeInventoryName(item.id);
    const normalizedName = normalizeInventoryName(item.name);
    const idQuantity = availableQuantities.get(normalizedId) ?? 0;
    const nameQuantity = normalizedName === normalizedId ? 0 : (availableQuantities.get(normalizedName) ?? 0);
    return idQuantity + nameQuantity > 0;
  });
}

function parseInventoryLine(line: string): { name: string; quantity: number } | null {
  const parenMatch = line.match(/^(.*)\(\s*[xX]\s*(\d+)\s*\)\s*$/);
  if (parenMatch) {
    return {
      name: parenMatch[1].trim(),
      quantity: Number(parenMatch[2]),
    };
  }

  const suffixMatch = line.match(/^(.*)\s+[xX]\s*(\d+)\s*$/);
  if (suffixMatch) {
    return {
      name: suffixMatch[1].trim(),
      quantity: Number(suffixMatch[2]),
    };
  }

  const catalogLineMatch = line.match(/^#\d+\s+(.+?)\s+\[[^\]]+\]\s*[·•]\s*/);
  if (catalogLineMatch) {
    return {
      name: catalogLineMatch[1].trim(),
      quantity: 1,
    };
  }

  if (/[\/#[\]—·•]/.test(line)) {
    return null;
  }

  return {
    name: line,
    quantity: 1,
  };
}

function normalizeInventoryName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
