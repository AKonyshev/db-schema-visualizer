// The single source of truth for the diagram's persisted settings.
//
// These strings are a compatibility contract, not an implementation detail:
// each one names a value already stored in users' browsers. Renaming a key
// silently resets that setting for everyone who had enabled it, which is why
// COLOR_RELATIONS still reads `enableAlwaysHover` — the option was renamed in
// the UI, the storage key deliberately was not.
//
// Referencing these constants instead of repeating the literals makes that
// mistake structurally impossible rather than merely documented.
export const STORAGE_KEYS = {
  COLOR_RELATIONS: "enableAlwaysHover",
  ANIMATE_RELATIONS: "animateRelations",
  SHORT_TABLE_NAME: "shortTableNameSetting",
} as const;
