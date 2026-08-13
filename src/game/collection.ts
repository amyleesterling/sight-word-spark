// Collection rules: which egg is offered next, and when set 2 opens.
// No duplicates are awarded until the entire active set has been discovered.

import { CREATURES, creaturesInSet, type CreatureSpec } from "./creatures";
import type { CollectedCreature } from "./storage";

export function discoveredIds(collection: CollectedCreature[]): Set<string> {
  return new Set(collection.map((c) => c.id));
}

export function setComplete(collection: CollectedCreature[], set: 1 | 2): boolean {
  const found = discoveredIds(collection);
  return creaturesInSet(set).every((c) => found.has(c.id));
}

/** The set the player is currently collecting from. */
export function activeSet(collection: CollectedCreature[]): 1 | 2 {
  return setComplete(collection, 1) ? 2 : 1;
}

/**
 * Pick the creature hiding in the next egg.
 * Undiscovered creatures from the active set only; when both full sets are
 * complete, any creature may hatch again (a friendly encore, never a loss).
 */
export function pickNextCreature(
  collection: CollectedCreature[],
  random: () => number = Math.random,
): CreatureSpec {
  const found = discoveredIds(collection);
  const set = activeSet(collection);
  const remaining = creaturesInSet(set).filter((c) => !found.has(c.id));
  const pool = remaining.length > 0 ? remaining : CREATURES;
  return pool[Math.floor(random() * pool.length)];
}

export interface CollectionProgress {
  set: 1 | 2;
  found: number;
  total: number;
}

export function collectionProgress(collection: CollectedCreature[]): CollectionProgress {
  const set = activeSet(collection);
  const found = discoveredIds(collection);
  const inSet = creaturesInSet(set);
  return {
    set,
    found: inSet.filter((c) => found.has(c.id)).length,
    total: inSet.length,
  };
}
