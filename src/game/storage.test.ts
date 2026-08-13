import { describe, expect, it } from "vitest";
import { CURRENT_VERSION, freshSave, migrateSave } from "./storage";

const OPEN = 4;

describe("migrateSave", () => {
  it("returns a fresh save for missing data", () => {
    expect(migrateSave(null, OPEN)).toEqual(freshSave(OPEN));
  });

  it("returns a fresh save for corrupt JSON", () => {
    expect(migrateSave("{not json", OPEN)).toEqual(freshSave(OPEN));
    expect(migrateSave('"a string"', OPEN)).toEqual(freshSave(OPEN));
  });

  it("round-trips a current save", () => {
    const save = freshSave(OPEN);
    save.collection.push({ id: "emberly", discoveredAt: 123 });
    save.trailsCompleted = 5;
    save.unlockedLevel = 6;
    save.practice = { the: { seen: 3, missed: 1 } };
    save.customWords = ["sophie"];
    expect(migrateSave(JSON.stringify(save), OPEN)).toEqual(save);
  });

  it("keeps the collection when future fields are unknown (forward compat)", () => {
    const stored = JSON.stringify({
      version: 3,
      collection: [{ id: "puddle", discoveredAt: 9 }],
      someNewField: true,
    });
    const migrated = migrateSave(stored, OPEN);
    expect(migrated.version).toBe(CURRENT_VERSION);
    expect(migrated.collection).toEqual([{ id: "puddle", discoveredAt: 9 }]);
  });

  it("migrates v1 saves (no collection) preserving practice memory", () => {
    const v1 = JSON.stringify({
      practice: { was: { seen: 4, missed: 2 } },
      stars: 17, // v1 concept, dropped
    });
    const migrated = migrateSave(v1, OPEN);
    expect(migrated.version).toBe(CURRENT_VERSION);
    expect(migrated.collection).toEqual([]);
    expect(migrated.practice).toEqual({ was: { seen: 4, missed: 2 } });
    expect(migrated.unlockedLevel).toBe(OPEN);
  });

  it("drops malformed collection entries and duplicates", () => {
    const stored = JSON.stringify({
      version: 2,
      collection: [
        { id: "emberly", discoveredAt: 1 },
        { id: "emberly", discoveredAt: 99 },
        { id: 42 },
        "junk",
      ],
    });
    expect(migrateSave(stored, OPEN).collection).toEqual([
      { id: "emberly", discoveredAt: 1 },
    ]);
  });

  it("never lowers unlockedLevel below the initial open levels", () => {
    const stored = JSON.stringify({ version: 2, unlockedLevel: 1 });
    expect(migrateSave(stored, OPEN).unlockedLevel).toBe(OPEN);
  });
});
