// English is the source language. Every user-facing string lives here; adding a
// key here makes it a compile error in every other locale until translated.
export const MESSAGES_EN = {
  "action.autoArrange": "Auto-arrange",
  "action.detailLevel": "Detail level",
  "action.detailLevel.full": "Full details",
  "action.detailLevel.header": "Header only",
  "action.detailLevel.key": "Key only",
  "action.fitToView": "Fit to view",
  "action.exportPng": "Export",
  "action.exportSvg": "Export SVG",
  "action.exportAdoc": "Export AsciiDoc",
  "action.shortTableName": "Short table names",
  "action.shortTableName.compact": "Short names",
  "action.colorRelations": "Colored relations",
  "action.animateRelations": "Relation animation",
  "action.animateRelations.compact": "Animation",
  "action.themeToggle": "Change theme mode",
  "action.showLegend": "Show this legend",
  "action.closeLegend": "Close the legend",
  "action.search": "Search tables",
  "action.toggleRefs": "Toggle refs in DBML",
  "legend.title": "Keyboard shortcuts",
  "message.noTables": "No table found",
  "message.noSchema": "No schema found",
  "search.tooltip": "Use ⌘+F or control+F command to search",
  "search.placeholder": "Search tables and columns...",
  "adoc.title": "Table reference",
  "adoc.noDescription": "No description",
  "adoc.columns": "| Name | Type | Description",
  "adoc.relations": "Relations:",
} as const;

export type MessageKey = keyof typeof MESSAGES_EN;
